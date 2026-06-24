mod sidecar;

use std::sync::Arc;
use serde_json::Value;
use tauri::{Manager, State};
use tokio::sync::Mutex;
use uuid::Uuid;

use sidecar::PiSidecar;

struct AppState {
    sidecar: Mutex<PiSidecar>,
}

#[tauri::command]
async fn pi_start(
    app: tauri::AppHandle,
    state: State<'_, Arc<AppState>>,
) -> Result<(), String> {
    let mut sc = state.sidecar.lock().await;
    if sc.is_running() {
        return Ok(());
    }
    sc.start(app).await
}

#[tauri::command]
async fn pi_ready(
    app: tauri::AppHandle,
    state: State<'_, Arc<AppState>>,
) -> Result<bool, String> {
    let mut sc = state.sidecar.lock().await;
    if !sc.is_running() {
        sc.start(app).await?;
        if !sc.is_running() {
            return Ok(false);
        }
    }
    // Health check: send get_state, expect success within 5s
    let id = Uuid::new_v4().to_string();
    let cmd = serde_json::json!({ "type": "get_state", "id": id });
    match sc.send(cmd).await {
        Ok(resp) => Ok(resp
            .get("success")
            .and_then(|s| s.as_bool())
            .unwrap_or(false)),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
async fn pi_send(
    state: State<'_, Arc<AppState>>,
    cmd: Value,
) -> Result<Value, String> {
    let sc = state.sidecar.lock().await;
    if !sc.is_running() {
        return Err("pi sidecar not running".to_string());
    }
    sc.send(cmd).await
}

#[tauri::command]
async fn pi_stop(state: State<'_, Arc<AppState>>) -> Result<(), String> {
    let mut sc = state.sidecar.lock().await;
    sc.stop().await;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Arc::new(AppState {
            sidecar: Mutex::new(PiSidecar::new()),
        }))
        .setup(|app| {
            // Auto-start the sidecar on launch.
            let state = app.state::<Arc<AppState>>().inner().clone();
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut sc = state.sidecar.lock().await;
                match sc.start(handle).await {
                    Ok(_) => eprintln!("[apple-pi] pi sidecar started"),
                    Err(e) => eprintln!("[apple-pi] failed to start pi sidecar: {e}"),
                }
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            // Stop the sidecar when the main window closes.
            if let tauri::WindowEvent::Destroyed = event {
                let state = window.app_handle().state::<Arc<AppState>>().inner().clone();
                tauri::async_runtime::spawn(async move {
                    let mut sc = state.sidecar.lock().await;
                    sc.stop().await;
                });
            }
        })
        .invoke_handler(tauri::generate_handler![pi_start, pi_ready, pi_send, pi_stop])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
