// combat.js - Combat system for EX LAMINÆ
import * as THREE from 'three';

export class CombatManager {
    constructor(sceneManager, npcManager, tradingGame, scene) {
        this.sceneManager = sceneManager;
        this.npcManager = npcManager;
        this.tradingGame = tradingGame;
        this.scene = scene;

        // Combat state
        this.inCombat = false;
        this.combatMode = null; // 'voluntary' or 'defend'
        this.currentDefendNPC = null;
        this.defendCountdown = null;
        this.defendInterval = null;
        this.lastDefendTurn = -1; // Track last turn defend mode was triggered
        this.lastLocation = null; // Track location changes for screen updates

        // NPC power ranges (as specified)
        this.npcPowerRanges = {
            'Venusians': { min: 10, max: 50 },
            'Martians': { min: 20, max: 80 },
            'Reptilians': { min: 50, max: 200 },
            'Pleiadians': { min: 500, max: 1000 }
        };

        // NPC booty rewards (as specified)
        this.npcBooty = {
            'Venusians': [
                { type: 'commodity', id: 'exotic', quantity: 1 },
                { type: 'commodity', id: 'aura', quantity: 1 },
                { type: 'commodity', id: 'gold', quantity: 1 },
                { type: 'money', amount: 5000 }
            ],
            'Martians': [
                { type: 'commodity', id: 'aura', quantity: 1 },
                { type: 'item', id: 'archon', quantity: 1 },
                { type: 'item', id: 'robot', quantity: 1 },
                { type: 'money', amount: 10000 }
            ],
            'Reptilians': [
                { type: 'item', id: 'baby', quantity: 1 },
                { type: 'item', id: 'archon', quantity: 1 },
                { type: 'commodity', id: 'aura', quantity: 1 },
                { type: 'money', amount: 50000 }
            ],
            'Pleiadians': [
                { type: 'commodity', id: 'ore', quantity: 1 }
            ]
        };

        // Current NPC powers (regenerated each turn)
        this.npcPowers = new Map();

        // No more delayed agro - NPCs become agro immediately

        this.initializeUI();
        this.regenerateNPCPowers();
    }

    // Initialize combat UI elements
    initializeUI() {
        // Combat panel (hidden by default)
        this.combatPanel = document.createElement('div');
        this.combatPanel.className = 'control-panel combat-panel';
        this.combatPanel.id = 'combat-panel';

        const panelHeader = document.createElement('div');
        panelHeader.className = 'panel-header';

        const panelTitle = document.createElement('h2');
        panelTitle.className = 'combat-title';
        panelTitle.textContent = 'COMBAT MODE';
        panelHeader.appendChild(panelTitle);

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'panel-close';
        closeButton.setAttribute('aria-label', 'Close combat');
        closeButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
        `;
        closeButton.addEventListener('click', () => this.exitVoluntaryCombat());
        panelHeader.appendChild(closeButton);

        this.combatPanel.appendChild(panelHeader);

        // Prevent clicks outside the panel from closing it or interfering
        this.combatPanel.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        // Add escape key listener
        this.escapeKeyListener = (event) => {
            if (event.key === 'Escape' && this.inCombat && this.combatMode === 'voluntary') {
                this.exitVoluntaryCombat();
                event.preventDefault();
            }
        };
        document.addEventListener('keydown', this.escapeKeyListener);

        const panelContent = document.createElement('div');
        panelContent.className = 'panel-content';
        this.combatPanel.appendChild(panelContent);

        // Combat content container
        this.combatContent = document.createElement('div');
        this.combatContent.className = 'combat-content';
        panelContent.appendChild(this.combatContent);

        // Add to DOM
        document.body.appendChild(this.combatPanel);

        // Defend mode popup
        this.defendPopup = document.createElement('div');
        this.defendPopup.className = 'defend-popup';
        this.defendPopup.innerHTML = `
            <div class="defend-popup-content">
                <div class="defend-popup-title">⚠️ UNDER ATTACK ⚠️</div>
                <div class="defend-popup-text">An enemy approaches...</div>
                <div class="defend-countdown">10</div>
            </div>
        `;
        document.body.appendChild(this.defendPopup);
    }

    // Regenerate NPC powers each turn (within their ranges)
    regenerateNPCPowers() {
        this.npcPowers.clear();
        Object.keys(this.npcPowerRanges).forEach(npcName => {
            const range = this.npcPowerRanges[npcName];
            const power = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            this.npcPowers.set(npcName, power);
        });
    }

    // Get current NPC power
    getNPCPower(npcName) {
        return this.npcPowers.get(npcName) || 0;
    }

    // Get player power
    getPlayerPower() {
        if (!window.inventoryManager) return 0;
        const weaponItem = window.inventoryManager.getItem('weapons');
        const armyItem = window.inventoryManager.getItem('army');
        const archonItem = window.inventoryManager.getItem('archon');
        const weaponPower = weaponItem ? weaponItem.quantity * 1 : 0;
        const armyPower = armyItem ? armyItem.quantity * 5 : 0;
        const archonPower = archonItem ? archonItem.quantity * 10 : 0;
        return weaponPower + armyPower + archonPower;
    }

    // Enter voluntary combat mode (frequency 1)
    enterVoluntaryCombat() {
        if (this.inCombat) return;

        this.inCombat = true;
        this.combatMode = 'voluntary';

        // Show combat panel
        this.combatPanel.classList.add('open');

        // Hide other panels completely
        document.getElementById('control-panel')?.classList.remove('open');
        document.getElementById('inventory-panel')?.classList.remove('open');
        document.getElementById('explore-panel')?.classList.remove('open');

        // Hide all main menu toggles during combat
        document.getElementById('panel-toggle')?.classList.add('hidden');
        document.getElementById('inventory-toggle')?.classList.add('hidden');
        document.getElementById('explore-toggle')?.classList.add('hidden');

        this.renderCombatMenu();
    }

    // Exit voluntary combat mode
    exitVoluntaryCombat() {
        if (!this.inCombat || this.combatMode === 'defend') return;

        this.inCombat = false;
        this.combatMode = null;

        // Hide combat panel
        this.combatPanel.classList.remove('open');

        // Show all main menu toggles
        document.getElementById('panel-toggle')?.classList.remove('hidden');
        document.getElementById('inventory-toggle')?.classList.remove('hidden');
        document.getElementById('explore-toggle')?.classList.remove('hidden');

        // Set frequency to 7 to exit combat mode (do this after setting inCombat = false to avoid recursion)
        if (window.steppers && window.steppers[4]) {
            window.steppers[4].setValue(7);
        }
    }

    // Enter defend mode (forced by agro NPC)
    enterDefendMode(npc) {
        if (this.inCombat && this.combatMode === 'defend') return; // Already in defend mode

        this.inCombat = true;
        this.combatMode = 'defend';
        this.currentDefendNPC = npc;
        this.lastDefendTurn = this.tradingGame ? this.tradingGame.turn : 0; // Mark this turn as having defend mode

        // Force frequency to 1 (this will be handled by frequency stepper integration)
        // For now, assume it's already set

        // Hide ALL non-combat UI during defend mode
        this.hideAllNonCombatUI();

        // Show defend popup
        this.defendPopup.classList.add('open');

        // Start countdown
        this.defendCountdown = 10;
        this.updateDefendCountdown();

        this.defendInterval = setInterval(() => {
            this.defendCountdown--;
            this.updateDefendCountdown();

            if (this.defendCountdown <= 0) {
                // Auto-attack when countdown reaches 0
                this.executeAttack(npc, true); // true = auto-attack from defend mode
            }
        }, 1000);

        // Show combat panel with defend UI
        this.combatPanel.classList.add('open');
        this.renderDefendMenu(npc);
    }

    // Update defend countdown display
    updateDefendCountdown() {
        const countdownEl = this.defendPopup.querySelector('.defend-countdown');
        if (countdownEl) {
            countdownEl.textContent = this.defendCountdown;
        }
    }

    // Render main combat menu (NPC selection)
    renderCombatMenu() {
        this.combatContent.innerHTML = '';

        const title = document.createElement('div');
        title.className = 'combat-section-title';
        title.textContent = 'SELECT TARGET';
        this.combatContent.appendChild(title);

        // Get NPCs at current location
        const currentLocation = this.tradingGame.currentLocation;
        const availableNPCs = this.npcManager.npcs.filter(npc =>
            npc.currentLocation.toLowerCase() === currentLocation.toLowerCase()
        );

        if (availableNPCs.length === 0) {
            const noTargets = document.createElement('div');
            noTargets.className = 'combat-no-targets';
            noTargets.textContent = 'No enemies present at this location.';
            this.combatContent.appendChild(noTargets);
            return;
        }

        // Create NPC buttons
        availableNPCs.forEach(npc => {
            const npcButton = document.createElement('button');
            npcButton.className = 'combat-npc-button';
            npcButton.textContent = npc.name.toUpperCase();
            npcButton.addEventListener('click', () => this.renderNPCSubmenu(npc));
            this.combatContent.appendChild(npcButton);
        });
    }

    // Update combat screen if it's currently open
    updateCombatScreen() {
        if (!this.inCombat || this.combatMode !== 'voluntary') return;

        // Re-render the combat menu to show current NPCs
        this.renderCombatMenu();
    }

    // Render NPC submenu (power display + actions)
    renderNPCSubmenu(npc) {
        this.combatContent.innerHTML = '';

        const backButton = document.createElement('button');
        backButton.className = 'combat-back-button';
        backButton.textContent = '← BACK';
        backButton.addEventListener('click', () => this.renderCombatMenu());
        this.combatContent.appendChild(backButton);

        const npcTitle = document.createElement('div');
        npcTitle.className = 'combat-npc-title';
        npcTitle.textContent = `TARGET: ${npc.name.toUpperCase()}`;
        this.combatContent.appendChild(npcTitle);

        // Power display
        const powerDisplay = document.createElement('div');
        powerDisplay.className = 'combat-power-display';

        const playerPower = this.getPlayerPower();
        const npcPower = this.getNPCPower(npc.name); // Get actual randomized power

        powerDisplay.innerHTML = `
            <div class="combat-power-item">
                <span class="combat-power-label">YOUR POWER:</span>
                <span class="combat-power-value">${playerPower}</span>
            </div>
            <div class="combat-power-item">
                <span class="combat-power-label">ENEMY POWER:</span>
                <span class="combat-power-value revealed">${npcPower}</span>
            </div>
        `;
        this.combatContent.appendChild(powerDisplay);

        // Action buttons
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'combat-actions';

        const stealButton = document.createElement('button');
        stealButton.className = 'combat-action-button steal-button';
        stealButton.textContent = 'STEAL';
        stealButton.addEventListener('click', () => this.executeSteal(npc));
        actionsContainer.appendChild(stealButton);

        const attackButton = document.createElement('button');
        attackButton.className = 'combat-action-button attack-button';
        attackButton.textContent = 'ATTACK';
        attackButton.addEventListener('click', () => this.executeAttack(npc));
        actionsContainer.appendChild(attackButton);

        this.combatContent.appendChild(actionsContainer);
    }

    // Render defend mode menu
    renderDefendMenu(npc) {
        this.combatContent.innerHTML = '';

        const defendTitle = document.createElement('div');
        defendTitle.className = 'combat-defend-title';
        defendTitle.textContent = `DEFEND AGAINST ${npc.name.toUpperCase()}`;
        this.combatContent.appendChild(defendTitle);

        // Power display
        const powerDisplay = document.createElement('div');
        powerDisplay.className = 'combat-power-display';

        const playerPower = this.getPlayerPower();
        const npcPower = this.getNPCPower(npc.name); // Show actual power in defend mode

        powerDisplay.innerHTML = `
            <div class="combat-power-item">
                <span class="combat-power-label">YOUR POWER:</span>
                <span class="combat-power-value">${playerPower}</span>
            </div>
            <div class="combat-power-item">
                <span class="combat-power-label">ENEMY POWER:</span>
                <span class="combat-power-value revealed">${npcPower}</span>
            </div>
        `;
        this.combatContent.appendChild(powerDisplay);

        // Actions (steal disabled in defend mode)
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'combat-actions defend-actions';

        const stealButton = document.createElement('button');
        stealButton.className = 'combat-action-button steal-button disabled';
        stealButton.textContent = 'STEAL (DISABLED)';
        stealButton.disabled = true;
        actionsContainer.appendChild(stealButton);

        const attackButton = document.createElement('button');
        attackButton.className = 'combat-action-button attack-button defend-attack';
        attackButton.textContent = 'ATTACK';
        attackButton.addEventListener('click', () => this.executeAttack(npc, true)); // defend mode attack
        actionsContainer.appendChild(attackButton);

        this.combatContent.appendChild(actionsContainer);
    }

    // Execute steal action
    executeSteal(npc) {
        const playerPower = this.getPlayerPower();
        const npcPower = this.getNPCPower(npc.name);

        if (playerPower > npcPower) {
            // Success - get booty
            this.grantBooty(npc.name);
            this.activateAgroImmediately(npc); // Combat stealing triggers agro
            this.showCombatResult('STEAL SUCCESSFUL', `You successfully stole from the ${npc.name}!`, true);
        } else {
            // Failure - no booty, but agro still activates
            this.activateAgroImmediately(npc); // Failed combat stealing still triggers agro
            this.showCombatResult('STEAL FAILED', `The ${npc.name} resisted your theft!`, false);
        }
    }

    // Execute attack action
    executeAttack(npc, isDefendMode = false) {
        const playerPower = this.getPlayerPower();
        const npcPower = this.getNPCPower(npc.name);

        // Stop defend countdown if active
        if (this.defendInterval) {
            clearInterval(this.defendInterval);
            this.defendInterval = null;
        }

        if (playerPower >= npcPower) {
            // Victory - get booty and remove NPC
            this.grantBooty(npc.name);
            this.removeNPC(npc);
            this.showCombatResult('VICTORY', `You defeated the ${npc.name}!`, true);
            // showCombatResult will handle ending combat when user clicks continue
        } else {
            // Defeat - lose all inventory except body/soul/spirit/light, get 1 fuel
            this.handleDefeat();
            this.activateAgroImmediately(npc); // Activate agro immediately (NPC survives)
            this.showCombatResult('DEFEAT', `You were defeated by the ${npc.name}!`, false);
            // showCombatResult will handle ending combat after 5 seconds or user click
        }
    }

    // Grant booty rewards
    grantBooty(npcName) {
        const booty = this.npcBooty[npcName];
        if (!booty) return;

        booty.forEach(reward => {
            if (reward.type === 'commodity') {
                // Add to commodities
                this.tradingGame.commodities[reward.id] = (this.tradingGame.commodities[reward.id] || 0) + reward.quantity;
            } else if (reward.type === 'item') {
                // Add to inventory
                if (window.inventoryManager) {
                    window.inventoryManager.addItem(reward.id, reward.quantity);
                }
            } else if (reward.type === 'money') {
                // Add money
                this.tradingGame.money += reward.amount;
            }
        });

        // Update UI
        if (window.renderInventory) {
            window.renderInventory();
        }
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }
    }

    // Handle defeat consequences
    handleDefeat() {
        // Remove all commodities (including fuel)
        Object.keys(this.tradingGame.commodities).forEach(commodity => {
            this.tradingGame.commodities[commodity] = 0;
        });

        // Set fuel to exactly 1
        this.tradingGame.commodities['fuel'] = 1;

        // Handle essence removal based on current state
        if (window.inventoryManager) {
            const hasEssence = this.hasBodySoulOrSpirit();

            if (hasEssence) {
                // Player has Body/Soul/Spirit - remove them but keep Light (survivable defeat)
                const itemsToRemove = window.inventoryManager.items.filter(item =>
                    item.id !== 'light' // Keep only light
                );

                itemsToRemove.forEach(item => {
                    window.inventoryManager.removeItem(item.id, item.quantity);
                });
            } else {
                // Player has only Light - remove Light too (reincarnation)
                const allItems = window.inventoryManager.items.slice(); // Copy array
                allItems.forEach(item => {
                    window.inventoryManager.removeItem(item.id, item.quantity);
                });

                // Start reincarnation
                this.startReincarnationCountdown();
                return; // Don't update UI - reincarnation overlay will handle it
            }

            // Update UI for survivable defeat
            if (window.renderInventory) {
                window.renderInventory();
            }
        }
    }

    // Check if player has body, soul, or spirit
    hasBodySoulOrSpirit() {
        if (!window.inventoryManager) return false;

        const essenceItems = ['body', 'soul', 'spirit'];
        return essenceItems.some(itemId => {
            const item = window.inventoryManager.getItem(itemId);
            return item && item.quantity > 0;
        });
    }

    // Hide all non-combat UI elements
    hideAllNonCombatUI() {
        // Hide main menu toggles
        document.getElementById('panel-toggle')?.classList.add('hidden');
        document.getElementById('inventory-toggle')?.classList.add('hidden');
        document.getElementById('explore-toggle')?.classList.add('hidden');

        // Hide all panels
        document.getElementById('control-panel')?.classList.remove('open');
        document.getElementById('inventory-panel')?.classList.remove('open');
        document.getElementById('explore-panel')?.classList.remove('open');

        // Hide info box if open
        const infoBox = document.getElementById('object-info-box');
        if (infoBox && infoBox.classList.contains('show')) {
            infoBox.classList.remove('show');
        }

        // Hide travel indicator if visible
        const travelIndicator = document.getElementById('travel-indicator');
        if (travelIndicator && travelIndicator.classList.contains('show')) {
            travelIndicator.classList.remove('show');
        }
    }

    // Comprehensive UI hiding for reincarnation (called repeatedly)
    hideAllUIForReincarnation() {
        // Hide ALL possible UI elements during reincarnation

        // Menu toggles
        ['panel-toggle', 'inventory-toggle', 'explore-toggle'].forEach(id => {
            document.getElementById(id)?.classList.add('hidden');
        });

        // All panels
        ['control-panel', 'inventory-panel', 'explore-panel', 'combat-panel'].forEach(id => {
            document.getElementById(id)?.classList.remove('open');
        });

        // Info box
        const infoBox = document.getElementById('object-info-box');
        if (infoBox) {
            infoBox.classList.remove('show');
            infoBox.style.display = 'none'; // Extra measure
        }

        // Travel indicator
        const travelIndicator = document.getElementById('travel-indicator');
        if (travelIndicator) {
            travelIndicator.classList.remove('show');
            travelIndicator.style.display = 'none'; // Extra measure
        }

        // Cheat modal
        const cheatModal = document.getElementById('cheat-modal');
        if (cheatModal) {
            cheatModal.style.display = 'none';
        }

        // Any notification elements
        const notifications = document.querySelectorAll('.game-notification');
        notifications.forEach(notification => {
            notification.style.display = 'none';
        });

        // Any other potential UI elements
        const allDivs = document.querySelectorAll('div[style*="display"]');
        allDivs.forEach(div => {
            if (div.id !== 'reincarnation-overlay' && !div.closest('#reincarnation-overlay')) {
                // Don't hide the reincarnation overlay itself
                const computedStyle = window.getComputedStyle(div);
                if (computedStyle.display !== 'none') {
                    div.style.display = 'none';
                }
            }
        });
    }

    // Check if player only has light remaining (triggers reincarnation)
    checkIfOnlyLightRemains() {
        if (!window.inventoryManager) return false;

        // Check if only light item exists and has quantity > 0
        const lightItem = window.inventoryManager.getItem('light');
        return lightItem && lightItem.quantity > 0 && window.inventoryManager.items.length === 1;
    }

    // Start reincarnation countdown
    startReincarnationCountdown() {
        this.reincarnationCountdown = 10;
        this.showReincarnationOverlay();

        // Switch to frequency 4 (hide lines and labels)
        if (window.steppers && window.steppers[4]) {
            window.steppers[4].setValue(4);
        }

        // Ensure COMPLETE UI isolation during reincarnation
        this.hideAllNonCombatUI();

        // Additional UI hiding measures during reincarnation
        this.hideAllUIForReincarnation();

        this.reincarnationInterval = setInterval(() => {
            this.reincarnationCountdown--;
            this.updateReincarnationCountdown();

            // Re-hide UI every second to ensure nothing reappears
            this.hideAllUIForReincarnation();

            if (this.reincarnationCountdown <= 0) {
                this.executeReincarnation();
            }
        }, 1000);
    }

    // Show reincarnation overlay
    showReincarnationOverlay() {
        // Create overlay if it doesn't exist
        if (!this.reincarnationOverlay) {
            this.reincarnationOverlay = document.createElement('div');
            this.reincarnationOverlay.className = 'reincarnation-overlay';
            this.reincarnationOverlay.innerHTML = `
                <div class="reincarnation-content">
                    <div class="reincarnation-title">REINCARNATION</div>
                    <div class="reincarnation-subtitle">Your essence has been extinguished...</div>
                    <div class="reincarnation-countdown">10</div>
                    <div class="reincarnation-message">All progress will be lost</div>
                </div>
            `;
            document.body.appendChild(this.reincarnationOverlay);
        }

        this.reincarnationOverlay.classList.add('active');
    }

    // Update reincarnation countdown display
    updateReincarnationCountdown() {
        if (this.reincarnationOverlay) {
            const countdownEl = this.reincarnationOverlay.querySelector('.reincarnation-countdown');
            if (countdownEl) {
                countdownEl.textContent = this.reincarnationCountdown;
            }
        }
    }

    // Execute reincarnation (refresh page)
    executeReincarnation() {
        if (this.reincarnationInterval) {
            clearInterval(this.reincarnationInterval);
        }

        // Clear all localStorage to ensure complete reset
        localStorage.clear();

        // Refresh the page (F5 equivalent)
        window.location.reload();
    }

    // Activate agro immediately for NPC
    activateAgroImmediately(npc) {
        if (!npc.agro) {
            this.activateAgroMode(npc);
            console.log(`🚨 ${npc.name} has become agro immediately!`);
        }
    }

    // Activate agro mode for NPC
    activateAgroMode(npc) {
        npc.agro = true;

        // Remove home planet from greenlist permanently
        this.removeHomePlanetFromGreenlist(npc.name);

        // Disable traditional encounters for this NPC
        npc.disableTraditionalEncounters = true;

        // No more delayed agro tracking to clean up
    }

    // Remove home planet from greenlist
    removeHomePlanetFromGreenlist(npcName) {
        const homePlanets = {
            'Venusians': 'venus',
            'Martians': 'mars',
            'Reptilians': 'Gaia BH1',
            'Pleiadians': 'Pleiades'
        };

        const homePlanet = homePlanets[npcName];
        if (homePlanet) {
            // Remove from greenlist (this will be handled by explore panel integration)
            console.log(`🗺️ ${homePlanet} permanently removed from greenlist due to ${npcName} agro`);
            // The explore panel will need to check for this
            localStorage.setItem(`${homePlanet}_removed_from_greenlist`, 'true');
        }
    }

    // Remove NPC permanently
    removeNPC(npc) {
        const index = this.npcManager.npcs.indexOf(npc);
        if (index !== -1) {
            // Remove spaceship from scene
            if (npc.spaceship) {
                this.scene.remove(npc.spaceship);
            }
            // Remove from NPCs array
            this.npcManager.npcs.splice(index, 1);
        }
    }

    // Show combat result and end combat
    showCombatResult(title, message, success) {
        this.combatContent.innerHTML = '';

        // Ensure no other menus are visible during combat results
        this.hideAllNonCombatUI();

        const resultDiv = document.createElement('div');
        resultDiv.className = `combat-result ${success ? 'success' : 'failure'}`;

        const resultTitle = document.createElement('div');
        resultTitle.className = 'combat-result-title';
        resultTitle.textContent = title;
        resultDiv.appendChild(resultTitle);

        const resultMessage = document.createElement('div');
        resultMessage.className = 'combat-result-message';
        resultMessage.textContent = message;
        resultDiv.appendChild(resultMessage);

        const continueButton = document.createElement('button');
        continueButton.className = 'combat-continue-button';
        continueButton.textContent = 'CONTINUE';
        continueButton.addEventListener('click', () => this.endCombat());
        resultDiv.appendChild(continueButton);

        this.combatContent.appendChild(resultDiv);

        // Auto-dismiss after 5 seconds for defeat messages (still clickable)
        if (!success) {
            setTimeout(() => {
                if (this.inCombat) { // Only if still in combat (user didn't click continue)
                    this.endCombat();
                }
            }, 5000);
        }
    }

    // End combat
    endCombat() {
        this.inCombat = false;
        this.combatMode = null;
        this.currentDefendNPC = null;

        // Hide panels
        this.combatPanel.classList.remove('open');
        this.defendPopup.classList.remove('open');

        // Clear defend countdown
        if (this.defendInterval) {
            clearInterval(this.defendInterval);
            this.defendInterval = null;
        }

        // Show toggles based on frequency
        // This will be handled by frequency stepper integration
        document.getElementById('panel-toggle')?.classList.remove('hidden');
        document.getElementById('explore-toggle')?.classList.remove('hidden');
        document.getElementById('inventory-toggle')?.classList.remove('hidden');
    }

    // Check for defend mode triggers (called by game loop)
    checkForDefendModeTriggers() {
        // Only check if not already in combat
        if (this.inCombat) return;

        // Check if we've already had a defend mode encounter this turn
        const currentTurn = this.tradingGame ? this.tradingGame.turn : 0;
        if (this.lastDefendTurn === currentTurn) return;

        const currentLocation = this.tradingGame.currentLocation;
        const agroNPCsAtLocation = this.npcManager.getAgroNPCsAtPlayerLocation(currentLocation);

        if (agroNPCsAtLocation.length > 0) {
            // Sort by power (lowest first)
            agroNPCsAtLocation.sort((a, b) => this.getNPCPower(a.name) - this.getNPCPower(b.name));

            // Trigger defend mode for first (lowest power) NPC
            this.enterDefendMode(agroNPCsAtLocation[0]);
        }
    }

    // Update method (called each frame)
    update(deltaTime) {
        // Handle any ongoing combat animations or effects

        // Check for location changes and update combat screen if needed
        const currentLocation = this.tradingGame ? this.tradingGame.currentLocation : null;

        if (currentLocation !== this.lastLocation && this.inCombat && this.combatMode === 'voluntary') {
            this.updateCombatScreen();
            this.lastLocation = currentLocation;
        }
    }

    // Advance turn (regenerate NPC powers)
    advanceTurn() {
        this.regenerateNPCPowers();

        // Reset defend mode flag for new turn
        this.lastDefendTurn = -1;
        // Update combat screen if open
        this.updateCombatScreen();
    }
}
