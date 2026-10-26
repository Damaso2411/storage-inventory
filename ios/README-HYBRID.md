# Storage Inventory: web + escáner nativo Apple

La aplicación híbrida mantiene la interfaz web existente y utiliza VisionKit mediante un puente WKWebView.

## Archivos

- `HybridApp.swift`: contenedor web, puente JavaScript, escáner nativo y retorno automático.
- `NativeScanner.swift`: DataScanner de VisionKit para texto, UPC/EAN, QR y Data Matrix.
- `app/scan/page.tsx`: detecta el puente Apple, muestra botón «Abrir escáner Apple», recibe el resultado y abre el modal de búsqueda existente.

## Preparación para iPhone

Crear proyecto iOS SwiftUI en Xcode, deployment target iOS 16+, agregar `HybridApp.swift` y `NativeScanner.swift` al target. Configurar `NSCameraUsageDescription` y firma. En `StorageInventoryApp.swift`, cambiar `ContentView()` por `HybridApp()`. Usar un iPhone real compatible con DataScanner; el simulador no ofrece el escáner.

La aplicación web se sirve desde `https://storage-inventory-roan.vercel.app/scan`. El puente únicamente acepta solicitudes de escaneo desde ese host. El código detectado vuelve a la web y dispara la búsqueda y el modal.

**Pendiente:** generación y compilación del proyecto Xcode, firma, instalación en iPhone y pruebas reales. El inventario web todavía se guarda en localStorage, no en una base compartida. Google depende de SerpAPI.
