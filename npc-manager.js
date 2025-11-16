// npc-manager.js - Manages NPC spaceships and interactions
import * as THREE from 'three';
import { COMMODITIES } from './trading-config.js';

export class NPCManager {
    constructor(sceneManager, tradingGame, scene) {
        this.sceneManager = sceneManager;
        this.tradingGame = tradingGame;
        this.scene = scene;

        // Available locations for NPC movement
        this.availableLocations = [
            'mars', 'earth', 'moon', 'venus', 'mercury',
            'saturn', 'jupiter', 'uranus', 'neptune', 'pluto', 'Gaia BH1'
        ];

        this.npcs = [];
        this.encounterCooldowns = new Map(); // Track encounter cooldowns per NPC
        this.initializeMartians();
    }

    initializeMartians() {
        // Create Martian NPC starting at Mars
        const martian = {
            name: 'Martians',
            currentLocation: 'mars',
            movementTimer: 0, // Moves every 2 turns
            spaceship: null,
            isTraveling: false,
            travelStartTime: 0,
            travelDuration: 20000, // 20 seconds (same as player travel)
            travelStartPos: null,
            travelEndPos: null
        };
        this.npcs.push(martian);
    }

    createRedSpaceship() {
        // Create a red spaceship with wings
        const spaceship = new THREE.Group();

        // Main body - bright red sphere
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 6, 4),
            new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.8
            })
        );
        spaceship.add(body);

        // Wings - red cones
        const wingGeometry = new THREE.ConeGeometry(0.12, 0.25, 4);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.6
        });

        // Left wing
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.15, 0, 0);
        leftWing.rotation.z = Math.PI / 2;
        spaceship.add(leftWing);

        // Right wing
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.15, 0, 0);
        rightWing.rotation.z = -Math.PI / 2;
        spaceship.add(rightWing);

        spaceship.visible = false;
        return spaceship;
    }

    advanceTurn() {
        this.npcs.forEach(npc => {
            npc.movementTimer++;
            console.log(`⏰ Martian turn timer: ${npc.movementTimer}/2 (at ${npc.currentLocation})`);

            if (npc.movementTimer >= 2) {
                console.log(`🚀 Martian movement triggered!`);
                this.moveNPC(npc);
                npc.movementTimer = 0;
            }
        });
    }

    moveNPC(npc) {
        // Get available locations excluding current location
        const availableDestinations = this.availableLocations.filter(
            loc => loc.toLowerCase() !== npc.currentLocation.toLowerCase()
        );

        // Randomly select new location
        const randomIndex = Math.floor(Math.random() * availableDestinations.length);
        const newLocation = availableDestinations[randomIndex];

        console.log(`🎯 Martian moving from ${npc.currentLocation} to ${newLocation} (${availableDestinations.length} choices available)`);

        // Start travel to new location
        this.startNPCTravel(npc, newLocation);
    }

    startNPCTravel(npc, destinationName) {
        const oldLocation = npc.currentLocation;
        npc.currentLocation = destinationName;
        npc.isTraveling = true;

        // Create spaceship if it doesn't exist
        if (!npc.spaceship) {
            npc.spaceship = this.createRedSpaceship();
            this.scene.add(npc.spaceship);
        }

        // Get positions
        const startPos = this.getLocationPosition(oldLocation);
        const endPos = this.getLocationPosition(destinationName);

        if (!startPos || !endPos) {
            console.error('Could not find positions for travel:', oldLocation, 'to', destinationName);
            return;
        }


        npc.travelStartPos = startPos.clone();
        npc.travelEndPos = endPos.clone();
        npc.travelStartTime = performance.now();
        npc.travelDestination = destinationName; // Store destination for animation

        // Position spaceship at start
        npc.spaceship.position.copy(startPos);
        npc.spaceship.visible = true;

        // Start travel animation
        this.animateNPCTravel(npc);
    }

    animateNPCTravel(npc) {
        // Animation is handled by updateTravelAnimations() in the main loop
    }

    getLocationPosition(locationName) {
        const obj = this.sceneManager.allObjects.find(
            obj => obj.name.toLowerCase() === locationName.toLowerCase()
        );

        if (!obj) return null;

        const pos = new THREE.Vector3();
        if (obj.mesh) {
            obj.mesh.getWorldPosition(pos);
        } else if (obj.position) {
            pos.copy(obj.position);
            if (obj.planesGroup) {
                obj.planesGroup.localToWorld(pos);
            }
        }
        return pos;
    }

    checkForEncounter(npc) {
        console.log(`🔍 Checking for Martian encounter: NPC at '${npc.currentLocation}', Player at '${this.tradingGame.currentLocation}'`);

        if (npc.currentLocation.toLowerCase() === this.tradingGame.currentLocation.toLowerCase()) {
            console.log(`✅ Martian encounter triggered! NPC arrived at player's location.`);
            this.triggerEncounter(npc);
        } else {
            console.log(`❌ No encounter: Locations don't match`);
        }
    }

    checkForPlayerArrivalEncounter(locationName) {
        console.log(`🏃 Player arrived at '${locationName}', checking for NPCs...`);

        // Check if any NPCs are currently at this location
        this.npcs.forEach(npc => {
            if (npc.currentLocation.toLowerCase() === locationName.toLowerCase()) {
                console.log(`✅ Player arrival encounter triggered! Martian already at location.`);
                // NPC is already at this location - trigger encounter
                this.triggerEncounter(npc);
            }
        });
    }

    triggerEncounter(npc) {
        // Prevent multiple encounters with the same NPC within 10 seconds
        const npcId = npc.name;
        const now = Date.now();
        const lastEncounter = this.encounterCooldowns.get(npcId) || 0;

        if (now - lastEncounter < 10000) { // 10 second cooldown
            console.log(`⏰ Martian encounter blocked by cooldown (${Math.round((10000 - (now - lastEncounter)) / 1000)}s remaining)`);
            return;
        }

        // Update cooldown timestamp
        this.encounterCooldowns.set(npcId, now);

        // Build list of available scenarios based on what player actually has
        const availableScenarios = [];
        const scenarioNames = [];

        // Check each scenario's requirements and add to available list
        if (this.tradingGame.money >= 99) {
            availableScenarios.push(() => this.exoticSaleScenario(npc));
            scenarioNames.push('Exotic Sale');
        }

        if (window.inventoryManager && window.inventoryManager.hasItem('ftl', 1)) {
            availableScenarios.push(() => this.ftlPurchaseScenario(npc));
            scenarioNames.push('FTL Purchase');
        }

        if ((this.tradingGame.commodities[COMMODITIES.SLAVES] || 0) > 0) {
            availableScenarios.push(() => this.slaveKidnappingScenario(npc));
            scenarioNames.push('Slave Kidnapping');
        }

        if ((this.tradingGame.commodities[COMMODITIES.GOLD] || 0) > 0) {
            availableScenarios.push(() => this.goldTheftScenario(npc));
            scenarioNames.push('Gold Theft');
        }

        // Neutral is always available as fallback
        availableScenarios.push(() => this.neutralScenario(npc));
        scenarioNames.push('Neutral');

        // Randomly select from available scenarios
        const randomIndex = Math.floor(Math.random() * availableScenarios.length);
        const selectedScenario = scenarioNames[randomIndex];

        console.log(`🎲 Martian encounter triggered! Available scenarios: [${scenarioNames.join(', ')}]`);
        console.log(`🎯 Selected scenario: ${selectedScenario}`);
        console.log(`💰 Player money: $${this.tradingGame.money}`);
        console.log(`👥 Player slaves: ${this.tradingGame.commodities[COMMODITIES.SLAVES] || 0}`);
        console.log(`💛 Player gold: ${this.tradingGame.commodities[COMMODITIES.GOLD] || 0}`);
        console.log(`🚀 Player has FTL: ${window.inventoryManager && window.inventoryManager.hasItem('ftl', 1) ? 'YES' : 'NO'}`);

        const randomScenario = availableScenarios[randomIndex];
        randomScenario();
    }

    exoticSaleScenario(npc) {
        // Player already verified to have >= $99
        this.showNPCPopup(
            'We offer to sell you 1 Exotic for $99',
            'Accept',
            'Decline',
            () => {
                // Accept: pay $99, get 1 Exotic
                const oldMoney = this.tradingGame.money;
                const oldExotic = this.tradingGame.commodities[COMMODITIES.EXOTIC] || 0;

                this.tradingGame.money -= 99;
                this.tradingGame.commodities[COMMODITIES.EXOTIC] = oldExotic + 1;

                console.log(`Martian transaction: Money ${oldMoney} -> ${this.tradingGame.money}, Exotic ${oldExotic} -> ${this.tradingGame.commodities[COMMODITIES.EXOTIC]}`);
                this.showResultMessage('You purchased 1 Exotic for $99!');
            },
            () => {
                this.showResultMessage('You declined the offer.');
            }
        );
    }

    ftlPurchaseScenario(npc) {
        // Player already verified to have FTL Drive
        const price = 9000 + Math.floor(Math.random() * 4000); // $9000-$13000
        this.showNPCPopup(
            `We offer to buy your FTL Drive for $${price}`,
            'Accept',
            'Decline',
            () => {
                // Accept: sell FTL Drive, get money
                window.inventoryManager.removeItem('ftl', 1);
                this.tradingGame.money += price;
                this.showResultMessage(`You sold your FTL Drive for $${price}!`);
            },
            () => {
                this.showResultMessage('You declined the offer.');
            }
        );
    }

    slaveKidnappingScenario(npc) {
        // Player already verified to have slaves
        this.showNPCPopup(
            'We have kidnapped your slaves!',
            'Accept',
            null, // No decline button
            () => {
                // Remove all slaves
                const oldSlaves = this.tradingGame.commodities[COMMODITIES.SLAVES] || 0;
                this.tradingGame.commodities[COMMODITIES.SLAVES] = 0;
                console.log(`Martian slave theft: ${oldSlaves} slaves taken`);
                this.showResultMessage('The Martians kidnapped all your slaves!');
            }
        );
    }

    goldTheftScenario(npc) {
        // Player already verified to have gold
        this.showNPCPopup(
            'We have stolen your gold!',
            'Accept',
            null, // No decline button
            () => {
                // Remove all gold
                const oldGold = this.tradingGame.commodities[COMMODITIES.GOLD] || 0;
                this.tradingGame.commodities[COMMODITIES.GOLD] = 0;
                console.log(`Martian gold theft: ${oldGold} gold taken`);
                this.showResultMessage('The Martians stole all your gold!');
            }
        );
    }

    neutralScenario(npc) {
        // Always available neutral interaction
        const messages = [
            'We laugh at you.',
            'We wish you well.',
            'We ignore you.',
            'We wish to avoid you.'
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        this.showNPCPopup(
            randomMessage,
            'OK',
            null,
            () => {
                // Just close the popup
            }
        );
    }

    showNPCPopup(message, acceptText, declineText, acceptCallback, declineCallback = null) {
        // Create custom popup for NPC interactions
        const popup = document.createElement('div');
        popup.className = 'npc-popup';
        popup.innerHTML = `
            <div class="npc-popup-content">
                <div class="npc-speaker-label">The Martians</div>
                <p>${message}</p>
                <div class="npc-popup-buttons">
                    <button class="npc-accept-btn">${acceptText}</button>
                    ${declineText ? `<button class="npc-decline-btn">${declineText}</button>` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        // Add button event listeners
        const acceptBtn = popup.querySelector('.npc-accept-btn');
        acceptBtn.onclick = () => {
            acceptCallback();
            document.body.removeChild(popup);
        };

        if (declineText && declineCallback) {
            const declineBtn = popup.querySelector('.npc-decline-btn');
            declineBtn.onclick = () => {
                declineCallback();
                document.body.removeChild(popup);
            };
        }

        // Auto-remove after 10 seconds if no interaction
        setTimeout(() => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
        }, 10000);
    }

    showResultMessage(message) {
        // Create in-game notification instead of ugly browser alert
        const notification = document.createElement('div');
        notification.className = 'game-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-text">${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300); // Wait for fade out animation
        }, 3000);
    }

    updateTravelAnimations(deltaTime) {
        this.npcs.forEach(npc => {
            if (npc.isTraveling) {
                const elapsed = performance.now() - npc.travelStartTime;
                const progress = Math.min(elapsed / npc.travelDuration, 1);

                if (npc.spaceship && npc.travelStartPos) {
                    const currentEndPos = this.getLocationPosition(npc.travelDestination);
                    if (currentEndPos) {
                        npc.spaceship.position.lerpVectors(npc.travelStartPos, currentEndPos, progress);
                    }

                    if (progress >= 1) {
                        npc.spaceship.visible = false;
                        npc.isTraveling = false;
                        this.checkForEncounter(npc);
                    }
                }
            }
        });
    }
}
