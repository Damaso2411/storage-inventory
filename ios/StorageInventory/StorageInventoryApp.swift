import SwiftUI

@main
struct StorageInventoryApp: App {
    @StateObject private var inventory = InventoryStore()
    var body: some Scene {
        WindowGroup {
            HybridApp()
                .environmentObject(inventory)
        }
    }
}
