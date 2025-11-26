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
            'saturn', 'jupiter', 'uranus', 'neptune', 'pluto', 'Gaia BH1', 'Pleiades',
            'Milky Way', 'Andromeda', 'anja'
        ];

        this.npcs = [];
        this.encounterCooldowns = new Map(); // Track encounter cooldowns per NPC
        this.encounterQueue = []; // Queue for sequential NPC encounters
        this.currentEncounter = null; // Currently active encounter
        this.activeTypewriterSprites = []; // Track active typewriter text sprites
        this.initializeMartians();
        this.initializeVenusians();
        this.initializeReptilians();
        this.initializePleiadians();
        this.initializeGreys();
    }

    // Check if any NPCs are currently traveling (have active animations)
    areAnyNPCsTraveling() {
        return this.npcs.some(npc => npc.isTraveling);
    }

    // Advance all NPC turns simultaneously (respecting individual timers)
    advanceAllTurnsSimultaneously() {
        console.log('🚀 Advancing ALL NPC turns simultaneously (respecting timers)!');
        this.npcs.forEach(npc => {
            // Handle Greys hostility cycle
            if (npc.name === 'Greys') {
                // Count turns since last agro period ended
                npc.turnsSinceLastAgro++;

                // After 10 turns, activate agro mode
                if (npc.turnsSinceLastAgro >= 10 && !npc.agro) {
                    console.log(`👽 Greys turning agro after ${npc.turnsSinceLastAgro} turns! Will stay agro until they attack once.`);
                    window.combatManager.activateAgroMode(npc);
                }
            }

            // Agro NPCs do NOT move during regular turn advancement - they wait for player skips

            // Normal movement logic for non-agro NPCs
            // Track if this is the NPC's first advancement ever
            if (npc.hasMoved === undefined) {
                npc.hasMoved = false;
            }

            npc.movementTimer++;
            let moveThreshold = 2; // Default for Martians and Venusians
            if (npc.name === 'Reptilians') {
                moveThreshold = 3;
            } else if (npc.name === 'Pleiadians') {
                moveThreshold = 1; // Pleiadians move every turn
            }

            // Force movement on first advancement, then use normal timer logic
            const shouldMove = !npc.hasMoved || npc.movementTimer >= moveThreshold;

            console.log(`⏰ ${npc.name} simultaneous turn timer: ${npc.movementTimer}/${moveThreshold} (at ${npc.currentLocation}) - firstMove: ${!npc.hasMoved}, shouldMove: ${shouldMove}`);

            if (shouldMove) {
                // Check for Pleiadian location-based encounter
                if (npc.name === 'Pleiadians' &&
                    npc.currentLocation.toLowerCase() === this.tradingGame.currentLocation.toLowerCase()) {
                    console.log(`👽 Pleiadians: Co-located with player at ${npc.currentLocation}, initiating encounter then travel`);
                    this.triggerEncounter(npc);
                }
                console.log(`🚀 ${npc.name} simultaneous movement triggered! ${!npc.hasMoved ? '(FIRST MOVE)' : ''}`);
                this.moveNPC(npc);
                npc.movementTimer = 0; // Reset timer only for NPCs that actually moved
                npc.hasMoved = true; // Mark that this NPC has made its first move
            }
        });
    }

    // Get encounter count for an NPC from localStorage
    getEncounterCount(npcName) {
        const key = `npc_${npcName.toLowerCase()}_encounters`;
        return parseInt(localStorage.getItem(key) || '0');
    }

    // Increment encounter count for an NPC
    incrementEncounterCount(npcName) {
        const key = `npc_${npcName.toLowerCase()}_encounters`;
        const currentCount = this.getEncounterCount(npcName);
        const newCount = currentCount + 1;
        localStorage.setItem(key, newCount.toString());
        return newCount;
    }

    initializeMartians() {
        // Create Martian NPC starting at Mars
        const martian = {
            name: 'Martians',
            currentLocation: 'mars',
            movementTimer: 0, // Moves every 2 turns (unless agro)
            spaceship: null,
            isTraveling: false,
            travelStartTime: 0,
            travelDuration: 20000, // 20 seconds (same as player travel)
            travelStartPos: null,
            travelEndPos: null,
            agro: false, // Agro state
            disableTraditionalEncounters: false, // Disable traditional encounters when agro
            pendingDestination: null
        };
        this.npcs.push(martian);
    }

    initializeVenusians() {
        // Create Venusian NPC starting at Venus
        const venusian = {
            name: 'Venusians',
            currentLocation: 'venus',
            movementTimer: 0, // Moves every 2 turns (unless agro)
            spaceship: null,
            isTraveling: false,
            travelStartTime: 0,
            travelDuration: 20000, // 20 seconds (same as player travel)
            travelStartPos: null,
            travelEndPos: null,
            agro: false, // Agro state
            disableTraditionalEncounters: false, // Disable traditional encounters when agro
            pendingDestination: null
        };
        this.npcs.push(venusian);
    }

    initializeReptilians() {
        // Create Reptilian NPC starting at Gaia BH1
        const reptilian = {
            name: 'Reptilians',
            currentLocation: 'Gaia BH1',
            movementTimer: 0, // Moves every 3 turns (unless agro)
            spaceship: null,
            isTraveling: false,
            travelStartTime: 0,
            travelDuration: 20000, // 20 seconds (same as player travel)
            travelStartPos: null,
            travelEndPos: null,
            agro: false, // Agro state
            disableTraditionalEncounters: false, // Disable traditional encounters when agro
            pendingDestination: null
        };
        this.npcs.push(reptilian);
    }

    initializePleiadians() {
        // Create Pleiadian NPC starting at Pleiades
        const pleiadian = {
            name: 'Pleiadians',
            currentLocation: 'Pleiades',
            movementTimer: 0, // Moves every turn
            spaceship: null,
            isTraveling: false,
            travelStartTime: 0,
            travelDuration: 20000, // 20 seconds (same as player travel)
            travelStartPos: null,
            travelEndPos: null,
            agro: false, // Agro state
            disableTraditionalEncounters: false, // Disable traditional encounters when agro
            pendingDestination: null
        };
        this.npcs.push(pleiadian);
    }

    initializeGreys() {
        // Create Greys NPC starting at Zeta Reticuli
        const greys = {
            name: 'Greys',
            currentLocation: 'zeta reticuli',
            movementTimer: 0, // Moves every 2 turns (unless agro)
            spaceship: null,
            isTraveling: false,
            travelStartTime: 0,
            travelDuration: 20000, // 20 seconds (same as player travel)
            travelStartPos: null,
            travelEndPos: null,
            agro: false, // Agro state
            disableTraditionalEncounters: false, // Disable traditional encounters when agro
            turnsSinceLastAgro: 0, // Turns since last agro period ended
            pendingDestination: null
        };
        this.npcs.push(greys);
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

    createYellowSpaceship() {
        // Create a yellow spaceship with cylindrical body and cross-wing pattern
        const spaceship = new THREE.Group();

        // Main body - bright yellow cylinder
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8),
            new THREE.MeshStandardMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.8
            })
        );
        spaceship.add(body);

        // Cross-wing pattern - four yellow box wings
        const wingGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.04);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.6
        });

        // Front wing
        const frontWing = new THREE.Mesh(wingGeometry, wingMaterial);
        frontWing.position.set(0, 0, 0.08);
        spaceship.add(frontWing);

        // Back wing
        const backWing = new THREE.Mesh(wingGeometry, wingMaterial);
        backWing.position.set(0, 0, -0.08);
        spaceship.add(backWing);

        // Left wing
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.08, 0, 0);
        leftWing.rotation.z = Math.PI / 2;
        spaceship.add(leftWing);

        // Right wing
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.08, 0, 0);
        rightWing.rotation.z = Math.PI / 2;
        spaceship.add(rightWing);

        spaceship.visible = false;
        return spaceship;
    }

    createGreenSpaceship() {
        // Create a green spaceship with triangular wings
        const spaceship = new THREE.Group();

        // Main body - bright green sphere
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 6, 4),
            new THREE.MeshStandardMaterial({
                color: 0x00ff00,
                emissive: 0x00ff00,
                emissiveIntensity: 0.8
            })
        );
        spaceship.add(body);

        // Wings - green triangular prisms
        const wingGeometry = new THREE.ConeGeometry(0.1, 0.18, 3);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.6
        });

        // Left wing
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.12, 0, 0);
        leftWing.rotation.z = Math.PI / 2;
        spaceship.add(leftWing);

        // Right wing
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.12, 0, 0);
        rightWing.rotation.z = -Math.PI / 2;
        spaceship.add(rightWing);

        // Rear stabilizer
        const stabilizer = new THREE.Mesh(wingGeometry, wingMaterial);
        stabilizer.position.set(0, 0, -0.12);
        stabilizer.rotation.x = Math.PI / 2;
        stabilizer.scale.set(0.7, 0.7, 0.7);
        spaceship.add(stabilizer);

        spaceship.visible = false;
        return spaceship;
    }

    createBlueSpaceship() {
        // Create a blue spaceship with wing-like structures
        const spaceship = new THREE.Group();

        // Main body - bright blue sphere
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 6, 4),
            new THREE.MeshStandardMaterial({
                color: 0x0088ff,
                emissive: 0x0088ff,
                emissiveIntensity: 0.8
            })
        );
        spaceship.add(body);

        // Wing structures - blue elongated cones
        const wingGeometry = new THREE.ConeGeometry(0.08, 0.2, 6);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0x0088ff,
            emissive: 0x0088ff,
            emissiveIntensity: 0.6
        });

        // Left wing
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.12, 0, 0);
        leftWing.rotation.z = Math.PI / 2;
        spaceship.add(leftWing);

        // Right wing
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.12, 0, 0);
        rightWing.rotation.z = -Math.PI / 2;
        spaceship.add(rightWing);

        // Rear stabilizer
        const stabilizer = new THREE.Mesh(wingGeometry, wingMaterial);
        stabilizer.position.set(0, 0, -0.12);
        stabilizer.rotation.x = Math.PI / 2;
        stabilizer.scale.set(0.6, 0.6, 0.6);
        spaceship.add(stabilizer);

        spaceship.visible = false;
        return spaceship;
    }

    createGreySpaceship() {
        // Create a sleek gray spaceship with angular wing structures
        const spaceship = new THREE.Group();

        // Main body - elongated dark gray cylinder
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.08, 0.25, 8),
            new THREE.MeshStandardMaterial({
                color: 0x333333,
                emissive: 0x222222,
                emissiveIntensity: 0.6
            })
        );
        spaceship.add(body);

        // Angular wing structures - dark gray triangular prisms
        const wingGeometry = new THREE.ConeGeometry(0.08, 0.15, 3);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            emissive: 0x333333,
            emissiveIntensity: 0.5
        });

        // Left wing - angular design
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.1, 0, 0.05);
        leftWing.rotation.set(0, 0, Math.PI / 2);
        leftWing.scale.set(1.2, 0.8, 1);
        spaceship.add(leftWing);

        // Right wing - angular design
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.1, 0, 0.05);
        rightWing.rotation.set(0, 0, -Math.PI / 2);
        rightWing.scale.set(1.2, 0.8, 1);
        spaceship.add(rightWing);

        // Rear stabilizers - smaller angular structures
        const stabilizerGeometry = new THREE.ConeGeometry(0.04, 0.08, 3);
        const stabilizerMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            emissive: 0x444444,
            emissiveIntensity: 0.4
        });

        // Left stabilizer
        const leftStabilizer = new THREE.Mesh(stabilizerGeometry, stabilizerMaterial);
        leftStabilizer.position.set(-0.06, 0, -0.08);
        leftStabilizer.rotation.set(Math.PI / 2, 0, Math.PI / 2);
        spaceship.add(leftStabilizer);

        // Right stabilizer
        const rightStabilizer = new THREE.Mesh(stabilizerGeometry, stabilizerMaterial);
        rightStabilizer.position.set(0.06, 0, -0.08);
        rightStabilizer.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
        spaceship.add(rightStabilizer);

        // Forward antenna/sensor array
        const antennaGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.08, 6);
        const antennaMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            emissive: 0x555555,
            emissiveIntensity: 0.7
        });

        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(0, 0.08, 0.08);
        spaceship.add(antenna);

        spaceship.visible = false;
        return spaceship;
    }

    advanceTurn() {
        this.npcs.forEach(npc => {
            // Agro NPCs move every turn regardless of normal timer
            if (npc.agro) {
                console.log(`🚨 ${npc.name} agro movement triggered! (seeking player)`);
                this.moveAgroNPC(npc);
                return; // Skip normal movement logic for agro NPCs
            }

            // Normal movement logic for non-agro NPCs
            npc.movementTimer++;
            let moveThreshold = 2; // Default for Martians and Venusians
            if (npc.name === 'Reptilians') {
                moveThreshold = 3;
            } else if (npc.name === 'Pleiadians') {
                moveThreshold = 1; // Pleiadians move every turn
            }
            console.log(`⏰ ${npc.name} turn timer: ${npc.movementTimer}/${moveThreshold} (at ${npc.currentLocation})`);

            if (npc.movementTimer >= moveThreshold) {
                if (npc.name === 'Pleiadians' &&
                    npc.currentLocation.toLowerCase() === this.tradingGame.currentLocation.toLowerCase()) {
                    // Pleiadians and player are co-located - encounter first (only if not agro)
                    console.log(`👽 Pleiadians: Co-located with player at ${npc.currentLocation}, initiating encounter then travel`);
                    this.triggerEncounter(npc);
                }
                console.log(`🚀 ${npc.name} movement triggered!`);
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

        console.log(`🎯 ${npc.name} moving from ${npc.currentLocation} to ${newLocation} (${availableDestinations.length} choices available)`);

        // Start travel to new location
        this.startNPCTravel(npc, newLocation);
    }

    moveAgroNPC(npc) {
        // Get the player's last skipped location (stored when player skips)
        const lastSkippedLocation = localStorage.getItem('player_last_skipped_location');

        if (!lastSkippedLocation) {
            console.log(`🚨 ${npc.name} agro: no last skipped location found, staying put`);
            return;
        }

        // If already at the player's last skipped location, trigger defend mode immediately
        if (npc.currentLocation.toLowerCase() === lastSkippedLocation.toLowerCase()) {
            console.log(`🚨 ${npc.name} already at player's last skipped location (${lastSkippedLocation}) - triggering defend mode immediately`);
            // Trigger defend mode immediately if not already in combat
            if (window.combatManager && !window.combatManager.inCombat) {
                window.combatManager.enterDefendMode(npc);
            }
            return;
        }

        // Agro NPCs move directly to the player's last skipped location (ignore greenlist)
        console.log(`🚨 ${npc.name} agro: moving to player's last skipped location ${lastSkippedLocation} from ${npc.currentLocation}`);

        // Move directly to player's last skipped location
        this.startNPCTravel(npc, lastSkippedLocation);
    }

    startNPCTravel(npc, destinationName) {
        if (npc.isTraveling) {
            npc.pendingDestination = destinationName;
            console.log(`⏳ ${npc.name} is already traveling; queuing next destination: ${destinationName}`);
            return;
        }

        npc.pendingDestination = null;
        const oldLocation = npc.currentLocation;
        npc.currentLocation = destinationName;
        npc.isTraveling = true;

        // Create spaceship if it doesn't exist
        if (!npc.spaceship) {
            if (npc.name === 'Martians') {
                npc.spaceship = this.createRedSpaceship();
            } else if (npc.name === 'Venusians') {
                npc.spaceship = this.createYellowSpaceship();
            } else if (npc.name === 'Reptilians') {
                npc.spaceship = this.createGreenSpaceship();
            } else if (npc.name === 'Pleiadians') {
                npc.spaceship = this.createBlueSpaceship();
            } else if (npc.name === 'Greys') {
                npc.spaceship = this.createGreySpaceship();
            }
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

        // Show departure message (1/3 chance)
        this.showDepartureMessage(npc, destinationName);

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
        console.log(`🔍 Checking for ${npc.name} encounter: NPC at '${npc.currentLocation}', Player at '${this.tradingGame.currentLocation}'`);

        if (npc.currentLocation.toLowerCase() === this.tradingGame.currentLocation.toLowerCase()) {
            console.log(`✅ ${npc.name} encounter triggered! NPC arrived at player's location.`);

            // Agro NPCs trigger defend mode immediately instead of traditional encounters
            if (npc.agro) {
                console.log(`🚨 ${npc.name} agro NPC arrived - triggering defend mode immediately`);
                if (window.combatManager && !window.combatManager.inCombat) {
                    window.combatManager.enterDefendMode(npc);
                }
                return; // Don't trigger traditional encounter for agro NPCs
            }

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
                console.log(`✅ Player arrival encounter triggered! ${npc.name} already at location.`);

                // Agro NPCs trigger defend mode immediately when player arrives
                if (npc.agro) {
                    console.log(`🚨 ${npc.name} agro: player arrived at agro NPC location - triggering defend mode immediately`);
                    if (window.combatManager && !window.combatManager.inCombat) {
                        window.combatManager.enterDefendMode(npc);
                    }
                    return; // Don't trigger traditional encounter for agro NPCs
                }

                // NPC is already at this location - trigger encounter
                this.triggerEncounter(npc);
            }
        });
    }

    triggerEncounter(npc) {
        // Skip traditional encounters for agro NPCs - they use defend mode instead
        if (npc.agro || npc.disableTraditionalEncounters) {
            console.log(`🚨 ${npc.name} agro encounter blocked - agro NPCs use defend mode`);
            return;
        }

        // Prevent multiple encounters with the same NPC within 10 seconds
        const npcId = npc.name;
        const now = Date.now();
        const lastEncounter = this.encounterCooldowns.get(npcId) || 0;

        if (now - lastEncounter < 10000) { // 10 second cooldown
            console.log(`⏰ ${npc.name} encounter blocked by cooldown (${Math.round((10000 - (now - lastEncounter)) / 1000)}s remaining)`);
            return;
        }

        // Update cooldown timestamp
        this.encounterCooldowns.set(npcId, now);

        // Add encounter to queue instead of executing immediately
        this.encounterQueue.push(npc);
        console.log(`📋 ${npc.name} encounter queued. Queue length: ${this.encounterQueue.length}`);

        // Process the queue if no encounter is currently active
        if (!this.currentEncounter) {
            this.processEncounterQueue();
        }
    }

    processEncounterQueue() {
        if (this.encounterQueue.length === 0) {
            this.currentEncounter = null;
            return;
        }

        // Get next NPC from queue
        const npc = this.encounterQueue.shift();
        this.currentEncounter = npc;

        console.log(`🎲 Processing ${npc.name} encounter from queue. Remaining: ${this.encounterQueue.length}`);

        // Build list of available scenarios based on NPC type and player state
        const availableScenarios = [];
        const scenarioNames = [];

        if (npc.name === 'Martians') {
            // Martian scenarios
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
        } else if (npc.name === 'Venusians') {
            // Venusian scenarios
            if ((this.tradingGame.commodities[COMMODITIES.AURA] || 0) > 0) {
                availableScenarios.push(() => this.venusianAuraPurchaseScenario(npc));
                scenarioNames.push('Aura Purchase');
            }

            if ((this.tradingGame.commodities[COMMODITIES.FUEL] || 0) > 1) {
                availableScenarios.push(() => this.venusianFuelTheftScenario(npc));
                scenarioNames.push('Fuel Theft');
            }

            if ((this.tradingGame.commodities[COMMODITIES.ORE] || 0) > 0) {
                availableScenarios.push(() => this.venusianOreTheftScenario(npc));
                scenarioNames.push('Ore Theft');
            }

            // Gold gift is always available (like neutral)
            availableScenarios.push(() => this.venusianGoldGiftScenario(npc));
            scenarioNames.push('Gold Gift');

            // Neutral is always available as fallback
            availableScenarios.push(() => this.venusianNeutralScenario(npc));
            scenarioNames.push('Neutral');
        } else if (npc.name === 'Reptilians') {
            // Reptilians have progressive encounters based on count
            const encounterCount = this.getEncounterCount('Reptilians');
            console.log(`🐲 Reptilians encounter #${encounterCount + 1}`);

            if (encounterCount === 0) {
                availableScenarios.push(() => this.reptiliansFirstEncounterScenario(npc));
                scenarioNames.push('First Encounter');
            } else {
                // For subsequent encounters, provide banking access
                availableScenarios.push(() => this.reptilianBankingScenario(npc));
                scenarioNames.push('Banking Access');
            }
        } else if (npc.name === 'Pleiadians') {
            // Pleiadians have progressive encounters based on count
            const encounterCount = this.getEncounterCount('Pleiadians');
            console.log(`👽 Pleiadians encounter #${encounterCount + 1}`);

            if (encounterCount === 0) {
                availableScenarios.push(() => this.pleiadiansFirstEncounterScenario(npc));
                scenarioNames.push('First Encounter');
            } else {
                // For subsequent encounters, check if Pleiades is greenlisted
                const isPleiadesGreenlisted = localStorage.getItem('pleiadesGreenlisted') === 'true';
                if (!isPleiadesGreenlisted) {
                    // If not greenlisted, show first encounter again
                    console.log('🌟 Pleiadians: Pleiades not greenlisted, showing first encounter again');
                    availableScenarios.push(() => this.pleiadiansFirstEncounterScenario(npc));
                    scenarioNames.push('First Encounter');
                } else if (encounterCount === 1) {
                    availableScenarios.push(() => this.pleiadiansAuraGiftScenario(npc));
                    scenarioNames.push('Aura Gift');
                } else if (encounterCount === 2) {
                    availableScenarios.push(() => this.pleiadiansAntimatterGiftScenario(npc));
                    scenarioNames.push('Antimatter Gift');
                } else if (encounterCount === 3) {
                    availableScenarios.push(() => this.pleiadiansDarkMatterGiftScenario(npc));
                    scenarioNames.push('Dark Matter Gift');
                } else if (encounterCount === 4) {
                    availableScenarios.push(() => this.pleiadiansGoldGiftScenario(npc));
                    scenarioNames.push('Gold Gift');
                } else {
                    availableScenarios.push(() => this.pleiadiansAscensionScenario(npc));
                    scenarioNames.push('Ascension Message');
                }
            }
        } else if (npc.name === 'Greys') {
            // Greys scenarios - rude warnings about Zeta Reticuli
            availableScenarios.push(() => this.greysWarningScenario(npc));
            scenarioNames.push('Warning');

            availableScenarios.push(() => this.greysRudeScenario(npc));
            scenarioNames.push('Rude Dismissal');

            availableScenarios.push(() => this.greysThreatScenario(npc));
            scenarioNames.push('Threat');
        }

        // Randomly select from available scenarios
        const randomIndex = Math.floor(Math.random() * availableScenarios.length);
        const selectedScenario = scenarioNames[randomIndex];

        console.log(`🎯 Selected scenario: ${selectedScenario}`);
        console.log(`💰 Player money: $${this.tradingGame.money}`);
        console.log(`👥 Player slaves: ${this.tradingGame.commodities[COMMODITIES.SLAVES] || 0}`);
        console.log(`💛 Player gold: ${this.tradingGame.commodities[COMMODITIES.GOLD] || 0}`);
        console.log(`🚀 Player has FTL: ${window.inventoryManager && window.inventoryManager.hasItem('ftl', 1) ? 'YES' : 'NO'}`);
        console.log(`✨ Player has Aura: ${this.tradingGame.commodities[COMMODITIES.AURA] || 0}`);
        console.log(`⛽ Player fuel: ${this.tradingGame.commodities[COMMODITIES.FUEL] || 0}`);
        console.log(`⛰️ Player ore: ${this.tradingGame.commodities[COMMODITIES.ORE] || 0}`);

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
            },
            () => {
                // Declined offer - no action needed
            },
            npc
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
            },
            () => {
                // Declined offer - no action needed
            },
            npc
        );
    }

    slaveKidnappingScenario(npc) {
        // Player already verified to have slaves
        this.showNPCPopup(
            'We have kidnapped your slaves!',
            null, // No accept text - auto execute
            null, // No decline button
            () => {
                // Remove all slaves
                const oldSlaves = this.tradingGame.commodities[COMMODITIES.SLAVES] || 0;
                this.tradingGame.commodities[COMMODITIES.SLAVES] = 0;
                console.log(`Martian slave theft: ${oldSlaves} slaves taken`);
            },
            null,
            npc,
            true // autoExecute = true
        );
    }

    goldTheftScenario(npc) {
        // Player already verified to have gold
        this.showNPCPopup(
            'We have stolen your gold!',
            null, // No accept text - auto execute
            null, // No decline button
            () => {
                // Remove all gold
                const oldGold = this.tradingGame.commodities[COMMODITIES.GOLD] || 0;
                this.tradingGame.commodities[COMMODITIES.GOLD] = 0;
                console.log(`Martian gold theft: ${oldGold} gold taken`);
            },
            null,
            npc,
            true // autoExecute = true
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
            },
            null,
            npc
        );
    }

    venusianAuraPurchaseScenario(npc) {
        // Player already verified to have Aura
        this.showNPCPopup(
            'We offer to buy your Aura for $1000',
            'Accept',
            'Decline',
            () => {
                // Accept: sell 1 Aura, get $1000
                const oldAura = this.tradingGame.commodities[COMMODITIES.AURA] || 0;

                this.tradingGame.commodities[COMMODITIES.AURA] = oldAura - 1;
                this.tradingGame.money += 1000;

                console.log(`Venusian transaction: Aura ${oldAura} -> ${this.tradingGame.commodities[COMMODITIES.AURA]}, Money +$1000`);
            },
            () => {
                // Declined offer - no action needed
            },
            npc
        );
    }

    venusianFuelTheftScenario(npc) {
        // Player already verified to have >1 fuel
        this.showNPCPopup(
            'We have stolen your fuel!',
            null, // No accept text - auto execute
            null, // No decline button
            () => {
                // Steal all fuel except 1
                const oldFuel = this.tradingGame.commodities[COMMODITIES.FUEL] || 0;
                this.tradingGame.commodities[COMMODITIES.FUEL] = 1;
                console.log(`Venusian fuel theft: ${oldFuel} fuel -> 1 fuel`);
            },
            null,
            npc,
            true // autoExecute = true
        );
    }

    venusianOreTheftScenario(npc) {
        // Player already verified to have ore
        this.showNPCPopup(
            'We stole your ore!',
            null, // No accept text - auto execute
            null, // No decline button
            () => {
                console.log('Venusian ore theft callback executed!');
                // Remove all ore
                const oldOre = this.tradingGame.commodities[COMMODITIES.ORE] || 0;
                console.log(`Before theft: ${oldOre} ore`);
                this.tradingGame.commodities[COMMODITIES.ORE] = 0;
                console.log(`Venusian ore theft: ${oldOre} ore taken, now have ${this.tradingGame.commodities[COMMODITIES.ORE]} ore`);
            },
            null,
            npc,
            true // autoExecute = true
        );
    }

    venusianGoldGiftScenario(npc) {
        // Always available - gift 1 gold
        this.showNPCPopup(
            'We gift you 1 Gold!',
            'Accept',
            null, // No decline button
            () => {
                // Add 1 gold to commodities
                const oldGold = this.tradingGame.commodities[COMMODITIES.GOLD] || 0;
                this.tradingGame.commodities[COMMODITIES.GOLD] = oldGold + 1;
                console.log(`Venusian gold gift: ${oldGold} gold -> ${this.tradingGame.commodities[COMMODITIES.GOLD]} gold`);
            },
            null,
            npc
        );
    }

    venusianNeutralScenario(npc) {
        // Always available neutral interaction
        const messages = [
            'We embrace the eternal heat.',
            'Venus claims its tribute.',
            'Our atmosphere surrounds you.',
            'The pressure builds within.'
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        this.showNPCPopup(
            randomMessage,
            'OK',
            null,
            () => {
                // Just close the popup
            },
            null,
            npc
        );
    }

    removeExistingReptilianPopups() {
        // Remove any existing reptilian popups to ensure only one at a time
        const existingPopups = document.querySelectorAll('.reptilian-popup');
        existingPopups.forEach(popup => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
        });
    }

    reptilianBankingScenario(npc) {
        // Remove any existing reptilian popups first
        this.removeExistingReptilianPopups();

        // Create a custom popup that embeds the Gaia BH1 banking system
        const popup = document.createElement('div');
        popup.className = 'npc-popup reptilian-popup';

        // Green theming is now handled by CSS classes

        // Create banking content container
        const bankingContainer = document.createElement('div');
        bankingContainer.style.width = '100%';
        bankingContainer.style.maxWidth = '400px';

        // Title
        const title = document.createElement('div');
        title.style.fontFamily = 'var(--font-primary)';
        title.style.fontSize = '0.875rem';
        title.style.fontWeight = '700';
        title.style.color = 'var(--color--foreground)';
        title.style.textAlign = 'center';
        title.style.marginBottom = '1rem';
        title.textContent = 'REPTILIAN BANKING CONSORTIUM';
        bankingContainer.appendChild(title);

        // Create main buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.flexDirection = 'column';
        buttonsContainer.style.gap = '0.5rem';

        // Borrow button
        const borrowButton = this.createBankingButton('BORROW', () => {
            this.showBorrowSubmenu(bankingContainer, npc);
        });
        buttonsContainer.appendChild(borrowButton);

        // Deposit button
        const depositButton = this.createBankingButton('DEPOSIT', () => {
            this.showDepositSubmenu(bankingContainer, npc);
        });
        buttonsContainer.appendChild(depositButton);

        // Invest button
        const investButton = this.createBankingButton('INVEST', () => {
            this.showInvestSubmenu(bankingContainer, npc);
        });
        buttonsContainer.appendChild(investButton);

        // Cancel button
        const cancelButton = this.createBankingButton('CANCEL', () => {
            document.body.removeChild(popup);
            this.currentEncounter = null;
            this.processEncounterQueue();
        });
        buttonsContainer.appendChild(cancelButton);

        bankingContainer.appendChild(buttonsContainer);

        // Add to popup
        popup.innerHTML = `
            <div class="npc-popup-content">
                <div class="npc-speaker-label">The Reptilians</div>
                <div style="text-align: center; margin-bottom: 1rem;">We offer banking services.</div>
            </div>
        `;

        const popupContent = popup.querySelector('.npc-popup-content');
        popupContent.appendChild(bankingContainer);

        document.body.appendChild(popup);

        // Auto-remove after 30 seconds (longer for banking interactions)
        setTimeout(() => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
                // Process next encounter in queue
                this.currentEncounter = null;
                this.processEncounterQueue();
            }
        }, 30000);
    }

    reptiliansFirstEncounterScenario(npc) {
        this.showNPCPopup(
            'We invite you to visit Gaia BH1, our home planet.',
            'Accept Invitation',
            null,
            () => {
                // Accept invitation - permanently greenlist Gaia BH1
                console.log('🐲 Reptilians: Setting Gaia BH1 greenlist to true');
                localStorage.setItem('gaiaBH1Greenlisted', 'true');
                console.log('🐲 Reptilians: localStorage value:', localStorage.getItem('gaiaBH1Greenlisted'));
                this.incrementEncounterCount('Reptilians');

                // Update UI if explore panel is visible
                if (window.updateExplorePanel) {
                    console.log('🐲 Reptilians: Updating explore panel');
                    window.updateExplorePanel();
                }
            },
            null,
            npc
        );
    }

    pleiadiansFirstEncounterScenario(npc) {
        this.showNPCPopup(
            'We invite you to visit Pleiades.',
            'Accept Invitation',
            null,
            () => {
                // Accept invitation - permanently greenlist Pleiades
                console.log('🌟 Pleiadians: Setting Pleiades greenlist to true');
                localStorage.setItem('pleiadesGreenlisted', 'true');
                console.log('🌟 Pleiadians: localStorage value:', localStorage.getItem('pleiadesGreenlisted'));
                this.incrementEncounterCount('Pleiadians');

                // Update UI if explore panel is visible
                if (window.updateExplorePanel) {
                    console.log('🌟 Pleiadians: Updating explore panel');
                    window.updateExplorePanel();
                }
            },
            null,
            npc
        );
    }

    pleiadiansAuraGiftScenario(npc) {
        this.showNPCPopup(
            'We gift you 1 Aura as a token of our friendship.',
            'Accept',
            null,
            () => {
                // Gift 1 Aura
                const oldAura = this.tradingGame.commodities[COMMODITIES.AURA] || 0;
                this.tradingGame.commodities[COMMODITIES.AURA] = oldAura + 1;
                this.incrementEncounterCount('Pleiadians');

                console.log(`Pleiadians aura gift: ${oldAura} -> ${this.tradingGame.commodities[COMMODITIES.AURA]} aura`);
            },
            null,
            npc
        );
    }

    pleiadiansAntimatterGiftScenario(npc) {
        this.showNPCPopup(
            'We gift you 1 Antimatter as a sign of our goodwill.',
            'Accept',
            null,
            () => {
                // Gift 1 Antimatter
                const oldAntimatter = this.tradingGame.commodities[COMMODITIES.ANTIMATTER] || 0;
                this.tradingGame.commodities[COMMODITIES.ANTIMATTER] = oldAntimatter + 1;
                this.incrementEncounterCount('Pleiadians');

                console.log(`Pleiadians antimatter gift: ${oldAntimatter} -> ${this.tradingGame.commodities[COMMODITIES.ANTIMATTER]} antimatter`);
            },
            null,
            npc
        );
    }

    pleiadiansDarkMatterGiftScenario(npc) {
        this.showNPCPopup(
            'We gift you 1 Dark Matter as a mark of our alliance.',
            'Accept',
            null,
            () => {
                // Gift 1 Dark Matter
                const oldDarkMatter = this.tradingGame.commodities[COMMODITIES.DARK_MATTER] || 0;
                this.tradingGame.commodities[COMMODITIES.DARK_MATTER] = oldDarkMatter + 1;
                this.incrementEncounterCount('Pleiadians');

                console.log(`Pleiadians dark matter gift: ${oldDarkMatter} -> ${this.tradingGame.commodities[COMMODITIES.DARK_MATTER]} dark matter`);
            },
            null,
            npc
        );
    }

    pleiadiansGoldGiftScenario(npc) {
        this.showNPCPopup(
            'We gift you 1 Gold as our final offering.',
            'Accept',
            null,
            () => {
                // Gift 1 Gold
                const oldGold = this.tradingGame.commodities[COMMODITIES.GOLD] || 0;
                this.tradingGame.commodities[COMMODITIES.GOLD] = oldGold + 1;
                this.incrementEncounterCount('Pleiadians');

                console.log(`Pleiadians gold gift: ${oldGold} -> ${this.tradingGame.commodities[COMMODITIES.GOLD]} gold`);
            },
            null,
            npc
        );
    }

    pleiadiansAscensionScenario(npc) {
        this.showNPCPopup(
            'We implore you to Ascend the Star Child to the Throne. The time has come for the great awakening.',
            'Understood',
            null,
            () => {
                // Just acknowledge the message
                this.incrementEncounterCount('Pleiadians');
            },
            null,
            npc
        );
    }

    greysWarningScenario(npc) {
        this.showNPCPopup(
            'Stay away from Zeta Reticuli. It belongs to us.',
            'Understood',
            null,
            () => {
                // Just acknowledge the warning
            },
            null,
            npc
        );
    }

    greysRudeScenario(npc) {
        const messages = [
            'What do you want, primitive? Go bother someone else.',
            'You are beneath our concern. Leave us.',
            'Your presence here is an annoyance. Depart.',
            'We have no time for inferior species like yours.'
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        this.showNPCPopup(
            randomMessage,
            'OK',
            null,
            () => {
                // Just close the popup
            },
            null,
            npc
        );
    }

    greysThreatScenario(npc) {
        this.showNPCPopup(
            'You\'ve been warned. Zeta Reticuli is off-limits to outsiders. Defy us at your peril.',
            'Understood',
            null,
            () => {
                // Just acknowledge the threat
            },
            null,
            npc
        );
    }

    createBankingButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.width = '100%';
        button.style.padding = '0.75rem';
        button.style.fontFamily = 'var(--font-primary)';
        button.style.fontWeight = '700';
        button.style.fontSize = '0.625rem';
        button.style.textTransform = 'uppercase';
        button.style.letterSpacing = '0.05em';
        button.style.color = 'var(--color--foreground)';
        button.style.backgroundColor = 'rgba(0, 255, 0, 0.1)'; // Green theme for Reptilians
        button.style.border = '1px solid rgba(0, 255, 0, 0.3)';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.transition = 'all 0.2s';

        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        });

        button.addEventListener('click', onClick);

        return button;
    }

    createBackButton(onClick) {
        const backButton = document.createElement('button');
        backButton.textContent = '← BACK';
        backButton.style.width = '100%';
        backButton.style.padding = '0.5rem';
        backButton.style.marginBottom = '1rem';
        backButton.style.fontFamily = 'var(--font-primary)';
        backButton.style.fontWeight = '700';
        backButton.style.fontSize = '0.5rem';
        backButton.style.textTransform = 'uppercase';
        backButton.style.letterSpacing = '0.05em';
        backButton.style.color = 'var(--color--foreground)';
        backButton.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        backButton.style.border = '1px solid rgba(0, 255, 0, 0.3)';
        backButton.style.borderRadius = '4px';
        backButton.style.cursor = 'pointer';

        backButton.addEventListener('click', onClick);

        return backButton;
    }

    showBorrowSubmenu(container, npc) {
        // Clear container and show borrow submenu
        container.innerHTML = '';

        // Back button
        const backButton = this.createBackButton(() => {
            // Return to main banking menu
            this.reptilianBankingScenario(npc);
        });
        container.appendChild(backButton);

        // Content
        const content = document.createElement('div');
        content.style.fontFamily = 'var(--font-primary)';
        content.style.fontSize = '0.75rem';
        content.style.lineHeight = '1.4';
        content.style.color = 'var(--color--foreground)';
        content.style.textAlign = 'center';
        content.style.marginBottom = '1rem';

        if (this.tradingGame && this.tradingGame.gaiaBH1Loan.active) {
            // Show repayment option
            content.innerHTML = `
                <div style="margin-bottom: 1rem;">Loan Status: Active</div>
                <div style="margin-bottom: 1rem;">Amount Owed: $${this.tradingGame.gaiaBH1Loan.totalOwed}</div>
                <div style="margin-bottom: 1rem;">Turns Remaining: ${this.tradingGame.gaiaBH1Loan.turnsRemaining}</div>
            `;

            const repayButton = this.createBankingButton('REPAY $24K', () => {
                if (this.tradingGame && this.tradingGame.money >= this.tradingGame.gaiaBH1Loan.totalOwed) {
                    this.tradingGame.money -= this.tradingGame.gaiaBH1Loan.totalOwed;
                    this.tradingGame.gaiaBH1Loan.repaid = true;
                    this.tradingGame.gaiaBH1Loan.active = false;

                    // Update UI
                    if (window.renderInventory) {
                        window.renderInventory();
                    }
                    if (window.updateExplorePanel) {
                        window.updateExplorePanel();
                    }

                    // Close the entire popup after successful repayment
                    const popup = document.querySelector('.reptilian-popup');
                    if (popup && document.body.contains(popup)) {
                        document.body.removeChild(popup);
                    }
                    this.currentEncounter = null;
                    this.processEncounterQueue();
                }
            });

            // Disable repay button if insufficient funds
            if (this.tradingGame.money < this.tradingGame.gaiaBH1Loan.totalOwed) {
                repayButton.disabled = true;
                repayButton.style.opacity = '0.5';
                repayButton.style.cursor = 'not-allowed';
            }

            container.appendChild(content);
            container.appendChild(repayButton);
        } else {
            // Show loan offer
            content.innerHTML = `
                <div style="margin-bottom: 1rem;">The Reptilians offer a $20,000 loan at 20% interest over 10 turns.</div>
                <div style="font-weight: 700; color: #ff6b6b;">Total repayment: $24,000</div>
            `;

            const confirmButton = this.createBankingButton('CONFIRM LOAN', () => {
                if (this.tradingGame) {
                    this.tradingGame.money += 20000;
                    this.tradingGame.gaiaBH1Loan.active = true;
                    this.tradingGame.gaiaBH1Loan.turnsRemaining = 10;

                    // Update UI
                    if (window.renderInventory) {
                        window.renderInventory();
                    }
                    if (window.updateExplorePanel) {
                        window.updateExplorePanel();
                    }

                    // Award Puppet achievement for first Reptilian interaction
                    if (window.scoreManager) {
                        window.scoreManager.addAchievement('Puppet');
                    }

                    // Return to main banking menu after loan acceptance
                    this.reptilianBankingScenario(npc);
                }
            });

            container.appendChild(content);
            container.appendChild(confirmButton);
        }
    }

    showDepositSubmenu(container, npc) {
        // Clear container and show deposit submenu
        container.innerHTML = '';

        // Back button
        const backButton = this.createBackButton(() => {
            // Return to main banking menu
            this.reptilianBankingScenario(npc);
        });
        container.appendChild(backButton);

        // Content
        const content = document.createElement('div');
        content.style.fontFamily = 'var(--font-primary)';
        content.style.fontSize = '0.75rem';
        content.style.lineHeight = '1.4';
        content.style.color = 'var(--color--foreground)';
        content.style.textAlign = 'center';
        content.style.marginBottom = '1rem';

        const accountBalance = this.tradingGame ? this.tradingGame.gaiaBH1Account.balance : 0;
        content.innerHTML = `
            <div style="margin-bottom: 1rem;">Account Balance: $${accountBalance}</div>
            <div style="margin-bottom: 1rem;">The Reptilians offer a $5,000 holding account. This account must hold minimum $5,000.</div>
        `;

        container.appendChild(content);

        // Number input
        const inputContainer = document.createElement('div');
        inputContainer.style.marginBottom = '1rem';

        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.min = '0';
        amountInput.placeholder = 'Enter amount';
        amountInput.style.width = '100%';
        amountInput.style.padding = '0.5rem';
        amountInput.style.fontFamily = 'var(--font-primary)';
        amountInput.style.fontSize = '0.75rem';
        amountInput.style.color = 'var(--color--foreground)';
        amountInput.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        amountInput.style.border = '1px solid rgba(0, 255, 0, 0.3)';
        amountInput.style.borderRadius = '4px';
        amountInput.style.textAlign = 'center';

        inputContainer.appendChild(amountInput);
        container.appendChild(inputContainer);

        // Buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.flexDirection = 'column';
        buttonsContainer.style.gap = '0.5rem';

        // Deposit button
        const depositButton = this.createBankingButton('DEPOSIT', () => {
            const amount = parseInt(amountInput.value) || 0;
            if (this.tradingGame && amount > 0 && this.tradingGame.money >= amount) {
                const newBalance = accountBalance + amount;
                if (newBalance >= 5000) {
                    this.tradingGame.money -= amount;
                    this.tradingGame.gaiaBH1Account.balance = newBalance;
                    this.tradingGame.gaiaBH1Account.active = true;

                    // Update UI
                    if (window.renderInventory) {
                        window.renderInventory();
                    }
                    if (window.updateExplorePanel) {
                        window.updateExplorePanel();
                    }

                    // Award Puppet achievement for first Reptilian interaction
                    if (window.scoreManager) {
                        window.scoreManager.addAchievement('Puppet');
                    }

                    // Return to main banking menu after successful deposit
                    this.reptilianBankingScenario(npc);
                }
            }
        });

        // Withdraw button
        const withdrawButton = this.createBankingButton('WITHDRAW', () => {
            const amount = parseInt(amountInput.value) || 0;
            if (this.tradingGame && amount > 0 && accountBalance >= amount) {
                const newBalance = accountBalance - amount;
                if (!this.tradingGame.gaiaBH1Account.active || newBalance >= 5000) {
                    this.tradingGame.money += amount;
                    this.tradingGame.gaiaBH1Account.balance = newBalance;

                    // Deactivate account if below minimum
                    if (newBalance < 5000) {
                        this.tradingGame.gaiaBH1Account.active = false;

                        // Trigger Reptilian agro when account closes while investment is active
                        if (this.tradingGame.gaiaBH1Investment.active) {
                            const reptiliansNpc = this.npcs.find(npc => npc.name === 'Reptilians');
                            if (reptiliansNpc && !reptiliansNpc.agro) {
                                window.combatManager.activateAgroMode(reptiliansNpc);
                                console.log('🐲 Reptilian agro triggered: Deposit account closed during active investment');
                            }
                        }
                    }

                    // Update UI
                    if (window.renderInventory) {
                        window.renderInventory();
                    }
                    if (window.updateExplorePanel) {
                        window.updateExplorePanel();
                    }

                    // Return to main banking menu after successful withdrawal
                    this.reptilianBankingScenario(npc);
                }
            }
        });

        buttonsContainer.appendChild(depositButton);
        buttonsContainer.appendChild(withdrawButton);
        container.appendChild(buttonsContainer);
    }

    showInvestSubmenu(container, npc) {
        // Clear container and show invest submenu
        container.innerHTML = '';

        // Back button
        const backButton = this.createBackButton(() => {
            // Return to main banking menu
            this.reptilianBankingScenario(npc);
        });
        container.appendChild(backButton);

        // Content
        const content = document.createElement('div');
        content.style.fontFamily = 'var(--font-primary)';
        content.style.fontSize = '0.75rem';
        content.style.lineHeight = '1.4';
        content.style.color = 'var(--color--foreground)';
        content.style.textAlign = 'center';
        content.style.marginBottom = '1rem';

        if (this.tradingGame && this.tradingGame.gaiaBH1Account.balance > 0) {
            // Show investment offer
            if (this.tradingGame.gaiaBH1Investment.active) {
                content.innerHTML = `
                    <div style="margin-bottom: 1rem;">Investment Status: Active</div>
                    <div style="margin-bottom: 1rem;">Turns Remaining: ${this.tradingGame.gaiaBH1Investment.turnsRemaining}</div>
                    <div style="margin-bottom: 1rem;">Total Paid: $${this.tradingGame.gaiaBH1Investment.totalPaid}</div>
                `;
            } else {
                content.innerHTML = `
                    <div style="margin-bottom: 1rem;">The Reptilians offer an investment package of $30,000.</div>
                    <div style="margin-bottom: 1rem;">This package pays out $4,000 every turn for 10 turns.</div>
                    <div style="font-weight: 700; color: #4ecdc4;">Total return: $40,000</div>
                `;

                const investButton = this.createBankingButton('INVEST', () => {
                    if (this.tradingGame && this.tradingGame.gaiaBH1Account.balance >= 30000) {
                        this.tradingGame.gaiaBH1Account.balance -= 30000;
                        this.tradingGame.gaiaBH1Investment.active = true;
                        this.tradingGame.gaiaBH1Investment.turnsRemaining = 10;
                        this.tradingGame.gaiaBH1Investment.totalPaid = 0;

                        // Update UI
                        if (window.renderInventory) {
                            window.renderInventory();
                        }
                        if (window.updateExplorePanel) {
                            window.updateExplorePanel();
                        }

                        // Return to main banking menu after successful investment
                        this.reptilianBankingScenario(npc);
                    }
                });

                container.appendChild(content);
                container.appendChild(investButton);
            }
        } else {
            // No account balance
            content.innerHTML = `
                <div>The Reptilians offer an investment package for account holders.</div>
            `;
            container.appendChild(content);
        }
    }

    showNPCPopup(message, acceptText, declineText, acceptCallback, declineCallback = null, npc = null, autoExecute = false) {
        // Create custom popup for NPC interactions
        const speakerLabel = npc ? `The ${npc.name}` : 'The Aliens';
        const popup = document.createElement('div');
        if (npc && npc.name === 'Venusians') {
            popup.className = 'npc-popup venusian-popup';
        } else if (npc && npc.name === 'Reptilians') {
            popup.className = 'npc-popup reptilian-popup';
        } else if (npc && npc.name === 'Pleiadians') {
            popup.className = 'npc-popup pleiadian-popup';
        } else if (npc && npc.name === 'Greys') {
            popup.className = 'npc-popup greys-popup';
        } else {
            popup.className = 'npc-popup';
        }

        // If autoExecute is true, execute callback immediately and show no buttons
        if (autoExecute) {
            acceptCallback();
            popup.innerHTML = `
                <div class="npc-popup-content">
                    <div class="npc-speaker-label">${speakerLabel}</div>
                    <p>${message}</p>
                </div>
            `;
        } else {
            // Normal interactive popup with buttons
            popup.innerHTML = `
                <div class="npc-popup-content">
                    <div class="npc-speaker-label">${speakerLabel}</div>
                    <p>${message}</p>
                    <div class="npc-popup-buttons">
                        <button class="npc-accept-btn">${acceptText}</button>
                        ${declineText ? `<button class="npc-decline-btn">${declineText}</button>` : ''}
                    </div>
                </div>
            `;

            // Add button event listeners
            const acceptBtn = popup.querySelector('.npc-accept-btn');
            acceptBtn.onclick = () => {
                acceptCallback();
                document.body.removeChild(popup);
                // Process next encounter in queue
                this.currentEncounter = null;
                this.processEncounterQueue();
            };

            if (declineText && declineCallback) {
                const declineBtn = popup.querySelector('.npc-decline-btn');
                declineBtn.onclick = () => {
                    declineCallback();
                    document.body.removeChild(popup);
                    // Process next encounter in queue
                    this.currentEncounter = null;
                    this.processEncounterQueue();
                };
            }
        }

        document.body.appendChild(popup);

        // Auto-remove after 10 seconds if no interaction
        setTimeout(() => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
                // Process next encounter in queue
                this.currentEncounter = null;
                this.processEncounterQueue();
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

    createTypewriterSprite(npcName, destinationName) {
        const textCanvas = document.createElement('canvas');
        const textContext = textCanvas.getContext('2d');
        const font = 'bold 48px Inter, sans-serif'; // Larger font size
        textContext.font = font;

        // Create two-line text
        const line1 = `The ${npcName}`;
        const line2 = `are travelling to ${destinationName}`;

        // Measure both lines to determine canvas size
        const line1Metrics = textContext.measureText(line1.toUpperCase());
        const line2Metrics = textContext.measureText(line2.toUpperCase());
        const maxWidth = Math.max(line1Metrics.width, line2Metrics.width);

        // Add padding
        const padding = 32;
        textCanvas.width = Math.max(200, Math.ceil(maxWidth) + padding);
        textCanvas.height = 80; // Taller for two lines

        const textTexture = new THREE.CanvasTexture(textCanvas);
        textTexture.needsUpdate = true;

        const textMaterial = new THREE.SpriteMaterial({
            map: textTexture,
            transparent: true
        });

        const sprite = new THREE.Sprite(textMaterial);

        // Scale to prevent squishing - even larger scale for maximum visibility
        const baseScaleX = 0.35;
        const baseScaleY = 0.35;
        const aspectRatio = textCanvas.width / textCanvas.height;
        sprite.scale.set(baseScaleX * aspectRatio, baseScaleY, 1);

        // Add typewriter animation data for two lines
        sprite.typewriterData = {
            line1: line1.toUpperCase(),
            line2: line2.toUpperCase(),
            currentLine: 1,
            currentIndex: 0,
            canvas: textCanvas,
            context: textContext,
            texture: textTexture,
            font: font,
            lastUpdateTime: performance.now(),
            charDelay: 100, // Comfortable speed for larger text
            isComplete: false
        };

        // Add sprite to scene
        this.scene.add(sprite);

        return sprite;
    }

    updateTypewriterSprite(sprite, deltaTime) {
        if (!sprite.typewriterData || sprite.typewriterData.isComplete) return;

        const data = sprite.typewriterData;
        const now = performance.now();

        // Add characters based on time passed
        const charsToAdd = Math.floor((now - data.lastUpdateTime) / data.charDelay);
        if (charsToAdd > 0) {
            // Handle two-line animation
            if (data.currentLine === 1) {
                // Still typing first line
                data.currentIndex = Math.min(data.currentIndex + charsToAdd, data.line1.length);
                data.lastUpdateTime = now;

                // Check if first line is complete
                if (data.currentIndex >= data.line1.length) {
                    // Move to second line
                    data.currentLine = 2;
                    data.currentIndex = 0;
                }
            } else if (data.currentLine === 2) {
                // Typing second line
                data.currentIndex = Math.min(data.currentIndex + charsToAdd, data.line2.length);
                data.lastUpdateTime = now;

                // Check if second line is complete
                if (data.currentIndex >= data.line2.length) {
                    data.isComplete = true;
                }
            }

            // Clear canvas
            data.context.clearRect(0, 0, data.canvas.width, data.canvas.height);

            // Reset context after clear
            data.context.font = data.font;
            data.context.fillStyle = '#ffffff'; // White text
            data.context.textAlign = 'left'; // Left-aligned text
            data.context.textBaseline = 'top';

            // Draw first line (always fully visible once started)
            data.context.fillText(data.line1, 16, 8);

            // Draw current second line text
            if (data.currentLine === 2) {
                const currentLine2Text = data.line2.substring(0, data.currentIndex);
                data.context.fillText(currentLine2Text, 16, 44); // Second line below first
            }

            // Update texture
            data.texture.needsUpdate = true;
        }
    }

    showDepartureMessage(npc, destinationName) {
        // 1/3 chance to show departure message
        if (Math.random() >= 0.333) return;

        // Create typewriter sprite with separate NPC name and destination
        const sprite = this.createTypewriterSprite(npc.name, destinationName);

        // Position at departure location with slight Y offset to avoid overlapping spaceship
        const position = npc.travelStartPos.clone();
        position.y += 0.5; // Offset above the spaceship
        sprite.position.copy(position);

        // Track the sprite with creation time for cleanup
        const spriteData = {
            sprite: sprite,
            creationTime: performance.now(),
            displayDuration: 10000 // 10 seconds total
        };

        this.activeTypewriterSprites.push(spriteData);

        console.log(`🚀 Departure message: "The ${npc.name} are travelling to ${destinationName}" at ${npc.currentLocation}`);
    }

    updateTravelAnimations(deltaTime) {
        // Update NPC spaceship travel animations
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
                        if (npc.pendingDestination) {
                            const nextDestination = npc.pendingDestination;
                            npc.pendingDestination = null;
                            this.startNPCTravel(npc, nextDestination);
                        } else {
                            this.checkForEncounter(npc);
                        }
                    }
                }
            }
        });

        // Update typewriter sprites
        this.activeTypewriterSprites.forEach((spriteData, index) => {
            this.updateTypewriterSprite(spriteData.sprite, deltaTime);

            // Check if sprite should be removed
            const elapsed = performance.now() - spriteData.creationTime;
            if (elapsed >= spriteData.displayDuration) {
                // Remove sprite from scene
                this.scene.remove(spriteData.sprite);

                // Dispose of texture and materials to free memory
                if (spriteData.sprite.material.map) {
                    spriteData.sprite.material.map.dispose();
                }
                spriteData.sprite.material.dispose();

                // Remove from active sprites array
                this.activeTypewriterSprites.splice(index, 1);
            }
        });
    }

    // Move all agro NPCs when player skips a turn
    moveAllAgroNPCsOnPlayerSkip() {
        console.log('🚨 Moving ALL agro NPCs after player skip!');
        this.npcs.forEach(npc => {
            if (npc.agro) {
                console.log(`🚨 ${npc.name} agro movement triggered by player skip`);
                this.moveAgroNPC(npc);
            }
        });
    }

    // Check if any agro NPCs are at the player's location (called by combat manager)
    getAgroNPCsAtPlayerLocation(playerLocation) {
        return this.npcs.filter(npc =>
            npc.agro &&
            npc.currentLocation.toLowerCase() === playerLocation.toLowerCase() &&
            !npc.isTraveling // Exclude NPCs that are still traveling (haven't arrived yet)
        );
    }

    // Get agro NPCs that are currently traveling to a specific location
    getAgroNPCsTravelingToLocation(targetLocation) {
        const travelingAgro = this.npcs.filter(npc =>
            npc.agro &&
            npc.isTraveling &&
            npc.travelDestination &&
            npc.travelDestination.toLowerCase() === targetLocation.toLowerCase()
        );
        console.log(`🚨 Agro NPCs traveling to ${targetLocation}: ${travelingAgro.map(npc => npc.name).join(', ')}`);
        return travelingAgro;
    }
}
