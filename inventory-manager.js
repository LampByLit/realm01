// InventoryManager - Manages player inventory
export class InventoryManager {
    constructor() {
        this.items = [];
        this.itemDefinitions = {
            'body': {
                name: 'Body',
                plural: 'Bodies',
                description: 'The physical vessel that contains your essence. A tangible form in the material realm.'
            },
            'soul': {
                name: 'Soul',
                plural: 'Souls',
                description: 'The eternal essence of your being. The core of consciousness that transcends physical form.'
            },
            'spirit': {
                name: 'Spirit',
                plural: 'Spirits',
                description: 'The animating force that connects body and soul. The bridge between material and ethereal.'
            }
        };
        
        // Initialize with starting items
        this.addItem('body', 1);
        this.addItem('soul', 1);
        this.addItem('spirit', 1);
    }
    
    // Add item to inventory
    addItem(id, quantity = 1) {
        const itemDef = this.itemDefinitions[id];
        if (!itemDef) {
            console.warn(`Item definition not found: ${id}`);
            return false;
        }
        
        const existingItem = this.items.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: id,
                quantity: quantity
            });
        }
        
        return true;
    }
    
    // Remove item from inventory
    removeItem(id, quantity = 1) {
        const itemIndex = this.items.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            return false;
        }
        
        const item = this.items[itemIndex];
        item.quantity -= quantity;
        
        if (item.quantity <= 0) {
            this.items.splice(itemIndex, 1);
        }
        
        return true;
    }
    
    // Check if player has item
    hasItem(id, quantity = 1) {
        const item = this.items.find(item => item.id === id);
        return item && item.quantity >= quantity;
    }
    
    // Get item by id
    getItem(id) {
        return this.items.find(item => item.id === id);
    }
    
    // Get all items
    getAllItems() {
        return this.items.map(item => {
            const def = this.itemDefinitions[item.id];
            return {
                ...item,
                name: def.name,
                plural: def.plural,
                description: def.description
            };
        });
    }
    
    // Get item display name (handles pluralization)
    getItemDisplayName(id, quantity) {
        const def = this.itemDefinitions[id];
        if (!def) return id;
        
        if (quantity === 1) {
            return def.name;
        } else {
            return def.plural;
        }
    }
    
    // Get item description
    getItemDescription(id) {
        const def = this.itemDefinitions[id];
        return def ? def.description : '';
    }
    
    // Register new item definition (for future expansion)
    registerItem(id, definition) {
        this.itemDefinitions[id] = definition;
    }
}

