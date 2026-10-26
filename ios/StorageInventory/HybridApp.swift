import SwiftUI
import WebKit
import VisionKit

struct HybridApp: View {
    @State private var showingScanner = false
    @State private var scanError: String?
    @State private var pendingCode: String?
    var body: some View {
        ZStack {
            HybridWebView(pendingCode: $pendingCode, onOpenScanner: { showingScanner = true })
                .ignoresSafeArea(edges: .bottom)
        }
        .sheet(isPresented: $showingScanner) {
            NavigationStack {
                NativeScanner(onDetected: { value in
                    showingScanner = false
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { pendingCode = value }
                }, onUnavailable: { message in
                    showingScanner = false
                    scanError = message
                })
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Cerrar") { showingScanner = false }
                    }
                }
            }
        }
        .alert("Escáner Apple", isPresented: Binding(
            get: { scanError != nil },
            set: { if !$0 { scanError = nil } }
        )) {
            Button("Aceptar", role: .cancel) { scanError = nil }
        } message: {
            Text(scanError ?? "")
        }
    }
}

private struct HybridWebView: UIViewRepresentable {
    @Binding var pendingCode: String?
    let onOpenScanner: () -> Void

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIView(context: Context) -> WKWebView {
        let controller = WKUserContentController()
        controller.add(context.coordinator, name: "storageScanner")
        let configuration = WKWebViewConfiguration()
        configuration.userContentController = controller
        let web = WKWebView(frame: .zero, configuration: configuration)
        web.navigationDelegate = context.coordinator
        web.allowsBackForwardNavigationGestures = true
        web.scrollView.contentInsetAdjustmentBehavior = .automatic
        web.load(URLRequest(url: URL(string: "https://storage-inventory-roan.vercel.app/scan")!))
        context.coordinator.webView = web
        return web
    }

    func updateUIView(_ web: WKWebView, context: Context) {
        guard let code = pendingCode else { return }
        DispatchQueue.main.async { pendingCode = nil }
        guard let json = try? JSONSerialization.data(withJSONObject: ["value": code]),
              let payload = String(data: json, encoding: .utf8) else { return }
        web.evaluateJavaScript("window.dispatchEvent(new CustomEvent('storage-inventory-native-scan', {detail: \(payload)}));", completionHandler: nil)
    }

    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
        let parent: HybridWebView
        weak var webView: WKWebView?
        init(_ parent: HybridWebView) { self.parent = parent }
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "storageScanner", (message.body as? String) == "open",
                  webView?.url?.host == "storage-inventory-roan.vercel.app" else { return }
            DispatchQueue.main.async { self.parent.onOpenScanner() }
        }
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = navigationAction.request.url, url.scheme == "https",
               url.host == "storage-inventory-roan.vercel.app" {
                decisionHandler(.allow)
            } else if navigationAction.navigationType == .linkActivated,
                      let url = navigationAction.request.url {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
            } else {
                decisionHandler(.cancel)
            }
        }
    }
}
