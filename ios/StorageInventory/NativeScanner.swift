import SwiftUI
import VisionKit

@available(iOS 16.0, *)
struct NativeScanner: UIViewControllerRepresentable {
    let onDetected: (String) -> Void
    let onUnavailable: (String) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIViewController(context: Context) -> UIViewController {
        guard DataScannerViewController.isSupported else {
            DispatchQueue.main.async { onUnavailable("Este dispositivo no admite DataScanner de VisionKit.") }
            return UIViewController()
        }
        guard DataScannerViewController.isAvailable else {
            DispatchQueue.main.async { onUnavailable("Activa el permiso de cámara en Ajustes y vuelve a abrir el escáner.") }
            return UIViewController()
        }
        let scanner = DataScannerViewController(
            recognizedDataTypes: [
                .text(textContentType: nil),
                .barcode(symbologies: [.ean8, .ean13, .upce, .code128, .code39, .qr, .dataMatrix, .pdf417])
            ],
            qualityLevel: .accurate,
            recognizesMultipleItems: true,
            isHighFrameRateTrackingEnabled: true,
            isPinchToZoomEnabled: true,
            isGuidanceEnabled: true,
            isHighlightingEnabled: true
        )
        scanner.delegate = context.coordinator
        DispatchQueue.main.async {
            do { try scanner.startScanning() }
            catch { onUnavailable("No se pudo iniciar la cámara: \(error.localizedDescription)") }
        }
        return scanner
    }

    func updateUIViewController(_ controller: UIViewController, context: Context) {}

    static func dismantleUIViewController(_ controller: UIViewController, coordinator: Coordinator) {
        (controller as? DataScannerViewController)?.stopScanning()
    }

    final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        let parent: NativeScanner
        private var lastValue = ""
        private var lastTime = Date.distantPast
        init(_ parent: NativeScanner) { self.parent = parent }

        func dataScanner(_ dataScanner: DataScannerViewController, didTapOn item: RecognizedItem) {
            process(item)
        }

        func dataScanner(_ dataScanner: DataScannerViewController, didAdd addedItems: [RecognizedItem], allItems: [RecognizedItem]) {
            for item in addedItems { process(item) }
        }

        private func process(_ item: RecognizedItem) {
            let raw: String
            switch item {
            case .barcode(let barcode): raw = barcode.payloadStringValue ?? ""
            case .text(let text): raw = text.transcript
            @unknown default: return
            }
            let digits = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            let code: String
            if digits.range(of: #"^\d{8,14}$"#, options: .regularExpression) != nil {
                code = digits
            } else if let range = digits.range(of: #"(?<!\d)\d{8,14}(?!\d)"#, options: .regularExpression) {
                code = String(digits[range])
            } else if case .barcode = item {
                // QR and Data Matrix may contain URLs or other identifiers.
                code = digits
            } else { return }
            guard !code.isEmpty, code != lastValue || Date().timeIntervalSince(lastTime) > 4 else { return }
            lastValue = code
            lastTime = Date()
            DispatchQueue.main.async { self.parent.onDetected(code) }
        }
    }
}
