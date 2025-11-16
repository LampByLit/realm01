// trading-config.js - Configuration for the trading game system

// Commodity definitions (in order of price, cheapest to most expensive)
export const COMMODITIES = {
    SLAVES: 'slaves',
    ORE: 'ore',
    IRON: 'iron',
    GOLD: 'gold',
    FUEL: 'fuel',
    EXOTIC: 'exotic',
    DARK_MATTER: 'dark matter',
    ANTIMATTER: 'antimatter',
    AURA: 'aura',
    ENTROPY: 'entropy'
};

// Price ranges for each commodity (base prices on EARTH)
// Format: { min: number, max: number }
export const PRICE_RANGES = {
    [COMMODITIES.SLAVES]: { min: 10, max: 50 },
    [COMMODITIES.ORE]: { min: 50, max: 150 },
    [COMMODITIES.IRON]: { min: 100, max: 300 },
    [COMMODITIES.GOLD]: { min: 200, max: 600 },
    [COMMODITIES.FUEL]: { min: 300, max: 900 },
    [COMMODITIES.EXOTIC]: { min: 500, max: 1500 },
    [COMMODITIES.DARK_MATTER]: { min: 1000, max: 3000 },
    [COMMODITIES.ANTIMATTER]: { min: 2000, max: 6000 },
    [COMMODITIES.AURA]: { min: 5000, max: 15000 },
    [COMMODITIES.ENTROPY]: { min: 10000, max: 30000 }
};

// Price fluctuation rates per commodity (percentage change per turn)
// Heavy fluctuation: ±30-50%, Moderate: ±15-25%, Light: ±5-15%
export const FLUCTUATION_RATES = {
    [COMMODITIES.SLAVES]: { min: 0.30, max: 0.50 }, // Heavy
    [COMMODITIES.ORE]: { min: 0.30, max: 0.50 }, // Heavy
    [COMMODITIES.IRON]: { min: 0.30, max: 0.50 }, // Heavy
    [COMMODITIES.GOLD]: { min: 0.15, max: 0.25 }, // Moderate
    [COMMODITIES.FUEL]: { min: 0.15, max: 0.25 }, // Moderate
    [COMMODITIES.EXOTIC]: { min: 0.30, max: 0.50 }, // Heavy
    [COMMODITIES.DARK_MATTER]: { min: 0.05, max: 0.15 }, // Light
    [COMMODITIES.ANTIMATTER]: { min: 0.05, max: 0.15 }, // Light
    [COMMODITIES.AURA]: { min: 0.05, max: 0.15 }, // Light
    [COMMODITIES.ENTROPY]: { min: 0.05, max: 0.15 } // Light
};

// Location configuration
// priceMultiplier: multiplier for base prices (1.0 = same as EARTH, >1.0 = more expensive)
// specialPrices: override prices for specific commodities at this location
// Note: Location names should match object names (case-insensitive matching handled in code)
export const LOCATION_CONFIG = {
    'EARTH': {
        fuelCost: 1,
        unlockCost: 0, // Already unlocked
        availableCommodities: [COMMODITIES.SLAVES, COMMODITIES.ORE, COMMODITIES.IRON, COMMODITIES.GOLD, COMMODITIES.FUEL],
        priceMultiplier: 1.0, // Cheapest
        specialPrices: {} // No special prices
    },
    'MOON': {
        fuelCost: 1,
        unlockCost: 0, // Already unlocked
        availableCommodities: [COMMODITIES.SLAVES, COMMODITIES.ORE, COMMODITIES.IRON, COMMODITIES.GOLD],
        alwaysAvailableCommodities: [COMMODITIES.FUEL], // Fuel always available
        priceMultiplier: 1.2, // Usually more expensive (20% markup)
        specialPrices: {} // No special prices
    },
    'MARS': {
        fuelCost: 1,
        unlockCost: 0, // Already unlocked
        availableCommodities: [COMMODITIES.SLAVES, COMMODITIES.ORE, COMMODITIES.IRON, COMMODITIES.GOLD, COMMODITIES.FUEL],
        priceMultiplier: 1.3, // Usually more expensive (30% markup)
        specialPrices: {
            [COMMODITIES.SLAVES]: { multiplier: 2.0 } // Slaves are expensive on MARS (2x base)
        }
    },
    'VENUS': {
        fuelCost: 1,
        unlockCost: 0, // Already unlocked (on initial greenlist)
        availableCommodities: [COMMODITIES.SLAVES, COMMODITIES.ORE, COMMODITIES.GOLD, COMMODITIES.FUEL, COMMODITIES.EXOTIC],
        priceMultiplier: 1.2, // Usually more expensive (20% markup)
        specialPrices: {},
        specialPriceRanges: {
            [COMMODITIES.EXOTIC]: { min: 2500, max: 3500 } // Exotic costs 2500-3500 on Venus
        },
        alwaysAvailableCommodities: [COMMODITIES.EXOTIC] // Exotic is always available
    },
    'SATURN': {
        fuelCost: 1,
        unlockCost: 0,
        availableCommodities: [COMMODITIES.GOLD, COMMODITIES.EXOTIC, COMMODITIES.SLAVES],
        priceMultiplier: 1.0,
        specialPrices: {
            [COMMODITIES.SLAVES]: { multiplier: 5.0 } // Slaves are worth 5x on Saturn
        }
    },
    'JUPITER': {
        fuelCost: 1,
        unlockCost: 0,
        availableCommodities: [], // No trading on Jupiter
        priceMultiplier: 1.0,
        specialPrices: {}
    },
    'NEPTUNE': {
        fuelCost: 1,
        unlockCost: 0,
        availableCommodities: [COMMODITIES.EXOTIC, COMMODITIES.ANTIMATTER, COMMODITIES.DARK_MATTER],
        priceMultiplier: 1.0,
        specialPrices: {},
        specialPriceRanges: {
            [COMMODITIES.ANTIMATTER]: { min: 5000, max: 9000 },
            [COMMODITIES.DARK_MATTER]: { min: 8000, max: 9999 }
        }
    },
    'PLUTO': {
        fuelCost: 1,
        unlockCost: 0,
        availableCommodities: [COMMODITIES.SLAVES, COMMODITIES.ORE, COMMODITIES.IRON, COMMODITIES.GOLD, COMMODITIES.FUEL],
        priceMultiplier: 1.0,
        specialPrices: {}
    },
    'anja': {
        fuelCost: 1,
        unlockCost: 0,
        availableCommodities: [COMMODITIES.SLAVES, COMMODITIES.ORE, COMMODITIES.IRON, COMMODITIES.GOLD, COMMODITIES.FUEL],
        priceMultiplier: 1.0,
        specialPrices: {}
    },
    // Other locations will be added later
};

// Helper function to get random price within range
export function getRandomPrice(commodity, location = null) {
    // Check for special price range at location first
    if (location) {
        const locationUpper = location.toUpperCase();
        const config = LOCATION_CONFIG[location] || LOCATION_CONFIG[locationUpper] || LOCATION_CONFIG[location.toLowerCase()];
        if (config && config.specialPriceRanges && config.specialPriceRanges[commodity]) {
            const range = config.specialPriceRanges[commodity];
            return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        }
    }
    
    // Use default price range
    const range = PRICE_RANGES[commodity];
    if (!range) return 0;
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

// Helper function to get price multiplier for commodity at location
export function getPriceMultiplier(location, commodity) {
    // Handle case-insensitive location matching
    const locationUpper = location.toUpperCase();
    const config = LOCATION_CONFIG[location] || LOCATION_CONFIG[locationUpper] || LOCATION_CONFIG[location.toLowerCase()];
    if (!config) return 1.0;
    
    // Check for special price override
    if (config.specialPrices && config.specialPrices[commodity]) {
        return config.specialPrices[commodity].multiplier;
    }
    
    return config.priceMultiplier || 1.0;
}

// Helper function to check if commodity is available at location
export function isCommodityAvailable(location, commodity) {
    // Handle case-insensitive location matching
    const locationUpper = location.toUpperCase();
    const config = LOCATION_CONFIG[location] || LOCATION_CONFIG[locationUpper] || LOCATION_CONFIG[location.toLowerCase()];
    if (!config) return false;
    return config.availableCommodities.includes(commodity);
}

