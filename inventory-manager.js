// InventoryManager - Manages player inventory
export class InventoryManager {
    constructor() {
        this.items = [];
        this.itemDefinitions = {
            'body': {
                name: 'Body',
                plural: 'Bodies',
                description: 'The physical vessel that contains your essence. A tangible form in the material realm.',
                rarity: 'legendary'
            },
            'soul': {
                name: 'Soul',
                plural: 'Souls',
                description: 'The eternal essence of your being. The core of consciousness that transcends physical form.',
                rarity: 'legendary'
            },
            'spirit': {
                name: 'Spirit',
                plural: 'Spirits',
                description: 'The animating force that connects body and soul. The bridge between material and ethereal.',
                rarity: 'legendary'
            },
            'light': {
                name: 'Light',
                plural: 'Light',
                description: 'The pure essence that exists when body, spirit, and soul are absent. Takes no space and cannot be stacked.',
                rarity: 'legendary'
            },
            'baby': {
                name: 'Baby',
                plural: 'Babies',
                description: 'A small human child, innocent and pure.',
                rarity: 'common'
            },
            'man': {
                name: 'Man',
                plural: 'Men',
                description: 'A fully formed adult male human.',
                rarity: 'common'
            },
            'woman': {
                name: 'Woman',
                plural: 'Women',
                description: 'A fully formed adult female human.',
                rarity: 'common'
            },
            'water': {
                name: 'Water',
                plural: 'Water',
                description: 'The essence of water and fluidity. The flow of life and change.',
                rarity: 'uncommon'
            },
            'earth': {
                name: 'Earth',
                plural: 'Earth',
                description: 'The essence of earth and stability. The foundation of material existence.',
                rarity: 'uncommon'
            },
            'fire': {
                name: 'Fire',
                plural: 'Fire',
                description: 'The essence of fire and transformation. The spark of creation and destruction.',
                rarity: 'uncommon'
            },
            'wind': {
                name: 'Wind',
                plural: 'Wind',
                description: 'The essence of wind and movement. The breath of change and freedom.',
                rarity: 'uncommon'
            },
            'throne': {
                name: 'Throne',
                plural: 'Thrones',
                description: 'The seat of ultimate power and authority. The pinnacle of ascension.',
                rarity: 'legendary'
            },
            'ftl': {
                name: 'FTL Drive',
                plural: 'FTL Drives',
                description: 'Faster-Than-Light propulsion system. Allows instantaneous travel across vast distances.',
                rarity: 'epic'
            },
            'weapons': {
                name: 'Weapon',
                plural: 'Weapons',
                description: 'Weapons provide +1 Power, or can be irreversibly deployed for +1 slave/turn.',
                rarity: 'common'
            },
            'robot': {
                name: 'Robot',
                plural: 'Robots',
                description: 'Robots provide +5 Inventory, or can be irreversibly deployed for +$100/turn.',
                rarity: 'rare'
            },
            'merchant': {
                name: 'Merchant',
                plural: 'Merchants',
                description: 'Merchants provide +15 Inventory, or can be irreversibly deployed for +$250/turn.',
                rarity: 'epic'
            },
            'army': {
                name: 'Army',
                plural: 'Armies',
                description: 'Armies provide +5 Power, or can be irreversibly deployed for +5 slaves/turn.',
                rarity: 'rare'
            },
            'archon': {
                name: 'Archon',
                plural: 'Archons',
                description: 'Archons provide +15 Inventory and +10 Power, or can be irreversibly deployed for +$500/turn and +5 slaves/turn.',
                rarity: 'legendary'
            },
            'alpha': {
                name: 'Alpha',
                plural: 'Alphas',
                description: 'First component of the Omega device. Deploy Omega when all three are collected.',
                rarity: 'epic'
            },
            'beta': {
                name: 'Beta',
                plural: 'Betas',
                description: 'Second component of the Omega device. Deploy Omega when all three are collected.',
                rarity: 'epic'
            },
            'gamma': {
                name: 'Gamma',
                plural: 'Gammas',
                description: 'Third component of the Omega device. Deploy Omega when all three are collected.',
                rarity: 'epic'
            },
            'past': {
                name: 'Past',
                plural: 'Pasts',
                description: 'A fragment of the past, containing memories of what was.',
                rarity: 'rare'
            },
            'present': {
                name: 'Present',
                plural: 'Presents',
                description: 'A moment of the present, holding the essence of now.',
                rarity: 'rare'
            },
            'future': {
                name: 'Future',
                plural: 'Futures',
                description: 'A glimpse of the future, revealing possibilities yet to come.',
                rarity: 'rare'
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

    // Get a random commodity gift from supernova (ore, iron, or fuel)
    getRandomSupernovaGift() {
        const supernovaGifts = ['ore', 'iron', 'fuel'];
        const randomIndex = Math.floor(Math.random() * supernovaGifts.length);
        return supernovaGifts[randomIndex];
    }
}

