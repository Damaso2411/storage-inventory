import Foundation

struct InventoryItem: Identifiable, Codable {
    var id: UUID = UUID()
    var code: String
    var name: String
    var quantity: Int = 1
    var addedAt: Date = Date()
}

@MainActor
final class InventoryStore: ObservableObject {
    @Published private(set) var items: [InventoryItem] = []
    private let key = "storage-inventory-native-v1"

    init() {
        guard let data = UserDefaults.standard.data(forKey: key),
              let decoded = try? JSONDecoder().decode([InventoryItem].self, from: data) else { return }
        items = decoded
    }

    func add(code: String, name: String, quantity: Int) {
        items.insert(InventoryItem(code: code, name: name, quantity: max(1, quantity)), at: 0)
        if let data = try? JSONEncoder().encode(items) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}
