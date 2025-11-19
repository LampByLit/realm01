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
        this.deployedRobots = 0; // Robots deployed for passive income
        this.deployedWeapons = 0; // Weapons deployed for slave income
        this.deployedMerchants = 0; // Merchants deployed for passive income
        this.deployedArmies = 0; // Armies deployed for slave income
        this.deployedArchons = 0; // Archons deployed for money and slave income

        // Omega weapon system
        this.omegaCharge = 0; // Turns of charging completed (0-10)

        // Supernova gift system
        this.supernovaGiftClaimedThisTurn = false; // Track if gift has been claimed this turn

        // Gaia BH1 Banking System
        this.gaiaBH1Loan = {
            active: false,
            amount: 20000,
            totalOwed: 24000,
            turnsRemaining: 10,
            repaid: false
        };

        this.gaiaBH1Account = {
            balance: 0,
            minimum: 5000,
            active: false
        };

        this.gaiaBH1Investment = {
            active: false,
            amount: 30000,
            payoutPerTurn: 4000,
            turnsRemaining: 10,
            totalPaid: 0
        };

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
            }
            // Special handling for Moon: Fuel is always available, only 2 random from others
            else if (locationKey === 'MOON' && config.alwaysAvailableCommodities) {
                const selected = [...config.alwaysAvailableCommodities]; // Start with always available (Fuel)
                const otherCommodities = config.availableCommodities.filter(
                    c => !config.alwaysAvailableCommodities.includes(c)
                );

                // Shuffle and take 2 random from others (Slaves, Ore, Iron, Gold)
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
        }
        // Special handling for Moon: Fuel is always available, only 2 random from others
        else if (locationKey === 'MOON' && config.alwaysAvailableCommodities) {
            selected = [...config.alwaysAvailableCommodities]; // Start with always available (Fuel)
            const otherCommodities = config.availableCommodities.filter(
                c => !config.alwaysAvailableCommodities.includes(c)
            );

            // Shuffle and take 2 random from others (Slaves, Ore, Iron, Gold)
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
        // Note: Robots don't count towards inventory usage (they provide capacity bonus instead)
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
        let capacity = this.carryingCapacity;

        // Add +5 capacity per robot in inventory
        if (window.inventoryManager) {
            const robotItem = window.inventoryManager.getItem('robot');
            if (robotItem) {
                capacity += robotItem.quantity * 5;
            }
        }

        // Add +15 capacity per merchant in inventory
        if (window.inventoryManager) {
            const merchantItem = window.inventoryManager.getItem('merchant');
            if (merchantItem) {
                capacity += merchantItem.quantity * 15;
            }
        }

        // Add +15 capacity per archon in inventory
        if (window.inventoryManager) {
            const archonItem = window.inventoryManager.getItem('archon');
            if (archonItem) {
                capacity += archonItem.quantity * 15;
            }
        }

        return capacity;
    }
    
    // Check if player has space for a new commodity type
    hasInventorySpace() {
        return this.getInventoryUsed() < this.getInventoryCapacity();
    }

    // Enforce inventory capacity limits by removing excess slaves
    enforceInventoryLimits() {
        const currentUsed = this.getInventoryUsed();
        const maxCapacity = this.getInventoryCapacity();

        if (currentUsed > maxCapacity) {
            const excess = currentUsed - maxCapacity;
            // Remove excess from slaves (don't go below 0)
            this.commodities[COMMODITIES.SLAVES] = Math.max(0, this.commodities[COMMODITIES.SLAVES] - excess);
        }
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

    // Deploy a robot for passive income
    deployRobot() {
        // Check if player has robots to deploy
        if (window.inventoryManager) {
            const robotItem = window.inventoryManager.getItem('robot');
            if (robotItem && robotItem.quantity > 0) {
                // Remove one robot from inventory
                window.inventoryManager.removeItem('robot', 1);
                // Add to deployed robots counter
                this.deployedRobots++;
                // Enforce inventory limits after capacity reduction
                this.enforceInventoryLimits();
                return true;
            }
        }
        return false;
    }

    // Deploy a merchant for passive income
    deployMerchant() {
        // Check if player has merchants to deploy
        if (window.inventoryManager) {
            const merchantItem = window.inventoryManager.getItem('merchant');
            if (merchantItem && merchantItem.quantity > 0) {
                // Remove one merchant from inventory
                window.inventoryManager.removeItem('merchant', 1);
                // Add to deployed merchants counter
                this.deployedMerchants++;
                // Enforce inventory limits after capacity reduction
                this.enforceInventoryLimits();
                return true;
            }
        }
        return false;
    }

    // Get total deployed robot income per turn
    getDeployedRobotIncome() {
        return this.deployedRobots * 100;
    }

    // Get total deployed merchant income per turn
    getDeployedMerchantIncome() {
        return this.deployedMerchants * 250;
    }

    // Deploy a weapon for slave income
    deployWeapon() {
        // Check if player has weapons to deploy
        if (window.inventoryManager) {
            const weaponItem = window.inventoryManager.getItem('weapons');
            if (weaponItem && weaponItem.quantity > 0) {
                // Remove one weapon from inventory
                window.inventoryManager.removeItem('weapons', 1);
                // Add to deployed weapons counter
                this.deployedWeapons++;
                return true;
            }
        }
        return false;
    }

    // Deploy an army for slave income
    deployArmy() {
        // Check if player has armies to deploy
        if (window.inventoryManager) {
            const armyItem = window.inventoryManager.getItem('army');
            if (armyItem && armyItem.quantity > 0) {
                // Remove one army from inventory
                window.inventoryManager.removeItem('army', 1);
                // Add to deployed armies counter
                this.deployedArmies++;
                return true;
            }
        }
        return false;
    }

    // Deploy an archon for money and slave income
    deployArchon() {
        // Check if player has archons to deploy
        if (window.inventoryManager) {
            const archonItem = window.inventoryManager.getItem('archon');
            if (archonItem && archonItem.quantity > 0) {
                // Remove one archon from inventory
                window.inventoryManager.removeItem('archon', 1);
                // Add to deployed archons counter
                this.deployedArchons++;
                // Enforce inventory limits after capacity reduction
                this.enforceInventoryLimits();
                return true;
            }
        }
        return false;
    }

    // Get total deployed weapon slave income per turn
    getDeployedWeaponSlaveIncome() {
        return this.deployedWeapons * 1; // +1 slave per weapon per turn
    }

    // Get total deployed army slave income per turn
    getDeployedArmySlaveIncome() {
        return this.deployedArmies * 5; // +5 slaves per army per turn
    }

    // Get total deployed archon income per turn
    getDeployedArchonIncome() {
        return this.deployedArchons * 500; // $500 per archon per turn
    }

    // Get total deployed archon slave income per turn
    getDeployedArchonSlaveIncome() {
        return this.deployedArchons * 5; // +5 slaves per archon per turn
    }

    // Advance turn (called when travel completes)
    advanceTurn(newLocation) {
        this.turn++;
        this.currentLocation = newLocation;

        // Reset supernova gift availability for new turn
        this.supernovaGiftClaimedThisTurn = false;

        // Add income from deployed robots ($100 per robot per turn)
        if (this.deployedRobots > 0) {
            this.money += this.deployedRobots * 100;
        }

        // Add income from deployed merchants ($250 per merchant per turn)
        if (this.deployedMerchants > 0) {
            this.money += this.deployedMerchants * 250;
        }

        // Add income from deployed archons ($500 per archon per turn)
        if (this.deployedArchons > 0) {
            this.money += this.deployedArchons * 500;
        }

        // Add slaves from deployed weapons (+1 slave per weapon per turn)
        // But respect inventory capacity - don't exceed the limit
        if (this.deployedWeapons > 0) {
            const slavesToAdd = this.deployedWeapons * 1;
            const currentUsed = this.getInventoryUsed();
            const maxCapacity = this.getInventoryCapacity();
            const availableSpace = maxCapacity - currentUsed;

            // Only add slaves up to available inventory space
            const actualSlavesToAdd = Math.min(slavesToAdd, availableSpace);
            if (actualSlavesToAdd > 0) {
                this.commodities[COMMODITIES.SLAVES] += actualSlavesToAdd;
            }
        }

        // Add slaves from deployed armies (+5 slaves per army per turn)
        // But respect inventory capacity - don't exceed the limit
        if (this.deployedArmies > 0) {
            const slavesToAdd = this.deployedArmies * 5;
            const currentUsed = this.getInventoryUsed();
            const maxCapacity = this.getInventoryCapacity();
            const availableSpace = maxCapacity - currentUsed;

            // Only add slaves up to available inventory space
            const actualSlavesToAdd = Math.min(slavesToAdd, availableSpace);
            if (actualSlavesToAdd > 0) {
                this.commodities[COMMODITIES.SLAVES] += actualSlavesToAdd;
            }
        }

        // Add slaves from deployed archons (+5 slaves per archon per turn)
        // But respect inventory capacity - don't exceed the limit
        if (this.deployedArchons > 0) {
            const slavesToAdd = this.deployedArchons * 5;
            const currentUsed = this.getInventoryUsed();
            const maxCapacity = this.getInventoryCapacity();
            const availableSpace = maxCapacity - currentUsed;

            // Only add slaves up to available inventory space
            const actualSlavesToAdd = Math.min(slavesToAdd, availableSpace);
            if (actualSlavesToAdd > 0) {
                this.commodities[COMMODITIES.SLAVES] += actualSlavesToAdd;
            }
        }

        // Process Omega weapon charging
        if (this.omegaCharge >= 0 && this.omegaCharge < 10) {
            this.omegaCharge++;
            console.log(`⚡ Omega charge increased to ${this.omegaCharge}/10`);

            // If fully charged, update moon interface
            if (this.omegaCharge >= 10) {
                console.log('⚡ Omega fully charged - ready to destroy locations');
                // The moon interface will be updated when the explore panel refreshes
            }
        }

        // Randomize active commodities for all locations (new selection each turn)
        Object.keys(LOCATION_CONFIG).forEach(location => {
            this.randomizeActiveCommodities(location);
        });
        
        // Process Gaia BH1 banking system
        this.processGaiaBH1Banking();

        // Fluctuate prices for active commodities at all locations
        this.fluctuatePrices();
    }

    // Process Gaia BH1 banking mechanics each turn
    processGaiaBH1Banking() {
        // Process loan countdown
        if (this.gaiaBH1Loan.active && !this.gaiaBH1Loan.repaid) {
            this.gaiaBH1Loan.turnsRemaining--;

            // Trigger Reptilian agro when loan is not repaid on time
            if (this.gaiaBH1Loan.turnsRemaining <= 0) {
                if (window.npcManager) {
                    const reptiliansNpc = window.npcManager.npcs.find(npc => npc.name === 'Reptilians');
                    if (reptiliansNpc && !reptiliansNpc.agro) {
                        window.npcManager.activateAgroMode(reptiliansNpc);
                        console.log('🐲 Reptilian agro triggered: Loan default');
                    }
                }
            }
        }

        // Process investment payouts
        if (this.gaiaBH1Investment.active) {
            this.gaiaBH1Investment.turnsRemaining--;
            this.money += this.gaiaBH1Investment.payoutPerTurn;
            this.gaiaBH1Investment.totalPaid += this.gaiaBH1Investment.payoutPerTurn;

            // Investment complete
            if (this.gaiaBH1Investment.turnsRemaining <= 0) {
                this.gaiaBH1Investment.active = false;
            }
        }
    }
    
    // Generate totally random prices within range (no fluctuation logic)
    fluctuatePrices() {
        Object.keys(this.locationActiveCommodities).forEach(locationKey => {
            // Get active commodities for this location
            const activeCommodities = this.locationActiveCommodities[locationKey] || [];

            // Try to find config with case-insensitive matching
            const config = LOCATION_CONFIG[locationKey] ||
                          LOCATION_CONFIG[locationKey.toUpperCase()] ||
                          LOCATION_CONFIG[locationKey.toLowerCase()];
            if (!config) return;

            // Generate completely new random prices for active commodities
            activeCommodities.forEach(commodity => {
                // Check if this commodity has a special price range at this location
                if (config && config.specialPriceRanges && config.specialPriceRanges[commodity]) {
                    // Use special price range directly (no multiplier)
                    const range = config.specialPriceRanges[commodity];
                    this.locationPrices[locationKey][commodity] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
                } else {
                    // Use standard price generation with multiplier
                    const basePrice = getRandomPrice(commodity, locationKey);
                    const multiplier = getPriceMultiplier(locationKey, commodity);
                    this.locationPrices[locationKey][commodity] = Math.floor(basePrice * multiplier);
                }
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

    // Add commodity directly (for gifts, not purchases)
    addCommodity(commodity, quantity) {
        // Check inventory space - count total quantity, not types
        const currentInventoryUsed = this.getInventoryUsed();
        const wouldExceedCapacity = (currentInventoryUsed + quantity) > this.getInventoryCapacity();

        if (wouldExceedCapacity) {
            return false; // Insufficient inventory space
        }

        // Add the commodity
        this.commodities[commodity] = (this.commodities[commodity] || 0) + quantity;
        return true;
    }
}

