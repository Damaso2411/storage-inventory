import Foundation

struct ProductCandidate: Identifiable, Decodable {
    var id: String { url }
    let title: String
    let snippet: String?
    let url: String
    let domain: String?
    let image: String?
    let price: String?
    let sponsored: Bool?
}

struct GoogleResponse: Decodable {
    let results: [ProductCandidate]?
    let note: String?
}

struct CatalogResponse: Decodable {
    let found: Bool?
    let name: String?
    let brand: String?
}

@MainActor
final class ProductLookup: ObservableObject {
    @Published var loading = false
    @Published var candidates: [ProductCandidate] = []
    @Published var catalogName: String?
    @Published var message = ""
    private let base = URL(string: "https://storage-inventory-roan.vercel.app")!

    func search(code: String) async {
        loading = true
        candidates = []
        catalogName = nil
        message = "Buscando producto..."
        defer { loading = false }
        guard let encoded = code.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else { return }
        async let google = loadGoogle(encoded)
        async let catalog = loadCatalog(encoded)
        let (g, c) = await (google, catalog)
        candidates = g?.results ?? []
        catalogName = c?.found == true ? c?.name : nil
        message = g?.note ?? "Sin resultados de Google."
    }

    private func loadGoogle(_ code: String) async -> GoogleResponse? {
        guard let url = URL(string: "/api/products/google?code=\(code)", relativeTo: base) else { return nil }
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return nil }
            return try JSONDecoder().decode(GoogleResponse.self, from: data)
        } catch { return nil }
    }

    private func loadCatalog(_ code: String) async -> CatalogResponse? {
        guard let url = URL(string: "/api/products/lookup?code=\(code)", relativeTo: base) else { return nil }
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return nil }
            return try JSONDecoder().decode(CatalogResponse.self, from: data)
        } catch { return nil }
    }
}
