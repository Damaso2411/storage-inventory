import SwiftUI
import VisionKit

struct ContentView: View {
    @EnvironmentObject private var inventory: InventoryStore
    @StateObject private var lookup = ProductLookup()
    @State private var scannedCode = ""
    @State private var showingScanner = false
    @State private var showingResult = false
    @State private var scanError: String?
    @State private var productName = ""
    @State private var quantity = 1

    var body: some View {
        NavigationStack {
            List {
                Section("Escaneo automático") {
                    Button {
                        scanError = nil
                        showingScanner = true
                    } label: {
                        Label("Abrir cámara VisionKit", systemImage: "barcode.viewfinder")
                    }
                    TextField("Código UPC, EAN o identificador", text: $scannedCode)
                        .keyboardType(.numbersAndPunctuation)
                        .textInputAutocapitalization(.never)
                    Button("Buscar producto") { openResult(scannedCode) }
                        .disabled(scannedCode.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    if let scanError { Text(scanError).foregroundStyle(.red) }
                }
                Section("Inventario local (sin sincronización web)") {
                    if inventory.items.isEmpty {
                        Text("Todavía no hay artículos guardados.")
                            .foregroundStyle(.secondary)
                    }
                    ForEach(inventory.items) { item in
                        VStack(alignment: .leading) {
                            Text(item.name).font(.headline)
                            Text("\(item.code) · Cantidad: \(item.quantity)")
                                .font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .navigationTitle("Storage Inventory")
            .sheet(isPresented: $showingScanner) {
                NavigationStack {
                    Group {
                        if #available(iOS 16.0, *) {
                            NativeScanner(onDetected: { code in
                                showingScanner = false
                                openResult(code)
                            }, onUnavailable: { error in
                                showingScanner = false
                                scanError = error
                            })
                            .ignoresSafeArea(edges: .bottom)
                        } else {
                            ContentUnavailableView("iOS no compatible", systemImage: "iphone.slash", description: Text("Se requiere iOS 16 o posterior."))
                        }
                    }
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Cerrar") { showingScanner = false }
                        }
                    }
                }
            }
            .sheet(isPresented: $showingResult) {
                NavigationStack {
                    Form {
                        Section("Código detectado") {
                            Text(scannedCode).font(.headline)
                            if lookup.loading { ProgressView("Buscando en Google...") }
                            else { Text(lookup.message).font(.footnote).foregroundStyle(.secondary) }
                        }
                        Section("Confirmar producto") {
                            TextField("Nombre del producto", text: $productName)
                            Stepper("Cantidad: \(quantity)", value: $quantity, in: 1...9999)
                            Button("Guardar en inventario local") {
                                inventory.add(code: scannedCode, name: productName, quantity: quantity)
                                showingResult = false
                            }
                            .disabled(productName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                        }
                        if !lookup.candidates.isEmpty {
                            Section("Resultados de Google · verificar antes de guardar") {
                                ForEach(lookup.candidates) { candidate in
                                    VStack(alignment: .leading, spacing: 8) {
                                        if candidate.sponsored == true { Text("Patrocinado").font(.caption).bold() }
                                        HStack {
                                            if let image = candidate.image, let url = URL(string: image) {
                                                AsyncImage(url: url) { picture in
                                                    picture.resizable().scaledToFit()
                                                } placeholder: { Color.gray.opacity(0.1) }
                                                .frame(width: 72, height: 72)
                                            }
                                            VStack(alignment: .leading) {
                                                Text(candidate.title).font(.headline)
                                                if let price = candidate.price { Text(price) }
                                            }
                                        }
                                        Button("Usar este nombre") { productName = candidate.title }
                                        if let url = URL(string: candidate.url) {
                                            Link("Ver en tienda", destination: url)
                                        }
                                    }
                                }
                            }
                        }
                        if scannedCode.range(of: #"^\d{8,14}$"#, options: .regularExpression) == nil {
                            Section {
                                Text("Este QR o código no contiene un identificador UPC/EAN de 8 a 14 dígitos. Se conserva su contenido, pero no se consulta como código comercial.")
                            }
                        }
                    }
                    .navigationTitle("Confirmar producto")
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Cerrar") { showingResult = false }
                        }
                    }
                }
            }
        }
    }

    private func openResult(_ value: String) {
        let value = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty else { return }
        scannedCode = value
        productName = ""
        quantity = 1
        showingResult = true
        if value.range(of: #"^\d{8,14}$"#, options: .regularExpression) != nil {
            Task {
                await lookup.search(code: value)
                if let name = lookup.catalogName, !name.isEmpty { productName = name }
            }
        } else {
            lookup.candidates = []
            lookup.message = "Código leído. No es un UPC/EAN numérico."
        }
    }
}
