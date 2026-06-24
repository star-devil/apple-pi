use std::sync::Arc;
use std::path::PathBuf;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, ChildStdin};
use tokio::sync::{Mutex, oneshot};
use tauri::{AppHandle, Emitter, Manager};
use std::collections::HashMap;
use serde_json::Value;

use crate::config::resolve_pi_dir;

/// Manages the Pi sidecar process: spawns `node pi-cli.js --mode rpc`,
/// bridges stdin/stdout JSONL to the frontend via Tauri events,
/// and correlates command/response by id.
pub struct PiSidecar {
    child: Option<Child>,
    stdin: Arc<Mutex<Option<ChildStdin>>>,
    pending: Arc<Mutex<HashMap<String, oneshot::Sender<Value>>>>,
}

impl PiSidecar {
    pub fn new() -> Self {
        Self {
            child: None,
            stdin: Arc::new(Mutex::new(None)),
            pending: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Spawn the Pi sidecar. Resolves when the process has started and the
    /// stdout reader task is running. Returns Err if the node binary or pi
    /// entry cannot be found.
    pub async fn start(&mut self, app: AppHandle) -> Result<(), String> {
        if self.child.is_some() {
            return Ok(());
        }

        let node_bin = resolve_node_bin()?;
        let pi_entry = resolve_pi_entry(&app)?;
        let pi_dir = resolve_pi_dir(&app)?;

        // Ensure isolated pi data dir exists
        tokio::fs::create_dir_all(&pi_dir)
            .await
            .map_err(|e| format!("failed to create pi dir {pi_dir:?}: {e}"))?;

        let mut cmd = tokio::process::Command::new(&node_bin);
        cmd.arg(&pi_entry)
            .arg("--mode")
            .arg("rpc")
            .arg("-a")
            .env("PI_CODING_AGENT_DIR", &pi_dir)
            .env("PI_OFFLINE", "1")
            .env("PI_TELEMETRY", "0")
            .env("PI_SKIP_VERSION_CHECK", "1")
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        let mut child = cmd
            .spawn()
            .map_err(|e| format!("failed to spawn pi sidecar: {e}"))?;

        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| "pi sidecar stdin not captured".to_string())?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "pi sidecar stdout not captured".to_string())?;
        let stderr = child
            .stderr
            .take()
            .ok_or_else(|| "pi sidecar stderr not captured".to_string())?;

        self.stdin = Arc::new(Mutex::new(Some(stdin)));

        // Spawn stdout reader: parse each \n-delimited JSON line.
        // A line with type=="response" and an id resolves a pending oneshot;
        // any other line is emitted to the frontend as `pi:event`.
        let pending = self.pending.clone();
        let app_clone = app.clone();
        tokio::spawn(async move {
            let mut reader = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                if line.is_empty() {
                    continue;
                }
                match serde_json::from_str::<Value>(&line) {
                    Ok(value) => {
                        // If it's a response with an id, resolve the pending sender.
                        let is_response = value.get("type")
                            .and_then(|t| t.as_str())
                            .map(|s| s == "response")
                            .unwrap_or(false);
                        let id = value.get("id").and_then(|i| i.as_str()).map(|s| s.to_string());
                        if is_response {
                            if let Some(id) = id {
                                let mut guard = pending.lock().await;
                                if let Some(tx) = guard.remove(&id) {
                                    let _ = tx.send(value);
                                    continue;
                                }
                            }
                        }
                        // Otherwise emit to frontend
                        let _ = app_clone.emit("pi:event", value);
                    }
                    Err(e) => {
                        eprintln!("[pi] unparseable stdout line: {line} ({e})");
                    }
                }
            }
            eprintln!("[pi] sidecar stdout stream ended");
        });

        // Spawn stderr reader: log warnings.
        tokio::spawn(async move {
            let mut reader = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                if !line.is_empty() {
                    eprintln!("[pi sidecar stderr] {line}");
                }
            }
        });

        self.child = Some(child);
        Ok(())
    }

    /// Send a JSON command to the sidecar and await its response (matched by id).
    /// Commands without an id get fire-and-forget semantics and resolve immediately
    /// once written to stdin.
    pub async fn send(&self, cmd: Value) -> Result<Value, String> {
        let id = cmd.get("id").and_then(|i| i.as_str()).map(|s| s.to_string());

        let rx = if let Some(id) = id.clone() {
            let (tx, rx) = oneshot::channel();
            self.pending.lock().await.insert(id, tx);
            Some(rx)
        } else {
            None
        };

        let line = serde_json::to_string(&cmd).map_err(|e| format!("serialize cmd: {e}"))?;
        {
            let mut guard = self.stdin.lock().await;
            let stdin = guard
                .as_mut()
                .ok_or_else(|| "pi sidecar not running".to_string())?;
            stdin
                .write_all(line.as_bytes())
                .await
                .map_err(|e| format!("write stdin: {e}"))?;
            stdin
                .write_all(b"\n")
                .await
                .map_err(|e| format!("write newline: {e}"))?;
            stdin.flush().await.map_err(|e| format!("flush stdin: {e}"))?;
        }

        if let Some(rx) = rx {
            match tokio::time::timeout(std::time::Duration::from_secs(30), rx).await {
                Ok(Ok(value)) => Ok(value),
                Ok(Err(_)) => Err("pi sidecar response channel closed".to_string()),
                Err(_) => {
                    // Clean up pending entry on timeout
                    if let Some(id) = id {
                        self.pending.lock().await.remove(&id);
                    }
                    Err("pi sidecar command timed out (30s)".to_string())
                }
            }
        } else {
            Ok(serde_json::json!({ "success": true }))
        }
    }

    /// Gracefully stop the sidecar: close stdin, then kill if needed.
    pub async fn stop(&mut self) {
        // Close stdin to signal EOF
        {
            let mut guard = self.stdin.lock().await;
            guard.take();
        }
        if let Some(mut child) = self.child.take() {
            // Give it a moment to exit cleanly
            let _ = tokio::time::timeout(std::time::Duration::from_secs(2), child.wait()).await;
            // Force kill if still alive
            let _ = child.kill().await;
        }
    }

    pub fn is_running(&self) -> bool {
        self.child.is_some()
    }
}

/// Resolve the platform-specific node binary path.
/// In dev: src-tauri/binaries/node-<target>
/// In prod (bundled): Tauri resolves it via externalBin.
fn resolve_node_bin() -> Result<PathBuf, String> {
    // Tauri externalBin convention: binary is named `node-<target-triple>` and
    // placed next to the app. In dev we ship it under src-tauri/binaries/.
    let candidates = [
        // Dev: relative to CARGO_MANIFEST_DIR
        {
            let manifest = env!("CARGO_MANIFEST_DIR");
            let target = current_target_triple();
            let ext = if cfg!(windows) { ".exe" } else { "" };
            PathBuf::from(manifest)
                .join("binaries")
                .join(format!("node-{target}{ext}"))
        },
        // Bundled: next to the executable (Tauri places externalBin there)
        {
            let ext = if cfg!(windows) { ".exe" } else { "" };
            std::env::current_exe()
                .map_err(|e| e.to_string())?
                .parent()
                .ok_or_else(|| "no parent of current_exe".to_string())?
                .join(format!("node-{}{ext}", current_target_triple()))
        },
    ];

    for c in &candidates {
        if c.exists() {
            return Ok(c.clone());
        }
    }
    Err(format!(
        "node binary not found. Run `pnpm fetch:node` first. Tried: {:?}",
        candidates
    ))
}

fn current_target_triple() -> &'static str {
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    return "aarch64-apple-darwin";
    #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
    return "x86_64-apple-darwin";
    #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
    return "x86_64-pc-windows-msvc";
    #[cfg(all(target_os = "windows", target_arch = "aarch64"))]
    return "aarch64-pc-windows-msvc";
    #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
    return "x86_64-unknown-linux-gnu";
    #[cfg(all(target_os = "linux", target_arch = "aarch64"))]
    return "aarch64-unknown-linux-gnu";
    #[cfg(not(any(
        all(target_os = "macos", target_arch = "aarch64"),
        all(target_os = "macos", target_arch = "x86_64"),
        all(target_os = "windows", target_arch = "x86_64"),
        all(target_os = "windows", target_arch = "aarch64"),
        all(target_os = "linux", target_arch = "x86_64"),
        all(target_os = "linux", target_arch = "aarch64"),
    )))]
    return "unknown-target";
}

/// Resolve the pi-coding-agent CLI entry (dist/cli.js).
/// Looks under sidecar/node_modules (dev) or bundled resources (prod).
fn resolve_pi_entry(app: &AppHandle) -> Result<PathBuf, String> {
    let candidates = [
        // Dev: <workspace>/sidecar/node_modules/@earendil-works/pi-coding-agent/dist/cli.js
        {
            let manifest = env!("CARGO_MANIFEST_DIR");
            PathBuf::from(manifest)
                .join("..")
                .join("sidecar")
                .join("node_modules")
                .join("@earendil-works")
                .join("pi-coding-agent")
                .join("dist")
                .join("cli.js")
        },
        // Bundled: <resource_dir>/_up_/sidecar/node_modules/@earendil-works/pi-coding-agent/dist/cli.js
        // (Tauri preserves the "../" prefix from the resources glob as "_up_".)
        {
            let resource_dir = app
                .path()
                .resource_dir()
                .map_err(|e| format!("resource_dir: {e}"))?;
            resource_dir
                .join("_up_")
                .join("sidecar")
                .join("node_modules")
                .join("@earendil-works")
                .join("pi-coding-agent")
                .join("dist")
                .join("cli.js")
        },
    ];
    for c in &candidates {
        if c.exists() {
            return Ok(c.clone());
        }
    }
    Err(format!(
        "pi-coding-agent entry not found. Run `pnpm install` in sidecar/. Tried: {:?}",
        candidates
    ))
}
