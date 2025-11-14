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
            },
            'light': {
                name: 'Light',
                plural: 'Light',
                description: 'The pure essence that exists when body, spirit, and soul are absent. Takes no space and cannot be stacked.'
            },
            'baby': {
                name: 'Baby',
                plural: 'Babies',
                description: 'A small human child, innocent and pure.'
            }
        };
        
        // Initialize with starting items
        this.addItem('body', 1);
        this.addItem('soul', 1);
        this.addItem('spirit', 1);
        
        // Light is managed automatically, don't add it here
    }
    
    // Add item to inventory
    addItem(id, quantity = 1) {
        // Prevent manually adding light (it's managed automatically)
        if (id === 'light') {
            return false;
        }
        
        const itemDef = this.itemDefinitions[id];
        if (!itemDef) {
            console.warn(`Item definition not found: ${id}`);
            return false;
        }
        
        // Enforce maximum of 1 for body, soul, and spirit
        const maxOneItems = ['body', 'soul', 'spirit'];
        if (maxOneItems.includes(id)) {
            const existingItem = this.items.find(item => item.id === id);
            if (existingItem && existingItem.quantity >= 1) {
                return false; // Already have maximum
            }
            quantity = 1; // Force quantity to 1
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
        
        // Update light status after adding item
        this.updateLightStatus();
        
        return true;
    }
    
    // Remove item from inventory
    removeItem(id, quantity = 1) {
        // Prevent manually removing light (it's managed automatically)
        if (id === 'light') {
            return false;
        }
        
        const itemIndex = this.items.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            return false;
        }
        
        const item = this.items[itemIndex];
        item.quantity -= quantity;
        
        if (item.quantity <= 0) {
            this.items.splice(itemIndex, 1);
        }
        
        // Update light status after removing item
        this.updateLightStatus();
        
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
    
    // Check if player has any of body, spirit, or soul
    hasBodySpiritOrSoul() {
        return this.hasItem('body', 1) || this.hasItem('spirit', 1) || this.hasItem('soul', 1);
    }
    
    // Update light status: add light if no body/spirit/soul, remove if any exist
    updateLightStatus() {
        const hasAny = this.hasBodySpiritOrSoul();
        const hasLight = this.hasItem('light', 1);
        
        if (!hasAny && !hasLight) {
            // No body/spirit/soul and no light - add light
            const lightItem = this.items.find(item => item.id === 'light');
            if (!lightItem) {
                this.items.push({
                    id: 'light',
                    quantity: 1
                });
            } else {
                lightItem.quantity = 1; // Ensure it's exactly 1
            }
        } else if (hasAny && hasLight) {
            // Has body/spirit/soul and has light - remove light
            const lightIndex = this.items.findIndex(item => item.id === 'light');
            if (lightIndex !== -1) {
                this.items.splice(lightIndex, 1);
            }
        }
    }
    
    // Get inventory capacity used (light doesn't count)
    getUsedCapacity() {
        return this.items.filter(item => item.id !== 'light').length;
    }
}

