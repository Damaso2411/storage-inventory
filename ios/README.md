# Storage Inventory — iPhone nativo (VisionKit)

Este directorio contiene el código fuente SwiftUI para una aplicación nativa de iPhone. **No es una página web ni una PWA**. No requiere Lovable.

## Crear y ejecutar en Xcode

1. En una Mac con Xcode, crea un proyecto **iOS App** llamado `StorageInventory`, interfaz **SwiftUI**, lenguaje **Swift**, deployment target **iOS 16 o posterior**.
2. Añade los cinco archivos Swift de `ios/StorageInventory/` al target de la aplicación. Sustituye el archivo `App` generado por `StorageInventoryApp.swift` (no dejes dos declaraciones `@main`).
3. En **Target → Info**, agrega `Privacy - Camera Usage Description` (`NSCameraUsageDescription`) con el texto «Storage Inventory utiliza la cámara para leer números, códigos de barras y QR».
4. Selecciona un iPhone físico compatible con **VisionKit DataScanner** (no simulador). Firma la aplicación con tu Apple ID/equipo de desarrollo en **Signing & Capabilities**.
5. Ejecuta en el dispositivo. Permite el acceso a la cámara.

## Comportamiento

- VisionKit reconoce texto, UPC/EAN, QR y Data Matrix en la cámara.
- Detecta automáticamente identificadores numéricos de 8 a 14 dígitos y abre el modal de confirmación.
- Consulta `/api/products/lookup` y `/api/products/google` en el sitio de producción existente.
- Permite seleccionar un nombre sugerido de Google y guardar un artículo en almacenamiento local del iPhone.
- Los QR sin UPC/EAN se muestran como texto, pero no se consultan como identificadores comerciales.
- **No existe sincronización de inventario con la web**: el sitio actual utiliza localStorage. Para sincronizar se necesita backend de inventario y autenticación.
- Google Shopping/patrocinados dependen de la API SerpAPI y de su disponibilidad; VisionKit no provee identificación comercial por sí solo.
- No se ha compilado ni probado en un iPhone real desde este entorno.

## Distribución

Para instalar fuera de Xcode mediante TestFlight/App Store, se necesita configurar firma y distribución con Apple Developer. El repositorio contiene el código fuente, **no** un archivo IPA firmado.
