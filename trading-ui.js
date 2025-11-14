// trading-ui.js - UI rendering for trading system
import { COMMODITIES } from './trading-config.js';

export class TradingUI {
    constructor() {
        // Commodity display names
        this.commodityNames = {
            [COMMODITIES.SLAVES]: 'Slaves',
            [COMMODITIES.ORE]: 'Ore',
            [COMMODITIES.IRON]: 'Iron',
            [COMMODITIES.GOLD]: 'Gold',
            [COMMODITIES.FUEL]: 'Fuel',
            [COMMODITIES.EXOTIC]: 'Exotic',
            [COMMODITIES.DARK_MATTER]: 'Dark Matter',
            [COMMODITIES.UNOBTAINIUM]: 'Unobtainium',
            [COMMODITIES.ANTIMATTER]: 'Antimatter',
            [COMMODITIES.AURA]: 'Aura',
            [COMMODITIES.ENTROPY]: 'Entropy'
        };
        
        // Error message timeout
        this.errorTimeout = null;
    }
    
    // Show error message in the trading section
    showError(message, parentElement) {
        // Remove any existing error message
        const existingError = parentElement.querySelector('.trading-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'trading-error';
        errorElement.textContent = message;
        errorElement.style.fontFamily = 'var(--font-primary)';
        errorElement.style.fontSize = '0.625rem';
        errorElement.style.color = 'rgba(255, 100, 100, 0.9)';
        errorElement.style.padding = '0.5rem';
        errorElement.style.marginTop = '0.5rem';
        errorElement.style.backgroundColor = 'rgba(255, 100, 100, 0.1)';
        errorElement.style.border = '1px solid rgba(255, 100, 100, 0.3)';
        errorElement.style.borderRadius = '4px';
        errorElement.style.opacity = '0';
        errorElement.style.transition = 'opacity 0.2s';
        
        // Insert error at the end of parent
        parentElement.appendChild(errorElement);
        
        // Fade in
        setTimeout(() => {
            errorElement.style.opacity = '1';
        }, 10);
        
        // Auto-remove after 4 seconds
        clearTimeout(this.errorTimeout);
        this.errorTimeout = setTimeout(() => {
            errorElement.style.opacity = '0';
            setTimeout(() => {
                if (errorElement.parentElement) {
                    errorElement.remove();
                }
            }, 200);
        }, 4000);
    }
    
    // Render trading panel for explore menu
    renderTradingPanel(tradingGame, currentLocation) {
        const tradingSection = document.createElement('div');
        tradingSection.className = 'trading-section';
        tradingSection.style.marginBottom = '2rem';
        tradingSection.style.paddingBottom = '2rem';
        tradingSection.style.borderBottom = '1px solid rgba(196, 213, 188, 0.2)';
        
        // Title
        const tradingTitle = document.createElement('h3');
        tradingTitle.textContent = 'TRADING';
        tradingTitle.style.fontFamily = 'var(--font-primary)';
        tradingTitle.style.fontWeight = '700';
        tradingTitle.style.fontSize = '0.625rem';
        tradingTitle.style.textTransform = 'uppercase';
        tradingTitle.style.letterSpacing = '0.1em';
        tradingTitle.style.color = 'var(--color--foreground)';
        tradingTitle.style.marginBottom = '1rem';
        tradingTitle.style.opacity = '0.9';
        tradingSection.appendChild(tradingTitle);
        
        // Get available commodities at current location
        const availableCommodities = tradingGame.getAvailableCommodities(currentLocation);
        
        if (availableCommodities.length === 0) {
            const noCommodities = document.createElement('p');
            noCommodities.textContent = 'No commodities available at this location.';
            noCommodities.style.fontFamily = 'var(--font-primary)';
            noCommodities.style.fontSize = '0.75rem';
            noCommodities.style.color = 'var(--color--foreground)';
            noCommodities.style.opacity = '0.7';
            tradingSection.appendChild(noCommodities);
            return tradingSection;
        }
        
        // Create commodity list
        const commodityList = document.createElement('div');
        commodityList.className = 'commodity-list';
        commodityList.style.display = 'flex';
        commodityList.style.flexDirection = 'column';
        commodityList.style.gap = '0.75rem';
        
        availableCommodities.forEach(commodity => {
            const commodityItem = this.createCommodityItem(tradingGame, currentLocation, commodity, tradingSection);
            commodityList.appendChild(commodityItem);
        });
        
        tradingSection.appendChild(commodityList);
        
        return tradingSection;
    }
    
    // Create individual commodity item with buy/sell controls
    createCommodityItem(tradingGame, location, commodity, tradingSection) {
        const item = document.createElement('div');
        item.className = 'commodity-item';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '0.5rem';
        item.style.padding = '0.75rem';
        item.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
        item.style.borderRadius = '4px';
        item.style.border = '1px solid rgba(196, 213, 188, 0.1)';
        
        // Commodity name and price row
        const headerRow = document.createElement('div');
        headerRow.style.display = 'flex';
        headerRow.style.justifyContent = 'space-between';
        headerRow.style.alignItems = 'center';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = this.commodityNames[commodity];
        nameSpan.style.fontFamily = 'var(--font-primary)';
        nameSpan.style.fontWeight = '600';
        nameSpan.style.fontSize = '0.75rem';
        nameSpan.style.color = 'var(--color--foreground)';
        nameSpan.style.opacity = '0.9';
        
        const priceSpan = document.createElement('span');
        const price = tradingGame.getPrice(location, commodity);
        priceSpan.textContent = `$${price}`;
        priceSpan.style.fontFamily = 'var(--font-primary)';
        priceSpan.style.fontWeight = '700';
        priceSpan.style.fontSize = '0.75rem';
        priceSpan.style.color = 'var(--color--foreground)';
        
        headerRow.appendChild(nameSpan);
        headerRow.appendChild(priceSpan);
        
        // Inventory quantity
        const quantitySpan = document.createElement('span');
        const quantity = tradingGame.getCommodityQuantity(commodity);
        quantitySpan.textContent = `You have: ${quantity}`;
        quantitySpan.style.fontFamily = 'var(--font-primary)';
        quantitySpan.style.fontSize = '0.625rem';
        quantitySpan.style.color = 'var(--color--foreground)';
        quantitySpan.style.opacity = '0.7';
        
        // Buy/Sell buttons row
        const buttonRow = document.createElement('div');
        buttonRow.style.display = 'flex';
        buttonRow.style.gap = '0.5rem';
        
        // Buy button
        const buyButton = document.createElement('button');
        buyButton.textContent = 'BUY';
        buyButton.className = 'trading-button buy-button';
        buyButton.style.flex = '1';
        buyButton.style.padding = '0.5rem';
        buyButton.style.fontFamily = 'var(--font-primary)';
        buyButton.style.fontWeight = '700';
        buyButton.style.fontSize = '0.625rem';
        buyButton.style.textTransform = 'uppercase';
        buyButton.style.letterSpacing = '0.05em';
        buyButton.style.color = 'var(--color--foreground)';
        buyButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
        buyButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
        buyButton.style.borderRadius = '4px';
        buyButton.style.cursor = 'pointer';
        buyButton.style.transition = 'all 0.2s';
        
        // Hover effects
        buyButton.addEventListener('mouseenter', () => {
            buyButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
        });
        buyButton.addEventListener('mouseleave', () => {
            buyButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
        });
        
        // Buy click handler
        buyButton.addEventListener('click', () => {
            this.handleBuy(tradingGame, location, commodity, buyButton, tradingSection);
        });
        
        // Sell button
        const sellButton = document.createElement('button');
        sellButton.textContent = 'SELL';
        sellButton.className = 'trading-button sell-button';
        sellButton.style.flex = '1';
        sellButton.style.padding = '0.5rem';
        sellButton.style.fontFamily = 'var(--font-primary)';
        sellButton.style.fontWeight = '700';
        sellButton.style.fontSize = '0.625rem';
        sellButton.style.textTransform = 'uppercase';
        sellButton.style.letterSpacing = '0.05em';
        sellButton.style.color = 'var(--color--foreground)';
        sellButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
        sellButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
        sellButton.style.borderRadius = '4px';
        sellButton.style.cursor = 'pointer';
        sellButton.style.transition = 'all 0.2s';
        
        // Disable sell if no quantity
        if (quantity === 0) {
            sellButton.disabled = true;
            sellButton.style.opacity = '0.5';
            sellButton.style.cursor = 'not-allowed';
        }
        
        // Hover effects
        sellButton.addEventListener('mouseenter', () => {
            if (!sellButton.disabled) {
                sellButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            }
        });
        sellButton.addEventListener('mouseleave', () => {
            if (!sellButton.disabled) {
                sellButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            }
        });
        
        // Sell click handler
        sellButton.addEventListener('click', () => {
            if (!sellButton.disabled) {
                this.handleSell(tradingGame, location, commodity, sellButton, quantitySpan, tradingSection);
            }
        });
        
        buttonRow.appendChild(buyButton);
        buttonRow.appendChild(sellButton);
        
        // Assemble item
        item.appendChild(headerRow);
        item.appendChild(quantitySpan);
        item.appendChild(buttonRow);
        
        return item;
    }
    
    // Handle buy action
    handleBuy(tradingGame, location, commodity, button, tradingSection) {
        // Simple: buy 1 unit for now (can be enhanced later with quantity input)
        const result = tradingGame.buyCommodity(location, commodity, 1);
        
        if (result.success) {
            // Update UI
            this.updateTradingPanel(tradingGame, location);
            this.updateInventoryDisplay();
            
            // Visual feedback
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
            setTimeout(() => {
                button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            }, 200);
        } else {
            // Show error inline
            this.showError(result.error || 'Purchase failed', tradingSection);
            
            // Visual feedback for error
            button.style.backgroundColor = 'rgba(255, 100, 100, 0.2)';
            setTimeout(() => {
                button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            }, 300);
        }
    }
    
    // Handle sell action
    handleSell(tradingGame, location, commodity, button, quantitySpan, tradingSection) {
        // Simple: sell 1 unit for now (can be enhanced later with quantity input)
        const result = tradingGame.sellCommodity(location, commodity, 1);
        
        if (result.success) {
            // Update quantity display
            const newQuantity = tradingGame.getCommodityQuantity(commodity);
            quantitySpan.textContent = `You have: ${newQuantity}`;
            
            // Disable sell button if quantity is 0
            if (newQuantity === 0) {
                button.disabled = true;
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
            }
            
            // Update UI
            this.updateTradingPanel(tradingGame, location);
            this.updateInventoryDisplay();
            
            // Visual feedback
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
            setTimeout(() => {
                button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            }, 200);
        } else {
            // Show error inline
            this.showError(result.error || 'Sale failed', tradingSection);
            
            // Visual feedback for error
            button.style.backgroundColor = 'rgba(255, 100, 100, 0.2)';
            setTimeout(() => {
                button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            }, 300);
        }
    }
    
    // Update trading panel (refresh prices, quantities)
    updateTradingPanel(tradingGame, location) {
        // This will be called from main.js when needed
        // The explore panel will be re-rendered
    }
    
    // Update inventory display
    updateInventoryDisplay() {
        // Trigger inventory re-render
        if (window.renderInventory) {
            window.renderInventory();
        }
        
        // Trigger explore panel re-render to update trading section
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }
    }
}

