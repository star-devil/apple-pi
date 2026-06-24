use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::fs;

use crate::config::resolve_pi_dir;

/// The first line of a Pi session JSONL file.
#[derive(Debug, Serialize, Deserialize)]
pub struct SessionHeader {
    #[serde(rename = "type")]
    pub kind: String,
    pub id: String,
    pub timestamp: String,
    #[serde(default)]
    pub cwd: Option<String>,
    #[serde(default)]
    pub version: Option<u32>,
}

/// A session entry returned to the frontend.
#[derive(Debug, Serialize)]
pub struct SessionEntry {
    pub id: String,
    pub timestamp: String,
    pub cwd: Option<String>,
    /// Absolute path to the .jsonl file (used by switch_session RPC).
    pub path: String,
    /// Human-readable title derived from cwd's last segment + time.
    pub title: String,
}

fn sessions_root(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(resolve_pi_dir(app)?.join("sessions"))
}

/// Derive a readable title from cwd + timestamp.
/// Falls back to the session id if cwd is unavailable.
fn make_title(cwd: Option<&str>, timestamp: &str) -> String {
    let location = cwd
        .and_then(|c| std::path::Path::new(c).file_name())
        .and_then(|n| n.to_str())
        .unwrap_or("session");
    // Compact timestamp: 2026-06-22T09-08-17-901Z -> 06-22 09:08
    let compact = timestamp
        .get(5..16)
        .map(|s| s.replace('T', " ").replace('-', ":"))
        .unwrap_or_else(|| timestamp.to_string());
    format!("{location} · {compact}")
}

#[tauri::command]
pub async fn list_sessions(app: AppHandle) -> Result<Vec<SessionEntry>, String> {
    let root = sessions_root(&app)?;
    if !root.exists() {
        return Ok(Vec::new());
    }

    let mut entries = Vec::new();
    let mut walker = vec![root.clone()];

    while let Some(dir) = walker.pop() {
        let mut rd = match fs::read_dir(&dir).await {
            Ok(rd) => rd,
            Err(_) => continue,
        };
        while let Ok(Some(entry)) = rd.next_entry().await {
            let path = entry.path();
            if path.is_dir() {
                walker.push(path);
                continue;
            }
            if path.extension().and_then(|e| e.to_str()) != Some("jsonl") {
                continue;
            }
            // Read only the first line for the header.
            let mut file = match fs::File::open(&path).await {
                Ok(f) => f,
                Err(_) => continue,
            };
            use tokio::io::AsyncBufReadExt;
            let mut reader = tokio::io::BufReader::new(&mut file).lines();
            let first_line = match reader.next_line().await {
                Ok(Some(l)) if !l.is_empty() => l,
                _ => continue,
            };
            let header: SessionHeader = match serde_json::from_str(&first_line) {
                Ok(h) => h,
                Err(_) => continue,
            };
            if header.kind != "session" {
                continue;
            }
            let title = make_title(header.cwd.as_deref(), &header.timestamp);
            let path_str = path.to_string_lossy().to_string();
            entries.push(SessionEntry {
                id: header.id,
                timestamp: header.timestamp,
                cwd: header.cwd,
                path: path_str,
                title,
            });
        }
    }

    // Sort by timestamp descending (newest first).
    entries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    Ok(entries)
}
