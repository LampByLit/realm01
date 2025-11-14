// trading-game.js - Core trading game logic
import { 
    COMMODITIES, 
    PRICE_RANGES, 
    FLUCTUATION_RATES,
    LOCATION_CONFIG,
    getRandomPrice,
    getPriceMultiplier,
    isCommodityAvailable
} from './trading-config.js';

export class TradingGame {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        
        // Game state
        this.money = 0; // Starting with $0
        this.commodities = {
            [COMMODITIES.SLAVES]: 0,
            [COMMODITIES.ORE]: 0,
            [COMMODITIES.IRON]: 0,
            [COMMODITIES.GOLD]: 0,
            [COMMODITIES.FUEL]: 5, // Starting with 5 fuel
            [COMMODITIES.EXOTIC]: 0,
            [COMMODITIES.DARK_MATTER]: 0,
            [COMMODITIES.ANTIMATTER]: 0,
            [COMMODITIES.AURA]: 0,
            [COMMODITIES.ENTROPY]: 0
        };
        
        this.currentLocation = 'EARTH';
        this.turn = 0;
        this.carryingCapacity = 10;
        
        // Price state per location (stores current prices)
        this.locationPrices = {};
        
        // Active commodities per location (randomly selected 3 per turn)
        this.locationActiveCommodities = {};
        
        // Initialize prices and active commodities for all locations
        this.initializePrices();
        this.initializeActiveCommodities();
    }
    
    // Initialize prices for all configured locations
    initializePrices() {
        Object.keys(LOCATION_CONFIG).forEach(location => {
            // Normalize to uppercase for consistent storage
            const locationKey = location.toUpperCase();
            this.locationPrices[locationKey] = {};
            const config = LOCATION_CONFIG[location];
            
            // Only initialize prices for active commodities
            const activeCommodities = this.locationActiveCommodities[locationKey] || [];
            activeCommodities.forEach(commodity => {
                // Check if this commodity has a special price range at this location
                if (config && config.specialPriceRanges && config.specialPriceRanges[commodity]) {
                    // Use special price range directly (no multiplier)
                    const range = config.specialPriceRanges[commodity];
                    this.locationPrices[locationKey][commodity] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
                } else {
                    // Use standard price generation with multiplier
                    const basePrice = getRandomPrice(commodity, location);
                    const multiplier = getPriceMultiplier(location, commodity);
                    this.locationPrices[locationKey][commodity] = Math.floor(basePrice * multiplier);
                }
            });
        });
    }
    
    // Initialize active commodities (randomly select 3 per location)
    initializeActiveCommodities() {
        Object.keys(LOCATION_CONFIG).forEach(location => {
            const locationKey = location.toUpperCase();
            const config = LOCATION_CONFIG[location];
            
            // Special handling for Venus: Exotic is always available, only 2 random from others
            if (locationKey === 'VENUS' && config.alwaysAvailableCommodities) {
                const selected = [...config.alwaysAvailableCommodities]; // Start with always available
                const otherCommodities = config.availableCommodities.filter(
                    c => !config.alwaysAvailableCommodities.includes(c)
                );
                
                // Shuffle and take 2 random from others
                const shuffled = otherCommodities.sort(() => Math.random() - 0.5);
                const count = Math.min(2, shuffled.length);
                for (let i = 0; i < count; i++) {
                    selected.push(shuffled[i]);
                }
                
                this.locationActiveCommodities[locationKey] = selected;
            } else {
                // Standard logic: randomly select up to 3 commodities from available list
                const available = [...config.availableCommodities];
                const selected = [];
                
                // Shuffle array
                const shuffled = available.sort(() => Math.random() - 0.5);
                
                // Take first 3 (or all if less than 3)
                const count = Math.min(3, shuffled.length);
                for (let i = 0; i < count; i++) {
                    selected.push(shuffled[i]);
                }
                
                this.locationActiveCommodities[locationKey] = selected;
            }
        });
    }
    
    // Randomize active commodities for a location (called on turn advance)
    randomizeActiveCommodities(location) {
        const locationKey = location.toUpperCase();
        const config = LOCATION_CONFIG[location] || 
                       LOCATION_CONFIG[locationKey] || 
                       LOCATION_CONFIG[location.toLowerCase()];
        
        if (!config) return;
        
        let selected = []; // Declare selected outside if/else blocks
        
        // Special handling for Venus: Exotic is always available, only 2 random from others
        if (locationKey === 'VENUS' && config.alwaysAvailableCommodities) {
            selected = [...config.alwaysAvailableCommodities]; // Start with always available
            const otherCommodities = config.availableCommodities.filter(
                c => !config.alwaysAvailableCommodities.includes(c)
            );
            
            // Shuffle and take 2 random from others
            const shuffled = otherCommodities.sort(() => Math.random() - 0.5);
            const count = Math.min(2, shuffled.length);
            for (let i = 0; i < count; i++) {
                selected.push(shuffled[i]);
            }
            
            this.locationActiveCommodities[locationKey] = selected;
        } else {
            // Standard logic: randomly select up to 3 commodities from available list
            const available = [...config.availableCommodities];
            selected = [];
            
            // Shuffle array
            const shuffled = available.sort(() => Math.random() - 0.5);
            
            // Take first 3 (or all if less than 3)
            const count = Math.min(3, shuffled.length);
            for (let i = 0; i < count; i++) {
                selected.push(shuffled[i]);
            }
            
            this.locationActiveCommodities[locationKey] = selected;
        }
        
        // Initialize prices for newly selected commodities
        if (!this.locationPrices[locationKey]) {
            this.locationPrices[locationKey] = {};
        }
        
        selected.forEach(commodity => {
            if (this.locationPrices[locationKey][commodity] === undefined) {
                // Check if this commodity has a special price range at this location
                const locationUpper = location.toUpperCase();
                const config = LOCATION_CONFIG[location] || LOCATION_CONFIG[locationUpper] || LOCATION_CONFIG[location.toLowerCase()];
                if (config && config.specialPriceRanges && config.specialPriceRanges[commodity]) {
                    // Use special price range directly (no multiplier)
                    const range = config.specialPriceRanges[commodity];
                    this.locationPrices[locationKey][commodity] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
                } else {
                    // Use standard price generation with multiplier
                    const basePrice = getRandomPrice(commodity, location);
                    const multiplier = getPriceMultiplier(location, commodity);
                    this.locationPrices[locationKey][commodity] = Math.floor(basePrice * multiplier);
                }
            }
        });
    }
    
    // Get current price for a commodity at a location
    getPrice(location, commodity) {
        // Normalize location name for consistent storage
        const locationKey = location.toUpperCase();
        
        // Check if commodity is in the active commodities for this location
        const activeCommodities = this.locationActiveCommodities[locationKey] || [];
        if (!activeCommodities.includes(commodity)) {
            return null; // Not available at this location this turn
        }
        
        if (!this.locationPrices[locationKey]) {
            this.locationPrices[locationKey] = {};
        }
        
        if (this.locationPrices[locationKey][commodity] === undefined) {
            // Initialize price if not set
            // Check if this commodity has a special price range at this location
            const locationUpper = location.toUpperCase();
            const config = LOCATION_CONFIG[location] || LOCATION_CONFIG[locationUpper] || LOCATION_CONFIG[location.toLowerCase()];
            if (config && config.specialPriceRanges && config.specialPriceRanges[commodity]) {
                // Use special price range directly (no multiplier)
                const range = config.specialPriceRanges[commodity];
                this.locationPrices[locationKey][commodity] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            } else {
                // Use standard price generation with multiplier
                const basePrice = getRandomPrice(commodity, location);
                const multiplier = getPriceMultiplier(location, commodity);
                this.locationPrices[locationKey][commodity] = Math.floor(basePrice * multiplier);
            }
        }
        
        return this.locationPrices[locationKey][commodity];
    }
    
    // Get available commodities at a location (returns the 3 randomly selected active commodities)
    getAvailableCommodities(location) {
        // Normalize location name
        const locationKey = location.toUpperCase();
        
        // Get active commodities
        const active = this.locationActiveCommodities[locationKey] || [];
        
        // For locations with alwaysAvailableCommodities, ensure they're included
        const config = LOCATION_CONFIG[location] || 
                       LOCATION_CONFIG[locationKey] || 
                       LOCATION_CONFIG[location.toLowerCase()];
        
        if (config && config.alwaysAvailableCommodities) {
            const alwaysAvailable = config.alwaysAvailableCommodities;
            const combined = [...new Set([...alwaysAvailable, ...active])]; // Merge and deduplicate
            return combined;
        }
        
        // Return the active commodities for this location
        return active;
    }
    
    // Get quantity of a commodity
    getCommodityQuantity(commodity) {
        return this.commodities[commodity] || 0;
    }
    
    // Get fuel cost to travel to a location
    getFuelCost(location) {
        // Handle case-insensitive location matching
        const locationUpper = location.toUpperCase();
        const config = LOCATION_CONFIG[location] || LOCATION_CONFIG[locationUpper] || LOCATION_CONFIG[location.toLowerCase()];
        return config ? config.fuelCost : 1;
    }
    
    // Check if player can travel to a location
    canTravelTo(location) {
        const fuelCost = this.getFuelCost(location);
        const currentFuel = this.getCommodityQuantity(COMMODITIES.FUEL);
        return currentFuel >= fuelCost;
    }
    
    // Consume fuel for travel
    consumeFuel(amount) {
        const currentFuel = this.getCommodityQuantity(COMMODITIES.FUEL);
        if (currentFuel >= amount) {
            this.commodities[COMMODITIES.FUEL] = currentFuel - amount;
            return true;
        }
        return false;
    }
    
    // Calculate inventory used (including commodities and body/soul/spirit items)
    // Counts total QUANTITY of items, not types
    getInventoryUsed() {
        let used = 0;
        
        // Count total quantity of all commodities (including fuel)
        Object.values(COMMODITIES).forEach(commodity => {
            const quantity = this.commodities[commodity] || 0;
            used += quantity; // Count actual quantity, not just types
        });
        
        // Count body/soul/spirit items from inventory manager
        if (window.inventoryManager) {
            const specialItems = ['body', 'soul', 'spirit'];
            specialItems.forEach(itemId => {
                const item = window.inventoryManager.items.find(i => i.id === itemId);
                if (item) {
                    used += item.quantity || 0; // Count actual quantity
                }
            });
        }
        
        return used;
    }
    
    // Get inventory capacity
    getInventoryCapacity() {
        return this.carryingCapacity;
    }
    
    // Check if player has space for a new commodity type
    hasInventorySpace() {
        return this.getInventoryUsed() < this.getInventoryCapacity();
    }
    
    // Buy commodity
    buyCommodity(location, commodity, quantity) {
        // Validate location
        if (location !== this.currentLocation) {
            return { success: false, error: 'Not at this location' };
        }
        
        // Validate commodity is in active commodities for this location
        const activeCommodities = this.getAvailableCommodities(location);
        if (!activeCommodities.includes(commodity)) {
            return { success: false, error: 'Commodity not available at this location this turn' };
        }
        
        // Get price
        const price = this.getPrice(location, commodity);
        if (!price) {
            return { success: false, error: 'Price not available' };
        }
        
        // Calculate total cost
        const totalCost = price * quantity;
        
        // Check if player has enough money
        if (this.money < totalCost) {
            return { success: false, error: 'Insufficient funds' };
        }
        
        // Check inventory space - count total quantity, not types
        const currentInventoryUsed = this.getInventoryUsed();
        const wouldExceedCapacity = (currentInventoryUsed + quantity) > this.getInventoryCapacity();
        
        if (wouldExceedCapacity) {
            return { success: false, error: 'Insufficient Inventory' };
        }
        
        // Execute purchase
        this.money -= totalCost;
        this.commodities[commodity] = (this.commodities[commodity] || 0) + quantity;
        
        // Track achievements and score for slave purchases
        if (commodity === 'slaves' && window.scoreManager) {
            // Add Slaver achievement on first slave purchase
            const isNewAchievement = window.scoreManager.addAchievement('Slaver');
            // Add 1 point per slave bought
            window.scoreManager.addScore(quantity);
            // Update score display if it exists
            if (window.updateScoreDisplay) {
                window.updateScoreDisplay();
            }
        }
        
        return { success: true, cost: totalCost };
    }
    
    // Sell commodity
    sellCommodity(location, commodity, quantity) {
        // Validate location
        if (location !== this.currentLocation) {
            return { success: false, error: 'Not at this location' };
        }
        
        // Validate commodity is in active commodities for this location
        const activeCommodities = this.getAvailableCommodities(location);
        if (!activeCommodities.includes(commodity)) {
            return { success: false, error: 'Commodity not available at this location this turn' };
        }
        
        // Check if player has enough quantity
        const currentQuantity = this.getCommodityQuantity(commodity);
        if (currentQuantity < quantity) {
            return { success: false, error: 'Insufficient quantity' };
        }
        
        // Get price
        const price = this.getPrice(location, commodity);
        if (!price) {
            return { success: false, error: 'Price not available' };
        }
        
        // Calculate total revenue
        const totalRevenue = price * quantity;
        
        // Execute sale
        this.commodities[commodity] = currentQuantity - quantity;
        this.money += totalRevenue;
        
        // Track achievements for gold sales
        if (commodity === 'gold' && window.scoreManager) {
            const isNewAchievement = window.scoreManager.addAchievement('Jew');
            // Update score display if it exists
            if (window.updateScoreDisplay) {
                window.updateScoreDisplay();
            }
        }
        
        return { success: true, revenue: totalRevenue };
    }
    
    // Advance turn (called when travel completes)
    advanceTurn(newLocation) {
        this.turn++;
        this.currentLocation = newLocation;
        
        // Randomize active commodities for all locations (new selection each turn)
        Object.keys(LOCATION_CONFIG).forEach(location => {
            this.randomizeActiveCommodities(location);
        });
        
        // Fluctuate prices for active commodities at all locations
        this.fluctuatePrices();
    }
    
    // Fluctuate prices based on fluctuation rates (only for active commodities)
    fluctuatePrices() {
        Object.keys(this.locationActiveCommodities).forEach(locationKey => {
            // Get active commodities for this location
            const activeCommodities = this.locationActiveCommodities[locationKey] || [];
            
            // Try to find config with case-insensitive matching
            const config = LOCATION_CONFIG[locationKey] || 
                          LOCATION_CONFIG[locationKey.toUpperCase()] || 
                          LOCATION_CONFIG[locationKey.toLowerCase()];
            if (!config) return;
            
            // Only fluctuate prices for active commodities
            activeCommodities.forEach(commodity => {
                const currentPrice = this.locationPrices[locationKey]?.[commodity];
                if (currentPrice === undefined) return;
                
                const fluctuationRate = FLUCTUATION_RATES[commodity];
                if (!fluctuationRate) return;
                
                // Random fluctuation within range
                const fluctuation = (Math.random() * (fluctuationRate.max - fluctuationRate.min)) + fluctuationRate.min;
                const direction = Math.random() < 0.5 ? -1 : 1; // Random up or down
                
                const change = currentPrice * fluctuation * direction;
                let newPrice = Math.floor(currentPrice + change);
                
                // Ensure price doesn't go below minimum or above maximum
                const baseRange = PRICE_RANGES[commodity];
                const multiplier = getPriceMultiplier(locationKey, commodity);
                const minPrice = Math.floor(baseRange.min * multiplier * 0.5); // Allow 50% below base
                const maxPrice = Math.floor(baseRange.max * multiplier * 1.5); // Allow 50% above base
                
                newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
                
                if (!this.locationPrices[locationKey]) {
                    this.locationPrices[locationKey] = {};
                }
                this.locationPrices[locationKey][commodity] = newPrice;
            });
        });
    }
    
    // Get all commodities with quantities (for inventory display)
    getAllCommodities() {
        return Object.values(COMMODITIES).map(commodity => ({
            id: commodity,
            quantity: this.getCommodityQuantity(commodity)
        })).filter(item => item.quantity > 0);
    }
}

