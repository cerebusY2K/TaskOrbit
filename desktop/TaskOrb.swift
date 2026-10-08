import AppKit
import WebKit

let appHosts: Set<String> = ["taskorb.app", "www.taskorb.app", "taskorbit-k762.onrender.com"]
let safariSuffix = "Version/18.0 Safari/605.1.15"
let background = NSColor(red: 6 / 255, green: 10 / 255, blue: 24 / 255, alpha: 1)

func siteURL() -> URL {
    let value = Bundle.main.object(forInfoDictionaryKey: "TaskOrbURL") as? String
    return URL(string: value ?? "") ?? URL(string: "https://taskorbit-k762.onrender.com")!
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, NSWindowDelegate {
    var window: NSWindow!
    var webView: WKWebView!
    var popups: [NSWindow] = []

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildMenu()

        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.applicationNameForUserAgent = safariSuffix
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = true

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.setValue(false, forKey: "drawsBackground")

        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1280, height: 820),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "TaskOrb"
        window.titlebarAppearsTransparent = true
        window.backgroundColor = background
        window.appearance = NSAppearance(named: .darkAqua)
        window.minSize = NSSize(width: 420, height: 520)
        window.contentView = webView
        window.center()
        window.setFrameAutosaveName("TaskOrbMain")
        window.makeKeyAndOrderFront(nil)

        webView.load(URLRequest(url: siteURL()))
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if !flag { window.makeKeyAndOrderFront(nil) }
        return true
    }

    // Links to other sites open in the default browser; the TaskOrb site stays in the app.
    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard webView === self.webView,
              navigationAction.navigationType == .linkActivated,
              let url = navigationAction.request.url,
              let host = url.host,
              !appHosts.contains(host)
        else {
            decisionHandler(.allow)
            return
        }
        NSWorkspace.shared.open(url)
        decisionHandler(.cancel)
    }

    // Google sign-in opens a popup and reports back to the opener, so popups get a real window.
    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        if let url = navigationAction.request.url, let host = url.host,
           !appHosts.contains(host), !host.hasSuffix("google.com"), !host.hasSuffix("firebaseapp.com") {
            NSWorkspace.shared.open(url)
            return nil
        }
        let width = CGFloat(truncating: windowFeatures.width ?? 500)
        let height = CGFloat(truncating: windowFeatures.height ?? 640)
        let popup = WKWebView(frame: .zero, configuration: configuration)
        popup.uiDelegate = self
        let popupWindow = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: width, height: height),
            styleMask: [.titled, .closable, .resizable],
            backing: .buffered,
            defer: false
        )
        popupWindow.title = "Sign in"
        popupWindow.isReleasedWhenClosed = false
        popupWindow.contentView = popup
        popupWindow.delegate = self
        popupWindow.center()
        popupWindow.makeKeyAndOrderFront(nil)
        popups.append(popupWindow)
        return popup
    }

    func webViewDidClose(_ webView: WKWebView) {
        guard let popupWindow = popups.first(where: { $0.contentView === webView }) else { return }
        popupWindow.close()
    }

    func windowWillClose(_ notification: Notification) {
        guard let closing = notification.object as? NSWindow else { return }
        popups.removeAll { $0 === closing }
    }

    func webView(
        _ webView: WKWebView,
        runJavaScriptAlertPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping () -> Void
    ) {
        let alert = NSAlert()
        alert.messageText = message
        alert.runModal()
        completionHandler()
    }

    func webView(
        _ webView: WKWebView,
        runJavaScriptConfirmPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (Bool) -> Void
    ) {
        let alert = NSAlert()
        alert.messageText = message
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Cancel")
        completionHandler(alert.runModal() == .alertFirstButtonReturn)
    }

    func webView(
        _ webView: WKWebView,
        runJavaScriptTextInputPanelWithPrompt prompt: String,
        defaultText: String?,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (String?) -> Void
    ) {
        let alert = NSAlert()
        alert.messageText = prompt
        let field = NSTextField(frame: NSRect(x: 0, y: 0, width: 320, height: 24))
        field.stringValue = defaultText ?? ""
        alert.accessoryView = field
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Cancel")
        completionHandler(alert.runModal() == .alertFirstButtonReturn ? field.stringValue : nil)
    }

    func webView(
        _ webView: WKWebView,
        didFail navigation: WKNavigation!,
        withError error: Error
    ) {
        showOffline(error)
    }

    func webView(
        _ webView: WKWebView,
        didFailProvisionalNavigation navigation: WKNavigation!,
        withError error: Error
    ) {
        showOffline(error)
    }

    private func showOffline(_ error: Error) {
        let code = (error as NSError).code
        if code == NSURLErrorCancelled || code == 102 { return }
        let html = """
        <html><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
        background:#060a18;color:#fff;font:15px -apple-system;text-align:center">
        <div><h2 style="font-weight:600">TaskOrb can't reach the internet</h2>
        <p style="color:#ffffff99">Check your connection, then choose View, Reload (⌘R).</p></div></body></html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }

    @objc func reload(_ sender: Any?) {
        if webView.url?.host.map(appHosts.contains) == true {
            webView.reload()
        } else {
            webView.load(URLRequest(url: siteURL()))
        }
    }

    @objc func goHome(_ sender: Any?) {
        webView.load(URLRequest(url: siteURL()))
    }

    @objc func zoomIn(_ sender: Any?) { webView.pageZoom = min(webView.pageZoom + 0.1, 2) }
    @objc func zoomOut(_ sender: Any?) { webView.pageZoom = max(webView.pageZoom - 0.1, 0.6) }
    @objc func zoomReset(_ sender: Any?) { webView.pageZoom = 1 }

    private func buildMenu() {
        let main = NSMenu()

        let appItem = NSMenuItem()
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "About TaskOrb", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Hide TaskOrb", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        let others = appMenu.addItem(withTitle: "Hide Others", action: #selector(NSApplication.hideOtherApplications(_:)), keyEquivalent: "h")
        others.keyEquivalentModifierMask = [.command, .option]
        appMenu.addItem(withTitle: "Show All", action: #selector(NSApplication.unhideAllApplications(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Quit TaskOrb", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu
        main.addItem(appItem)

        let editItem = NSMenuItem()
        let editMenu = NSMenu(title: "Edit")
        editMenu.addItem(withTitle: "Undo", action: Selector(("undo:")), keyEquivalent: "z")
        let redo = editMenu.addItem(withTitle: "Redo", action: Selector(("redo:")), keyEquivalent: "z")
        redo.keyEquivalentModifierMask = [.command, .shift]
        editMenu.addItem(.separator())
        editMenu.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        editMenu.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        editMenu.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        editMenu.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editItem.submenu = editMenu
        main.addItem(editItem)

        let viewItem = NSMenuItem()
        let viewMenu = NSMenu(title: "View")
        viewMenu.addItem(withTitle: "Reload", action: #selector(reload(_:)), keyEquivalent: "r")
        let home = viewMenu.addItem(withTitle: "Home", action: #selector(goHome(_:)), keyEquivalent: "h")
        home.keyEquivalentModifierMask = [.command, .shift]
        viewMenu.addItem(.separator())
        viewMenu.addItem(withTitle: "Zoom In", action: #selector(zoomIn(_:)), keyEquivalent: "+")
        viewMenu.addItem(withTitle: "Zoom Out", action: #selector(zoomOut(_:)), keyEquivalent: "-")
        viewMenu.addItem(withTitle: "Actual Size", action: #selector(zoomReset(_:)), keyEquivalent: "0")
        viewMenu.addItem(.separator())
        let fullScreen = viewMenu.addItem(withTitle: "Enter Full Screen", action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f")
        fullScreen.keyEquivalentModifierMask = [.command, .control]
        viewItem.submenu = viewMenu
        main.addItem(viewItem)

        let windowItem = NSMenuItem()
        let windowMenu = NSMenu(title: "Window")
        windowMenu.addItem(withTitle: "Minimize", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        windowMenu.addItem(withTitle: "Zoom", action: #selector(NSWindow.performZoom(_:)), keyEquivalent: "")
        windowMenu.addItem(withTitle: "Close", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        windowItem.submenu = windowMenu
        main.addItem(windowItem)
        NSApp.windowsMenu = windowMenu

        NSApp.mainMenu = main
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
