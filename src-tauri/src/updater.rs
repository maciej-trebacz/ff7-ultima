use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;

pub async fn update(app: AppHandle) -> tauri_plugin_updater::Result<()> {
    if let Some(update) = app.updater()?.check().await? {
        let mut downloaded = 0;
        let version = update.version.clone();

        println!("[Updater] update to version {version} available, downloading...");

        update
            .download_and_install(
                |chunk_length, _content_length| {
                    downloaded += chunk_length;
                },
                || {
                    println!("[Updater] download finished");
                },
            )
            .await?;

        println!("[Updater] update installed");
        app.restart();
    } else {
        println!("[Updater] no update available");
    }

    Ok(())
}
