use std::path::PathBuf;
use serde_json::Value;
use tauri::{AppHandle, Manager};

/// Resolve the isolated Pi data directory under the app data dir.
/// PI_CODING_AGENT_DIR points at the `agent/` dir (default ~/.pi/agent),
/// so we return <app_data>/apple-pi/.pi/agent.
pub fn resolve_pi_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir: {e}"))?;
    Ok(data_dir.join("apple-pi").join(".pi").join("agent"))
}

fn auth_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(resolve_pi_dir(app)?.join("auth.json"))
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(resolve_pi_dir(app)?.join("settings.json"))
}

fn models_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(resolve_pi_dir(app)?.join("models.json"))
}

/// Read a JSON file, returning the parsed Value. Returns the provided default
/// if the file does not exist.
async fn read_json_or_default(path: &PathBuf, default: Value) -> Result<Value, String> {
    match tokio::fs::read_to_string(path).await {
        Ok(s) if s.trim().is_empty() => Ok(default),
        Ok(s) => serde_json::from_str(&s)
            .map_err(|e| format!("parse {}: {e}", path.display())),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(default),
        Err(e) => Err(format!("read {}: {e}", path.display())),
    }
}

/// Write a JSON file with 0600 permissions (best-effort on non-Unix).
async fn write_json_private(path: &PathBuf, value: &Value) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("mkdir {}: {e}", parent.display()))?;
    }
    let body = serde_json::to_string_pretty(value)
        .map_err(|e| format!("serialize: {e}"))?;
    tokio::fs::write(path, body)
        .await
        .map_err(|e| format!("write {}: {e}", path.display()))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = std::fs::Permissions::from_mode(0o600);
        std::fs::set_permissions(path, perms)
            .map_err(|e| format!("chmod {}: {e}", path.display()))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn config_get_auth(app: AppHandle) -> Result<Value, String> {
    let path = auth_path(&app)?;
    read_json_or_default(&path, serde_json::json!({})).await
}

#[tauri::command]
pub async fn config_save_auth(app: AppHandle, auth: Value) -> Result<(), String> {
    let path = auth_path(&app)?;
    write_json_private(&path, &auth).await
}

#[tauri::command]
pub async fn config_get_settings(app: AppHandle) -> Result<Value, String> {
    let path = settings_path(&app)?;
    // Sensible defaults if settings.json is missing.
    let default = serde_json::json!({
        "defaultProvider": null,
        "defaultModel": null,
        "defaultThinkingLevel": "medium",
    });
    read_json_or_default(&path, default).await
}

#[tauri::command]
pub async fn config_save_settings(app: AppHandle, settings: Value) -> Result<(), String> {
    let path = settings_path(&app)?;
    write_json_private(&path, &settings).await
}

#[tauri::command]
pub async fn config_get_models(app: AppHandle) -> Result<Value, String> {
    let path = models_path(&app)?;
    read_json_or_default(&path, serde_json::json!({ "providers": {} })).await
}

#[tauri::command]
pub async fn config_save_models(app: AppHandle, models: Value) -> Result<(), String> {
    let path = models_path(&app)?;
    write_json_private(&path, &models).await
}
