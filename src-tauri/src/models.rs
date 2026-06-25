use serde::{Deserialize, Serialize};
use serde_json::Value;

// Model entry returned by the fetch_models command.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteModel {
    pub id: String,
    pub name: String,
}

/// Fetch the model list from a provider's `/models` (or equivalent) endpoint.
///
/// - OpenAI-compatible APIs: `GET <baseUrl>/models` → `{ data: [{ id: "..." }] }`
/// - Google Gemini: `GET <baseUrl>/models` → `{ models: [{ name: "models/gemini-..." }] }`
/// - Ollama: `GET <baseUrl>/models` → `{ models: [{ name: "llama3.2" }] }`
#[tauri::command]
pub async fn fetch_models(
    base_url: String,
    api_key: Option<String>,
    api_spec: String,
) -> Result<Vec<RemoteModel>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("HTTP client error: {e}"))?;

    let url = build_models_url(&base_url, &api_spec);

    let mut req = client.get(&url);
    if let Some(key) = api_key.filter(|k| !k.is_empty()) {
        if api_spec == "google-generative-ai" {
            req = req.query(&[("key", key)]);
        } else {
            req = req.header("Authorization", format!("Bearer {key}"));
        }
    }

    let resp = req
        .send()
        .await
        .map_err(|e| format!("Request failed: {e}"))?;

    let status = resp.status();
    let body: Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse response (status {status}): {e}"))?;

    if !status.is_success() {
        let err_msg = body
            .get("error")
            .and_then(|e| e.get("message"))
            .and_then(|m| m.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| format!("HTTP {status}"));
        return Err(err_msg);
    }

    Ok(parse_models(&body, &api_spec))
}

/// Build the models endpoint URL from the base URL and API spec.
fn build_models_url(base_url: &str, api_spec: &str) -> String {
    let base = base_url.trim_end_matches('/');
    if api_spec == "google-generative-ai" {
        // Gemini: base already contains /v1beta
        if base.ends_with("/models") {
            base.to_string()
        } else {
            format!("{base}/models")
        }
    } else if base.ends_with("/v1") || base.ends_with("/v1beta") {
        format!("{base}/models")
    } else {
        format!("{base}/models")
    }
}

/// Parse the response body into a list of remote models.
fn parse_models(body: &Value, api_spec: &str) -> Vec<RemoteModel> {
    let mut models = Vec::new();

    if api_spec == "google-generative-ai" {
        // Gemini: { models: [{ name: "models/gemini-2.0-flash", displayName: "..." }] }
        if let Some(arr) = body.get("models").and_then(|m| m.as_array()) {
            for m in arr {
                let name = m.get("name").and_then(|n| n.as_str()).unwrap_or("");
                let id = name.strip_prefix("models/").unwrap_or(name).to_string();
                if id.is_empty() {
                    continue;
                }
                let display = m
                    .get("displayName")
                    .and_then(|d| d.as_str())
                    .unwrap_or(&id)
                    .to_string();
                models.push(RemoteModel {
                    id,
                    name: display,
                });
            }
        }
    } else if api_spec == "anthropic-messages" {
        // Anthropic: { data: [{ id: "claude-..." }] }
        if let Some(arr) = body.get("data").and_then(|d| d.as_array()) {
            for m in arr {
                let id = m.get("id").and_then(|i| i.as_str()).unwrap_or("");
                if id.is_empty() {
                    continue;
                }
                models.push(RemoteModel {
                    id: id.to_string(),
                    name: id.to_string(),
                });
            }
        }
    } else {
        // OpenAI-compatible: { data: [{ id: "gpt-4o" }] }
        // Ollama: { models: [{ name: "llama3.2" }] }
        let arr = body
            .get("data")
            .and_then(|d| d.as_array())
            .or_else(|| body.get("models").and_then(|m| m.as_array()));

        if let Some(arr) = arr {
            for m in arr {
                let id = m
                    .get("id")
                    .and_then(|i| i.as_str())
                    .or_else(|| m.get("name").and_then(|n| n.as_str()))
                    .unwrap_or("");
                if id.is_empty() {
                    continue;
                }
                models.push(RemoteModel {
                    id: id.to_string(),
                    name: id.to_string(),
                });
            }
        }
    }

    models.sort_by(|a, b| a.id.cmp(&b.id));
    models
}
