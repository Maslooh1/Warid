use std::sync::Mutex;
use tauri::{
    menu::{MenuBuilder, MenuItem, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    Manager,
};

struct TrayHandles {
    tray: TrayIcon,
    show_item: MenuItem<tauri::Wry>,
    quit_item: MenuItem<tauri::Wry>,
}

struct TrayState(Mutex<Option<TrayHandles>>);

#[tauri::command]
fn greet(name: &str) -> String {
    format!("مرحباً، {}! من وارِد.", name)
}

#[tauri::command]
fn update_tray_language(app: tauri::AppHandle, lang: String) {
    let (show_label, quit_label, tooltip) = if lang == "ar" {
        ("إظهار وارِد", "إغلاق", "وارِد")
    } else {
        ("Show Warid", "Quit", "Warid")
    };
    let state = app.state::<TrayState>();
    let guard = state.0.lock().unwrap();
    if let Some(handles) = guard.as_ref() {
        let _ = handles.show_item.set_text(show_label);
        let _ = handles.quit_item.set_text(quit_label);
        let _ = handles.tray.set_tooltip(Some(tooltip));
    }
}

#[tauri::command]
fn paste_at_cursor(app: tauri::AppHandle) {
    use enigo::{Direction, Enigo, Key, Keyboard, Settings};
    use std::thread::sleep;
    use std::time::Duration;

    #[cfg(target_os = "windows")]
    {
        use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, SetForegroundWindow};

        // Step 1: Capture the HWND of whichever app currently has focus.
        // We must do this BEFORE our window minimizes, because minimize itself
        // changes the foreground window.
        let prev_hwnd = unsafe { GetForegroundWindow() };

        // Step 2: Minimize the Warid window.
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.minimize();
        }
        sleep(Duration::from_millis(100));

        // Step 3: Explicitly restore focus to the previous app.
        // This is the key step that was missing — minimize() alone does NOT
        // guarantee Windows will return focus to the right window.
        if !prev_hwnd.0.is_null() {
            unsafe { let _ = SetForegroundWindow(prev_hwnd); }
        }
        sleep(Duration::from_millis(80));

        // Step 4: Send Ctrl+V to whatever is now in the foreground.
        if let Ok(mut enigo) = Enigo::new(&Settings::default()) {
            let _ = enigo.key(Key::Control, Direction::Press);
            sleep(Duration::from_millis(30));
            let _ = enigo.key(Key::Unicode('v'), Direction::Click);
            sleep(Duration::from_millis(30));
            let _ = enigo.key(Key::Control, Direction::Release);
        }
    }

    // Non-Windows fallback (original behaviour).
    #[cfg(not(target_os = "windows"))]
    {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.minimize();
        }
        sleep(Duration::from_millis(120));
        if let Ok(mut enigo) = Enigo::new(&Settings::default()) {
            let _ = enigo.key(Key::Control, Direction::Press);
            sleep(Duration::from_millis(30));
            let _ = enigo.key(Key::Unicode('v'), Direction::Click);
            sleep(Duration::from_millis(30));
            let _ = enigo.key(Key::Control, Direction::Release);
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        // Shortcuts are registered dynamically from JS (per-command), so we just
        // mount the plugin with no built-in handler.
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
            _ => {}
        })
        .manage(TrayState(Mutex::new(None)))
        .setup(|app| {
            // System tray — labels default to English; updated at runtime once the
            // JS layer reports the saved UI language via `update_tray_language`.
            let show_item = MenuItemBuilder::with_id("show", "Show Warid").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            let menu = MenuBuilder::new(app)
                .item(&show_item)
                .item(&quit_item)
                .build()?;

            let tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Warid")
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            if let Some(overlay) = app.get_webview_window("overlay") {
                let _ = overlay.set_always_on_top(true);
                // We don't know the monitor size yet easily here without a bit more code,
                // but Tauri's 'center' in tauri.conf handles the horizontal part well.
                // We'll just let it stay centered for now, or we can use the monitor API.
            }

            let state = app.state::<TrayState>();
            *state.0.lock().unwrap() = Some(TrayHandles {
                tray,
                show_item,
                quit_item,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, paste_at_cursor, update_tray_language])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
