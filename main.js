// Clear ALL localStorage on game start - NO PERSISTENCE EVER
localStorage.clear();
console.log('🧹 Game state completely reset - no localStorage persistence');

import * as THREE from 'three';
import { PillStepper } from './pillstepper.js';
import { SceneManager } from './scene-manager.js';
import { InventoryManager } from './inventory-manager.js';
import { createAllObjects } from './objects.js';
import { TradingGame } from './trading-game.js';
import { TradingUI } from './trading-ui.js';
import { ScoreManager } from './score-manager.js';
import { NPCManager } from './npc-manager.js';
import { CombatManager } from './combat.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.01, // Closer near plane to prevent clipping when zooming in very close
    2000  // Further far plane to prevent objects disappearing when zooming out
);
camera.position.z = 10;
camera.position.y = 2;

// Renderer
// Limit pixel ratio on mobile for better performance
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const pixelRatio = isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio;

const renderer = new THREE.WebGLRenderer({ antialias: !isMobile }); // Disable antialiasing on mobile for performance
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(pixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 10, 10);
scene.add(pointLight);

// Raycaster for click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Create a group to hold all planes for rotation
const planesGroup = new THREE.Group();

// Create stacked horizontal planes
const planeCount = 5;
let spacing = 2.5; // Make spacing variable
const planeSize = 8;
const planes = []; // Store plane references for dynamic updates

// Function to get plane Y position by index
function getPlaneY(index) {
    return (index - 1) * spacing;
}

// Colors for a retro-futuristic look
const colors = [
    0xff6b6b, // Red
    0xff8e53, // Orange
    0xffd93d, // Yellow
    0x6bcf7f, // Green
    0x4d9de0, // Blue
    0x9b59b6, // Purple
    0xe74c3c, // Deep Red
    0xf39c12, // Orange-Yellow
];

for (let i = 0; i < planeCount; i++) {
    const planeColor = colors[i % colors.length];
    
    if (i === 1) {
        // Plane 1: Create mountain/hill terrain with same loose grid style and mirror material
        // Override color to bright yellow (brighter, more yellow, less orange)
        const plane1Color = 0xfff700; // Bright yellow
        const gridDivisions = 20; // Same as other planes
        const halfSize = planeSize / 2;
        const step = planeSize / gridDivisions;
        
        // Helper function to calculate terrain height (mountain-like)
        const getTerrainHeight = (x, z, time) => {
            // Create mountain/hill terrain using multiple noise-like functions
            const dist = Math.sqrt(x * x + z * z);
            const hill1 = Math.sin(x * 0.3 + time * 0.2) * 0.8;
            const hill2 = Math.sin(z * 0.4 + time * 0.15) * 0.7;
            const hill3 = Math.sin((x + z) * 0.25 + time * 0.25) * 0.6;
            const mountain = Math.sin(dist * 0.2 + time * 0.1) * 0.5;
            const detail = Math.sin(x * 0.8 + z * 0.6 + time * 0.3) * 0.3;
            return hill1 + hill2 + hill3 + mountain + detail;
        };
        
        // Create mesh geometry with faces for mirror material
        const meshGeometry = new THREE.PlaneGeometry(planeSize, planeSize, gridDivisions, gridDivisions);
        meshGeometry.rotateX(-Math.PI / 2);
        const meshPositions = meshGeometry.attributes.position;
        
        // Deform mesh geometry to terrain
        for (let j = 0; j < meshPositions.count; j++) {
            const x = meshPositions.getX(j);
            const z = meshPositions.getZ(j);
            const y = getTerrainHeight(x, z, 0);
            meshPositions.setY(j, y);
        }
        meshGeometry.computeVertexNormals();
        
        // Create mirror material for the terrain mesh - highly reflective
        const meshMaterial = new THREE.MeshPhysicalMaterial({
            color: plane1Color, // Use bright yellow instead of planeColor
            metalness: 1.0,
            roughness: 0.0,
            transmission: 0.0,
            ior: 1.5,
            transparent: true,
            opacity: 0.6, // Increased opacity for stronger reflection
            reflectivity: 1.0, // Maximum reflectivity
            side: THREE.DoubleSide
        });
        
        // Create mesh with mirror material
        const terrainMesh = new THREE.Mesh(meshGeometry, meshMaterial);
        terrainMesh.position.y = (i - 1) * spacing - 0.5;
        
        // Create grid lines (same style as other planes)
        const gridGeometry = new THREE.BufferGeometry();
        const gridVertices = [];
        
        // Create vertical grid lines (along Z axis)
        for (let j = 0; j <= gridDivisions; j++) {
            const x = -halfSize + j * step;
            for (let k = 0; k < gridDivisions; k++) {
                const z1 = -halfSize + k * step;
                const z2 = -halfSize + (k + 1) * step;
                const y1 = getTerrainHeight(x, z1, 0);
                const y2 = getTerrainHeight(x, z2, 0);
                
                gridVertices.push(x, y1, z1);
                gridVertices.push(x, y2, z2);
            }
        }
        
        // Create horizontal grid lines (along X axis)
        for (let j = 0; j <= gridDivisions; j++) {
            const z = -halfSize + j * step;
            for (let k = 0; k < gridDivisions; k++) {
                const x1 = -halfSize + k * step;
                const x2 = -halfSize + (k + 1) * step;
                const y1 = getTerrainHeight(x1, z, 0);
                const y2 = getTerrainHeight(x2, z, 0);
                
                gridVertices.push(x1, y1, z);
                gridVertices.push(x2, y2, z);
            }
        }
        
        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridVertices, 3));
        gridGeometry.computeBoundingSphere();
        
        const gridLineMaterial = new THREE.LineBasicMaterial({
            color: plane1Color, // Use bright yellow instead of planeColor
            transparent: true,
            opacity: 0.8
        });
        const gridLines = new THREE.LineSegments(gridGeometry, gridLineMaterial);
        gridLines.position.y = (i - 1) * spacing - 0.5;
        
        // Create a group to hold both mesh and grid lines
        const grid = new THREE.Group();
        grid.add(terrainMesh);
        grid.add(gridLines);
        grid.position.y = 0; // Position handled by children
        
        // Store references for animation
        grid.userData.isRippled = true;
        grid.userData.meshGeometry = meshGeometry;
        grid.userData.gridGeometry = gridGeometry;
        grid.userData.terrainMesh = terrainMesh;
        grid.userData.gridLines = gridLines;
        grid.userData.getTerrainHeight = getTerrainHeight;
        grid.userData.gridDivisions = gridDivisions;
        grid.userData.halfSize = halfSize;
        grid.userData.step = step;
        
        planesGroup.add(grid);
        planes.push(grid);
    } else if (i === 3) {
        // Plane 3: Create sharp jagged mountain terrain (higher in middle, lower at edges) with grid
        const gridDivisions = 30; // More divisions for sharper changes
        const halfSize = planeSize / 2;
        const step = planeSize / gridDivisions;
        
        // Simple pseudo-random function for sharp jagged peaks
        const hash = (x, z) => {
            const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
            return n - Math.floor(n);
        };
        
        // Helper function to calculate terrain height (sharp jagged mountain with subtle flicker)
        const getTerrainHeight = (x, z, time) => {
            // Distance from center
            const dist = Math.sqrt(x * x + z * z);
            const maxDist = Math.sqrt(halfSize * halfSize + halfSize * halfSize);
            
            // Base mountain shape - higher in center, lower at edges (sharp falloff)
            const normalizedDist = Math.min(dist / maxDist, 1.0);
            const mountainHeight = (1.0 - normalizedDist) * 0.8; // Peak at center, linear falloff
            
            // Sharp jagged peaks using hash-based noise with step function
            const gridX = Math.floor((x + halfSize) / step);
            const gridZ = Math.floor((z + halfSize) / step);
            const jaggedness = hash(gridX, gridZ) * 0.4; // Sharp random peaks
            const detail = hash(gridX * 2, gridZ * 2) * 0.2; // Fine detail
            
            // Subtle flicker/tweak animation - use time to create gentle variations
            const flickerSpeed = 0.8; // Faster flicker
            const flickerAmount = 0.25; // More noticeable amount
            const flicker = Math.sin(time * flickerSpeed + gridX * 0.5 + gridZ * 0.3) * flickerAmount;
            const tweak = Math.sin(time * 0.4 + dist * 0.5) * 0.15; // More noticeable distance-based tweak
            const jitter = Math.sin(time * 1.2 + gridX * 1.1 + gridZ * 0.9) * 0.1; // Additional jitter for visibility
            
            // Combine with sharp transitions and subtle animation
            return mountainHeight + jaggedness + detail + flicker + tweak + jitter;
        };
        
        // Create mesh geometry with faces
        const meshGeometry = new THREE.PlaneGeometry(planeSize, planeSize, gridDivisions, gridDivisions);
        meshGeometry.rotateX(-Math.PI / 2);
        const meshPositions = meshGeometry.attributes.position;
        
        // Deform mesh geometry to terrain
        for (let j = 0; j < meshPositions.count; j++) {
            const x = meshPositions.getX(j);
            const z = meshPositions.getZ(j);
            const y = getTerrainHeight(x, z, 0);
            meshPositions.setY(j, y);
        }
        meshGeometry.computeVertexNormals();
        
        // Create material for the terrain mesh - fully transparent with just grid lines visible
        const meshMaterial = new THREE.MeshStandardMaterial({
            color: planeColor,
            emissive: planeColor,
            emissiveIntensity: 0.0,
            transparent: true,
            opacity: 0.0, // Fully transparent squares
            side: THREE.DoubleSide
        });
        
        // Create mesh - offset down so base stays at same level as flat planes
        const terrainMesh = new THREE.Mesh(meshGeometry, meshMaterial);
        terrainMesh.position.y = (i - 1) * spacing - 0.4; // Offset down to keep base level
        terrainMesh.renderOrder = 0; // Render before astrological symbols (which have renderOrder 1)
        terrainMesh.visible = false; // Hide mesh completely - only grid lines are visible
        
        // Create grid lines following terrain
        const gridGeometry = new THREE.BufferGeometry();
        const gridVertices = [];
        
        // Create vertical grid lines (along Z axis)
        for (let j = 0; j <= gridDivisions; j++) {
            const x = -halfSize + j * step;
            for (let k = 0; k < gridDivisions; k++) {
                const z1 = -halfSize + k * step;
                const z2 = -halfSize + (k + 1) * step;
                const y1 = getTerrainHeight(x, z1, 0);
                const y2 = getTerrainHeight(x, z2, 0);
                
                gridVertices.push(x, y1, z1);
                gridVertices.push(x, y2, z2);
            }
        }
        
        // Create horizontal grid lines (along X axis)
        for (let j = 0; j <= gridDivisions; j++) {
            const z = -halfSize + j * step;
            for (let k = 0; k < gridDivisions; k++) {
                const x1 = -halfSize + k * step;
                const x2 = -halfSize + (k + 1) * step;
                const y1 = getTerrainHeight(x1, z, 0);
                const y2 = getTerrainHeight(x2, z, 0);
                
                gridVertices.push(x1, y1, z);
                gridVertices.push(x2, y2, z);
            }
        }
        
        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridVertices, 3));
        gridGeometry.computeBoundingSphere();
        
        const gridLineMaterial = new THREE.LineBasicMaterial({
            color: planeColor,
            transparent: true,
            opacity: 1.0 // Fully opaque grid lines
        });
        const gridLines = new THREE.LineSegments(gridGeometry, gridLineMaterial);
        gridLines.position.y = (i - 1) * spacing - 0.4; // Match mesh offset
        
        // Create a group to hold both mesh and grid lines
        const grid = new THREE.Group();
        grid.add(terrainMesh);
        grid.add(gridLines);
        grid.position.y = 0; // Position handled by children
        
        // Store references for animation
        grid.userData.isFlickering = true;
        grid.userData.meshGeometry = meshGeometry;
        grid.userData.gridGeometry = gridGeometry;
        grid.userData.terrainMesh = terrainMesh;
        grid.userData.gridLines = gridLines;
        grid.userData.getTerrainHeight = getTerrainHeight;
        grid.userData.gridDivisions = gridDivisions;
        grid.userData.halfSize = halfSize;
        grid.userData.step = step;
        
        // Create water cascade effect along L-shaped corner edge (top-right corner)
        const waterParticleCount = 3000; // Particle count for waterfall flow
        const waterGeometry = new THREE.BufferGeometry();
        const waterPositions = new Float32Array(waterParticleCount * 3);
        const waterVelocities = new Float32Array(waterParticleCount * 3);
        const waterSizes = new Float32Array(waterParticleCount);
        const waterActive = new Uint8Array(waterParticleCount); // Track if particle is active
        
        // L-shape: top edge (along X) and right edge (along Z)
        const edgeLength = 2.0; // Length of each edge of the L
        const cornerX = halfSize - 0.3; // Top-right corner X
        const cornerZ = -halfSize + 0.3; // Top-right corner Z
        
        // Spawn parameters for continuous flow - 50x faster!
        const spawnRate = 0.001; // Spawn new particle every 0.001 units of time (much faster = much denser)
        let nextSpawnIndex = 0; // Which particle to spawn next
        let spawnTimer = 0; // Timer for continuous spawning
        
        // Initialize all particles as inactive (will spawn over time)
        for (let i = 0; i < waterParticleCount; i++) {
            waterActive[i] = 0; // Inactive
            waterSizes[i] = 0.02 + Math.random() * 0.03;
        }
        
        waterGeometry.setAttribute('position', new THREE.BufferAttribute(waterPositions, 3));
        waterGeometry.setAttribute('size', new THREE.BufferAttribute(waterSizes, 1));
        
        // Water material - transparent blue
        const waterMaterial = new THREE.PointsMaterial({
            color: 0x4d9de0, // Blue
            size: 0.05,
            transparent: true,
            opacity: 0.7,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
        });
        
        const waterParticles = new THREE.Points(waterGeometry, waterMaterial);
        waterParticles.position.y = (i - 1) * spacing - 0.4; // Match plane offset
        
        // Store water particle data for animation
        grid.userData.waterParticles = waterParticles;
        grid.userData.waterPositions = waterPositions;
        grid.userData.waterVelocities = waterVelocities;
        grid.userData.waterParticleCount = waterParticleCount;
        grid.userData.waterCornerX = cornerX;
        grid.userData.waterCornerZ = cornerZ;
        grid.userData.waterEdgeLength = edgeLength;
        grid.userData.waterGravity = -0.0003; // Gravity acceleration (very very slow)
        grid.userData.waterSizes = waterSizes;
        grid.userData.waterActive = waterActive;
        grid.userData.spawnRate = spawnRate;
        grid.userData.nextSpawnIndex = nextSpawnIndex;
        grid.userData.spawnTimer = spawnTimer;
        
        grid.add(waterParticles);
        
        planesGroup.add(grid);
        planes.push(grid);
    } else if (i === 2) {
        // Plane 2: White, very translucent grid
        const grid = new THREE.GridHelper(planeSize, 20, 0xffffff, 0xffffff);
        grid.position.y = (i - 1) * spacing;
        
        // Make grid lines white and very translucent
        grid.material.color.setHex(0xffffff);
        grid.material.opacity = 0.15; // Very translucent
        grid.material.transparent = true;
        
        planesGroup.add(grid);
        planes.push(grid); // Store reference for dynamic updates
    } else if (i === 4) {
        // Plane 4: Override color to violet with ripple effect
        const plane4Color = 0x8a2be2; // BlueViolet / Violet
        const gridDivisions = 30; // More divisions for smoother ripples
        const halfSize = planeSize / 2;
        const step = planeSize / gridDivisions;
        
        // Helper function to calculate ripple height
        const getRippleHeight = (x, z, time) => {
            // Distance from center
            const dist = Math.sqrt(x * x + z * z);
            const maxDist = Math.sqrt(halfSize * halfSize + halfSize * halfSize);
            const normalizedDist = dist / maxDist;
            
            // Create ripple waves radiating from center
            const rippleSpeed = 0.5; // Speed of ripple animation
            const rippleFrequency = 3.0; // Number of ripple waves
            const rippleAmplitude = 0.15; // Height of ripples (subtle)
            
            // Multiple overlapping ripples for more complex pattern
            const ripple1 = Math.sin(dist * rippleFrequency - time * rippleSpeed) * rippleAmplitude;
            const ripple2 = Math.sin(dist * rippleFrequency * 1.5 - time * rippleSpeed * 1.2) * rippleAmplitude * 0.6;
            const ripple3 = Math.sin(dist * rippleFrequency * 0.7 - time * rippleSpeed * 0.8) * rippleAmplitude * 0.4;
            
            // Fade out ripples near edges
            const edgeFade = Math.max(0, 1 - normalizedDist * 1.2);
            
            return (ripple1 + ripple2 + ripple3) * edgeFade;
        };
        
        // Create mesh geometry with faces for ripple effect
        const meshGeometry = new THREE.PlaneGeometry(planeSize, planeSize, gridDivisions, gridDivisions);
        meshGeometry.rotateX(-Math.PI / 2);
        const meshPositions = meshGeometry.attributes.position;
        
        // Deform mesh geometry to initial ripple state
        for (let j = 0; j < meshPositions.count; j++) {
            const x = meshPositions.getX(j);
            const z = meshPositions.getZ(j);
            const y = getRippleHeight(x, z, 0);
            meshPositions.setY(j, y);
        }
        meshGeometry.computeVertexNormals();
        
        // Create material for the ripple mesh - fully transparent with just grid lines visible
        const meshMaterial = new THREE.MeshStandardMaterial({
            color: plane4Color,
            emissive: plane4Color,
            emissiveIntensity: 0.0,
            transparent: true,
            opacity: 0.0, // Fully transparent squares
            side: THREE.DoubleSide
        });
        
        // Create mesh - offset down so base stays at same level as flat planes
        const terrainMesh = new THREE.Mesh(meshGeometry, meshMaterial);
        terrainMesh.position.y = (i - 1) * spacing;
        terrainMesh.visible = false; // Hide mesh completely - only grid lines are visible
        
        // Create grid lines following ripple
        const gridGeometry = new THREE.BufferGeometry();
        const gridVertices = [];
        
        // Create vertical grid lines (along Z axis)
        for (let j = 0; j <= gridDivisions; j++) {
            const x = -halfSize + j * step;
            for (let k = 0; k < gridDivisions; k++) {
                const z1 = -halfSize + k * step;
                const z2 = -halfSize + (k + 1) * step;
                const y1 = getRippleHeight(x, z1, 0);
                const y2 = getRippleHeight(x, z2, 0);
                
                gridVertices.push(x, y1, z1);
                gridVertices.push(x, y2, z2);
            }
        }
        
        // Create horizontal grid lines (along X axis)
        for (let j = 0; j <= gridDivisions; j++) {
            const z = -halfSize + j * step;
            for (let k = 0; k < gridDivisions; k++) {
                const x1 = -halfSize + k * step;
                const x2 = -halfSize + (k + 1) * step;
                const y1 = getRippleHeight(x1, z, 0);
                const y2 = getRippleHeight(x2, z, 0);
                
                gridVertices.push(x1, y1, z);
                gridVertices.push(x2, y2, z);
            }
        }
        
        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridVertices, 3));
        gridGeometry.computeBoundingSphere();
        
        const gridLineMaterial = new THREE.LineBasicMaterial({
            color: plane4Color,
            transparent: true,
            opacity: 1.0 // Fully opaque violet grid lines
        });
        const gridLines = new THREE.LineSegments(gridGeometry, gridLineMaterial);
        gridLines.position.y = (i - 1) * spacing;
        
        // Create a group to hold both mesh and grid lines
        const grid = new THREE.Group();
        grid.add(terrainMesh);
        grid.add(gridLines);
        grid.position.y = 0; // Position handled by children
        
        // Store references for animation
        grid.userData.isRippling = true;
        grid.userData.meshGeometry = meshGeometry;
        grid.userData.gridGeometry = gridGeometry;
        grid.userData.terrainMesh = terrainMesh;
        grid.userData.gridLines = gridLines;
        grid.userData.getRippleHeight = getRippleHeight;
        grid.userData.gridDivisions = gridDivisions;
        grid.userData.halfSize = halfSize;
        grid.userData.step = step;
        
        // Create miniature lightning at top-right corner (same corner as rain on plane 3)
        const lightningGroup = new THREE.Group();
        const plane4HalfSize = planeSize / 2; // Calculate halfSize for plane 4
        const lightningCornerX = plane4HalfSize - 0.3; // Top-right corner X (same as rain)
        const lightningCornerZ = -plane4HalfSize + 0.3; // Top-right corner Z (same as rain)
        // Position lightning elastically between planes 3 and 4 (80% of the way from plane 3 to plane 4)
        const plane3Y = (3 - 1) * spacing;
        const plane4Y = (4 - 1) * spacing;
        const lightningPercentage = 0.8; // 80% of the way from plane 3 to plane 4 (ensures it's below plane 4)
        const lightningY = Math.min(plane3Y + (plane4Y - plane3Y) * lightningPercentage, plane4Y - 0.01); // Clamp to ensure it's always below plane 4
        
        // Create multiple lightning bolts for more dynamic effect
        // Scale lightning length proportionally with spacing (ratio = 0.48)
        const lightningLength = spacing * 0.48;
        const segments = 16; // More segments for longer, more jagged effect
        const boltCount = 3; // Multiple bolts for branching effect
        
        const lightningBolts = [];
        const lightningMaterials = [];
        
        for (let b = 0; b < boltCount; b++) {
            // Create a jagged lightning bolt using lines
            const lightningGeometry = new THREE.BufferGeometry();
            const lightningVertices = [];
            
            // Spread out starting positions around the corner area
            const spreadRadius = 1.2; // Spread radius around corner (increased for more spread)
            const startOffsetX = (Math.random() - 0.5) * spreadRadius;
            const startOffsetZ = (Math.random() - 0.5) * spreadRadius;
            const boltStartX = lightningCornerX + startOffsetX;
            const boltStartZ = lightningCornerZ + startOffsetZ;
            
            // Create jagged lightning path with chaotic variation
            for (let s = 0; s <= segments; s++) {
                const t = s / segments;
                // Much more dramatic and chaotic jitter
                const baseJitter = 0.4 + Math.random() * 0.3; // Variable base jitter
                const jitterAmount = baseJitter * (1 - t * 0.3); // More jitter throughout, less reduction
                // Add chaotic spikes and variations
                const spike = Math.random() < 0.3 ? (Math.random() - 0.5) * 0.5 : 0; // Random spikes
                const x = boltStartX + (Math.random() - 0.5) * jitterAmount + spike;
                const y = lightningY - t * lightningLength + (Math.random() - 0.5) * 0.1; // Add Y variation too
                const z = boltStartZ + (Math.random() - 0.5) * jitterAmount + spike;
                lightningVertices.push(x, y, z);
            }
            
            lightningGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lightningVertices, 3));
            
            const lightningMaterial = new THREE.LineBasicMaterial({
                color: b === 0 ? 0xffffff : 0xaaccff, // Main bolt white, branches bluish
                transparent: true,
                opacity: 0.0, // Start invisible
                linewidth: b === 0 ? 2 : 1 // Main bolt thicker
            });
            
            const lightningBolt = new THREE.Line(lightningGeometry, lightningMaterial);
            lightningGroup.add(lightningBolt);
            lightningBolts.push(lightningBolt);
            lightningMaterials.push(lightningMaterial);
        }
        
        lightningGroup.position.set(0, 0, 0); // Position handled by vertices
        
        // Store lightning data for animation
        grid.userData.lightningBolts = lightningBolts;
        grid.userData.lightningMaterials = lightningMaterials;
        grid.userData.lightningCornerX = lightningCornerX;
        grid.userData.lightningCornerZ = lightningCornerZ;
        grid.userData.lightningY = lightningY;
        grid.userData.lightningLength = lightningLength;
        grid.userData.lightningSegments = segments;
        grid.userData.lightningBoltCount = boltCount;
        grid.userData.lightningSpreadRadius = 1.2; // Spread radius for starting positions (increased for more spread)
        grid.userData.lightningFlashTime = 0; // Time remaining for current flash
        grid.userData.lightningFlashCount = 0; // Number of flashes in current burst
        grid.userData.lightningNextFlash = Math.random() * 1000 + 500; // Random delay 0.5-1.5 seconds
        
        planesGroup.add(lightningGroup);
        planesGroup.add(grid);
        planes.push(grid); // Store reference for dynamic updates
    } else {
        // All other planes: Create grids instead of solid planes
        // GridHelper is already horizontal (XZ plane), no rotation needed
        const grid = new THREE.GridHelper(planeSize, 20, planeColor, planeColor);
        grid.position.y = (i - 1) * spacing;
        
        // Make grid lines emissive/glowing
        grid.material.color.setHex(planeColor);
        grid.material.opacity = 0.8;
        grid.material.transparent = true;
        
        planesGroup.add(grid);
        planes.push(grid); // Store reference for dynamic updates
    }
}

scene.add(planesGroup);
planesGroup.userData.isPlanesGroup = true; // Mark for cloud animation reference

// Create 500 randomly placed stars (tiny white specs)
const starCount = 500;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
const starRand = new Float32Array(starCount);

// Center on Nucleus: Nucleus is at [0, 3.75, 0] in world space
// planesGroup is at (0, 0, 0) in world space, so stars need Y offset of 3.75 in planesGroup local space
const universeCenterY = 3.75; // Stars centered at (0, 3.75, 0) in planesGroup local space = (0, 3.75, 0) in world space

// Randomly position stars in a massive sphere around the scene, centered on the Nucleus
const starRadius = 2500; // Large enough to encompass entire view frustum at maximum zoom out (z=20, far plane=2000)
for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    // Random spherical coordinates for even distribution
    const theta = Math.random() * Math.PI * 2; // Azimuth angle (0 to 2π)
    const phi = Math.acos(2 * Math.random() - 1); // Polar angle (0 to π)
    // Fill the entire sphere from near center to edge - use uniform distribution in volume
    // For uniform volume distribution, use r^3, then take cube root
    const r = starRadius * Math.pow(Math.random(), 1/3); // Uniform distribution in volume from 0 to starRadius
    
    // Convert to Cartesian coordinates using standard spherical coordinates
    // Standard: x = r*sin(phi)*cos(theta), y = r*cos(phi), z = r*sin(phi)*sin(theta)
    // This centers the sphere at (0, 0, 0), then we offset Y to center on Nucleus
    starPositions[i3] = r * Math.sin(phi) * Math.cos(theta); // X
    starPositions[i3 + 1] = r * Math.cos(phi) + universeCenterY; // Y (offset to center on Nucleus)
    starPositions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta); // Z
    
    starRand[i] = Math.random();
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('random', new THREE.BufferAttribute(starRand, 1));

// Bright twinkling star material with shader
const starMaterial = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    uniforms: {
        uTime: { value: 0 }
    },
    vertexShader: `
        attribute float random;
        varying vec3 vPos;
        varying float vRandom;
        uniform float uTime;
        
        void main() {
            vPos = position;
            vRandom = random;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            // Twinkling size variation
            float twinkle = sin(uTime * 2.0 + random * 10.0) * 0.5 + 0.5;
            gl_PointSize = (8.0 + random * 12.0) * (0.7 + twinkle * 0.6);
        }
    `,
    fragmentShader: `
        varying vec3 vPos;
        varying float vRandom;
        uniform float uTime;
        
        float rand(vec2 co) {
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
            vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
            vec2 centre = uv - 0.5;
            
            // Bright white with subtle color variation
            vec3 rgb = vec3(
                rand(vPos.xy + uTime * 0.1),
                rand(vPos.xz + uTime * 0.15),
                rand(vPos.yz + uTime * 0.12)
            );
            
            // Bright white base with sparkle
            vec3 col = vec3(0.9) + rgb * 0.3; // Very bright
            float twinkle = sin(uTime * 3.0 + vRandom * 20.0) * 0.5 + 0.5;
            col *= (0.8 + twinkle * 0.4); // Twinkling brightness
            
            float a = smoothstep(0.7, 1.0, 1.0 - length(centre) * 2.0);
            gl_FragColor = vec4(col, a);
        }
    `
});

const stars = new THREE.Points(starGeometry, starMaterial);
planesGroup.add(stars); // Add to planesGroup so they rotate with the universe

// Create 100 stars inside the world, spread among the areas between planes
const innerStarCount = 100;
const innerStarGeometry = new THREE.BufferGeometry();
const innerStarPositions = new Float32Array(innerStarCount * 3);

// Spread stars between planes (from plane 0 to plane 4)
const minY = -2.5; // Below plane 0
const maxY = 7.5; // Above plane 4
const planeHalfSize = planeSize / 2; // 4

for (let i = 0; i < innerStarCount; i++) {
    const i3 = i * 3;
    // Random position within the plane boundaries
    innerStarPositions[i3] = (Math.random() - 0.5) * planeSize * 0.9; // X: slightly smaller than plane size
    innerStarPositions[i3 + 1] = minY + Math.random() * (maxY - minY); // Y: between planes
    innerStarPositions[i3 + 2] = (Math.random() - 0.5) * planeSize * 0.9; // Z: slightly smaller than plane size
}

innerStarGeometry.setAttribute('position', new THREE.BufferAttribute(innerStarPositions, 3));

// Same material as outer stars
const innerStars = new THREE.Points(innerStarGeometry, starMaterial);
planesGroup.add(innerStars); // Add to planesGroup so they rotate with the universe

// Initialize Scene Manager
const sceneManager = new SceneManager(scene, camera, renderer);

// Initialize Trading Game
const tradingGame = new TradingGame(sceneManager);
const tradingUI = new TradingUI();

// Initialize NPC Manager
const npcManager = new NPCManager(sceneManager, tradingGame, scene);

// Initialize Combat Manager
const combatManager = new CombatManager(sceneManager, npcManager, tradingGame, scene);

// Make managers available globally for UI updates
window.sceneManager = sceneManager;
window.npcManager = npcManager;
window.tradingGame = tradingGame;
window.combatManager = combatManager;

// Travel system state
let currentLocation = 'EARTH'; // Name of current location object (default to EARTH)
let travelState = {
    isTraveling: false,
    startTime: 0,
    duration: 20000, // 20 seconds in milliseconds
    startPos: null,
    endPos: null,
    spaceship: null,
    destinationName: null // Store destination name for completion
};

// Current infobox state for updating when frequency changes
let currentInfoBoxState = {
    objectName: null,
    isGreenlisted: null,
    content: null
};

// Create all scene objects
const m87Data = createAllObjects(sceneManager, spacing, planeSize, planesGroup);

// Generate environment map from scene for reflections
function generateEnvironmentMap() {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    
    // Temporarily hide cloud dummy meshes from environment map generation
    const cloudDummies = [];
    scene.traverse((child) => {
        if (child.userData && child.userData.isCloudDummy) {
            cloudDummies.push(child);
            child.visible = false;
        }
    });
    
    // Generate environment map from the scene
    const envMap = pmremGenerator.fromScene(scene, 0.04).texture;
    
    // Restore cloud dummy meshes
    cloudDummies.forEach(dummy => {
        dummy.visible = true;
    });
    
    // Apply environment map to all materials
    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(material => {
                if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                    material.envMap = envMap;
                    material.envMapIntensity = 1.0;
                    material.needsUpdate = true;
                }
            });
        }
    });
    
    return envMap;
}

// Generate environment map after initial scene setup
generateEnvironmentMap();

// Set up environment map regeneration callback for SceneManager
sceneManager.onEnvironmentUpdate = generateEnvironmentMap;

// Zoom control - smooth animation (declare before animate)

// Zoom control - smooth animation (declare before animate)
let targetZoom = 10; // Current zoom (value 5 = z = 10)
let currentZoom = 10;

// Camera Y position control - smooth animation
let targetY = 2; // Current Y position (value 5 = y = 2)
let currentY = 2;

// NPCs now advance simultaneously with player travel (no longer needed)

// Spacing control - smooth animation
let targetSpacing = 2.5; // Current spacing (value 5 = spacing 2.5)
let currentSpacing = 2.5;

// Rotation speed control
let rotationSpeed = 0.002; // Current rotation speed (value 5 = 0.002)

// Reduce rotation speed on mobile for better performance
if (isMobile) {
    rotationSpeed *= 0.5; // Half speed on mobile
}

// Animation loop with slow rotation and smooth zoom
let waveTime = 0;
// Celestial events system (shooting star, comet)
let celestialEventTimeout = null;
const nightContainer = document.getElementById('night-container');
const body = document.body;

function createShootingStar() {
    // Create a new shooting star element
    const star = document.createElement('div');
    star.className = 'shooting_star';
    
    // Random position (offset from center)
    const topOffset = (Math.random() * 400) - 200; // -200 to 200px
    const leftOffset = Math.random() * 300; // 0 to 300px
    
    star.style.top = `calc(50% - ${topOffset}px)`;
    star.style.left = `calc(50% - ${leftOffset}px)`;
    
    // Random opacity for variety
    const opacity = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
    star.style.opacity = opacity;
    
    nightContainer.appendChild(star);
    
    // Remove the star after animation completes (3 seconds)
    setTimeout(() => {
        if (star.parentNode) {
            star.parentNode.removeChild(star);
        }
    }, 3000);
    
    // Schedule next event
    scheduleNextCelestialEvent();
}

function createComet() {
    // Create a longer comet element
    const comet = document.createElement('div');
    comet.className = 'comet';
    
    // Random position (offset from center)
    const topOffset = (Math.random() * 400) - 200; // -200 to 200px
    const leftOffset = Math.random() * 300; // 0 to 300px
    
    comet.style.top = `calc(50% - ${topOffset}px)`;
    comet.style.left = `calc(50% - ${leftOffset}px)`;
    
    // Random opacity for variety
    const opacity = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
    comet.style.opacity = opacity;
    
    nightContainer.appendChild(comet);
    
    // Remove the comet after animation completes (5 seconds - longer than shooting star)
    setTimeout(() => {
        if (comet.parentNode) {
            comet.parentNode.removeChild(comet);
        }
    }, 5000);
    
    // Schedule next event
    scheduleNextCelestialEvent();
}

function scheduleNextCelestialEvent() {
    // Random delay between 70-120 seconds
    const minDelay = 70000; // 70 seconds
    const maxDelay = 120000; // 120 seconds
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    
    // Randomly choose one of two events (equal probability)
    const eventType = Math.floor(Math.random() * 2);
    
    celestialEventTimeout = setTimeout(() => {
        if (eventType === 0) {
            createShootingStar();
        } else {
            createComet();
        }
    }, delay);
}

// Start the celestial events system after a short initial delay
setTimeout(() => {
    scheduleNextCelestialEvent();
}, 5000); // First event after 5 seconds

// Sun-Nucleus eclipse system
let isEclipseActive = false;
let eclipseOverlay = null;

function checkSunNucleusAlignment() {
    // Find SUN object
    const sunObject = sceneManager.allObjects.find(obj => obj.name === 'SUN');
    
    if (!sunObject || !sunObject.position) {
        return false;
    }
    
    // Check if sun's center is passing through the middle (X position at 0)
    // Camera is at (0, 2, 10), so when sun's X is 0, it's opposite the camera
    const sunX = sunObject.position.x;
    const threshold = 0.1; // Small threshold for center detection
    
    // Check if sun crossed from one side to the other, passing through center
    if (typeof window.lastSunX === 'undefined') {
        window.lastSunX = sunX;
        return false;
    }
    
    // Check if sun's center crossed through X=0 (went from negative to positive or vice versa)
    // This ensures the center passes through, not just the edge
    const crossedCenter = (window.lastSunX < 0 && sunX >= 0) || 
                          (window.lastSunX > 0 && sunX <= 0);
    
    window.lastSunX = sunX;
    
    if (crossedCenter) {
        console.log('*** Sun center passed through middle! X=' + sunX.toFixed(2) + ' ***');
        return true;
    }
    
    return false;
}

function triggerSunEclipse() {
    if (isEclipseActive) {
        return; // Already in eclipse
    }
    
    console.log('=== ECLIPSE TRIGGERED ===');
    isEclipseActive = true;
    
    // Create eclipse overlay
    eclipseOverlay = document.createElement('div');
    eclipseOverlay.className = 'sun-eclipse-overlay';
    eclipseOverlay.style.position = 'fixed';
    eclipseOverlay.style.top = '0';
    eclipseOverlay.style.left = '0';
    eclipseOverlay.style.width = '100%';
    eclipseOverlay.style.height = '100%';
    eclipseOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0)';
    eclipseOverlay.style.pointerEvents = 'none';
    eclipseOverlay.style.zIndex = '9999';
    eclipseOverlay.style.transition = 'background-color 2.5s ease-in-out';
    
    if (!body) {
        console.error('body element not found!');
        isEclipseActive = false;
        return;
    }
    
    body.appendChild(eclipseOverlay);
    console.log('Eclipse overlay added to body');
    
    // Fade to white over 2.5 seconds
    setTimeout(() => {
        if (eclipseOverlay) {
            eclipseOverlay.style.transition = 'background-color 2.5s ease-in-out';
            eclipseOverlay.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            console.log('Eclipse fading to white');
        }
    }, 10);
    
    // Fade back to transparent over 2.5 seconds (starts at 2.5 seconds, completes at 5 seconds)
    setTimeout(() => {
        if (eclipseOverlay) {
            eclipseOverlay.style.transition = 'background-color 2.5s ease-in-out';
            eclipseOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0)';
            console.log('Eclipse fading back');
        }
    }, 2500);
    
    // Remove overlay and reset state after animation completes (5 seconds total)
    setTimeout(() => {
        if (eclipseOverlay && eclipseOverlay.parentNode) {
            eclipseOverlay.parentNode.removeChild(eclipseOverlay);
            eclipseOverlay = null;
            console.log('Eclipse overlay removed');
        }
        // Reset state after a small delay to prevent immediate re-trigger
        setTimeout(() => {
            isEclipseActive = false;
            console.log('Eclipse state reset');
        }, 100);
    }, 5000);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update star twinkling time
    if (starMaterial && starMaterial.uniforms) {
        starMaterial.uniforms.uTime.value += 0.016; // ~60fps
    }
    
    // Update M87 star motion - stars orbit around the black hole
    if (m87Data.m87Object && m87Data.m87Object.mesh && m87Data.particleOrbits.length > 0) {
        const geometry = m87Data.m87Object.mesh.geometry;
        const positions = geometry.attributes.position;
        const particleCount = positions.count;
        
        for (let i = 0; i < particleCount && i < m87Data.particleOrbits.length; i++) {
            const orbit = m87Data.particleOrbits[i];
            
            // Update orbital angles
            orbit.theta += orbit.thetaSpeed; // Rotate around Z axis (azimuth) - primary motion
            orbit.phi += orbit.phiSpeed * orbit.phiDirection; // Vary polar angle slightly
            
            // Keep phi in valid range [0, π] and reverse direction at boundaries
            if (orbit.phi < 0) {
                orbit.phi = 0;
                orbit.phiDirection = 1;
            } else if (orbit.phi > Math.PI) {
                orbit.phi = Math.PI;
                orbit.phiDirection = -1;
            }
            
            // Calculate new position using spherical coordinates matching createGlowingRegion
            // x = r*sin(phi)*cos(theta), y = r*sin(phi)*sin(theta), z = r*cos(phi)
            const x = orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta);
            const y = orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta);
            const z = orbit.radius * Math.cos(orbit.phi);
            
            // Update particle position (positions are relative to the object's center)
            positions.setX(i, x);
            positions.setY(i, y);
            positions.setZ(i, z);
        }
        
        // Mark positions as needing update
        positions.needsUpdate = true;
    }
    
    // Rotation speed controlled by pillstepper
    planesGroup.rotation.y += rotationSpeed;
    
    // Update terrain animation for plane 1 (mountain/hill effect)
    waveTime += 0.01;
    if (planes[1] && planes[1].userData.isRippled) {
        const grid = planes[1];
        const meshGeometry = grid.userData.meshGeometry;
        const gridGeometry = grid.userData.gridGeometry;
        const meshPositions = meshGeometry.attributes.position;
        const gridPositions = gridGeometry.attributes.position;
        const getTerrainHeight = grid.userData.getTerrainHeight;
        const gridDivisions = grid.userData.gridDivisions;
        const halfSize = grid.userData.halfSize;
        const step = grid.userData.step;
        
        // Update mesh geometry
        for (let j = 0; j < meshPositions.count; j++) {
            const x = meshPositions.getX(j);
            const z = meshPositions.getZ(j);
            const y = getTerrainHeight(x, z, waveTime);
            meshPositions.setY(j, y);
        }
        meshPositions.needsUpdate = true;
        meshGeometry.computeVertexNormals();
        
        // Update grid lines
        let vertexIndex = 0;
        
        // Update vertical grid lines
        for (let j = 0; j <= gridDivisions; j++) {
            const x = -halfSize + j * step;
            for (let k = 0; k < gridDivisions; k++) {
                const z1 = -halfSize + k * step;
                const z2 = -halfSize + (k + 1) * step;
                const y1 = getTerrainHeight(x, z1, waveTime);
                const y2 = getTerrainHeight(x, z2, waveTime);
                
                gridPositions.setXYZ(vertexIndex++, x, y1, z1);
                gridPositions.setXYZ(vertexIndex++, x, y2, z2);
            }
        }
        
        // Update horizontal grid lines
        for (let j = 0; j <= gridDivisions; j++) {
            const z = -halfSize + j * step;
            for (let k = 0; k < gridDivisions; k++) {
                const x1 = -halfSize + k * step;
                const x2 = -halfSize + (k + 1) * step;
                const y1 = getTerrainHeight(x1, z, waveTime);
                const y2 = getTerrainHeight(x2, z, waveTime);
                
                gridPositions.setXYZ(vertexIndex++, x1, y1, z);
                gridPositions.setXYZ(vertexIndex++, x2, y2, z);
            }
        }
        
        gridPositions.needsUpdate = true;
    }
    
    // Update terrain animation for plane 3 (subtle flicker/tweak)
    if (planes[3] && planes[3].userData.isFlickering) {
        const grid = planes[3];
        const meshGeometry = grid.userData.meshGeometry;
        const gridGeometry = grid.userData.gridGeometry;
        const meshPositions = meshGeometry.attributes.position;
        const gridPositions = gridGeometry.attributes.position;
        const getTerrainHeight = grid.userData.getTerrainHeight;
        const gridDivisions = grid.userData.gridDivisions;
        const halfSize = grid.userData.halfSize;
        const step = grid.userData.step;
        
        // Update mesh geometry
        for (let j = 0; j < meshPositions.count; j++) {
            const x = meshPositions.getX(j);
            const z = meshPositions.getZ(j);
            const y = getTerrainHeight(x, z, waveTime);
            meshPositions.setY(j, y);
        }
        meshPositions.needsUpdate = true;
        meshGeometry.computeVertexNormals();
        
        // Update grid lines
        let vertexIndex = 0;
        
        // Update vertical grid lines
        for (let j = 0; j <= gridDivisions; j++) {
            const x = -halfSize + j * step;
            for (let k = 0; k < gridDivisions; k++) {
                const z1 = -halfSize + k * step;
                const z2 = -halfSize + (k + 1) * step;
                const y1 = getTerrainHeight(x, z1, waveTime);
                const y2 = getTerrainHeight(x, z2, waveTime);
                
                gridPositions.setXYZ(vertexIndex++, x, y1, z1);
                gridPositions.setXYZ(vertexIndex++, x, y2, z2);
            }
        }
        
        // Update horizontal grid lines
        for (let j = 0; j <= gridDivisions; j++) {
            const z = -halfSize + j * step;
            for (let k = 0; k < gridDivisions; k++) {
                const x1 = -halfSize + k * step;
                const x2 = -halfSize + (k + 1) * step;
                const y1 = getTerrainHeight(x1, z, waveTime);
                const y2 = getTerrainHeight(x2, z, waveTime);
                
                gridPositions.setXYZ(vertexIndex++, x1, y1, z);
                gridPositions.setXYZ(vertexIndex++, x2, y2, z);
            }
        }
        
        gridPositions.needsUpdate = true;
        
        // Update water cascade particles
        if (grid.userData.waterParticles) {
            const waterParticles = grid.userData.waterParticles;
            const waterPositions = grid.userData.waterPositions;
            const waterVelocities = grid.userData.waterVelocities;
            const waterSizes = grid.userData.waterSizes;
            const waterActive = grid.userData.waterActive;
            const waterParticleCount = grid.userData.waterParticleCount;
            const cornerX = grid.userData.waterCornerX;
            const cornerZ = grid.userData.waterCornerZ;
            const edgeLength = grid.userData.waterEdgeLength;
            const gravity = grid.userData.waterGravity;
            const getTerrainHeight = grid.userData.getTerrainHeight;
            const spawnRate = grid.userData.spawnRate;
            
            // Continuous spawning from top edge - spawn multiple particles per frame for dense flow
            grid.userData.spawnTimer += 0.016; // ~60fps delta time approximation
            // Add randomness to spawn timing to break patterns
            const randomSpawnRate = spawnRate * (0.7 + Math.random() * 0.6); // Vary spawn rate ±30%
            const spawnsPerFrame = Math.floor(grid.userData.spawnTimer / randomSpawnRate); // Spawn multiple particles if needed
            
            for (let s = 0; s < spawnsPerFrame; s++) {
                // Find next inactive particle (only reuse particles that have finished falling)
                let spawnIndex = -1;
                const startIndex = grid.userData.nextSpawnIndex;
                for (let attempt = 0; attempt < waterParticleCount; attempt++) {
                    const checkIndex = (startIndex + attempt) % waterParticleCount;
                    if (!waterActive[checkIndex]) {
                        spawnIndex = checkIndex;
                        grid.userData.nextSpawnIndex = (checkIndex + 1) % waterParticleCount;
                        break;
                    }
                }
                
                // Skip spawning if no inactive particles available
                if (spawnIndex === -1) {
                    break; // All particles are active, wait for some to deactivate
                }
                
                const i3 = spawnIndex * 3;
                
                // Distribute along L-shape edge with more randomness
                let spawnX, spawnZ;
                // Randomly choose which edge, with slight bias toward alternating
                const edgeChoice = Math.random() < 0.55 ? (spawnIndex % 2 === 0) : (spawnIndex % 2 === 1);
                // Random position along edge with some clustering
                const edgePosition = Math.random() * edgeLength;
                
                if (edgeChoice) {
                    // Top edge: vary X, fixed Z with randomness
                    spawnX = cornerX - edgePosition + (Math.random() - 0.5) * 0.2;
                    spawnZ = cornerZ + (Math.random() - 0.5) * 0.15;
                } else {
                    // Right edge: fixed X with randomness, vary Z
                    spawnX = cornerX + (Math.random() - 0.5) * 0.15;
                    spawnZ = cornerZ + edgePosition + (Math.random() - 0.5) * 0.2;
                }
                
                // Add randomness to spawn height
                const spawnY = getTerrainHeight(spawnX, spawnZ, waveTime) + 0.05 + Math.random() * 0.15;
                
                waterPositions[i3] = spawnX;
                waterPositions[i3 + 1] = spawnY;
                waterPositions[i3 + 2] = spawnZ;
                
                // More varied initial velocities for chaotic flow
                const speedVariation = 0.5 + Math.random() * 0.5; // 50-100% of base speed
                waterVelocities[i3] = (Math.random() - 0.5) * 0.008 * speedVariation; // More horizontal variation
                waterVelocities[i3 + 1] = (-0.008 - Math.random() * 0.006) * speedVariation; // More vertical variation
                waterVelocities[i3 + 2] = (Math.random() - 0.5) * 0.008 * speedVariation; // More horizontal variation
                
                // Randomize particle size more
                waterSizes[spawnIndex] = 0.015 + Math.random() * 0.04;
                
                waterActive[spawnIndex] = 1; // Mark as active
            }
            
            // Reset timer after spawning with some randomness
            grid.userData.spawnTimer = grid.userData.spawnTimer % randomSpawnRate;
            
            // Calculate reset zone - extend waterfall much further down
            const plane3Y = (3 - 1) * currentSpacing - 0.4;
            const plane2Y = (2 - 1) * currentSpacing;
            const plane0Y = (0 - 1) * currentSpacing;
            const waterfallBottom = plane0Y - 2.0;
            const relativeBottom = waterfallBottom - plane3Y;
            const relativePlane2Y = plane2Y - plane3Y;
            
            // Fade zone: start fading early, completely fade out before reset
            const fadeStart = relativePlane2Y + 3.0;
            const completeFadeY = relativeBottom - 0.5;
            const fadeEnd = relativeBottom - 1.0;
            
            for (let i = 0; i < waterParticleCount; i++) {
                if (!waterActive[i]) continue; // Skip inactive particles
                
                const i3 = i * 3;
                const baseSize = waterSizes[i] || (0.02 + Math.random() * 0.03);
                
                // Update velocity with gravity (very slow) - add slight random turbulence
                const turbulence = (Math.random() - 0.5) * 0.0001; // Small random force
                waterVelocities[i3] += turbulence;
                waterVelocities[i3 + 1] += gravity + turbulence * 0.5;
                waterVelocities[i3 + 2] += turbulence;
                
                // Update position
                waterPositions[i3] += waterVelocities[i3];
                waterPositions[i3 + 1] += waterVelocities[i3 + 1];
                waterPositions[i3 + 2] += waterVelocities[i3 + 2];
                
                // Fade particles completely as they fall
                if (waterPositions[i3 + 1] < fadeStart) {
                    const fadeProgress = (fadeStart - waterPositions[i3 + 1]) / (fadeStart - completeFadeY);
                    const fadeAmount = Math.max(0, Math.min(1.0, 1.0 - fadeProgress));
                    waterSizes[i] = baseSize * fadeAmount;
                    
                    if (fadeAmount < 0.1) {
                        waterSizes[i] = 0;
                    }
                } else {
                    waterSizes[i] = baseSize;
                }
                
                // Deactivate particles when they reach bottom (they'll respawn naturally)
                if (waterPositions[i3 + 1] < fadeEnd) {
                    waterActive[i] = 0; // Deactivate - will be respawned by spawn system
                    waterSizes[i] = 0; // Make invisible
                }
            }
            
            // Update geometry
            waterParticles.geometry.attributes.position.needsUpdate = true;
            waterParticles.geometry.attributes.size.needsUpdate = true;
        }
    }
    
    // Update ripple animation for plane 4
    if (planes[4] && planes[4].userData.isRippling) {
        const grid = planes[4];
        const meshGeometry = grid.userData.meshGeometry;
        const gridGeometry = grid.userData.gridGeometry;
        const meshPositions = meshGeometry.attributes.position;
        const gridPositions = gridGeometry.attributes.position;
        const getRippleHeight = grid.userData.getRippleHeight;
        const gridDivisions = grid.userData.gridDivisions;
        const halfSize = grid.userData.halfSize;
        const step = grid.userData.step;
        
        // Update mesh geometry
        for (let j = 0; j < meshPositions.count; j++) {
            const x = meshPositions.getX(j);
            const z = meshPositions.getZ(j);
            const y = getRippleHeight(x, z, waveTime);
            meshPositions.setY(j, y);
        }
        meshPositions.needsUpdate = true;
        meshGeometry.computeVertexNormals();
        
        // Update grid lines
        let vertexIndex = 0;
        
        // Update vertical grid lines
        for (let j = 0; j <= gridDivisions; j++) {
            const x = -halfSize + j * step;
            for (let k = 0; k < gridDivisions; k++) {
                const z1 = -halfSize + k * step;
                const z2 = -halfSize + (k + 1) * step;
                const y1 = getRippleHeight(x, z1, waveTime);
                const y2 = getRippleHeight(x, z2, waveTime);
                
                gridPositions.setXYZ(vertexIndex++, x, y1, z1);
                gridPositions.setXYZ(vertexIndex++, x, y2, z2);
            }
        }
        
        // Update horizontal grid lines
        for (let j = 0; j <= gridDivisions; j++) {
            const z = -halfSize + j * step;
            for (let k = 0; k < gridDivisions; k++) {
                const x1 = -halfSize + k * step;
                const x2 = -halfSize + (k + 1) * step;
                const y1 = getRippleHeight(x1, z, waveTime);
                const y2 = getRippleHeight(x2, z, waveTime);
                
                gridPositions.setXYZ(vertexIndex++, x1, y1, z);
                gridPositions.setXYZ(vertexIndex++, x2, y2, z);
            }
        }
        
        gridPositions.needsUpdate = true;
    }
    
    // Update lightning on plane 4 (area 4a)
    if (planes[4] && planes[4].userData.lightningBolts) {
        const grid = planes[4];
        const lightningBolts = grid.userData.lightningBolts;
        const lightningMaterials = grid.userData.lightningMaterials;
        const lightningCornerX = grid.userData.lightningCornerX;
        const lightningCornerZ = grid.userData.lightningCornerZ;
        // Position lightning elastically between planes 3 and 4 (80% of the way from plane 3 to plane 4)
        const plane3Y = (3 - 1) * currentSpacing;
        const plane4Y = (4 - 1) * currentSpacing;
        const lightningPercentage = 0.8; // 80% of the way from plane 3 to plane 4 (ensures it's below plane 4)
        const lightningY = Math.min(plane3Y + (plane4Y - plane3Y) * lightningPercentage, plane4Y - 0.01); // Clamp to ensure it's always below plane 4
        // Scale lightning length proportionally with spacing (original: 1.2 at spacing 2.5, ratio = 0.48)
        const lightningLength = currentSpacing * 0.48;
        const segments = grid.userData.lightningSegments;
        const boltCount = grid.userData.lightningBoltCount;
        
        // Update lightning flash timing
        if (grid.userData.lightningFlashTime > 0) {
            // Lightning is flashing
            grid.userData.lightningFlashTime -= 16; // ~60fps, decrease by ~16ms per frame
            
            // Multiple quick flashes for dynamic effect
            const flashDuration = 30 + Math.random() * 20; // 30-50ms per flash
            const flashProgress = grid.userData.lightningFlashTime / flashDuration;
            
            // Much more chaotic flickering effect
            const baseOpacity = Math.max(0, flashProgress);
            const flicker = Math.random() * 0.6; // More dramatic random flicker
            const chaosFlicker = Math.random() < 0.3 ? Math.random() * 0.8 : 0; // Occasional dramatic spikes
            
            for (let b = 0; b < boltCount; b++) {
                // Each bolt flickers independently for more chaos
                const boltFlicker = Math.random() * 0.4;
                const opacity = Math.min(1.0, baseOpacity + flicker + chaosFlicker + boltFlicker);
                lightningMaterials[b].opacity = opacity;
            }
            
            if (grid.userData.lightningFlashTime <= 0) {
                // Flash ended, check if more flashes in burst
                grid.userData.lightningFlashCount++;
                
                if (grid.userData.lightningFlashCount < 2 + Math.floor(Math.random() * 3)) {
                    // Continue burst with quick flash
                    grid.userData.lightningFlashTime = flashDuration;
                    // Regenerate paths for each bolt with spread starting positions
                    const spreadRadius = grid.userData.lightningSpreadRadius;
                    for (let b = 0; b < boltCount; b++) {
                        const positions = lightningBolts[b].geometry.attributes.position;
                        // Spread out starting positions around corner
                        const startOffsetX = (Math.random() - 0.5) * spreadRadius;
                        const startOffsetZ = (Math.random() - 0.5) * spreadRadius;
                        const boltStartX = lightningCornerX + startOffsetX;
                        const boltStartZ = lightningCornerZ + startOffsetZ;
                        
                        for (let s = 0; s <= segments; s++) {
                            const t = s / segments;
                            const i3 = s * 3;
                            // Much more chaotic jitter with spikes
                            const baseJitter = 0.5 + Math.random() * 0.4; // Variable chaotic jitter
                            const jitterAmount = baseJitter * (1 - t * 0.4);
                            const spike = Math.random() < 0.4 ? (Math.random() - 0.5) * 0.6 : 0; // More frequent spikes
                            const x = boltStartX + (Math.random() - 0.5) * jitterAmount + spike;
                            const y = lightningY - t * lightningLength + (Math.random() - 0.5) * 0.15; // Y variation
                            const z = boltStartZ + (Math.random() - 0.5) * jitterAmount + spike;
                            positions.setXYZ(i3, x, y, z);
                        }
                        positions.needsUpdate = true;
                    }
                } else {
                    // Burst ended, schedule next one
                    for (let b = 0; b < boltCount; b++) {
                        lightningMaterials[b].opacity = 0.0;
                    }
                    grid.userData.lightningFlashCount = 0;
                    grid.userData.lightningNextFlash = Math.random() * 1000 + 500; // Random delay 0.5-1.5 seconds
                }
            }
        } else {
            // Countdown to next flash
            grid.userData.lightningNextFlash -= 16; // ~60fps
            
            if (grid.userData.lightningNextFlash <= 0) {
                // Time to flash!
                const flashDuration = 30 + Math.random() * 20; // 30-50ms per flash
                grid.userData.lightningFlashTime = flashDuration;
                grid.userData.lightningFlashCount = 0;
                
                // Regenerate jagged lightning paths with more variation and spread starting positions
                const spreadRadius = grid.userData.lightningSpreadRadius;
                for (let b = 0; b < boltCount; b++) {
                    const positions = lightningBolts[b].geometry.attributes.position;
                    // Spread out starting positions around corner
                    const startOffsetX = (Math.random() - 0.5) * spreadRadius;
                    const startOffsetZ = (Math.random() - 0.5) * spreadRadius;
                    const boltStartX = lightningCornerX + startOffsetX;
                    const boltStartZ = lightningCornerZ + startOffsetZ;
                    
                    for (let s = 0; s <= segments; s++) {
                        const t = s / segments;
                        const i3 = s * 3;
                        // Much more chaotic jitter with dramatic spikes
                        const baseJitter = 0.6 + Math.random() * 0.5; // Very variable chaotic jitter
                        const jitterAmount = baseJitter * (1 - t * 0.3); // More jitter throughout
                        const spike = Math.random() < 0.5 ? (Math.random() - 0.5) * 0.8 : 0; // Frequent dramatic spikes
                        const x = boltStartX + (Math.random() - 0.5) * jitterAmount + spike;
                        const y = lightningY - t * lightningLength + (Math.random() - 0.5) * 0.2; // More Y variation
                        const z = boltStartZ + (Math.random() - 0.5) * jitterAmount + spike;
                        positions.setXYZ(i3, x, y, z);
                    }
                    positions.needsUpdate = true;
                    lightningMaterials[b].opacity = 1.0;
                }
            }
        }
        
        // Update lightning paths continuously as spacing changes - scale Y positions smoothly
        const oldLightningY = grid.userData.lightningY || lightningY;
        const oldLightningLength = grid.userData.lightningLength || lightningLength;
        
        // Always update Y positions to scale with spacing (smooth interpolation)
        if (Math.abs(oldLightningY - lightningY) > 0.001 || Math.abs(oldLightningLength - lightningLength) > 0.001) {
            // Scale existing lightning paths proportionally instead of regenerating
            const yScale = lightningLength / oldLightningLength;
            const yOffset = lightningY - oldLightningY;
            
            for (let b = 0; b < boltCount; b++) {
                const positions = lightningBolts[b].geometry.attributes.position;
                for (let s = 0; s <= segments; s++) {
                    const i3 = s * 3;
                    const currentX = positions.getX(i3);
                    const currentY = positions.getY(i3);
                    const currentZ = positions.getZ(i3);
                    
                    // Calculate relative position from old lightning Y (0 = top, 1 = bottom)
                    const relativePos = oldLightningLength > 0 ? (oldLightningY - currentY) / oldLightningLength : 0;
                    // Scale to new length and position
                    const newY = lightningY - relativePos * lightningLength;
                    
                    positions.setXYZ(i3, currentX, newY, currentZ);
                }
                positions.needsUpdate = true;
            }
            
            grid.userData.lightningY = lightningY;
            grid.userData.lightningLength = lightningLength;
        }
    }
    
    // Smooth zoom interpolation
    const zoomSpeed = 0.1; // Adjust for faster/slower zoom
    currentZoom += (targetZoom - currentZoom) * zoomSpeed;
    camera.position.z = currentZoom;
    
    // Smooth Y position interpolation
    const ySpeed = 0.1;
    currentY += (targetY - currentY) * ySpeed;
    camera.position.y = currentY;
    
    // Smooth spacing interpolation and update plane positions
    const spacingSpeed = 0.1;
    currentSpacing += (targetSpacing - currentSpacing) * spacingSpeed;
    if (Math.abs(currentSpacing - targetSpacing) > 0.01) {
        // Update plane positions when spacing changes
        for (let i = 0; i < planes.length; i++) {
            if (i === 1) {
                // Plane 1: terrain mesh and grid lines have their own positions
                const grid = planes[i];
                if (grid.userData.terrainMesh) {
                    grid.userData.terrainMesh.position.y = (i - 1) * currentSpacing - 0.5;
                }
                if (grid.userData.gridLines) {
                    grid.userData.gridLines.position.y = (i - 1) * currentSpacing - 0.5;
                }
            } else if (i === 3) {
                // Plane 3: terrain mesh and grid lines have their own positions
                const grid = planes[i];
                if (grid.userData.terrainMesh) {
                    grid.userData.terrainMesh.position.y = (i - 1) * currentSpacing - 0.4;
                }
                if (grid.userData.gridLines) {
                    grid.userData.gridLines.position.y = (i - 1) * currentSpacing - 0.4;
                }
                // Update water particles position too
                if (grid.userData.waterParticles) {
                    grid.userData.waterParticles.position.y = (i - 1) * currentSpacing - 0.4;
                }
            } else if (i === 4) {
                // Plane 4: ripple mesh and grid lines have their own positions
                const grid = planes[i];
                if (grid.userData.terrainMesh) {
                    grid.userData.terrainMesh.position.y = (i - 1) * currentSpacing;
                }
                if (grid.userData.gridLines) {
                    grid.userData.gridLines.position.y = (i - 1) * currentSpacing;
                }
            } else {
                // Regular planes: update group position directly
                planes[i].position.y = (i - 1) * currentSpacing;
            }
        }
        
        // Update bound objects (relative and elastic)
        sceneManager.updateBoundObjects(currentSpacing);
    }
    
    // Update scene objects (for leader line recalculation)
    sceneManager.update();
    
    // Check for sun-nucleus alignment and trigger eclipse
    const isAligned = checkSunNucleusAlignment();
    if (isAligned) {
        console.log('Calling triggerSunEclipse()');
        triggerSunEclipse();
    }
    
    // Update Mercury explore panel if open (throttled to every 500ms)
    if (currentLocation && currentLocation.toUpperCase() === 'MERCURY') {
        const explorePanelEl = document.getElementById('explore-panel');
        if (explorePanelEl && explorePanelEl.classList.contains('open')) {
            if (!window.lastMercuryUpdate || performance.now() - window.lastMercuryUpdate > 500) {
                window.lastMercuryUpdate = performance.now();
                renderExploreContent();
            }
        }
    }
    
    // Update travel animation
    if (travelState.isTraveling && travelState.spaceship) {
        const elapsed = performance.now() - travelState.startTime;
        const progress = Math.min(elapsed / travelState.duration, 1);
        
        // Get current world position of destination (accounts for rotation)
        const currentEndPos = new THREE.Vector3();
        const destinationObj = sceneManager.allObjects.find(obj => obj.name === travelState.destinationName);
        if (destinationObj && destinationObj.mesh) {
            destinationObj.mesh.getWorldPosition(currentEndPos);
        } else if (destinationObj) {
            currentEndPos.copy(destinationObj.position);
            if (destinationObj.planesGroup) {
                destinationObj.planesGroup.localToWorld(currentEndPos);
            }
        } else {
            currentEndPos.copy(travelState.endPos);
        }
        
        // Use smooth easing (ease-in-out)
        const easedProgress = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        // Interpolate position from start to current destination position
        // This accounts for rotation during travel
        travelState.spaceship.position.lerpVectors(
            travelState.startPos,
            currentEndPos,
            easedProgress
        );
        
        // Debug log every second
        if (Math.floor(elapsed / 1000) !== Math.floor((elapsed - 16) / 1000)) {
            console.log(`Travel progress: ${(progress * 100).toFixed(1)}%`, 'Position:', travelState.spaceship.position, 'Target:', currentEndPos);
        }
        
        // Check if travel is complete
        if (progress >= 1) {
            // Get fresh world position of destination in case it moved during travel
            const finalEndPos = new THREE.Vector3();
            const destinationObj = sceneManager.allObjects.find(obj => obj.name === travelState.destinationName);
            if (destinationObj && destinationObj.mesh) {
                destinationObj.mesh.getWorldPosition(finalEndPos);
            } else if (destinationObj) {
                finalEndPos.copy(destinationObj.position);
                if (destinationObj.planesGroup) {
                    destinationObj.planesGroup.localToWorld(finalEndPos);
                }
            } else {
                finalEndPos.copy(travelState.endPos);
            }
            
            // Ensure spaceship ends exactly at current destination position
            travelState.spaceship.position.set(
                finalEndPos.x,
                finalEndPos.y,
                finalEndPos.z
            );
            
            travelState.isTraveling = false;

            // NPCs already advanced when travel started - no need to advance again
            const destinationName = travelState.destinationName;
            
            // Hide travel indicator
            const travelIndicator = document.getElementById('travel-indicator');
            if (travelIndicator) {
                travelIndicator.classList.remove('show');
            }
            
            // Advance player turn (this is when the turn actually advances for everyone)
            if (tradingGame) {
                if (!travelState.isGetaway) {
                    const fuelCost = tradingGame.getFuelCost(destinationName);
                    tradingGame.consumeFuel(fuelCost);
                    tradingGame.advanceTurn(destinationName);

                    // Advance combat manager turn (regenerate NPC powers)
                    if (window.combatManager) {
                        window.combatManager.advanceTurn();
                    }

                    // NPC advancement now happens in the animation loop after travel completes
                } else {
                    // Getaway travel - consume fuel but skip turn advancement
                    console.log('🏃 Getaway travel - consuming fuel but skipping turn advancement!');
                    const fuelCost = tradingGame.getFuelCost(destinationName);
                    tradingGame.consumeFuel(fuelCost);
                    // Location already updated at travel start for getaway
                }
            }

            // Update explore panel to show new commodities/prices after turn advancement
            // (skip for getaway travels since no turn advancement occurred)
            if (window.updateExplorePanel && !travelState.isGetaway) {
                window.updateExplorePanel();
            }

            currentLocation = destinationName; // Update current location

            // Update trading game current location (skip for getaway - already updated)
            if (tradingGame && !travelState.isGetaway) {
                tradingGame.currentLocation = destinationName;
            }

            // Check for NPC encounters at the new location
            npcManager.checkForPlayerArrivalEncounter(destinationName);
            
            // Hide spaceship immediately
            if (travelState.spaceship) {
                travelState.spaceship.visible = false;
                // Remove from scene after hiding
                setTimeout(() => {
                    if (travelState.spaceship && travelState.spaceship.parent) {
                        travelState.spaceship.parent.remove(travelState.spaceship);
                    }
                }, 1000);
            }
            
            // Clear travel state
            travelState.spaceship = null;
            travelState.destinationName = null;
            
            // Update explore panel when landing
            updateExplorePanel();
            
            // Refresh inventory to update light status if needed
            if (window.renderInventory) {
                window.renderInventory();
            }
            
            console.log(`Travel complete! Arrived at ${destinationName}`);
            
            // Re-enable travel button (will be updated when info box is shown)
            const travelButton = document.getElementById('travel-button');
            if (travelButton) {
                travelButton.disabled = false;
            }
        }
    }

    // NPCs are now advanced when player travel starts (simultaneous movement)

    // Update NPC travel animations
    npcManager.updateTravelAnimations();

    // Update combat system
    if (window.combatManager) {
        window.combatManager.update();

        // Check for defend mode triggers (agro NPCs at player location)
        window.combatManager.checkForDefendModeTriggers();
    }

    renderer.render(scene, camera);
}

// Intro screen logic
function initIntroScreen() {
    const introOverlay = document.getElementById('intro-overlay');

    // Show intro screen initially
    introOverlay.classList.remove('hidden');

    // Hide intro screen after 2 seconds or on any key press/click
    let introTimeout = setTimeout(() => {
        hideIntroScreen();
    }, 2000);

    // Hide on any user interaction
    const hideIntroOnInteraction = () => {
        clearTimeout(introTimeout);
        hideIntroScreen();
    };

    document.addEventListener('keydown', hideIntroOnInteraction, { once: true });
    document.addEventListener('click', hideIntroOnInteraction, { once: true });
    document.addEventListener('touchstart', hideIntroOnInteraction, { once: true });

    function hideIntroScreen() {
        introOverlay.classList.add('hidden');
        // Remove event listeners
        document.removeEventListener('keydown', hideIntroOnInteraction);
        document.removeEventListener('click', hideIntroOnInteraction);
        document.removeEventListener('touchstart', hideIntroOnInteraction);
    }
}

// Initialize intro screen
initIntroScreen();

animate();

// Initialize steppers array early (will be populated later when pillsteppers are created)
let steppers = [];
window.steppers = steppers;

// Helper function to check if an object is on the current greenlist
// (considers frequency for Mercury - only greenlisted at frequency 6)
// (considers frequency 7 for outer planets - unlocks earth, moon, mars, venus, mercury, saturn, jupiter, neptune, uranus, pluto)
// (Black Cube is permanently greenlisted once Saturn Worshipper achievement is earned)
function isOnCurrentGreenlist(objectName, baseIsGreenlisted) {
    // Check frequency pillstepper
    let frequencyValue = 5; // Default to 5
    if (steppers && steppers[4]) {
        frequencyValue = steppers[4].getValue();
    }
    
    // Black Cube is permanently greenlisted once Saturn Worshipper achievement is earned
    // BUT removed if Archangel achievement is earned (mutual exclusion)
    if (objectName && objectName.toLowerCase() === 'black cube') {
        if (localStorage.getItem('blackCubeRemoved') === 'true') {
            return false; // Permanently removed due to Archangel path
        }
        if (window.scoreManager && window.scoreManager.hasAchievement('Saturn Worshipper')) {
            return true;
        }
    }

    // Anja is removed if Pedophile achievement is earned (mutual exclusion)
    if (objectName && objectName.toLowerCase() === 'anja') {
        if (localStorage.getItem('anjaRemoved') === 'true') {
            return false; // Permanently removed due to Pedophile path
        }
    }
    
    // Mercury is only greenlisted at frequency 6
    if (objectName && objectName.toLowerCase() === 'mercury') {
        return frequencyValue === 6;
    }

    // At frequency 3, unlock supernova
    if (frequencyValue === 3) {
        if (objectName && objectName.toLowerCase() === 'supernova') {
            return true;
        }
    }

    // At frequency 7, unlock outer planets: earth, moon, mars, venus, mercury, saturn, jupiter, neptune, uranus, pluto
    if (frequencyValue === 7) {
        const outerPlanets = ['earth', 'moon', 'mars', 'venus', 'mercury', 'saturn', 'jupiter', 'neptune', 'uranus', 'pluto'];
        if (objectName && outerPlanets.includes(objectName.toLowerCase())) {
            return true;
        }
    }

    // At frequency 8, unlock outer planets plus galaxies: milky way, andromeda, large magellanic cloud
    if (frequencyValue === 8) {
        const outerPlanets = ['earth', 'moon', 'mars', 'venus', 'mercury', 'saturn', 'jupiter', 'neptune', 'uranus', 'pluto'];
        const freq8Galaxies = ['milky way', 'andromeda', 'large magellanic cloud'];
        if (objectName && (outerPlanets.includes(objectName.toLowerCase()) || freq8Galaxies.includes(objectName.toLowerCase()))) {
            return true;
        }
    }

    // At frequency 2, unlock ONLY Atlantis (exclusive)
    if (frequencyValue === 2) {
        if (objectName && objectName.toLowerCase() === 'atlantis') {
            return true;
        }
        // Frequency 2 is exclusive - nothing else is greenlisted
        return false;
    }

    // At frequency 9, unlock ONLY station (exclusive)
    if (frequencyValue === 9) {
        if (objectName && objectName.toLowerCase() === 'station') {
            return true;
        }
        // Frequency 9 is exclusive - nothing else is greenlisted
        return false;
    }

    // At frequency 10, unlock ONLY monolith (exclusive)
    if (frequencyValue === 10) {
        if (objectName && objectName.toLowerCase() === 'monolith') {
            return true;
        }
        // Frequency 10 is exclusive - nothing else is greenlisted
        return false;
    }

    // FTL Drive unlocks advanced cosmic locations
    if (window.inventoryManager && window.inventoryManager.hasItem('ftl', 1)) {
        const ftlLocations = ['gaia bh1', 'zeta reticuli', 'messier 87'];
        if (objectName && ftlLocations.includes(objectName.toLowerCase())) {
            return true;
        }
    }

    // Anja is greenlisted once Jupiter name is entered
    if (objectName && objectName.toLowerCase() === 'anja') {
        if (localStorage.getItem('jupiterNameEntered')) {
            return true;
        }
    }

    // Pleiades is permanently greenlisted after first Pleiadian encounter
    if (objectName && objectName.toLowerCase() === 'pleiades') {
        const pleiadesGreenlisted = localStorage.getItem('pleiadesGreenlisted');
        console.log('🟢 Greenlist check for Pleiades:', objectName, 'pleiadesGreenlisted:', pleiadesGreenlisted);
        if (pleiadesGreenlisted === 'true') {
            console.log('🟢 Pleiades is greenlisted!');
            return true;
        }
    }

    // Check for planets removed from greenlist due to agro mode
    if (objectName) {
        const removedFromGreenlist = localStorage.getItem(`${objectName}_removed_from_greenlist`) === 'true';
        if (removedFromGreenlist) {
            console.log(`🚫 ${objectName} permanently removed from greenlist due to agro mode`);
            return false;
        }
    }

    // For all other objects, use their base greenlist status
    return baseIsGreenlisted;
}

// Show info box with content
function showInfoBox(content, objectName, isGreenlisted) {
    // Don't show infoboxes while traveling
    if (travelState.isTraveling) {
        return;
    }

    // Store current infobox state for updating when frequency changes
    currentInfoBoxState.objectName = objectName;
    currentInfoBoxState.isGreenlisted = isGreenlisted;
    currentInfoBoxState.content = content;
    
    const infoBox = document.getElementById('object-info-box');
    const contentDiv = document.getElementById('info-box-content');
    const travelButton = document.getElementById('travel-button');

    // Close any open panels
    const controlPanelEl = document.getElementById('control-panel');
    const inventoryPanelEl = document.getElementById('inventory-panel');
    const explorePanelEl = document.getElementById('explore-panel');
    const panelToggleEl = document.getElementById('panel-toggle');
    const inventoryToggleEl = document.getElementById('inventory-toggle');
    const exploreToggleEl = document.getElementById('explore-toggle');
    
    // Show all toggle buttons
    if (panelToggleEl) panelToggleEl.classList.remove('hidden');
    if (inventoryToggleEl) inventoryToggleEl.classList.remove('hidden');
    if (exploreToggleEl) exploreToggleEl.classList.remove('hidden');
    
    // Close any open panels
    if (controlPanelEl && controlPanelEl.classList.contains('open')) {
        controlPanelEl.classList.remove('open');
    }
    if (inventoryPanelEl && inventoryPanelEl.classList.contains('open')) {
        inventoryPanelEl.classList.remove('open');
    }
    if (explorePanelEl && explorePanelEl.classList.contains('open')) {
        explorePanelEl.classList.remove('open');
    }

    if (infoBox && contentDiv) {
        // Use innerHTML to support HTML formatting (like red text for Elon in Mars)
        // Replace newlines with <br> tags for proper formatting
        const formattedContent = content.replace(/\n/g, '<br>');
        contentDiv.innerHTML = formattedContent;
        infoBox.classList.add('show');

        // Show travel button for all objects, but disable if not greenlisted or if it's the current location
        // Hide travel button for Crown and Root
        const isCrownOrRoot = objectName && (objectName.toUpperCase() === 'CROWN' || objectName.toUpperCase() === 'ROOT');
        travelButton.style.display = isCrownOrRoot ? 'none' : 'block';
        const displayName = objectName.toUpperCase();
        travelButton.textContent = `VISIT ${displayName}`;

        // Enable/disable based on greenlist, current location, and fuel
        // Use case-insensitive comparison for current location check
        const isCurrentLocation = currentLocation && objectName && 
            currentLocation.toLowerCase() === objectName.toLowerCase();
        const hasFuel = tradingGame ? tradingGame.canTravelTo(objectName) : true;
        
        // Check if object is on the current greenlist (uses same logic as explore panel)
        const isActuallyGreenlisted = isOnCurrentGreenlist(objectName, isGreenlisted);
        
        // Disable button if not greenlisted, is current location, or doesn't have fuel
        travelButton.disabled = !isActuallyGreenlisted || isCurrentLocation || !hasFuel;

        if (!travelButton.disabled) {
            travelButton.onclick = () => startTravel(objectName);
        } else {
            travelButton.onclick = null;
        }
    }
}

// Update currently open infobox when frequency changes
function updateCurrentInfoBox() {
    const infoBox = document.getElementById('object-info-box');

    // Only update if infobox is currently open and has stored state
    if (infoBox && infoBox.classList.contains('show') &&
        currentInfoBoxState.objectName && currentInfoBoxState.content !== null) {

        // Re-run showInfoBox with the stored content and object info
        // This will refresh the visit availability based on new frequency
        showInfoBox(currentInfoBoxState.content, currentInfoBoxState.objectName, currentInfoBoxState.isGreenlisted);
    }
}

// Hide info box
function hideInfoBox() {
    const infoBox = document.getElementById('object-info-box');
    if (infoBox) {
        infoBox.classList.remove('show');
        // Clear any error messages
        const errorElement = infoBox.querySelector('.travel-error');
        if (errorElement) {
            errorElement.remove();
        }
        // Clear current infobox state
        currentInfoBoxState.objectName = null;
        currentInfoBoxState.isGreenlisted = null;
        currentInfoBoxState.content = null;
    }
}

// Show travel error message in info box
function showTravelError(message) {
    const infoBox = document.getElementById('object-info-box');
    if (!infoBox) return;
    
    // Remove any existing error
    const existingError = infoBox.querySelector('.travel-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'travel-error';
    errorElement.textContent = message;
    errorElement.style.fontFamily = 'var(--font-primary)';
    errorElement.style.fontSize = '0.75rem';
    errorElement.style.color = 'rgba(255, 100, 100, 0.9)';
    errorElement.style.padding = '0.5rem';
    errorElement.style.marginTop = '0.5rem';
    errorElement.style.backgroundColor = 'rgba(255, 100, 100, 0.1)';
    errorElement.style.border = '1px solid rgba(255, 100, 100, 0.3)';
    errorElement.style.borderRadius = '4px';
    errorElement.style.opacity = '0';
    errorElement.style.transition = 'opacity 0.2s';
    
    // Insert error before travel button
    const travelButton = document.getElementById('travel-button');
    if (travelButton && travelButton.parentElement) {
        travelButton.parentElement.insertBefore(errorElement, travelButton);
    } else {
        infoBox.appendChild(errorElement);
    }
    
    // Ensure info box is visible
    infoBox.classList.add('show');
    
    // Fade in
    setTimeout(() => {
        errorElement.style.opacity = '1';
    }, 10);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        errorElement.style.opacity = '0';
        setTimeout(() => {
            if (errorElement.parentElement) {
                errorElement.remove();
            }
        }, 200);
    }, 5000);
}

// Create spaceship sprite
function createSpaceship() {
    // Check if player has FTL for upgraded spaceship design
    const hasFTL = window.inventoryManager && window.inventoryManager.hasItem('ftl', 1);

    // Create spaceship sprite using canvas (to avoid CORS issues)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const centerX = 128;
    const centerY = 128;

    if (hasFTL) {
        // FTL-Equipped Spaceship: Advanced sleek design with energy effects
        ctx.clearRect(0, 0, 256, 256);

        // Main hull (sleek arrowhead shape)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 60); // Nose
        ctx.lineTo(centerX - 40, centerY + 20); // Left wing
        ctx.lineTo(centerX - 20, centerY + 40); // Left tail
        ctx.lineTo(centerX + 20, centerY + 40); // Right tail
        ctx.lineTo(centerX + 40, centerY + 20); // Right wing
        ctx.closePath();
        ctx.fill();

        // Metallic gradient overlay
        const hullGradient = ctx.createLinearGradient(centerX - 40, centerY - 60, centerX + 40, centerY + 40);
        hullGradient.addColorStop(0, 'rgba(200, 220, 255, 0.8)');
        hullGradient.addColorStop(0.5, 'rgba(150, 180, 255, 0.6)');
        hullGradient.addColorStop(1, 'rgba(100, 140, 255, 0.4)');
        ctx.fillStyle = hullGradient;
        ctx.fill();

        // Energy core (glowing blue center)
        const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 25);
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.5, '#4d9de0');
        coreGradient.addColorStop(1, 'rgba(77, 157, 224, 0)');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
        ctx.fill();

        // FTL drive rings (concentric energy rings)
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
        ctx.lineWidth = 3;
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, 15 + i * 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Warp field effect (subtle energy distortion)
        ctx.fillStyle = 'rgba(150, 220, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 60, 30, 0, 0, Math.PI * 2);
        ctx.fill();

        // Navigation lights (pulsing effect simulated with opacity)
        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
        ctx.beginPath();
        ctx.arc(centerX - 35, centerY + 15, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(100, 255, 100, 0.9)';
        ctx.beginPath();
        ctx.arc(centerX + 35, centerY + 15, 3, 0, Math.PI * 2);
        ctx.fill();

    } else {
        // Standard Spaceship: Classic UFO design
        // Bottom dome (main body)
        const gradient1 = ctx.createRadialGradient(centerX, centerY - 20, 0, centerX, centerY - 20, 80);
        gradient1.addColorStop(0, '#ffffff');
        gradient1.addColorStop(0.5, '#cccccc');
        gradient1.addColorStop(1, '#888888');
        ctx.fillStyle = gradient1;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 20, 80, 40, 0, 0, Math.PI * 2);
        ctx.fill();

        // Top dome (cockpit)
        const gradient2 = ctx.createRadialGradient(centerX, centerY - 40, 0, centerX, centerY - 40, 50);
        gradient2.addColorStop(0, '#ffffff');
        gradient2.addColorStop(0.6, '#aaaaaa');
        gradient2.addColorStop(1, '#666666');
        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 20, 50, 30, 0, 0, Math.PI * 2);
        ctx.fill();

        // Add some lights/glow
        ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
        for (let i = 0; i < 5; i++) {
            const x = centerX - 60 + (i * 30);
            ctx.beginPath();
            ctx.arc(x, centerY + 25, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.transparent = true;
    texture.needsUpdate = true;
    
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        alphaTest: 0.01
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.8, 0.8, 1); // Make it bigger so it's visible
    sprite.visible = false; // Hidden until travel starts
    scene.add(sprite);
    
    return sprite;
}

// Start travel to destination
function startTravel(destinationName) {
    if (travelState.isTraveling) {
        return; // Already traveling
    }
    
    // Hide any open infobox when starting travel
    hideInfoBox();
    
    // Prevent travel to current location (case-insensitive check)
    if (currentLocation && destinationName && 
        currentLocation.toLowerCase() === destinationName.toLowerCase()) {
        showTravelError('You are already at this location!');
        return;
    }
    
    // Check fuel requirement
    if (tradingGame && !tradingGame.canTravelTo(destinationName)) {
        const fuelCost = tradingGame.getFuelCost(destinationName);
        const currentFuel = tradingGame.getCommodityQuantity('fuel');
        showTravelError(`Insufficient fuel! Need ${fuelCost} fuel, but you only have ${currentFuel}.`);
        return;
    }

    // Check for getaway: if agro NPCs are traveling to current location, player escapes
    let isGetaway = false;
    if (npcManager) {
        // Debug: show agro status of all NPCs
        const agroStatus = npcManager.npcs.map(npc => `${npc.name}: agro=${npc.agro}, traveling=${npc.isTraveling}, dest=${npc.travelDestination}, loc=${npc.currentLocation}`).join(' | ');
        console.log(`🚨 NPC agro status: ${agroStatus}`);

        const agroTravelingToCurrent = npcManager.getAgroNPCsTravelingToLocation(currentLocation);
        if (agroTravelingToCurrent.length > 0) {
            console.log(`🏃 GETAWAY! Player escaped ${agroTravelingToCurrent.length} agro NPC(s) by traveling away!`);
            isGetaway = true;

            // Award Getaway achievement
            if (window.scoreManager && !window.scoreManager.hasAchievement('Getaway')) {
                const isNewAchievement = window.scoreManager.addAchievement('Getaway');
                if (isNewAchievement && window.updateScoreDisplay) {
                    window.updateScoreDisplay();
                }
            }

            // Grant free turn (skip turn advancement but still consume fuel)
            console.log('🎁 Free turn granted due to successful getaway!');
        }
    }

    // Store getaway status in travel state
    travelState.isGetaway = isGetaway;

    // For getaway travels, update location immediately to prevent agro attacks at old location
    if (isGetaway) {
        currentLocation = destinationName;
        if (tradingGame) {
            tradingGame.currentLocation = destinationName;
        }
        console.log(`🏃 Getaway: Location updated immediately to ${destinationName}`);
    }

    // NPC turns are already advanced from skipTurn() - don't advance them again here
    
    // Find destination object
    const destinationObj = sceneManager.allObjects.find(obj => obj.name === destinationName);
    if (!destinationObj) {
        console.error('Destination object not found:', destinationName);
        return;
    }

    // NPCs will advance their turns when player travel completes (for proper synchronization)

    // Get start position from current planet
    const startPos = new THREE.Vector3();
    if (currentLocation) {
        const currentObj = sceneManager.allObjects.find(obj => obj.name === currentLocation);
        if (currentObj && currentObj.mesh) {
            // getWorldPosition automatically accounts for all parent transforms
            currentObj.mesh.getWorldPosition(startPos);
        } else if (currentObj) {
            // Object exists but no mesh - use position and transform through group if it exists
            startPos.copy(currentObj.position);
            if (currentObj.planesGroup) {
                currentObj.planesGroup.localToWorld(startPos);
            }
        } else {
            // Current location object not found - fallback to Earth
            const earthObj = sceneManager.allObjects.find(obj => obj.name === 'EARTH');
            if (earthObj && earthObj.mesh) {
                earthObj.mesh.getWorldPosition(startPos);
            } else {
                startPos.copy(camera.position);
            }
        }
    } else {
        // No current location - start from Earth
        const earthObj = sceneManager.allObjects.find(obj => obj.name === 'EARTH');
        if (earthObj && earthObj.mesh) {
            earthObj.mesh.getWorldPosition(startPos);
        } else {
            // Fallback to camera if Earth not found
            startPos.copy(camera.position);
            startPos.y -= 2;
        }
    }
    
    // Get end position from destination planet
    const endPos = new THREE.Vector3();
    if (destinationObj.mesh) {
        // getWorldPosition automatically accounts for all parent transforms
        destinationObj.mesh.getWorldPosition(endPos);
    } else {
        // Object has no mesh - use position and transform through group if it exists
        endPos.copy(destinationObj.position);
        if (destinationObj.planesGroup) {
            destinationObj.planesGroup.localToWorld(endPos);
        }
    }
    
    // Create spaceship if it doesn't exist
    if (!travelState.spaceship) {
        travelState.spaceship = createSpaceship();
        scene.add(travelState.spaceship);
    }
    
    // Initialize travel state
    travelState.isTraveling = true;
    travelState.startTime = performance.now();
    travelState.startPos = startPos.clone();
    travelState.endPos = endPos.clone();
    travelState.destinationName = destinationName;

    // Calculate travel duration based on distance (minimum 2 seconds, plus 0.5 seconds per unit distance)
    const distance = startPos.distanceTo(endPos);
    travelState.duration = Math.max(2000, distance * 500); // milliseconds

    // Advance NPCs immediately so they travel simultaneously with player
    if (npcManager) {
        console.log('🚀 Advancing NPCs simultaneously with player travel start');
        npcManager.advanceAllTurnsSimultaneously();
    }

    // Show travel indicator
    const travelIndicator = document.getElementById('travel-indicator');
    if (travelIndicator) {
        travelIndicator.classList.add('show');
    }
    
    // Position spaceship exactly at start position
    travelState.spaceship.position.set(startPos.x, startPos.y, startPos.z);
    travelState.spaceship.visible = true;
    
    // Ensure spaceship is not in any group (should be direct child of scene)
    if (travelState.spaceship.parent && travelState.spaceship.parent !== scene) {
        travelState.spaceship.parent.remove(travelState.spaceship);
        scene.add(travelState.spaceship);
    }
    
    // Debug logs
    console.log('Starting travel from:', startPos, 'to:', endPos);
    console.log('Spaceship initial position:', travelState.spaceship.position);
    console.log('Spaceship visible:', travelState.spaceship.visible);
    console.log('Distance to travel:', startPos.distanceTo(endPos));
    
    // Disable travel button during travel
    const travelButton = document.getElementById('travel-button');
    if (travelButton) {
        travelButton.disabled = true;
        travelButton.textContent = 'TRAVELING...';
    }
}

// Click handler for label detection
function onMouseClick(event) {
    // Don't process clicks while traveling
    if (travelState.isTraveling) {
        return;
    }
    
    // First check HTML labels (lefty/lefthand)
    let clickedElement = event.target;

    // Traverse up the DOM tree to find label wrapper
    while (clickedElement && clickedElement !== document.body) {
        // Check if this is a lefty or lefthand label wrapper
        if (clickedElement.classList &&
            (clickedElement.classList.contains('lefty-label-wrapper') ||
             clickedElement.classList.contains('lefthand-label-wrapper'))) {

            // Get the SceneObject from the wrapper's userData
            const sceneObject = clickedElement.userData?.sceneObject;

            if (sceneObject && sceneObject.infoboxContent) {
                event.stopPropagation(); // Prevent event from bubbling
                showInfoBox(sceneObject.infoboxContent, sceneObject.name, sceneObject.isGreenlisted);
                return;
            }
        }
        clickedElement = clickedElement.parentElement;
    }

    // If not an HTML label, check sprite labels (3D sprites) using raycaster
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Get all sprite labels (labels are sprites for leader/laser line types)
    const spriteLabels = [];
    sceneManager.allObjects.forEach(obj => {
        if (obj.label && obj.label.type === 'Sprite') {
            spriteLabels.push(obj.label);
        }
    });

    // Find intersections with sprite labels
    const intersects = raycaster.intersectObjects(spriteLabels, true);

    if (intersects.length > 0) {
        const intersectedSprite = intersects[0].object;
        // Find the SceneObject that owns this sprite label
        const clickedObject = sceneManager.allObjects.find(obj => {
            return obj.label === intersectedSprite;
        });

        if (clickedObject && clickedObject.infoboxContent) {
            showInfoBox(clickedObject.infoboxContent, clickedObject.name, clickedObject.isGreenlisted);
            return;
        }
    }

    // If no label clicked, check for mesh and sprite intersections (for objects without labels like Earth)
    // Use a more robust approach: check the entire scene hierarchy to catch objects in groups
    // Build a map of all meshes/sprites to their SceneObjects for quick lookup
    const meshToObjectMap = new Map();
    const allMeshesAndSprites = [];
    sceneManager.allObjects.forEach(obj => {
        if (obj.mesh) {
            // More robust check: use isMesh/isSprite properties or type string
            const isMesh = obj.mesh.isMesh === true || obj.mesh.type === 'Mesh';
            const isSprite = obj.mesh.isSprite === true || obj.mesh.type === 'Sprite';
            if (isMesh || isSprite) {
                allMeshesAndSprites.push(obj.mesh);
                meshToObjectMap.set(obj.mesh, obj);
            }
        }
    });

    // Check all meshes/sprites directly, and also check the scene to catch any nested objects
    const objectsToCheck = allMeshesAndSprites.length > 0 ? allMeshesAndSprites : [scene];
    const meshIntersects = raycaster.intersectObjects(objectsToCheck, true);

    if (meshIntersects.length > 0) {
        const intersectedObject = meshIntersects[0].object;
        
        // Find the SceneObject that owns this mesh/sprite
        // First check our map for direct lookup
        let clickedObject = meshToObjectMap.get(intersectedObject);
        
        // If not found, traverse up the parent chain to find the actual mesh
        // This handles cases where the intersected object might be nested in a group
        if (!clickedObject) {
            let current = intersectedObject;
            while (current) {
                // Check if current object is in our map
                clickedObject = meshToObjectMap.get(current);
                if (clickedObject) break;
                
                // Move up the parent chain
                if (current.parent) {
                    current = current.parent;
                } else {
                    break;
                }
            }
        }

        if (clickedObject && clickedObject.infoboxContent) {
            showInfoBox(clickedObject.infoboxContent, clickedObject.name, clickedObject.isGreenlisted);
            return;
        }
    }

    // If clicked outside labels and meshes, hide info box
    hideInfoBox();
}

// Add click event listener
window.addEventListener('click', onMouseClick);

// Handle Escape key to close all menus and infoboxes
// Panel cycling state for Tab key
let currentPanelIndex = 0; // 0: console, 1: inventory, 2: explore

window.addEventListener('keydown', (event) => {
    // Debug logging for deployment troubleshooting
    console.log('🔧 Key event detected:', event.key, 'Code:', event.code, 'Target:', event.target.tagName);

    // Check if we're in a secure context (required for some keyboard APIs)
    if (!window.isSecureContext) {
        console.warn('⚠️ Not in secure context - keyboard events may be restricted');
    }

    // Check if focus is on an input element
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        console.log('📝 Key event on input element - allowing default behavior');
        return; // Allow input elements to handle their own events
    }

    // Deployment-specific workarounds
    // Check if we're in an iframe (common deployment issue)
    if (window.self !== window.top) {
        console.log('📱 Running in iframe - applying iframe-specific handling');
        // In iframes, some browsers restrict keyboard events
        // Try to ensure we have focus
        window.focus();
    }

    // PWA/standalone mode detection
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
        console.log('📱 Running in PWA/standalone mode');
        // Some PWA modes have different keyboard handling
    }

    // Mobile detection and workarounds
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        console.log('📱 Mobile device detected - keyboard behavior may differ');
        // On mobile, ensure we're not in a virtual keyboard state that blocks events
        if (document.activeElement && document.activeElement !== document.body) {
            console.log('📝 Active element:', document.activeElement.tagName);
        }
    }
    // Don't process hotkeys if an input element is focused
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT' || activeElement.contentEditable === 'true')) {
        return; // Let the input element handle the key event
    }

    if (event.key === 'Escape') {
        // Don't interfere with combat mode - let combat system handle escape
        if (window.combatManager && window.combatManager.inCombat) {
            return;
        }

        // Close all panels
        controlPanel.classList.remove('open');
        inventoryPanel.classList.remove('open');
        explorePanel.classList.remove('open');

        // Show all toggle buttons
        panelToggle.classList.remove('hidden');
        inventoryToggle.classList.remove('hidden');
        exploreToggle.classList.remove('hidden');

        // Close info box
        hideInfoBox();

        // Clear inventory description
        if (inventoryDescription) {
            inventoryDescription.textContent = '';
        }

        // Close cheat modal if open
        hideCheatModal();
    } else if (event.key === 'u' || event.key === 'U') {
        // Show cheat code modal - but check if we're in an environment where it might not work
        console.log('🎮 U key pressed - attempting to show cheat modal');
        showCheatModal();
    } else if (event.key === 'z' || event.key === 'Z') {
        // Z key: Close info box, then open console panel
        // Close any open info box
        const infoBox = document.getElementById('object-info-box');
        if (infoBox && infoBox.classList.contains('show')) {
            infoBox.classList.remove('show');
        }

        // Exit combat mode if active
        if (window.combatManager && window.combatManager.inCombat && window.combatManager.combatMode === 'voluntary') {
            window.combatManager.exitVoluntaryCombat();
        }

        // Close all panels
        controlPanel.classList.remove('open');
        inventoryPanel.classList.remove('open');
        explorePanel.classList.remove('open');

        // Open console panel
        controlPanel.classList.add('open');

        // Hide all toggle buttons
        panelToggle.classList.add('hidden');
        inventoryToggle.classList.add('hidden');
        exploreToggle.classList.add('hidden');
    } else if (event.key === 'x' || event.key === 'X') {
        // X key: Close info box, then open inventory panel
        // Close any open info box
        const infoBox = document.getElementById('object-info-box');
        if (infoBox && infoBox.classList.contains('show')) {
            infoBox.classList.remove('show');
        }

        // Exit combat mode if active
        if (window.combatManager && window.combatManager.inCombat && window.combatManager.combatMode === 'voluntary') {
            window.combatManager.exitVoluntaryCombat();
        }

        // Close all panels
        controlPanel.classList.remove('open');
        inventoryPanel.classList.remove('open');
        explorePanel.classList.remove('open');

        // Open inventory panel
        inventoryPanel.classList.add('open');

        // Hide all toggle buttons
        panelToggle.classList.add('hidden');
        inventoryToggle.classList.add('hidden');
        exploreToggle.classList.add('hidden');

        // Render inventory when opening
        renderInventory();
    } else if (event.key === 'c' || event.key === 'C') {
        // C key: Close info box, then open explore panel
        // Close any open info box
        const infoBox = document.getElementById('object-info-box');
        if (infoBox && infoBox.classList.contains('show')) {
            infoBox.classList.remove('show');
        }

        // Exit combat mode if active
        if (window.combatManager && window.combatManager.inCombat && window.combatManager.combatMode === 'voluntary') {
            window.combatManager.exitVoluntaryCombat();
        }

        // Close all panels
        controlPanel.classList.remove('open');
        inventoryPanel.classList.remove('open');
        explorePanel.classList.remove('open');

        // Open explore panel
        explorePanel.classList.add('open');

        // Hide all toggle buttons
        panelToggle.classList.add('hidden');
        inventoryToggle.classList.add('hidden');
        exploreToggle.classList.add('hidden');

        // Update explore panel content
        updateExplorePanel();
    } else if (event.key === 'Tab') {
        // Tab key: Cycle through panels (console -> inventory -> explore -> console...)
        event.preventDefault(); // Prevent default tab behavior

        // Exit combat mode if active
        if (window.combatManager && window.combatManager.inCombat && window.combatManager.combatMode === 'voluntary') {
            window.combatManager.exitVoluntaryCombat();
        }

        const panels = [
            { panel: controlPanel, toggle: panelToggle, openAction: () => {} },
            { panel: inventoryPanel, toggle: inventoryToggle, openAction: renderInventory },
            { panel: explorePanel, toggle: exploreToggle, openAction: updateExplorePanel }
        ];

        // Close all panels
        controlPanel.classList.remove('open');
        inventoryPanel.classList.remove('open');
        explorePanel.classList.remove('open');

        // Hide all toggle buttons (since a panel will be open)
        panelToggle.classList.add('hidden');
        inventoryToggle.classList.add('hidden');
        exploreToggle.classList.add('hidden');

        // Open the next panel
        const nextPanel = panels[currentPanelIndex];
        nextPanel.panel.classList.add('open');
        nextPanel.openAction();

        // Move to next panel for next Tab press
        currentPanelIndex = (currentPanelIndex + 1) % panels.length;
    } else if (event.key === 'Enter') {
        // Enter key: Could be used for menu confirmations in the future
        // For now, just prevent default to avoid accidental form submissions
        event.preventDefault();
    } else if (event.key >= '0' && event.key <= '9') {
        // Number keys: Set frequency stepper to exact value
        if (steppers && steppers[4]) { // Frequency is stepper[4]
            let value = parseInt(event.key);
            // Special case: 0 key sets frequency to 10
            if (value === 0) {
                value = 10;
            }
            if (value >= 1 && value <= 10) { // Ensure within stepper range
                steppers[4].setValue(value);
            }
        }
    } else if (event.key === '+' || event.key === '=') {
        // Plus key: Increase zoom stepper
        if (steppers && steppers[0]) { // Zoom is stepper[0]
            steppers[0].increase();
        }
    } else if (event.key === '-') {
        // Minus key: Decrease zoom stepper
        if (steppers && steppers[0]) { // Zoom is stepper[0]
            steppers[0].decrease();
        }
    } else if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
        // Up arrow or W: Increase vertical stepper
        if (steppers && steppers[1]) { // Vertical is stepper[1]
            steppers[1].increase();
        }
    } else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
        // Down arrow or S: Decrease vertical stepper
        if (steppers && steppers[1]) { // Vertical is stepper[1]
            steppers[1].decrease();
        }
    } else if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        // Left arrow or A: Decrease spacing stepper
        if (steppers && steppers[2]) { // Spacing is stepper[2]
            steppers[2].decrease();
        }
    } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        // Right arrow or D: Increase spacing stepper
        if (steppers && steppers[2]) { // Spacing is stepper[2]
            steppers[2].increase();
        }
    } else if (event.key === 'q' || event.key === 'Q') {
        // Q key: Decrease speed stepper
        if (steppers && steppers[3]) { // Speed is stepper[3]
            steppers[3].decrease();
        }
    } else if (event.key === 'e' || event.key === 'E') {
        // E key: Increase speed stepper
        if (steppers && steppers[3]) { // Speed is stepper[3]
            steppers[3].increase();
        }
    } else if (event.key === 'f' || event.key === 'F') {
        // F key: Skip turn
        if (!travelState.isTraveling && !skipTurnCooldown) {
            skipTurn();
        }
    }
});

// Fallback keyboard handler for deployment environments where window events might be blocked
document.addEventListener('keydown', (event) => {
    // Only handle if window listener didn't prevent default (meaning it didn't handle the event)
    if (!event.defaultPrevented) {
        console.log('🔄 Fallback key handler triggered for:', event.key);

        // Handle the same keys as the window listener but as fallback
        if (event.key === 'Escape') {
            if (window.combatManager && window.combatManager.inCombat) {
                return;
            }
            controlPanel.classList.remove('open');
            inventoryPanel.classList.remove('open');
            explorePanel.classList.remove('open');
            panelToggle.classList.remove('hidden');
            inventoryToggle.classList.remove('hidden');
            exploreToggle.classList.remove('hidden');
            hideInfoBox();
            hideCheatModal();
            if (inventoryDescription) {
                inventoryDescription.textContent = '';
            }
        } else if (event.key === 'u' || event.key === 'U') {
            showCheatModal();
        }
        // Add other critical hotkeys as fallback if needed
    }
});

// Additional deployment safeguard: ensure we can always close modals
window.addEventListener('keyup', (event) => {
    // Emergency escape handler that works even if main handlers fail
    if (event.key === 'Escape') {
        console.log('🚨 Emergency escape handler triggered');
        hideCheatModal();
        // Force close any open panels
        controlPanel.classList.remove('open');
        inventoryPanel.classList.remove('open');
        explorePanel.classList.remove('open');
    }
});

// Cheat Code Modal Functions
const cheatModal = document.getElementById('cheat-modal');
const cheatInput = document.getElementById('cheat-input');
const cheatSubmit = document.getElementById('cheat-submit');
const cheatCancel = document.getElementById('cheat-cancel');

function showCheatModal() {
    console.log('🎮 Opening cheat modal');
    cheatModal.classList.add('open');
    cheatInput.value = '';
    // Only focus if we're not in a deployment environment that blocks focus
    if (!window.matchMedia('(display-mode: standalone)').matches) {
        try {
            cheatInput.focus();
        } catch (e) {
            console.warn('⚠️ Could not focus cheat input:', e);
        }
    }
}

function hideCheatModal() {
    console.log('🎮 Closing cheat modal');
    cheatModal.classList.remove('open');
    cheatInput.value = '';

    // Ensure focus returns to the window/body to restore hotkeys
    try {
        // Try to focus the body element to restore window-level keyboard events
        document.body.focus();
        // Alternative: blur any focused element
        if (document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur();
        }
    } catch (e) {
        console.warn('⚠️ Could not restore focus to body:', e);
    }
}

// Handle cheat code submission
function handleCheatCode(code) {
    const normalizedCode = code.toLowerCase().trim();

    if (normalizedCode === 'idkfa') {
        // Give $999999
        if (tradingGame) {
            tradingGame.money = 999999;
            // Update UI if there's a money display function
            if (window.updateMoneyDisplay) {
                window.updateMoneyDisplay();
            }
            console.log('Cheat activated: $999999 added!');
        }
        return true;
    }

    return false;
}

// Event listeners for cheat modal
cheatSubmit.addEventListener('click', () => {
    const code = cheatInput.value;
    if (handleCheatCode(code)) {
        hideCheatModal();
        // Could add a success message here
    } else {
        // Invalid cheat code - could add visual feedback
        cheatInput.style.borderColor = '#ff4444';
        setTimeout(() => {
            cheatInput.style.borderColor = '#00d4ff';
        }, 1000);
    }
});

cheatCancel.addEventListener('click', () => {
    console.log('🎮 Cheat modal cancelled via button');
    hideCheatModal();
});

cheatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        console.log('🎮 Cheat code submitted via Enter key');
        cheatSubmit.click();
    }
});

// Additional safeguard: if user clicks outside modal, close it
cheatModal.addEventListener('click', (e) => {
    if (e.target === cheatModal) {
        console.log('🎮 Cheat modal closed via outside click');
        hideCheatModal();
    }
});

// Deployment diagnostics and safeguards
setInterval(() => {
    // Periodic check for focus issues
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName === 'INPUT' && !cheatModal.classList.contains('open')) {
        console.warn('⚠️ Input element has focus but cheat modal is closed - potential focus issue');
    }

    // Log current state every 30 seconds for debugging
    console.log('🔍 Game state check - Active element:', activeElement ? activeElement.tagName : 'body',
                'Cheat modal open:', cheatModal.classList.contains('open'));
}, 30000);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Enhanced landscape orientation lock for mobile devices
let orientationLocked = false;
let fullscreenEnabled = false;

function tryLockOrientation() {
    // Try modern API first
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').then(() => {
            orientationLocked = true;
            hideLandscapePrompt();
        }).catch(err => {
            // Orientation lock failed, might need fullscreen
            console.log('Orientation lock requires fullscreen or user gesture');
        });
    } else if (screen.lockOrientation) {
        // Legacy support
        try {
            screen.lockOrientation('landscape');
            orientationLocked = true;
            hideLandscapePrompt();
        } catch (e) {
            console.log('Legacy orientation lock failed');
        }
    } else if (screen.mozLockOrientation) {
        try {
            screen.mozLockOrientation('landscape');
            orientationLocked = true;
            hideLandscapePrompt();
        } catch (e) {
            console.log('Moz orientation lock failed');
        }
    } else if (screen.msLockOrientation) {
        try {
            screen.msLockOrientation('landscape');
            orientationLocked = true;
            hideLandscapePrompt();
        } catch (e) {
            console.log('MS orientation lock failed');
        }
    }
}

async function enableFullscreenAndLock() {
    try {
        // Try to enter fullscreen
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            await document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.msRequestFullscreen) {
            await document.documentElement.msRequestFullscreen();
        }
        
        fullscreenEnabled = true;
        
        // Wait a bit then try to lock orientation
        setTimeout(() => {
            tryLockOrientation();
        }, 100);
        
        hideLandscapePrompt();
    } catch (err) {
        console.log('Fullscreen not available:', err);
        // Still try to lock orientation without fullscreen
        tryLockOrientation();
    }
}

function showLandscapePrompt() {
    // Only show if we're on mobile and in portrait
    if (!isMobile) return;
    
    const prompt = document.getElementById('landscape-prompt');
    if (prompt) {
        prompt.style.display = 'flex';
    }
}

function hideLandscapePrompt() {
    const prompt = document.getElementById('landscape-prompt');
    if (prompt) {
        prompt.style.display = 'none';
    }
}

function checkOrientation() {
    if (!isMobile) return;
    
    // Check if we're in portrait mode
    if (window.innerHeight > window.innerWidth) {
        if (!orientationLocked) {
            showLandscapePrompt();
        }
    } else {
        hideLandscapePrompt();
        // Try to lock when rotated to landscape
        if (!orientationLocked) {
            tryLockOrientation();
        }
    }
}

// Initialize orientation lock on mobile devices
if (isMobile) {
    // Create landscape prompt button
    const prompt = document.createElement('div');
    prompt.id = 'landscape-prompt';
    prompt.innerHTML = `
        <div class="landscape-prompt-content">
            <p>Rotate to landscape or</p>
            <button id="enable-fullscreen-btn" class="landscape-prompt-button">
                Enable Fullscreen
            </button>
        </div>
    `;
    document.body.appendChild(prompt);
    
    // Set up fullscreen button
    document.getElementById('enable-fullscreen-btn')?.addEventListener('click', enableFullscreenAndLock);
    
    // Check orientation on load and resize
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', () => {
        setTimeout(checkOrientation, 100);
    });
    
    // Try to lock orientation after a short delay
    setTimeout(() => {
        tryLockOrientation();
    }, 500);
    
    // Also try on user interaction (some browsers require this)
    document.addEventListener('touchstart', () => {
        if (!orientationLocked) {
            tryLockOrientation();
        }
    }, { once: true });
    
    // Try fullscreen + lock on any click/touch
    document.addEventListener('click', () => {
        if (!fullscreenEnabled && !orientationLocked) {
            enableFullscreenAndLock();
        }
    }, { once: true });
}

// Initialize Inventory Manager
const inventoryManager = new InventoryManager();
// Make inventoryManager available globally for trading game inventory calculations
window.inventoryManager = inventoryManager;

// Initialize Score Manager
const scoreManager = new ScoreManager();
window.scoreManager = scoreManager;

// Explore Panel
const exploreToggle = document.getElementById('explore-toggle');
const exploreClose = document.getElementById('explore-close');
const explorePanel = document.getElementById('explore-panel');
const exploreTitle = document.getElementById('explore-title');
const exploreContent = document.getElementById('explore-content');

// Control Panel Toggle
const panelToggle = document.getElementById('panel-toggle');
const panelClose = document.getElementById('panel-close');
const controlPanel = document.getElementById('control-panel');

panelToggle.addEventListener('click', () => {
    const isOpening = !controlPanel.classList.contains('open');
    controlPanel.classList.toggle('open');
    panelToggle.classList.toggle('hidden');
    
    if (isOpening) {
        // Close inventory and explore if open
        inventoryPanel.classList.remove('open');
        explorePanel.classList.remove('open');
        // Hide inventory and explore buttons when CONSOLE opens
        inventoryToggle.classList.add('hidden');
        exploreToggle.classList.add('hidden');
    } else {
        // Show inventory and explore buttons when CONSOLE closes
        inventoryToggle.classList.remove('hidden');
        exploreToggle.classList.remove('hidden');
    }
});

panelClose.addEventListener('click', () => {
    controlPanel.classList.remove('open');
    panelToggle.classList.remove('hidden');
    // Show inventory and explore buttons when VIEW closes
    inventoryToggle.classList.remove('hidden');
    exploreToggle.classList.remove('hidden');
});

// Update explore panel with current location
function updateExplorePanel() {
    if (exploreTitle && currentLocation) {
        // Convert location name to uppercase for display
        const displayName = currentLocation.toUpperCase();
        exploreTitle.textContent = displayName;
        
        // Render location-specific content
        renderExploreContent();
    }
}

// Check if sun is visible (in front of camera)
// Returns true if sun is in front of camera (prograde), false if behind (retrograde)
function isSunVisible() {
    const sunObject = sceneManager.allObjects.find(obj => obj.name === 'SUN');
    if (!sunObject) {
        return false;
    }
    
    // Get sun's world position (accounting for all transforms)
    const sunWorldPos = new THREE.Vector3();
    if (sunObject.mesh) {
        sunObject.mesh.getWorldPosition(sunWorldPos);
    } else {
        // Sun doesn't have a mesh, use position directly
        // Sun is bindingType: 'free', so position is already in world space
        sunWorldPos.copy(sunObject.position);
    }
    
    // Calculate vector from camera to sun
    const cameraToSun = new THREE.Vector3();
    cameraToSun.subVectors(sunWorldPos, camera.position);
    
    // Get camera's forward direction (negative Z in Three.js)
    const cameraForward = new THREE.Vector3(0, 0, -1);
    cameraForward.applyQuaternion(camera.quaternion);
    
    // If dot product is positive, sun is in front of camera (prograde)
    // If dot product is negative, sun is behind camera (retrograde)
    const dotProduct = cameraToSun.dot(cameraForward);
    return dotProduct > 0;
}

// Render explore content based on current location
function renderExploreContent() {
    if (!exploreContent || !currentLocation) return;

    // Clear existing content
    exploreContent.innerHTML = '';

    // Get all greenlisted objects using the same logic as visit button
    let greenlistedObjects = sceneManager.allObjects.filter(obj => {
        return isOnCurrentGreenlist(obj.name, obj.isGreenlisted);
    });
    
    // Greenlist section hidden for now
    // if (greenlistedObjects.length > 0) {
    //     const greenlistSection = document.createElement('div');
    //     greenlistSection.className = 'greenlist-section';
    //     greenlistSection.style.marginBottom = '2rem';
    //     greenlistSection.style.paddingBottom = '2rem';
    //     greenlistSection.style.borderBottom = '1px solid rgba(196, 213, 188, 0.2)';
    //
    //     const greenlistTitle = document.createElement('h3');
    //     greenlistTitle.textContent = 'GREENLIST';
    //     greenlistTitle.style.fontFamily = 'var(--font-primary)';
    //     greenlistTitle.style.fontWeight = '700';
    //     greenlistTitle.style.fontSize = '0.625rem';
    //     greenlistTitle.style.textTransform = 'uppercase';
    //     greenlistTitle.style.letterSpacing = '0.1em';
    //     greenlistTitle.style.color = 'var(--color--foreground)';
    //     greenlistTitle.style.marginBottom = '0.75rem';
    //     greenlistTitle.style.opacity = '0.9';
    //
    //     // Remove duplicates (some objects might have same name)
    //     const uniqueGreenlisted = [];
    //     const seenNames = new Set();
    //     greenlistedObjects.forEach(obj => {
    //         if (!seenNames.has(obj.name)) {
    //             seenNames.add(obj.name);
    //             uniqueGreenlisted.push(obj);
    //         }
    //     });
    //
    //     // Simple comma-separated list
    //     const greenlistText = document.createElement('p');
    //     greenlistText.style.fontFamily = 'var(--font-primary)';
    //     greenlistText.style.fontWeight = '700';
    //     greenlistText.style.fontSize = '0.625rem';
    //     greenlistText.style.textTransform = 'uppercase';
    //     greenlistText.style.letterSpacing = '0.1em';
    //     greenlistText.style.color = 'var(--color--foreground)';
    //     greenlistText.style.opacity = '0.7';
    //     greenlistText.style.margin = '0';
    //     greenlistText.textContent = uniqueGreenlisted.map(obj => obj.name.toUpperCase()).join(', ');
    //
    //     greenlistSection.appendChild(greenlistTitle);
    //     greenlistSection.appendChild(greenlistText);
    //     exploreContent.appendChild(greenlistSection);
    // }

    // Add trading section (skip for Mercury, Jupiter, Pluto, Uranus, and Black Cube - no trading)
    if (tradingGame && tradingUI && currentLocation.toUpperCase() !== 'MERCURY' && currentLocation.toUpperCase() !== 'JUPITER' && currentLocation.toUpperCase() !== 'PLUTO' && currentLocation.toUpperCase() !== 'URANUS' && currentLocation.toUpperCase() !== 'BLACK CUBE') {
        const tradingSection = tradingUI.renderTradingPanel(tradingGame, currentLocation);
        exploreContent.appendChild(tradingSection);
    }

    // Find the current location object to get its explore content
    const currentObject = sceneManager.allObjects.find(obj => obj.name === currentLocation);

    // Special handling for MERCURY
    if (currentLocation.toUpperCase() === 'MERCURY') {
        const sunVisible = isSunVisible();
        const isPrograde = sunVisible;
        
        // Create content element
        const contentElement = document.createElement('p');
        contentElement.style.color = 'var(--color--foreground)';
        contentElement.style.opacity = '0.7';
        contentElement.style.padding = '1rem';
        
        if (isPrograde) {
            // Prograde: Sun is visible
            contentElement.textContent = 'Mercury is in Prograde.\n\nPlease wait until Mercury Retrograde.';
            exploreContent.appendChild(contentElement);
        } else {
            // Retrograde: Sun is not visible
            contentElement.textContent = 'Mercury is in Retrograde.\n\nPlease select your Location.';
            
            // Add SATURN and JUPITER buttons
            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.marginTop = '1rem';
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.flexDirection = 'column';
            buttonsContainer.style.gap = '0.75rem';
            
            // Create SATURN button
            const saturnButton = document.createElement('button');
            saturnButton.textContent = 'SATURN';
            saturnButton.style.width = '100%';
            saturnButton.style.padding = '0.75rem';
            saturnButton.style.fontFamily = 'var(--font-primary)';
            saturnButton.style.fontWeight = '700';
            saturnButton.style.fontSize = '0.625rem';
            saturnButton.style.textTransform = 'uppercase';
            saturnButton.style.letterSpacing = '0.05em';
            saturnButton.style.color = 'var(--color--foreground)';
            saturnButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            saturnButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
            saturnButton.style.borderRadius = '4px';
            saturnButton.style.cursor = 'pointer';
            saturnButton.style.transition = 'all 0.2s';
            saturnButton.onclick = () => {
                // Disable buttons temporarily when clicked
                saturnButton.disabled = true;
                jupiterButton.disabled = true;
                saturnButton.style.opacity = '0.5';
                jupiterButton.style.opacity = '0.5';
                saturnButton.style.cursor = 'not-allowed';
                jupiterButton.style.cursor = 'not-allowed';
                
                // Add 2 fuel when traveling from Mercury (respecting inventory limit)
                if (tradingGame) {
                    const currentFuel = tradingGame.getCommodityQuantity('fuel');
                    // Check inventory capacity before adding fuel
                    // Fuel already takes a slot if quantity > 0, so adding more won't exceed capacity
                    // But check if fuel doesn't exist and we're at capacity
                    const fuelExists = currentFuel > 0;
                    if (!fuelExists && tradingGame.getInventoryUsed() >= tradingGame.getInventoryCapacity()) {
                        showTravelError('Insufficient Inventory');
                        // Re-enable buttons if error
                        saturnButton.disabled = false;
                        jupiterButton.disabled = false;
                        saturnButton.style.opacity = '1';
                        jupiterButton.style.opacity = '1';
                        saturnButton.style.cursor = 'pointer';
                        jupiterButton.style.cursor = 'pointer';
                        return;
                    }
                    tradingGame.commodities['fuel'] = (currentFuel || 0) + 2;
                    // Refresh inventory to show updated fuel
                    if (window.renderInventory) {
                        window.renderInventory();
                    }
                }
                startTravel('SATURN');
            };
            
            // Hover effects for SATURN button
            saturnButton.addEventListener('mouseenter', () => {
                saturnButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            });
            saturnButton.addEventListener('mouseleave', () => {
                saturnButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            });
            
            // Create JUPITER button
            const jupiterButton = document.createElement('button');
            jupiterButton.textContent = 'JUPITER';
            jupiterButton.style.width = '100%';
            jupiterButton.style.padding = '0.75rem';
            jupiterButton.style.fontFamily = 'var(--font-primary)';
            jupiterButton.style.fontWeight = '700';
            jupiterButton.style.fontSize = '0.625rem';
            jupiterButton.style.textTransform = 'uppercase';
            jupiterButton.style.letterSpacing = '0.05em';
            jupiterButton.style.color = 'var(--color--foreground)';
            jupiterButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            jupiterButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
            jupiterButton.style.borderRadius = '4px';
            jupiterButton.style.cursor = 'pointer';
            jupiterButton.style.transition = 'all 0.2s';
            jupiterButton.onclick = () => {
                // Disable buttons temporarily when clicked
                saturnButton.disabled = true;
                jupiterButton.disabled = true;
                saturnButton.style.opacity = '0.5';
                jupiterButton.style.opacity = '0.5';
                saturnButton.style.cursor = 'not-allowed';
                jupiterButton.style.cursor = 'not-allowed';
                
                // Add 2 fuel when traveling from Mercury (respecting inventory limit)
                if (tradingGame) {
                    const currentFuel = tradingGame.getCommodityQuantity('fuel');
                    // Check inventory capacity before adding fuel
                    // Fuel already takes a slot if quantity > 0, so adding more won't exceed capacity
                    // But check if fuel doesn't exist and we're at capacity
                    const fuelExists = currentFuel > 0;
                    if (!fuelExists && tradingGame.getInventoryUsed() >= tradingGame.getInventoryCapacity()) {
                        showTravelError('Insufficient Inventory');
                        // Re-enable buttons if error
                        saturnButton.disabled = false;
                        jupiterButton.disabled = false;
                        saturnButton.style.opacity = '1';
                        jupiterButton.style.opacity = '1';
                        saturnButton.style.cursor = 'pointer';
                        jupiterButton.style.cursor = 'pointer';
                        return;
                    }
                    tradingGame.commodities['fuel'] = (currentFuel || 0) + 2;
                    // Refresh inventory to show updated fuel
                    if (window.renderInventory) {
                        window.renderInventory();
                    }
                }
                startTravel('JUPITER');
            };
            
            // Hover effects for JUPITER button
            jupiterButton.addEventListener('mouseenter', () => {
                jupiterButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            });
            jupiterButton.addEventListener('mouseleave', () => {
                jupiterButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            });
            
            buttonsContainer.appendChild(saturnButton);
            buttonsContainer.appendChild(jupiterButton);
            
            exploreContent.appendChild(contentElement);
            exploreContent.appendChild(buttonsContainer);
        }
    } else if (currentObject && currentObject.exploreContent) {
        // Use the object's explore content
        // For Venus, check if donation has been made and update content accordingly
        let displayContent = currentObject.exploreContent;
        if (currentLocation.toUpperCase() === 'VENUS' && currentObject.hasDonatedExotic) {
            displayContent = 'Tune to Frequency 6 to travel to Mercury.';
        }
        // For Jupiter, check if name has been entered
        if (currentLocation.toUpperCase() === 'JUPITER' && currentObject.playerName) {
            displayContent = 'Tune to Frequency 7 to unlock the Outer Planets.';
        }
        // For Black Cube, check if 9 slaves have been sacrificed
        if ((currentLocation.toUpperCase() === 'BLACK CUBE' || currentLocation.toLowerCase() === 'black cube') && currentObject.hasSacrificed9Slaves) {
            displayContent = 'Sacrifice 1 Baby to Moloch';
        }
        // For Saturn, check if soul has been pledged
        if ((currentLocation.toUpperCase() === 'SATURN' || currentLocation.toLowerCase() === 'saturn') && currentObject.hasPledgedSoul) {
            displayContent = 'Visit the Black Cube';
        }
        
        const contentElement = document.createElement('p');
        contentElement.textContent = displayContent;
        contentElement.style.color = 'var(--color--foreground)';
        contentElement.style.opacity = '0.7';
        contentElement.style.padding = '1rem';
        exploreContent.appendChild(contentElement);
        
        // Special handling for EARTH - add buy/sell body button
        if (currentLocation.toUpperCase() === 'EARTH') {
            createBuySellButton('body', 'BODY', 1000, exploreContent);
        }
        
        // Special handling for MOON - add buy/sell spirit button and omega interface
        if (currentLocation.toUpperCase() === 'MOON' || (window.sceneManager && window.sceneManager.allObjects.find(obj => obj.name === currentLocation.toUpperCase() && obj.infoboxContent && obj.infoboxContent.includes('Omega weapon platform')))) {
            createBuySellButton('spirit', 'SPIRIT', 1000, exploreContent);

            // Add omega interface only if omega has been deployed (moon transformed)
            const moonObject = window.sceneManager.allObjects.find(obj => obj.name === currentLocation.toUpperCase());
            if (moonObject && moonObject.name !== 'MOON') {
                createMoonOmegaInterface(exploreContent, moonObject);
            }
        }
        
        // Special handling for MARS - add buy/sell soul button
        if (currentLocation.toUpperCase() === 'MARS' || currentLocation.toLowerCase() === 'mars') {
            createBuySellButton('soul', 'SOUL', 1000, exploreContent);
        }
        
        // Special handling for VENUS - add donate exotic button
        if (currentLocation.toUpperCase() === 'VENUS' || currentLocation.toLowerCase() === 'venus') {
            createDonateExoticButton(exploreContent, currentObject);
        }
        
        // Special handling for SATURN - add pledge soul button
        if (currentLocation.toUpperCase() === 'SATURN' || currentLocation.toLowerCase() === 'saturn') {
            createPledgeSoulButton(exploreContent, currentObject);
        }

        // Special handling for SUPERNOVA - add free gift button and crafting
        if (currentLocation.toUpperCase() === 'SUPERNOVA' || currentLocation.toLowerCase() === 'supernova') {
            createSupernovaFreeGiftButton(exploreContent, currentObject);
            createSupernovaCraftingButton(exploreContent, currentObject);
        }

        // Special handling for STATION - sacred knowledge revelation
        if (currentLocation.toUpperCase() === 'STATION' || currentLocation.toLowerCase() === 'station') {
            createStationButton(exploreContent, currentObject);
        }

        // Special handling for JUPITER - add pledge gold button or name entry
        if (currentLocation.toUpperCase() === 'JUPITER' || currentLocation.toLowerCase() === 'jupiter') {
            createJupiterPledgeButton(exploreContent, currentObject);
        }
        
        // Special handling for NEPTUNE - add party button
        if (currentLocation.toUpperCase() === 'NEPTUNE' || currentLocation.toLowerCase() === 'neptune') {
            createNeptunePartyButton(exploreContent, currentObject);
        }

        // Special handling for PLUTO - add crafting stations
        if (currentLocation.toUpperCase() === 'PLUTO' || currentLocation.toLowerCase() === 'pluto') {
            createPlutoCraftingSection(exploreContent, currentObject);
            createPlutoWeaponsCraftingSection(exploreContent, currentObject);
            createPlutoRobotCraftingSection(exploreContent, currentObject);
        }

        // Special handling for PLEIADES - add crafting stations
        if (currentLocation.toUpperCase() === 'PLEIADES' || currentLocation.toLowerCase() === 'pleiades') {
            createPleiadesCraftingSection(exploreContent, currentObject);
            createPleiadesWeaponsCraftingSection(exploreContent, currentObject);
            createPleiadesRobotCraftingSection(exploreContent, currentObject);
        }

        // Special handling for URANUS - add crafting stations
        if (currentLocation.toUpperCase() === 'URANUS' || currentLocation.toLowerCase() === 'uranus') {
            // Clear any existing description content
            exploreContent.innerHTML = '';
            createUranusMerchantCraftingSection(exploreContent, currentObject);
            createUranusArmyCraftingSection(exploreContent, currentObject);
            createUranusArchonCraftingSection(exploreContent, currentObject);
        }

        // Special handling for MILKY WAY - add crafting stations
        if (currentLocation.toUpperCase() === 'MILKY WAY' || currentLocation.toLowerCase() === 'milky way') {
            createMilkyWayAlphaCraftingSection(exploreContent, currentObject);
            createMilkyWayBetaCraftingSection(exploreContent, currentObject);
            createMilkyWayGammaCraftingSection(exploreContent, currentObject);
        }

        // Special handling for BLACK CUBE - add sacrifice button
        if (currentLocation.toUpperCase() === 'BLACK CUBE' || currentLocation.toLowerCase() === 'black cube') {
            createBlackCubeSacrificeButton(exploreContent, currentObject);
        }

        // Special handling for ANJA - add pledge button
        if (currentLocation.toUpperCase() === 'ANJA' || currentLocation.toLowerCase() === 'anja') {
            createAnjaPledgeButton(exploreContent, currentObject);
        }

        // Special handling for ZETA RETICULI - Greys encounter
        if (currentLocation.toUpperCase() === 'ZETA RETICULI' || currentLocation.toLowerCase() === 'zeta reticuli') {
            createZetaReticuliGreysEncounter(exploreContent, currentObject);
        }

        // Special handling for GAIA BH1 - Reptilian Banking
        if (currentLocation.toUpperCase() === 'GAIA BH1' || currentLocation.toLowerCase() === 'gaia bh1') {
            createGaiaBH1BankingSystem(exploreContent, currentObject);
        }

        // Special handling for MONOLITH - final consecration
        if (currentLocation.toUpperCase() === 'MONOLITH' || currentLocation.toLowerCase() === 'monolith') {
            createMonolithButton(exploreContent, currentObject);
        }

        // Special handling for ANDROMEDA - add transmutation button
        if (currentLocation.toUpperCase() === 'ANDROMEDA' || currentLocation.toLowerCase() === 'andromeda') {
            createAndromedaTransmutationButton(exploreContent, currentObject);
        }
    } else if (currentObject) {
        // Special handling for PLUTO (when it doesn't have exploreContent)
        if (currentLocation.toUpperCase() === 'PLUTO' || currentLocation.toLowerCase() === 'pluto') {
            createPlutoCraftingSection(exploreContent, currentObject);
            createPlutoWeaponsCraftingSection(exploreContent, currentObject);
            createPlutoRobotCraftingSection(exploreContent, currentObject);
        }
        // Special handling for PLEIADES (when it doesn't have exploreContent)
        else if (currentLocation.toUpperCase() === 'PLEIADES' || currentLocation.toLowerCase() === 'pleiades') {
            createPleiadesCraftingSection(exploreContent, currentObject);
            createPleiadesWeaponsCraftingSection(exploreContent, currentObject);
            createPleiadesRobotCraftingSection(exploreContent, currentObject);
        }
        // Special handling for URANUS (when it doesn't have exploreContent)
        else if (currentLocation.toUpperCase() === 'URANUS' || currentLocation.toLowerCase() === 'uranus') {
            // Clear any existing description content
            exploreContent.innerHTML = '';
            createUranusMerchantCraftingSection(exploreContent, currentObject);
            createUranusArmyCraftingSection(exploreContent, currentObject);
            createUranusArchonCraftingSection(exploreContent, currentObject);
        }
        // Special handling for MILKY WAY (when it doesn't have exploreContent)
        else if (currentLocation.toUpperCase() === 'MILKY WAY' || currentLocation.toLowerCase() === 'milky way') {
            createMilkyWayAlphaCraftingSection(exploreContent, currentObject);
            createMilkyWayBetaCraftingSection(exploreContent, currentObject);
            createMilkyWayGammaCraftingSection(exploreContent, currentObject);
        }
        // Special handling for LARGE MAGELLANIC CLOUD - add time crafting
        else if (currentLocation.toUpperCase() === 'LARGE MAGELLANIC CLOUD' || currentLocation.toLowerCase() === 'large magellanic cloud') {
            createLargeMagellanicCloudPastCraftingSection(exploreContent, currentObject);
            createLargeMagellanicCloudPresentCraftingSection(exploreContent, currentObject);
            createLargeMagellanicCloudFutureCraftingSection(exploreContent, currentObject);
        }
        // Special handling for transformed moon (renamed with omega interface)
        else if (window.sceneManager && window.sceneManager.allObjects.find(obj => obj.name === currentLocation.toUpperCase() && obj.infoboxContent && obj.infoboxContent.includes('Omega weapon platform'))) {
            // Add omega interface (moon is already transformed, so interface should show)
            const moonObject = window.sceneManager.allObjects.find(obj => obj.name === currentLocation.toUpperCase());
            if (moonObject) {
                createMoonOmegaInterface(exploreContent, moonObject);
            }
        } else {
            // Fallback placeholder for other objects
            const locationName = currentLocation.toUpperCase();
            const placeholder = document.createElement('p');
            placeholder.textContent = `Exploring ${locationName}...`;
            placeholder.style.color = 'var(--color--foreground)';
            placeholder.style.opacity = '0.7';
            placeholder.style.padding = '1rem';
            exploreContent.appendChild(placeholder);
        }
    } else {
        // Fallback placeholder when no currentObject
        const locationName = currentLocation.toUpperCase();
        const placeholder = document.createElement('p');
        placeholder.textContent = `Exploring ${locationName}...`;
        placeholder.style.color = 'var(--color--foreground)';
        placeholder.style.opacity = '0.7';
        placeholder.style.padding = '1rem';
        exploreContent.appendChild(placeholder);
    }
}

// Helper function to create buy/sell button for body/soul/spirit
function createBuySellButton(itemId, itemName, price, parentElement) {
    const section = document.createElement('div');
    section.style.marginTop = '1rem';
    section.style.paddingTop = '1rem';
    section.style.borderTop = '1px solid rgba(196, 213, 188, 0.2)';
    
    const hasItem = inventoryManager.hasItem(itemId, 1);
    const button = document.createElement('button');
    button.textContent = hasItem ? `SELL ${itemName}` : `BUY ${itemName}`;
    button.style.width = '100%';
    button.style.padding = '0.75rem';
    button.style.fontFamily = 'var(--font-primary)';
    button.style.fontWeight = '700';
    button.style.fontSize = '0.625rem';
    button.style.textTransform = 'uppercase';
    button.style.letterSpacing = '0.05em';
    button.style.color = 'var(--color--foreground)';
    button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    button.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.transition = 'all 0.2s';
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
        if (!button.disabled) {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
        }
    });
    button.addEventListener('mouseleave', () => {
        if (!button.disabled) {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
        }
    });
    
    // Click handler
    button.addEventListener('click', () => {
        // Check item status dynamically
        const currentHasItem = inventoryManager.hasItem(itemId, 1);
        
        if (currentHasItem) {
            // Sell item
            if (tradingGame) {
                tradingGame.money += price;
                inventoryManager.removeItem(itemId, 1);
                
                // Track achievements and score based on location and item
                if (window.scoreManager && currentLocation) {
                    const loc = currentLocation.toUpperCase();
                    if (itemId === 'body' && loc === 'EARTH') {
                        window.scoreManager.addAchievement('Prostitute');
                    } else if (itemId === 'soul' && loc === 'MARS') {
                        window.scoreManager.addAchievement('Martian');
                        // Add 1 point for every soul sold to Elon on Mars
                        window.scoreManager.addScore(1);
                    } else if (itemId === 'spirit' && loc === 'MOON') {
                        window.scoreManager.addAchievement('Transhumanist');
                    }
                    // Update score display
                    if (window.updateScoreDisplay) {
                        window.updateScoreDisplay();
                    }
                }
                
                // Update UI - refresh inventory and explore panel
                if (window.renderInventory) {
                    window.renderInventory();
                }
                if (window.updateExplorePanel) {
                    window.updateExplorePanel();
                }
                
                // Visual feedback
                button.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
                setTimeout(() => {
                    button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
                }, 200);
            }
        } else {
            // Buy item
            // Check inventory capacity first - check if adding 1 would exceed capacity
            if (tradingGame && (tradingGame.getInventoryUsed() + 1) > tradingGame.getInventoryCapacity()) {
                // Show error if inventory is full
                const errorMsg = document.createElement('div');
                errorMsg.textContent = 'Insufficient Inventory';
                errorMsg.style.fontFamily = 'var(--font-primary)';
                errorMsg.style.fontSize = '0.625rem';
                errorMsg.style.color = 'rgba(255, 100, 100, 0.9)';
                errorMsg.style.marginTop = '0.5rem';
                errorMsg.style.padding = '0.5rem';
                errorMsg.style.backgroundColor = 'rgba(255, 100, 100, 0.1)';
                errorMsg.style.border = '1px solid rgba(255, 100, 100, 0.3)';
                errorMsg.style.borderRadius = '4px';
                errorMsg.style.opacity = '0';
                errorMsg.style.transition = 'opacity 0.2s';
                section.appendChild(errorMsg);
                
                setTimeout(() => {
                    errorMsg.style.opacity = '1';
                }, 10);
                
                setTimeout(() => {
                    errorMsg.style.opacity = '0';
                    setTimeout(() => {
                        if (errorMsg.parentElement) {
                            errorMsg.remove();
                        }
                    }, 200);
                }, 3000);
                
                // Visual feedback for error
                button.style.backgroundColor = 'rgba(255, 100, 100, 0.2)';
                setTimeout(() => {
                    button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
                }, 300);
                return;
            }
            
            if (tradingGame && tradingGame.money >= price) {
                tradingGame.money -= price;
                inventoryManager.addItem(itemId, 1);
                
                // Update UI - refresh inventory and explore panel
                if (window.renderInventory) {
                    window.renderInventory();
                }
                if (window.updateExplorePanel) {
                    window.updateExplorePanel();
                }
                
                // Visual feedback
                button.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
                setTimeout(() => {
                    button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
                }, 200);
            } else {
                // Show error if insufficient funds
                const errorMsg = document.createElement('div');
                errorMsg.textContent = 'Insufficient funds';
                errorMsg.style.fontFamily = 'var(--font-primary)';
                errorMsg.style.fontSize = '0.625rem';
                errorMsg.style.color = 'rgba(255, 100, 100, 0.9)';
                errorMsg.style.marginTop = '0.5rem';
                errorMsg.style.padding = '0.5rem';
                errorMsg.style.backgroundColor = 'rgba(255, 100, 100, 0.1)';
                errorMsg.style.border = '1px solid rgba(255, 100, 100, 0.3)';
                errorMsg.style.borderRadius = '4px';
                errorMsg.style.opacity = '0';
                errorMsg.style.transition = 'opacity 0.2s';
                section.appendChild(errorMsg);
                
                setTimeout(() => {
                    errorMsg.style.opacity = '1';
                }, 10);
                
                setTimeout(() => {
                    errorMsg.style.opacity = '0';
                    setTimeout(() => {
                        if (errorMsg.parentElement) {
                            errorMsg.remove();
                        }
                    }, 200);
                }, 3000);
                
                // Visual feedback for error
                button.style.backgroundColor = 'rgba(255, 100, 100, 0.2)';
                setTimeout(() => {
                    button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
                }, 300);
            }
        }
    });
    
    // Disable button if buying but insufficient funds
    if (!hasItem && tradingGame && tradingGame.money < price) {
        button.disabled = true;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
    }
    
    section.appendChild(button);
    parentElement.appendChild(section);
}

// Helper function to create pledge soul button for Saturn
function createPledgeSoulButton(parentElement, saturnObject) {
    const section = document.createElement('div');
    section.style.marginTop = '1rem';
    section.style.paddingTop = '1rem';
    section.style.borderTop = '1px solid rgba(196, 213, 188, 0.2)';
    
    // Initialize pledge state if not exists
    if (!saturnObject.hasPledgedSoul) {
        saturnObject.hasPledgedSoul = false;
    }
    
    const hasSoul = inventoryManager.hasItem('soul', 1);
    const isPledged = saturnObject.hasPledgedSoul;
    const button = document.createElement('button');
    button.textContent = isPledged ? 'PLEDGED' : 'PLEDGE SOUL';
    button.disabled = isPledged || !hasSoul;
    button.style.width = '100%';
    button.style.padding = '0.75rem';
    button.style.fontFamily = 'var(--font-primary)';
    button.style.fontWeight = '700';
    button.style.fontSize = '0.625rem';
    button.style.textTransform = 'uppercase';
    button.style.letterSpacing = '0.05em';
    button.style.color = 'var(--color--foreground)';
    button.style.backgroundColor = (isPledged || !hasSoul) ? 'rgba(196, 213, 188, 0.05)' : 'rgba(196, 213, 188, 0.1)';
    button.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    button.style.borderRadius = '4px';
    button.style.cursor = (isPledged || !hasSoul) ? 'not-allowed' : 'pointer';
    button.style.opacity = (isPledged || !hasSoul) ? '0.5' : '1';
    button.style.transition = 'all 0.2s';
    
    // Hover effects (only if not pledged and has soul)
    if (!isPledged && hasSoul) {
        button.addEventListener('mouseenter', () => {
            if (!button.disabled) {
                button.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            }
        });
        button.addEventListener('mouseleave', () => {
            if (!button.disabled) {
                button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            }
        });
    }
    
    // Click handler
    button.addEventListener('click', () => {
        if (isPledged || !hasSoul) return;
        
        // Check if still has soul
        const currentHasSoul = inventoryManager.hasItem('soul', 1);
        if (!currentHasSoul) {
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            return;
        }
        
        // Pledge soul: give $5000 and remove soul
        if (tradingGame) {
            tradingGame.money += 5000;
            inventoryManager.removeItem('soul', 1);
            saturnObject.hasPledgedSoul = true; // Mark as pledged
            
            // Track achievement for pledging soul to Saturn
            if (window.scoreManager) {
                window.scoreManager.addAchievement('Saturn Worshipper');
                // Update score display
                if (window.updateScoreDisplay) {
                    window.updateScoreDisplay();
                }
            }
            
            // Update button text and state
            button.textContent = 'PLEDGED';
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
            
            // Update UI - refresh inventory and explore panel
            if (window.renderInventory) {
                window.renderInventory();
            }
            if (window.updateExplorePanel) {
                window.updateExplorePanel();
            }
            
            // Visual feedback
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
            setTimeout(() => {
                button.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
            }, 200);
        }
    });
    
    section.appendChild(button);
    parentElement.appendChild(section);
}

// Helper function to create Supernova free gift button
function createSupernovaFreeGiftButton(parentElement, supernovaObject) {
    const section = document.createElement('div');
    section.style.marginTop = '1rem';
    section.style.paddingTop = '1rem';
    section.style.borderTop = '1px solid rgba(196, 213, 188, 0.2)';

    const button = document.createElement('button');
    button.textContent = 'FREE GIFT';

    // Check if gift already claimed this turn
    const giftAlreadyClaimed = window.tradingGame && window.tradingGame.supernovaGiftClaimedThisTurn;
    button.disabled = giftAlreadyClaimed;

    button.style.width = '100%';
    button.style.padding = '0.75rem';
    button.style.fontFamily = 'var(--font-primary)';
    button.style.fontWeight = '700';
    button.style.fontSize = '0.625rem';
    button.style.textTransform = 'uppercase';
    button.style.letterSpacing = '0.05em';
    button.style.color = 'var(--color--foreground)';
    button.style.backgroundColor = giftAlreadyClaimed ? 'rgba(196, 213, 188, 0.05)' : 'rgba(196, 213, 188, 0.1)';
    button.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    button.style.borderRadius = '4px';
    button.style.cursor = giftAlreadyClaimed ? 'not-allowed' : 'pointer';
    button.style.transition = 'all 0.2s';

    // Show status text
    if (giftAlreadyClaimed) {
        button.textContent = 'GIFT CLAIMED THIS TURN';
    }

    // Hover effects
    button.addEventListener('mouseenter', () => {
        if (!button.disabled) {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
        }
    });
    button.addEventListener('mouseleave', () => {
        if (!button.disabled) {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
        }
    });

    // Click handler
    button.addEventListener('click', () => {
        if (window.inventoryManager && window.tradingGame && !window.tradingGame.supernovaGiftClaimedThisTurn) {
            // Mark gift as claimed this turn
            window.tradingGame.supernovaGiftClaimedThisTurn = true;

            // Get a random commodity gift
            const randomCommodity = window.inventoryManager.getRandomSupernovaGift();

            // Add the commodity to trading game
            const success = window.tradingGame.addCommodity(randomCommodity, 1);

            if (success) {
                const commodityName = randomCommodity.charAt(0).toUpperCase() + randomCommodity.slice(1);

                // Update button state
                button.disabled = true;
                button.textContent = 'GIFT CLAIMED THIS TURN';
                button.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
                button.style.cursor = 'not-allowed';

                // Show feedback message
                const message = document.createElement('div');
                message.textContent = `Received: ${itemName}`;
                message.style.color = 'var(--color--foreground)';
                message.style.fontFamily = 'var(--font-primary)';
                message.style.fontSize = '0.75rem';
                message.style.textAlign = 'center';
                message.style.marginTop = '0.5rem';
                message.style.padding = '0.5rem';
                message.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
                message.style.borderRadius = '4px';

                // Remove message after 3 seconds
                section.appendChild(message);
                setTimeout(() => {
                    if (message.parentNode) {
                        message.parentNode.removeChild(message);
                    }
                }, 3000);

                // Update inventory panel if open
                if (window.updateInventoryPanel) {
                    window.updateInventoryPanel();
                }
            }
        }
    });

    section.appendChild(button);
    parentElement.appendChild(section);
}

// Helper function to create Supernova crafting button
function createSupernovaCraftingButton(parentElement, supernovaObject) {
    const section = document.createElement('div');
    section.style.marginTop = '1rem';
    section.style.paddingTop = '1rem';
    section.style.borderTop = '1px solid rgba(196, 213, 188, 0.2)';

    // Requirements display
    const requirementsDiv = document.createElement('div');
    requirementsDiv.style.fontSize = '0.8rem';
    requirementsDiv.style.color = 'var(--color--foreground)';
    requirementsDiv.style.marginBottom = '0.5rem';
    requirementsDiv.style.textAlign = 'center';

    requirementsDiv.innerHTML = `
        <div>Body + Soul + Spirit</div>
    `;

    const button = document.createElement('button');
    button.textContent = 'GENERATE HUMAN FORM';

    // Disable button if missing requirements
    const hasBody = window.inventoryManager && window.inventoryManager.hasItem('body');
    const hasSoul = window.inventoryManager && window.inventoryManager.hasItem('soul');
    const hasSpirit = window.inventoryManager && window.inventoryManager.hasItem('spirit');
    const canCraft = hasBody && hasSoul && hasSpirit;
    button.disabled = !canCraft;

    button.style.width = '100%';
    button.style.padding = '0.75rem';
    button.style.fontFamily = 'var(--font-primary)';
    button.style.fontWeight = '700';
    button.style.fontSize = '0.625rem';
    button.style.textTransform = 'uppercase';
    button.style.letterSpacing = '0.05em';
    button.style.color = 'var(--color--foreground)';
    button.style.backgroundColor = canCraft ? 'rgba(196, 213, 188, 0.1)' : 'rgba(100, 100, 100, 0.1)';
    button.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    button.style.borderRadius = '4px';
    button.style.cursor = canCraft ? 'pointer' : 'not-allowed';
    button.style.transition = 'all 0.2s';

    // Hover effects
    button.addEventListener('mouseenter', () => {
        if (canCraft) {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
        }
    });
    button.addEventListener('mouseleave', () => {
        if (canCraft) {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
        }
    });

    // Click handler
    button.addEventListener('click', () => {
        if (canCraft && window.inventoryManager) {
            // Remove ingredients
            window.inventoryManager.removeItem('body', 1);
            window.inventoryManager.removeItem('soul', 1);
            window.inventoryManager.removeItem('spirit', 1);

            // Randomly choose man or woman
            const result = Math.random() < 0.5 ? 'man' : 'woman';
            const success = window.inventoryManager.addItem(result, 1);

            if (success) {
                const itemDef = window.inventoryManager.itemDefinitions[result];
                const itemName = itemDef ? itemDef.name : result;

                // Update button state and requirements
                button.disabled = true;
                button.textContent = 'GENERATED';
                button.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
                button.style.cursor = 'not-allowed';

                // Update requirements display
                requirementsDiv.innerHTML = `
                    <div>Body + Soul + Spirit</div>
                `;

                // Show feedback message
                const message = document.createElement('div');
                message.textContent = `Created: ${itemName}`;
                message.style.color = 'var(--color--foreground)';
                message.style.fontFamily = 'var(--font-primary)';
                message.style.fontSize = '0.75rem';
                message.style.textAlign = 'center';
                message.style.marginTop = '0.5rem';
                message.style.padding = '0.5rem';
                message.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
                message.style.borderRadius = '4px';

                // Remove message after 3 seconds
                section.appendChild(message);
                setTimeout(() => {
                    if (message.parentNode) {
                        message.parentNode.removeChild(message);
                    }
                }, 3000);

                // Update inventory panel if open
                if (window.updateInventoryPanel) {
                    window.updateInventoryPanel();
                }
            }
        }
    });

    section.appendChild(requirementsDiv);
    section.appendChild(button);
    parentElement.appendChild(section);
}

// Helper function to create Jupiter pledge gold button and name entry
function createJupiterPledgeButton(parentElement, jupiterObject) {
    // Check for Station achievement - if earned, show different content
    const hasStationAchievement = window.scoreManager && window.scoreManager.hasAchievement('Station');
    if (hasStationAchievement) {
        // Clear existing content and show the updated message
        parentElement.innerHTML = '';
        const messageDiv = document.createElement('div');
        messageDiv.style.padding = '1rem';
        messageDiv.style.fontFamily = 'var(--font-primary)';
        messageDiv.style.fontSize = '0.875rem';
        messageDiv.style.color = 'var(--color--foreground)';
        messageDiv.style.textAlign = 'center';
        messageDiv.textContent = 'Take the 4 Elements to Monolith and Consecrate the Singularity.';
        parentElement.appendChild(messageDiv);
        return;
    }

    // Initialize pledge state if not exists
    if (!jupiterObject.hasPledgedGold) {
        jupiterObject.hasPledgedGold = false;
    }
    // No persistence - player name resets on page reload

    const section = document.createElement('div');
    section.style.marginTop = '1rem';
    section.style.paddingTop = '1rem';
    section.style.borderTop = '1px solid rgba(196, 213, 188, 0.2)';

    // If name is already entered, set explore content and return
    // The message will be displayed by renderExploreContent
    if (jupiterObject.playerName) {
        jupiterObject.exploreContent = 'Tune to Frequency 7 to unlock the Outer Planets.';
        return;
    }
    
    // If gold not pledged, show pledge button
    if (!jupiterObject.hasPledgedGold) {
        const hasGold = tradingGame && tradingGame.getCommodityQuantity('gold') >= 5;
        const button = document.createElement('button');
        button.textContent = 'PLEDGE';
        button.disabled = !hasGold;
        button.style.width = '100%';
        button.style.padding = '0.75rem';
        button.style.fontFamily = 'var(--font-primary)';
        button.style.fontWeight = '700';
        button.style.fontSize = '0.625rem';
        button.style.textTransform = 'uppercase';
        button.style.letterSpacing = '0.05em';
        button.style.color = 'var(--color--foreground)';
        button.style.backgroundColor = hasGold ? 'rgba(196, 213, 188, 0.1)' : 'rgba(196, 213, 188, 0.05)';
        button.style.border = '1px solid rgba(196, 213, 188, 0.3)';
        button.style.borderRadius = '4px';
        button.style.cursor = hasGold ? 'pointer' : 'not-allowed';
        button.style.opacity = hasGold ? '1' : '0.5';
        button.style.transition = 'all 0.2s';
        
        // Hover effects
        if (hasGold) {
            button.addEventListener('mouseenter', () => {
                if (!button.disabled) {
                    button.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
                }
            });
            button.addEventListener('mouseleave', () => {
                if (!button.disabled) {
                    button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
                }
            });
        }
        
        // Click handler
        button.addEventListener('click', () => {
            if (jupiterObject.hasPledgedGold || !hasGold) return;
            
            // Check if still has 5 gold
            const currentGold = tradingGame && tradingGame.getCommodityQuantity('gold');
            if (!currentGold || currentGold < 5) return;
            
            // Remove 5 gold
            tradingGame.commodities['gold'] = Math.max(0, tradingGame.commodities['gold'] - 5);
            jupiterObject.hasPledgedGold = true;
            
            // Update explore content
            jupiterObject.exploreContent = 'Enter your name';
            
            // Update UI - refresh inventory and explore panel
            if (window.renderInventory) {
                window.renderInventory();
            }
            if (window.updateExplorePanel) {
                window.updateExplorePanel();
            }
            
            // Visual feedback
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
            setTimeout(() => {
                button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            }, 200);
        });
        
        section.appendChild(button);
    } else {
        // Gold pledged, show name entry form
        jupiterObject.exploreContent = 'Enter your name';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Your name';
        nameInput.style.width = '100%';
        nameInput.style.padding = '0.75rem';
        nameInput.style.fontFamily = 'var(--font-primary)';
        nameInput.style.fontWeight = '700';
        nameInput.style.fontSize = '0.625rem';
        nameInput.style.textTransform = 'uppercase';
        nameInput.style.letterSpacing = '0.05em';
        nameInput.style.color = 'var(--color--foreground)';
        nameInput.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
        nameInput.style.border = '1px solid rgba(196, 213, 188, 0.3)';
        nameInput.style.borderRadius = '4px';
        nameInput.style.marginBottom = '0.5rem';
        nameInput.style.outline = 'none';
        
        const submitButton = document.createElement('button');
        submitButton.innerHTML = '→';
        submitButton.style.width = '100%';
        submitButton.style.padding = '0.75rem';
        submitButton.style.fontFamily = 'var(--font-primary)';
        submitButton.style.fontWeight = '700';
        submitButton.style.fontSize = '0.75rem';
        submitButton.style.color = 'var(--color--foreground)';
        submitButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
        submitButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
        submitButton.style.borderRadius = '4px';
        submitButton.style.cursor = 'pointer';
        submitButton.style.transition = 'all 0.2s';
        
        // Submit handler
        const handleSubmit = () => {
            const name = nameInput.value.trim();
            if (!name) return;
            
            // Save name (session only, no persistence)
            jupiterObject.playerName = name;

            // Always travel to Anja and give rewards
            jupiterObject.exploreContent = 'Tune to Frequency 7 to unlock the Outer Planets.';

            // Give 2 fuel
            if (tradingGame) {
                tradingGame.commodities['fuel'] = (tradingGame.commodities['fuel'] || 0) + 2;
            }

            // Award Ancient achievement
            if (window.scoreManager) {
                window.scoreManager.addAchievement('Ancient');
            }

            // Set persistent flag for Anja greenlisting
            localStorage.setItem('jupiterNameEntered', 'true');

            // Special case: if name is 'adem', give FTL drive
            if (name.toLowerCase() === 'adem') {
                if (window.inventoryManager) {
                    window.inventoryManager.addItem('ftl', 1);
                }
            }

            // Automatically travel to Anja
            setTimeout(() => {
                startTravel('anja');
            }, 500);
            
            // Update UI
            if (window.renderInventory) {
                window.renderInventory();
            }
            if (window.updateExplorePanel) {
                window.updateExplorePanel();
            }
        };
        
        submitButton.addEventListener('click', handleSubmit);
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSubmit();
            }
        });
        
        submitButton.addEventListener('mouseenter', () => {
            submitButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
        });
        submitButton.addEventListener('mouseleave', () => {
            submitButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
        });
        
        section.appendChild(nameInput);
        section.appendChild(submitButton);
    }
    
    parentElement.appendChild(section);
}

// Helper function to create Neptune party button
function createNeptunePartyButton(parentElement, neptuneObject) {
    // Initialize party count if not exists
    if (!neptuneObject.partyCount) {
        neptuneObject.partyCount = 0;
    }
    
    const section = document.createElement('div');
    section.style.marginTop = '1rem';
    section.style.paddingTop = '1rem';
    section.style.borderTop = '1px solid rgba(196, 213, 188, 0.2)';
    
    // If already partied 5 times, show final message
    if (neptuneObject.partyCount >= 5) {
        neptuneObject.exploreContent = 'You cannot party any harder.';
        const contentElement = document.createElement('p');
        contentElement.textContent = neptuneObject.exploreContent;
        contentElement.style.color = 'var(--color--foreground)';
        contentElement.style.opacity = '0.7';
        contentElement.style.padding = '1rem';
        section.appendChild(contentElement);
        parentElement.appendChild(section);
        return;
    }
    
    // Function to update button state based on money
    const updateButtonState = () => {
        const hasMoney = tradingGame && tradingGame.money >= 100;
        button.disabled = !hasMoney || neptuneObject.partyCount >= 5;
        button.style.backgroundColor = (hasMoney && neptuneObject.partyCount < 5) ? 'rgba(196, 213, 188, 0.1)' : 'rgba(196, 213, 188, 0.05)';
        button.style.cursor = (hasMoney && neptuneObject.partyCount < 5) ? 'pointer' : 'not-allowed';
        button.style.opacity = (hasMoney && neptuneObject.partyCount < 5) ? '1' : '0.5';
    };
    
    const button = document.createElement('button');
    button.textContent = 'PARTY';
    button.style.width = '100%';
    button.style.padding = '0.75rem';
    button.style.fontFamily = 'var(--font-primary)';
    button.style.fontWeight = '700';
    button.style.fontSize = '0.625rem';
    button.style.textTransform = 'uppercase';
    button.style.letterSpacing = '0.05em';
    button.style.color = 'var(--color--foreground)';
    button.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    button.style.borderRadius = '4px';
    button.style.transition = 'all 0.2s';
    
    // Initial button state
    updateButtonState();
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
        if (!button.disabled) {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
        }
    });
    button.addEventListener('mouseleave', () => {
        updateButtonState();
    });
    
    // Click handler
    button.addEventListener('click', () => {
        if (neptuneObject.partyCount >= 5) return;
        
        // Check if still has $100
        const currentMoney = tradingGame && tradingGame.money;
        if (!currentMoney || currentMoney < 100) {
            updateButtonState();
            return;
        }
        
        // Deduct $100
        tradingGame.money -= 100;
        neptuneObject.partyCount++;
        
        // Create confetti animation
        createConfetti();
        
        // If this was the 5th party, add Aura and show message
        if (neptuneObject.partyCount >= 5) {
            // Add 1 Aura to commodities
            if (tradingGame) {
                tradingGame.commodities['aura'] = (tradingGame.commodities['aura'] || 0) + 1;
            }
            
            // Update explore content
            neptuneObject.exploreContent = 'You cannot party any harder.';
            
            // Show temporary message that fades away
            const tempMessage = document.createElement('p');
            tempMessage.textContent = 'You have been gifted 1 Aura.';
            tempMessage.style.color = 'var(--color--foreground)';
            tempMessage.style.opacity = '1';
            tempMessage.style.padding = '1rem';
            tempMessage.style.transition = 'opacity 3s ease-out';
            section.appendChild(tempMessage);
            
            // Fade out after 3 seconds
            setTimeout(() => {
                tempMessage.style.opacity = '0';
                setTimeout(() => {
                    if (tempMessage.parentElement) {
                        tempMessage.remove();
                    }
                }, 3000);
            }, 2000);
            
            // Disable button
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
        }
        
        // Update button state
        updateButtonState();
        
        // Update UI
        if (window.renderInventory) {
            window.renderInventory();
        }
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }
        
        // Visual feedback
        button.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            updateButtonState();
        }, 200);
    });
    
    section.appendChild(button);
    parentElement.appendChild(section);
}

// Helper function to create Atlantis party button
function createAtlantisPartyButton(parentElement, atlantisObject) {
    // Initialize party count if not exists
    if (!atlantisObject.partyCount) {
        atlantisObject.partyCount = 0;
    }

    const section = document.createElement('div');
    section.style.marginTop = '1rem';
    section.style.paddingTop = '1rem';
    section.style.borderTop = '1px solid rgba(196, 213, 188, 0.2)';

    // If already partied 5 times, show final message
    if (atlantisObject.partyCount >= 5) {
        atlantisObject.exploreContent = 'You cannot party any harder.';
        const contentElement = document.createElement('p');
        contentElement.textContent = atlantisObject.exploreContent;
        contentElement.style.color = 'var(--color--foreground)';
        contentElement.style.opacity = '0.7';
        contentElement.style.padding = '1rem';
        section.appendChild(contentElement);
        parentElement.appendChild(section);
        return;
    }

    // Function to update button state based on money
    const updateButtonState = () => {
        const hasMoney = tradingGame && tradingGame.money >= 100;
        button.disabled = !hasMoney || atlantisObject.partyCount >= 5;
        button.style.backgroundColor = (hasMoney && atlantisObject.partyCount < 5) ? 'rgba(196, 213, 188, 0.1)' : 'rgba(196, 213, 188, 0.05)';
        button.style.cursor = (hasMoney && atlantisObject.partyCount < 5) ? 'pointer' : 'not-allowed';
        button.style.opacity = (hasMoney && atlantisObject.partyCount < 5) ? '1' : '0.5';
    };

    const button = document.createElement('button');
    button.textContent = 'PARTY';
    button.style.width = '100%';
    button.style.padding = '0.75rem';
    button.style.fontFamily = 'var(--font-primary)';
    button.style.fontWeight = '700';
    button.style.fontSize = '0.625rem';
    button.style.textTransform = 'uppercase';
    button.style.letterSpacing = '0.05em';
    button.style.color = 'var(--color--foreground)';
    button.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    button.style.borderRadius = '4px';
    button.style.transition = 'all 0.2s';

    // Initial button state
    updateButtonState();

    // Hover effects
    button.addEventListener('mouseenter', () => {
        if (!button.disabled) {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
        }
    });
    button.addEventListener('mouseleave', () => {
        updateButtonState();
    });

    // Click handler
    button.addEventListener('click', () => {
        if (atlantisObject.partyCount >= 5) return;

        // Check if still has $100
        const currentMoney = tradingGame && tradingGame.money;
        if (!currentMoney || currentMoney < 100) {
            updateButtonState();
            return;
        }

        // Deduct $100
        tradingGame.money -= 100;
        atlantisObject.partyCount++;

        // Create confetti animation
        createConfetti();

        // If this was the 5th party, add Aura and show message
        if (atlantisObject.partyCount >= 5) {
            // Add 1 Aura to commodities
            if (tradingGame) {
                tradingGame.commodities['aura'] = (tradingGame.commodities['aura'] || 0) + 1;
            }

            // Update explore content
            atlantisObject.exploreContent = 'You cannot party any harder.';

            // Show temporary message that fades away
            const tempMessage = document.createElement('p');
            tempMessage.textContent = 'You have been gifted 1 Aura.';
            tempMessage.style.color = 'var(--color--foreground)';
            tempMessage.style.opacity = '1';
            tempMessage.style.padding = '1rem';
            tempMessage.style.transition = 'opacity 3s ease-out';
            section.appendChild(tempMessage);

            // Fade out after 3 seconds
            setTimeout(() => {
                tempMessage.style.opacity = '0';
                setTimeout(() => {
                    if (tempMessage.parentElement) {
                        tempMessage.remove();
                    }
                }, 3000);
            }, 2000);

            // Disable button
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
        }

        // Update button state
        updateButtonState();

        // Update UI
        if (window.renderInventory) {
            window.renderInventory();
        }
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        button.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            updateButtonState();
        }, 200);
    });

    section.appendChild(button);
    parentElement.appendChild(section);
}

// Helper function to create Andromeda transmutation button
function createAndromedaTransmutationButton(parentElement, andromedaObject) {
    const section = document.createElement('div');
    section.style.marginTop = '1rem';
    section.style.paddingTop = '1rem';
    section.style.borderTop = '1px solid rgba(196, 213, 188, 0.2)';

    // Transmutation button
    const button = document.createElement('button');
    button.textContent = 'Transmute 3 Moments of Entropy to an Instant of Aura';
    button.style.width = '100%';
    button.style.padding = '0.75rem';
    button.style.fontFamily = 'var(--font-primary)';
    button.style.fontWeight = '700';
    button.style.fontSize = '0.625rem';
    button.style.textTransform = 'uppercase';
    button.style.letterSpacing = '0.05em';
    button.style.color = 'var(--color--foreground)';
    button.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    button.style.borderRadius = '4px';
    button.style.transition = 'all 0.2s';

    // Function to update button state
    const updateButtonState = () => {
        const entropyCount = tradingGame && tradingGame.commodities ? (tradingGame.commodities['entropy'] || 0) : 0;
        const hasEnoughEntropy = entropyCount >= 3;
        button.disabled = !hasEnoughEntropy;
        button.style.backgroundColor = hasEnoughEntropy ? 'rgba(196, 213, 188, 0.1)' : 'rgba(196, 213, 188, 0.05)';
        button.style.cursor = hasEnoughEntropy ? 'pointer' : 'not-allowed';
        button.style.opacity = hasEnoughEntropy ? '1' : '0.5';
    };

    // Initial button state
    updateButtonState();

    // Hover effects
    button.addEventListener('mouseenter', () => {
        if (!button.disabled) {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
        }
    });
    button.addEventListener('mouseleave', () => {
        updateButtonState();
    });

    // Click handler
    button.addEventListener('click', () => {
        if (button.disabled) return;

        const entropyCount = tradingGame && tradingGame.commodities ? (tradingGame.commodities['entropy'] || 0) : 0;
        if (entropyCount < 3) {
            updateButtonState();
            return;
        }

        // Consume 3 entropy
        if (tradingGame && tradingGame.commodities) {
            tradingGame.commodities['entropy'] = Math.max(0, (tradingGame.commodities['entropy'] || 0) - 3);
        }

        // Add 1 aura
        if (tradingGame && tradingGame.commodities) {
            tradingGame.commodities['aura'] = (tradingGame.commodities['aura'] || 0) + 1;
        }

        // Update button state
        updateButtonState();

        // Update UI
        if (window.renderInventory) {
            window.renderInventory();
        }
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        button.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            updateButtonState();
        }, 200);
    });

    section.appendChild(button);
    parentElement.appendChild(section);
}

// Helper function to create Pluto FTL crafting section
function createPlutoCraftingSection(parentElement, plutoObject) {
    const craftingSection = document.createElement('div');
    craftingSection.style.marginTop = '1rem';
    craftingSection.style.padding = '1rem';
    craftingSection.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    craftingSection.style.borderRadius = '4px';
    craftingSection.style.border = '1px solid rgba(196, 213, 188, 0.1)';

    // Inventory status
    const inventoryDiv = document.createElement('div');
    inventoryDiv.style.display = 'flex';
    inventoryDiv.style.justifyContent = 'space-around';
    inventoryDiv.style.marginBottom = '1rem';
    inventoryDiv.style.fontFamily = 'var(--font-primary)';
    inventoryDiv.style.fontSize = '0.625rem';
    inventoryDiv.style.color = 'var(--color--foreground)';
    inventoryDiv.style.opacity = '0.7';

    function updateInventoryDisplay() {
        inventoryDiv.innerHTML = '';
        const items = [
            { name: 'Antimatter', id: 'antimatter', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('antimatter') : 0 },
            { name: 'Dark Matter', id: 'dark matter', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('dark matter') : 0 },
            { name: 'Gold', id: 'gold', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('gold') : 0 }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    updateInventoryDisplay();
    craftingSection.appendChild(inventoryDiv);

    // Build button
    const buildButton = document.createElement('button');
    buildButton.textContent = 'BUILD FTL DRIVE';
    buildButton.style.width = '100%';
    buildButton.style.padding = '0.75rem';
    buildButton.style.fontFamily = 'var(--font-primary)';
    buildButton.style.fontWeight = '700';
    buildButton.style.fontSize = '0.625rem';
    buildButton.style.textTransform = 'uppercase';
    buildButton.style.letterSpacing = '0.05em';
    buildButton.style.color = 'var(--color--foreground)';
    buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    buildButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    buildButton.style.borderRadius = '4px';
    buildButton.style.cursor = 'pointer';
    buildButton.style.transition = 'all 0.2s';

    // Check if player has required items
    function checkRequirements() {
        const hasAntimatter = window.tradingGame && window.tradingGame.getCommodityQuantity('antimatter') >= 1;
        const hasDarkMatter = window.tradingGame && window.tradingGame.getCommodityQuantity('dark matter') >= 1;
        const hasGold = window.tradingGame && window.tradingGame.getCommodityQuantity('gold') >= 1;

        const canCraft = hasAntimatter && hasDarkMatter && hasGold;
        buildButton.disabled = !canCraft;

        if (canCraft) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            buildButton.style.cursor = 'pointer';
            buildButton.style.opacity = '1';
        } else {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            buildButton.style.cursor = 'not-allowed';
            buildButton.style.opacity = '0.5';
        }
    }

    checkRequirements();

    // Build button click handler
    buildButton.addEventListener('click', () => {
        if (buildButton.disabled) return;

        // Consume items
        if (window.tradingGame) {
            window.tradingGame.commodities['antimatter'] -= 1;
            window.tradingGame.commodities['dark matter'] -= 1;
            window.tradingGame.commodities['gold'] -= 1;
        }

        // Add FTL drive
        window.inventoryManager.addItem('ftl', 1);

        // Update displays
        updateInventoryDisplay();
        checkRequirements();

        // Refresh explore panel (updates inventory and crafting requirements)
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            checkRequirements();
        }, 200);
    });

    // Hover effects
    buildButton.addEventListener('mouseenter', () => {
        if (!buildButton.disabled) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    buildButton.addEventListener('mouseleave', () => {
        if (!buildButton.disabled) {
            checkRequirements();
        }
    });

    craftingSection.appendChild(buildButton);
    parentElement.appendChild(craftingSection);
}

// Helper function to create Pluto weapons crafting section
function createPlutoWeaponsCraftingSection(parentElement, plutoObject) {
    const craftingSection = document.createElement('div');
    craftingSection.style.marginTop = '1rem';
    craftingSection.style.padding = '1rem';
    craftingSection.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    craftingSection.style.borderRadius = '4px';
    craftingSection.style.border = '1px solid rgba(196, 213, 188, 0.1)';

    // Inventory status
    const inventoryDiv = document.createElement('div');
    inventoryDiv.style.display = 'flex';
    inventoryDiv.style.justifyContent = 'space-around';
    inventoryDiv.style.marginBottom = '1rem';
    inventoryDiv.style.fontFamily = 'var(--font-primary)';
    inventoryDiv.style.fontSize = '0.625rem';
    inventoryDiv.style.color = 'var(--color--foreground)';
    inventoryDiv.style.opacity = '0.7';

    function updateInventoryDisplay() {
        inventoryDiv.innerHTML = '';
        const items = [
            { name: 'Ore', id: 'ore', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('ore') : 0 },
            { name: 'Gold', id: 'gold', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('gold') : 0 },
            { name: 'Fuel', id: 'fuel', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('fuel') : 0 }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    updateInventoryDisplay();
    craftingSection.appendChild(inventoryDiv);

    // Build button
    const buildButton = document.createElement('button');
    buildButton.textContent = 'BUILD WEAPONS';
    buildButton.style.width = '100%';
    buildButton.style.padding = '0.75rem';
    buildButton.style.fontFamily = 'var(--font-primary)';
    buildButton.style.fontWeight = '700';
    buildButton.style.fontSize = '0.625rem';
    buildButton.style.textTransform = 'uppercase';
    buildButton.style.letterSpacing = '0.05em';
    buildButton.style.color = 'var(--color--foreground)';
    buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    buildButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    buildButton.style.borderRadius = '4px';
    buildButton.style.cursor = 'pointer';
    buildButton.style.transition = 'all 0.2s';

    // Check if player has required items
    function checkRequirements() {
        const hasOre = window.tradingGame && window.tradingGame.getCommodityQuantity('ore') >= 1;
        const hasGold = window.tradingGame && window.tradingGame.getCommodityQuantity('gold') >= 1;
        const hasFuel = window.tradingGame && window.tradingGame.getCommodityQuantity('fuel') >= 1;

        const canCraft = hasOre && hasGold && hasFuel;
        buildButton.disabled = !canCraft;

        if (canCraft) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            buildButton.style.cursor = 'pointer';
            buildButton.style.opacity = '1';
        } else {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            buildButton.style.cursor = 'not-allowed';
            buildButton.style.opacity = '0.5';
        }
    }

    checkRequirements();

    // Build button click handler
    buildButton.addEventListener('click', () => {
        if (buildButton.disabled) return;

        // Consume items
        if (window.tradingGame) {
            window.tradingGame.commodities['ore'] -= 1;
            window.tradingGame.commodities['gold'] -= 1;
            window.tradingGame.commodities['fuel'] -= 1;
        }

        // Add weapons
        window.inventoryManager.addItem('weapons', 1);

        // Update displays
        updateInventoryDisplay();
        checkRequirements();

        // Refresh explore panel (updates inventory and crafting requirements)
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            checkRequirements();
        }, 200);
    });

    // Hover effects
    buildButton.addEventListener('mouseenter', () => {
        if (!buildButton.disabled) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    buildButton.addEventListener('mouseleave', () => {
        if (!buildButton.disabled) {
            checkRequirements();
        }
    });

    craftingSection.appendChild(buildButton);
    parentElement.appendChild(craftingSection);
}

// Helper function to create Pluto robot crafting section
function createPlutoRobotCraftingSection(parentElement, plutoObject) {
    const craftingSection = document.createElement('div');
    craftingSection.style.marginTop = '1rem';
    craftingSection.style.padding = '1rem';
    craftingSection.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    craftingSection.style.borderRadius = '4px';
    craftingSection.style.border = '1px solid rgba(196, 213, 188, 0.1)';

    // Inventory status
    const inventoryDiv = document.createElement('div');
    inventoryDiv.style.display = 'flex';
    inventoryDiv.style.justifyContent = 'space-around';
    inventoryDiv.style.marginBottom = '1rem';
    inventoryDiv.style.fontFamily = 'var(--font-primary)';
    inventoryDiv.style.fontSize = '0.625rem';
    inventoryDiv.style.color = 'var(--color--foreground)';
    inventoryDiv.style.opacity = '0.7';

    function updateInventoryDisplay() {
        inventoryDiv.innerHTML = '';
        const items = [
            { name: 'Iron', id: 'iron', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('iron') : 0 },
            { name: 'Ore', id: 'ore', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('ore') : 0 },
            { name: 'Gold', id: 'gold', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('gold') : 0 }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    updateInventoryDisplay();
    craftingSection.appendChild(inventoryDiv);

    // Build button
    const buildButton = document.createElement('button');
    buildButton.textContent = 'BUILD ROBOT';
    buildButton.style.width = '100%';
    buildButton.style.padding = '0.75rem';
    buildButton.style.fontFamily = 'var(--font-primary)';
    buildButton.style.fontWeight = '700';
    buildButton.style.fontSize = '0.625rem';
    buildButton.style.textTransform = 'uppercase';
    buildButton.style.letterSpacing = '0.05em';
    buildButton.style.color = 'var(--color--foreground)';
    buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    buildButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    buildButton.style.borderRadius = '4px';
    buildButton.style.cursor = 'pointer';
    buildButton.style.transition = 'all 0.2s';

    // Check if player has required items
    function checkRequirements() {
        const hasIron = window.tradingGame && window.tradingGame.getCommodityQuantity('iron') >= 1;
        const hasOre = window.tradingGame && window.tradingGame.getCommodityQuantity('ore') >= 1;
        const hasGold = window.tradingGame && window.tradingGame.getCommodityQuantity('gold') >= 1;

        const canCraft = hasIron && hasOre && hasGold;
        buildButton.disabled = !canCraft;

        if (canCraft) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            buildButton.style.cursor = 'pointer';
            buildButton.style.opacity = '1';
        } else {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            buildButton.style.cursor = 'not-allowed';
            buildButton.style.opacity = '0.5';
        }
    }

    checkRequirements();

    // Build button click handler
    buildButton.addEventListener('click', () => {
        if (buildButton.disabled) return;

        // Consume items
        if (window.tradingGame) {
            window.tradingGame.commodities['iron'] -= 1;
            window.tradingGame.commodities['ore'] -= 1;
            window.tradingGame.commodities['gold'] -= 1;
        }

        // Add robot
        window.inventoryManager.addItem('robot', 1);

        // Update displays
        updateInventoryDisplay();
        checkRequirements();

        // Refresh explore panel (updates inventory and crafting requirements)
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            checkRequirements();
        }, 200);
    });

    // Hover effects
    buildButton.addEventListener('mouseenter', () => {
        if (!buildButton.disabled) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    buildButton.addEventListener('mouseleave', () => {
        if (!buildButton.disabled) {
            checkRequirements();
        }
    });

    craftingSection.appendChild(buildButton);
    parentElement.appendChild(craftingSection);
}

// Helper function to create Pleiades crafting section (slave + iron + aura = man)
function createPleiadesCraftingSection(parentElement, pleiadesObject) {
    const craftingSection = document.createElement('div');
    craftingSection.style.marginTop = '1rem';
    craftingSection.style.padding = '1rem';
    craftingSection.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    craftingSection.style.borderRadius = '4px';
    craftingSection.style.border = '1px solid rgba(196, 213, 188, 0.1)';

    // Inventory status
    const inventoryDiv = document.createElement('div');
    inventoryDiv.style.display = 'flex';
    inventoryDiv.style.justifyContent = 'space-around';
    inventoryDiv.style.marginBottom = '1rem';
    inventoryDiv.style.fontFamily = 'var(--font-primary)';
    inventoryDiv.style.fontSize = '0.625rem';
    inventoryDiv.style.color = 'var(--color--foreground)';
    inventoryDiv.style.opacity = '0.7';

    function updateInventoryDisplay() {
        inventoryDiv.innerHTML = '';
        const items = [
            { name: 'Slave', id: 'slaves', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('slaves') : 0 },
            { name: 'Iron', id: 'iron', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('iron') : 0 },
            { name: 'Aura', id: 'aura', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('aura') : 0 }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    updateInventoryDisplay();
    craftingSection.appendChild(inventoryDiv);

    // Build button
    const buildButton = document.createElement('button');
    buildButton.textContent = 'CREATE MAN';
    buildButton.style.width = '100%';
    buildButton.style.padding = '0.75rem';
    buildButton.style.fontFamily = 'var(--font-primary)';
    buildButton.style.fontWeight = '700';
    buildButton.style.fontSize = '0.625rem';
    buildButton.style.textTransform = 'uppercase';
    buildButton.style.letterSpacing = '0.05em';
    buildButton.style.color = 'var(--color--foreground)';
    buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    buildButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    buildButton.style.borderRadius = '4px';
    buildButton.style.cursor = 'pointer';
    buildButton.style.transition = 'all 0.2s';

    // Check if player has required items
    function checkRequirements() {
        const hasSlave = window.tradingGame && window.tradingGame.getCommodityQuantity('slaves') >= 1;
        const hasIron = window.tradingGame && window.tradingGame.getCommodityQuantity('iron') >= 1;
        const hasAura = window.tradingGame && window.tradingGame.getCommodityQuantity('aura') >= 1;

        const canCraft = hasSlave && hasIron && hasAura;
        buildButton.disabled = !canCraft;

        if (canCraft) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            buildButton.style.cursor = 'pointer';
            buildButton.style.opacity = '1';
        } else {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            buildButton.style.cursor = 'not-allowed';
            buildButton.style.opacity = '0.5';
        }
    }

    checkRequirements();

    // Build button click handler
    buildButton.addEventListener('click', () => {
        if (buildButton.disabled) return;

        // Consume items
        if (window.tradingGame) {
            window.tradingGame.commodities['slaves'] -= 1;
            window.tradingGame.commodities['iron'] -= 1;
            window.tradingGame.commodities['aura'] -= 1;
        }

        // Add Man
        window.inventoryManager.addItem('man', 1);

        // Update displays
        updateInventoryDisplay();
        checkRequirements();

        // Refresh explore panel (updates inventory and crafting requirements)
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            checkRequirements();
        }, 200);
    });

    // Hover effects
    buildButton.addEventListener('mouseenter', () => {
        if (!buildButton.disabled) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    buildButton.addEventListener('mouseleave', () => {
        if (!buildButton.disabled) {
            checkRequirements();
        }
    });

    craftingSection.appendChild(buildButton);
    parentElement.appendChild(craftingSection);
}

// Helper function to create Pleiades weapons crafting section (slave + gold + aura = woman)
function createPleiadesWeaponsCraftingSection(parentElement, pleiadesObject) {
    const craftingSection = document.createElement('div');
    craftingSection.style.marginTop = '1rem';
    craftingSection.style.padding = '1rem';
    craftingSection.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    craftingSection.style.borderRadius = '4px';
    craftingSection.style.border = '1px solid rgba(196, 213, 188, 0.1)';

    // Inventory status
    const inventoryDiv = document.createElement('div');
    inventoryDiv.style.display = 'flex';
    inventoryDiv.style.justifyContent = 'space-around';
    inventoryDiv.style.marginBottom = '1rem';
    inventoryDiv.style.fontFamily = 'var(--font-primary)';
    inventoryDiv.style.fontSize = '0.625rem';
    inventoryDiv.style.color = 'var(--color--foreground)';
    inventoryDiv.style.opacity = '0.7';

    function updateInventoryDisplay() {
        inventoryDiv.innerHTML = '';
        const items = [
            { name: 'Slave', id: 'slaves', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('slaves') : 0 },
            { name: 'Gold', id: 'gold', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('gold') : 0 },
            { name: 'Aura', id: 'aura', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('aura') : 0 }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    updateInventoryDisplay();
    craftingSection.appendChild(inventoryDiv);

    // Build button
    const buildButton = document.createElement('button');
    buildButton.textContent = 'CREATE WOMAN';
    buildButton.style.width = '100%';
    buildButton.style.padding = '0.75rem';
    buildButton.style.fontFamily = 'var(--font-primary)';
    buildButton.style.fontWeight = '700';
    buildButton.style.fontSize = '0.625rem';
    buildButton.style.textTransform = 'uppercase';
    buildButton.style.letterSpacing = '0.05em';
    buildButton.style.color = 'var(--color--foreground)';
    buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    buildButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    buildButton.style.borderRadius = '4px';
    buildButton.style.cursor = 'pointer';
    buildButton.style.transition = 'all 0.2s';

    // Check if player has required items
    function checkRequirements() {
        const hasSlave = window.tradingGame && window.tradingGame.getCommodityQuantity('slaves') >= 1;
        const hasGold = window.tradingGame && window.tradingGame.getCommodityQuantity('gold') >= 1;
        const hasAura = window.tradingGame && window.tradingGame.getCommodityQuantity('aura') >= 1;

        const canCraft = hasSlave && hasGold && hasAura;
        buildButton.disabled = !canCraft;

        if (canCraft) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            buildButton.style.cursor = 'pointer';
            buildButton.style.opacity = '1';
        } else {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            buildButton.style.cursor = 'not-allowed';
            buildButton.style.opacity = '0.5';
        }
    }

    checkRequirements();

    // Build button click handler
    buildButton.addEventListener('click', () => {
        if (buildButton.disabled) return;

        // Consume items
        if (window.tradingGame) {
            window.tradingGame.commodities['slaves'] -= 1;
            window.tradingGame.commodities['gold'] -= 1;
            window.tradingGame.commodities['aura'] -= 1;
        }

        // Add Woman
        window.inventoryManager.addItem('woman', 1);

        // Update displays
        updateInventoryDisplay();
        checkRequirements();

        // Refresh explore panel (updates inventory and crafting requirements)
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            checkRequirements();
        }, 200);
    });

    // Hover effects
    buildButton.addEventListener('mouseenter', () => {
        if (!buildButton.disabled) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    buildButton.addEventListener('mouseleave', () => {
        if (!buildButton.disabled) {
            checkRequirements();
        }
    });

    craftingSection.appendChild(buildButton);
    parentElement.appendChild(craftingSection);
}

// Helper function to create Pleiades robot crafting section (man + woman + aura = baby)
function createPleiadesRobotCraftingSection(parentElement, pleiadesObject) {
    const craftingSection = document.createElement('div');
    craftingSection.style.marginTop = '1rem';
    craftingSection.style.padding = '1rem';
    craftingSection.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    craftingSection.style.borderRadius = '4px';
    craftingSection.style.border = '1px solid rgba(196, 213, 188, 0.1)';

    // Inventory status
    const inventoryDiv = document.createElement('div');
    inventoryDiv.style.display = 'flex';
    inventoryDiv.style.justifyContent = 'space-around';
    inventoryDiv.style.marginBottom = '1rem';
    inventoryDiv.style.fontFamily = 'var(--font-primary)';
    inventoryDiv.style.fontSize = '0.625rem';
    inventoryDiv.style.color = 'var(--color--foreground)';
    inventoryDiv.style.opacity = '0.7';

    function updateInventoryDisplay() {
        inventoryDiv.innerHTML = '';
        const items = [
            { name: 'Man', id: 'man', quantity: window.inventoryManager ? window.inventoryManager.getItemQuantity('man') : 0 },
            { name: 'Woman', id: 'woman', quantity: window.inventoryManager ? window.inventoryManager.getItemQuantity('woman') : 0 },
            { name: 'Aura', id: 'aura', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('aura') : 0 }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    updateInventoryDisplay();
    craftingSection.appendChild(inventoryDiv);

    // Build button
    const buildButton = document.createElement('button');
    buildButton.textContent = 'CREATE BABY';
    buildButton.style.width = '100%';
    buildButton.style.padding = '0.75rem';
    buildButton.style.fontFamily = 'var(--font-primary)';
    buildButton.style.fontWeight = '700';
    buildButton.style.fontSize = '0.625rem';
    buildButton.style.textTransform = 'uppercase';
    buildButton.style.letterSpacing = '0.05em';
    buildButton.style.color = 'var(--color--foreground)';
    buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    buildButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    buildButton.style.borderRadius = '4px';
    buildButton.style.cursor = 'pointer';
    buildButton.style.transition = 'all 0.2s';

    // Check if player has required items
    function checkRequirements() {
        const hasMan = window.inventoryManager && window.inventoryManager.hasItem('man', 1);
        const hasWoman = window.inventoryManager && window.inventoryManager.hasItem('woman', 1);
        const hasAura = window.tradingGame && window.tradingGame.getCommodityQuantity('aura') >= 1;

        const canCraft = hasMan && hasWoman && hasAura;
        buildButton.disabled = !canCraft;

        if (canCraft) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            buildButton.style.cursor = 'pointer';
            buildButton.style.opacity = '1';
        } else {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            buildButton.style.cursor = 'not-allowed';
            buildButton.style.opacity = '0.5';
        }
    }

    checkRequirements();

    // Build button click handler
    buildButton.addEventListener('click', () => {
        if (buildButton.disabled) return;

        // Consume items
        if (window.inventoryManager) {
            window.inventoryManager.removeItem('man', 1);
            window.inventoryManager.removeItem('woman', 1);
        }
        if (window.tradingGame) {
            window.tradingGame.commodities['aura'] -= 1;
        }

        // Add Baby
        window.inventoryManager.addItem('baby', 1);

        // Update displays
        updateInventoryDisplay();
        checkRequirements();

        // Refresh explore panel (updates inventory and crafting requirements)
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            checkRequirements();
        }, 200);
    });

    // Hover effects
    buildButton.addEventListener('mouseenter', () => {
        if (!buildButton.disabled) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    buildButton.addEventListener('mouseleave', () => {
        if (!buildButton.disabled) {
            checkRequirements();
        }
    });

    craftingSection.appendChild(buildButton);
    parentElement.appendChild(craftingSection);
}

// Helper function to create Large Magellanic Cloud Past crafting section (entropy + alpha + iron = past)
function createLargeMagellanicCloudPastCraftingSection(parentElement, lmcObject) {
    const craftingSection = document.createElement('div');
    craftingSection.style.marginTop = '1rem';
    craftingSection.style.padding = '1rem';
    craftingSection.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    craftingSection.style.borderRadius = '4px';
    craftingSection.style.border = '1px solid rgba(196, 213, 188, 0.1)';

    // Inventory status
    const inventoryDiv = document.createElement('div');
    inventoryDiv.style.display = 'flex';
    inventoryDiv.style.justifyContent = 'space-around';
    inventoryDiv.style.marginBottom = '1rem';
    inventoryDiv.style.fontFamily = 'var(--font-primary)';
    inventoryDiv.style.fontSize = '0.625rem';
    inventoryDiv.style.color = 'var(--color--foreground)';
    inventoryDiv.style.opacity = '0.7';

    function updateInventoryDisplay() {
        inventoryDiv.innerHTML = '';
        const items = [
            { name: 'Entropy', id: 'entropy', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('entropy') : 0 },
            { name: 'Alpha', id: 'alpha', quantity: window.inventoryManager ? window.inventoryManager.getItem('alpha')?.quantity || 0 : 0 },
            { name: 'Iron', id: 'iron', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('iron') : 0 }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
                <div>${item.quantity}</div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    updateInventoryDisplay();
    craftingSection.appendChild(inventoryDiv);

    // Build button
    const buildButton = document.createElement('button');
    buildButton.textContent = 'FORGE PAST';
    buildButton.style.width = '100%';
    buildButton.style.padding = '0.75rem';
    buildButton.style.fontFamily = 'var(--font-primary)';
    buildButton.style.fontWeight = '700';
    buildButton.style.fontSize = '0.625rem';
    buildButton.style.textTransform = 'uppercase';
    buildButton.style.letterSpacing = '0.05em';
    buildButton.style.color = 'var(--color--foreground)';
    buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    buildButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    buildButton.style.borderRadius = '4px';
    buildButton.style.cursor = 'pointer';
    buildButton.style.transition = 'all 0.2s';

    // Check if player has required items
    function checkRequirements() {
        const hasEntropy = window.tradingGame && window.tradingGame.getCommodityQuantity('entropy') >= 1;
        const hasAlpha = window.inventoryManager && window.inventoryManager.hasItem('alpha', 1);
        const hasIron = window.tradingGame && window.tradingGame.getCommodityQuantity('iron') >= 1;

        const canCraft = hasEntropy && hasAlpha && hasIron;
        buildButton.disabled = !canCraft;

        if (canCraft) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            buildButton.style.cursor = 'pointer';
            buildButton.style.opacity = '1';
        } else {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            buildButton.style.cursor = 'not-allowed';
            buildButton.style.opacity = '0.5';
        }
    }

    checkRequirements();

    // Build button click handler
    buildButton.addEventListener('click', () => {
        if (buildButton.disabled) return;

        // Consume items
        if (window.tradingGame) {
            window.tradingGame.commodities['entropy'] -= 1;
            window.tradingGame.commodities['iron'] -= 1;
        }
        if (window.inventoryManager) {
            window.inventoryManager.removeItem('alpha', 1);
        }

        // Add Past
        if (window.inventoryManager) {
            window.inventoryManager.addItem('past', 1);
        }

        // Update displays
        updateInventoryDisplay();
        checkRequirements();

        // Refresh explore panel (updates inventory and crafting requirements)
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            checkRequirements();
        }, 200);
    });

    // Hover effects
    buildButton.addEventListener('mouseenter', () => {
        if (!buildButton.disabled) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    buildButton.addEventListener('mouseleave', () => {
        if (!buildButton.disabled) {
            checkRequirements();
        }
    });

    craftingSection.appendChild(buildButton);
    parentElement.appendChild(craftingSection);
}

// Helper function to create Large Magellanic Cloud Present crafting section (entropy + beta + gold = present)
function createLargeMagellanicCloudPresentCraftingSection(parentElement, lmcObject) {
    const craftingSection = document.createElement('div');
    craftingSection.style.marginTop = '1rem';
    craftingSection.style.padding = '1rem';
    craftingSection.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    craftingSection.style.borderRadius = '4px';
    craftingSection.style.border = '1px solid rgba(196, 213, 188, 0.1)';

    // Inventory status
    const inventoryDiv = document.createElement('div');
    inventoryDiv.style.display = 'flex';
    inventoryDiv.style.justifyContent = 'space-around';
    inventoryDiv.style.marginBottom = '1rem';
    inventoryDiv.style.fontFamily = 'var(--font-primary)';
    inventoryDiv.style.fontSize = '0.625rem';
    inventoryDiv.style.color = 'var(--color--foreground)';
    inventoryDiv.style.opacity = '0.7';

    function updateInventoryDisplay() {
        inventoryDiv.innerHTML = '';
        const items = [
            { name: 'Entropy', id: 'entropy', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('entropy') : 0 },
            { name: 'Beta', id: 'beta', quantity: window.inventoryManager ? window.inventoryManager.getItem('beta')?.quantity || 0 : 0 },
            { name: 'Gold', id: 'gold', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('gold') : 0 }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
                <div>${item.quantity}</div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    updateInventoryDisplay();
    craftingSection.appendChild(inventoryDiv);

    // Build button
    const buildButton = document.createElement('button');
    buildButton.textContent = 'FORGE PRESENT';
    buildButton.style.width = '100%';
    buildButton.style.padding = '0.75rem';
    buildButton.style.fontFamily = 'var(--font-primary)';
    buildButton.style.fontWeight = '700';
    buildButton.style.fontSize = '0.625rem';
    buildButton.style.textTransform = 'uppercase';
    buildButton.style.letterSpacing = '0.05em';
    buildButton.style.color = 'var(--color--foreground)';
    buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    buildButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    buildButton.style.borderRadius = '4px';
    buildButton.style.cursor = 'pointer';
    buildButton.style.transition = 'all 0.2s';

    // Check if player has required items
    function checkRequirements() {
        const hasEntropy = window.tradingGame && window.tradingGame.getCommodityQuantity('entropy') >= 1;
        const hasBeta = window.inventoryManager && window.inventoryManager.hasItem('beta', 1);
        const hasGold = window.tradingGame && window.tradingGame.getCommodityQuantity('gold') >= 1;

        const canCraft = hasEntropy && hasBeta && hasGold;
        buildButton.disabled = !canCraft;

        if (canCraft) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            buildButton.style.cursor = 'pointer';
            buildButton.style.opacity = '1';
        } else {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            buildButton.style.cursor = 'not-allowed';
            buildButton.style.opacity = '0.5';
        }
    }

    checkRequirements();

    // Build button click handler
    buildButton.addEventListener('click', () => {
        if (buildButton.disabled) return;

        // Consume items
        if (window.tradingGame) {
            window.tradingGame.commodities['entropy'] -= 1;
            window.tradingGame.commodities['gold'] -= 1;
        }
        if (window.inventoryManager) {
            window.inventoryManager.removeItem('beta', 1);
        }

        // Add Present
        if (window.inventoryManager) {
            window.inventoryManager.addItem('present', 1);
        }

        // Update displays
        updateInventoryDisplay();
        checkRequirements();

        // Refresh explore panel (updates inventory and crafting requirements)
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            checkRequirements();
        }, 200);
    });

    // Hover effects
    buildButton.addEventListener('mouseenter', () => {
        if (!buildButton.disabled) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    buildButton.addEventListener('mouseleave', () => {
        if (!buildButton.disabled) {
            checkRequirements();
        }
    });

    craftingSection.appendChild(buildButton);
    parentElement.appendChild(craftingSection);
}

// Helper function to create Large Magellanic Cloud Future crafting section (entropy + gamma + fuel = future)
function createLargeMagellanicCloudFutureCraftingSection(parentElement, lmcObject) {
    const craftingSection = document.createElement('div');
    craftingSection.style.marginTop = '1rem';
    craftingSection.style.padding = '1rem';
    craftingSection.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    craftingSection.style.borderRadius = '4px';
    craftingSection.style.border = '1px solid rgba(196, 213, 188, 0.1)';

    // Inventory status
    const inventoryDiv = document.createElement('div');
    inventoryDiv.style.display = 'flex';
    inventoryDiv.style.justifyContent = 'space-around';
    inventoryDiv.style.marginBottom = '1rem';
    inventoryDiv.style.fontFamily = 'var(--font-primary)';
    inventoryDiv.style.fontSize = '0.625rem';
    inventoryDiv.style.color = 'var(--color--foreground)';
    inventoryDiv.style.opacity = '0.7';

    function updateInventoryDisplay() {
        inventoryDiv.innerHTML = '';
        const items = [
            { name: 'Entropy', id: 'entropy', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('entropy') : 0 },
            { name: 'Gamma', id: 'gamma', quantity: window.inventoryManager ? window.inventoryManager.getItem('gamma')?.quantity || 0 : 0 },
            { name: 'Fuel', id: 'fuel', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('fuel') : 0 }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
                <div>${item.quantity}</div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    updateInventoryDisplay();
    craftingSection.appendChild(inventoryDiv);

    // Build button
    const buildButton = document.createElement('button');
    buildButton.textContent = 'FORGE FUTURE';
    buildButton.style.width = '100%';
    buildButton.style.padding = '0.75rem';
    buildButton.style.fontFamily = 'var(--font-primary)';
    buildButton.style.fontWeight = '700';
    buildButton.style.fontSize = '0.625rem';
    buildButton.style.textTransform = 'uppercase';
    buildButton.style.letterSpacing = '0.05em';
    buildButton.style.color = 'var(--color--foreground)';
    buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    buildButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    buildButton.style.borderRadius = '4px';
    buildButton.style.cursor = 'pointer';
    buildButton.style.transition = 'all 0.2s';

    // Check if player has required items
    function checkRequirements() {
        const hasEntropy = window.tradingGame && window.tradingGame.getCommodityQuantity('entropy') >= 1;
        const hasGamma = window.inventoryManager && window.inventoryManager.hasItem('gamma', 1);
        const hasFuel = window.tradingGame && window.tradingGame.getCommodityQuantity('fuel') >= 1;

        const canCraft = hasEntropy && hasGamma && hasFuel;
        buildButton.disabled = !canCraft;

        if (canCraft) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            buildButton.style.cursor = 'pointer';
            buildButton.style.opacity = '1';
        } else {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            buildButton.style.cursor = 'not-allowed';
            buildButton.style.opacity = '0.5';
        }
    }

    checkRequirements();

    // Build button click handler
    buildButton.addEventListener('click', () => {
        if (buildButton.disabled) return;

        // Consume items
        if (window.tradingGame) {
            window.tradingGame.commodities['entropy'] -= 1;
            window.tradingGame.commodities['fuel'] -= 1;
        }
        if (window.inventoryManager) {
            window.inventoryManager.removeItem('gamma', 1);
        }

        // Add Future
        if (window.inventoryManager) {
            window.inventoryManager.addItem('future', 1);
        }

        // Update displays
        updateInventoryDisplay();
        checkRequirements();

        // Refresh explore panel (updates inventory and crafting requirements)
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            checkRequirements();
        }, 200);
    });

    // Hover effects
    buildButton.addEventListener('mouseenter', () => {
        if (!buildButton.disabled) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    buildButton.addEventListener('mouseleave', () => {
        if (!buildButton.disabled) {
            checkRequirements();
        }
    });

    craftingSection.appendChild(buildButton);
    parentElement.appendChild(craftingSection);
}

// Helper function to create Milky Way Alpha crafting section
function createMilkyWayAlphaCraftingSection(parentElement, milkyWayObject) {
    const craftingSection = document.createElement('div');
    craftingSection.style.marginTop = '1rem';
    craftingSection.style.padding = '1rem';
    craftingSection.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    craftingSection.style.borderRadius = '4px';
    craftingSection.style.border = '1px solid rgba(196, 213, 188, 0.1)';

    // Inventory status
    const inventoryDiv = document.createElement('div');
    inventoryDiv.style.display = 'flex';
    inventoryDiv.style.justifyContent = 'space-around';
    inventoryDiv.style.marginBottom = '1rem';
    inventoryDiv.style.fontFamily = 'var(--font-primary)';
    inventoryDiv.style.fontSize = '0.625rem';
    inventoryDiv.style.color = 'var(--color--foreground)';
    inventoryDiv.style.opacity = '0.7';

    function updateInventoryDisplay() {
        inventoryDiv.innerHTML = '';
        const items = [
            { name: 'Antimatter', id: 'antimatter', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('antimatter') : 0 },
            { name: 'Iron', id: 'iron', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('iron') : 0 },
            { name: 'Robot', id: 'robot', quantity: window.inventoryManager ? window.inventoryManager.getItemQuantity('robot') : 0 }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    updateInventoryDisplay();
    craftingSection.appendChild(inventoryDiv);

    // Build button
    const buildButton = document.createElement('button');
    buildButton.textContent = 'CRAFT ALPHA';
    buildButton.style.width = '100%';
    buildButton.style.padding = '0.75rem';
    buildButton.style.fontFamily = 'var(--font-primary)';
    buildButton.style.fontWeight = '700';
    buildButton.style.fontSize = '0.625rem';
    buildButton.style.textTransform = 'uppercase';
    buildButton.style.letterSpacing = '0.05em';
    buildButton.style.color = 'var(--color--foreground)';
    buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    buildButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    buildButton.style.borderRadius = '4px';
    buildButton.style.cursor = 'pointer';
    buildButton.style.transition = 'all 0.2s';

    // Check if player has required items
    function checkRequirements() {
        const hasAntimatter = window.tradingGame && window.tradingGame.getCommodityQuantity('antimatter') >= 1;
        const hasIron = window.tradingGame && window.tradingGame.getCommodityQuantity('iron') >= 1;
        const hasRobot = window.inventoryManager && window.inventoryManager.hasItem('robot', 1);

        const canCraft = hasAntimatter && hasIron && hasRobot;
        buildButton.disabled = !canCraft;

        if (canCraft) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            buildButton.style.cursor = 'pointer';
            buildButton.style.opacity = '1';
        } else {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            buildButton.style.cursor = 'not-allowed';
            buildButton.style.opacity = '0.5';
        }
    }

    checkRequirements();

    // Build button click handler
    buildButton.addEventListener('click', () => {
        if (buildButton.disabled) return;

        // Consume items
        if (window.tradingGame) {
            window.tradingGame.commodities['antimatter'] -= 1;
            window.tradingGame.commodities['iron'] -= 1;
        }
        if (window.inventoryManager) {
            window.inventoryManager.removeItem('robot', 1);
        }

        // Add Alpha
        window.inventoryManager.addItem('alpha', 1);

        // Update displays
        updateInventoryDisplay();
        checkRequirements();

        // Refresh explore panel (updates inventory and crafting requirements)
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            checkRequirements();
        }, 200);
    });

    // Hover effects
    buildButton.addEventListener('mouseenter', () => {
        if (!buildButton.disabled) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    buildButton.addEventListener('mouseleave', () => {
        if (!buildButton.disabled) {
            checkRequirements();
        }
    });

    craftingSection.appendChild(buildButton);
    parentElement.appendChild(craftingSection);
}

// Helper function to create Milky Way Beta crafting section
function createMilkyWayBetaCraftingSection(parentElement, milkyWayObject) {
    const craftingSection = document.createElement('div');
    craftingSection.style.marginTop = '1rem';
    craftingSection.style.padding = '1rem';
    craftingSection.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    craftingSection.style.borderRadius = '4px';
    craftingSection.style.border = '1px solid rgba(196, 213, 188, 0.1)';

    // Inventory status
    const inventoryDiv = document.createElement('div');
    inventoryDiv.style.display = 'flex';
    inventoryDiv.style.justifyContent = 'space-around';
    inventoryDiv.style.marginBottom = '1rem';
    inventoryDiv.style.fontFamily = 'var(--font-primary)';
    inventoryDiv.style.fontSize = '0.625rem';
    inventoryDiv.style.color = 'var(--color--foreground)';
    inventoryDiv.style.opacity = '0.7';

    function updateInventoryDisplay() {
        inventoryDiv.innerHTML = '';
        const items = [
            { name: 'Dark Matter', id: 'dark matter', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('dark matter') : 0 },
            { name: 'Gold', id: 'gold', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('gold') : 0 },
            { name: 'Weapon', id: 'weapons', quantity: window.inventoryManager ? window.inventoryManager.getItemQuantity('weapons') : 0 }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    updateInventoryDisplay();
    craftingSection.appendChild(inventoryDiv);

    // Build button
    const buildButton = document.createElement('button');
    buildButton.textContent = 'CRAFT BETA';
    buildButton.style.width = '100%';
    buildButton.style.padding = '0.75rem';
    buildButton.style.fontFamily = 'var(--font-primary)';
    buildButton.style.fontWeight = '700';
    buildButton.style.fontSize = '0.625rem';
    buildButton.style.textTransform = 'uppercase';
    buildButton.style.letterSpacing = '0.05em';
    buildButton.style.color = 'var(--color--foreground)';
    buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    buildButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    buildButton.style.borderRadius = '4px';
    buildButton.style.cursor = 'pointer';
    buildButton.style.transition = 'all 0.2s';

    // Check if player has required items
    function checkRequirements() {
        const hasDarkMatter = window.tradingGame && window.tradingGame.getCommodityQuantity('dark matter') >= 1;
        const hasGold = window.tradingGame && window.tradingGame.getCommodityQuantity('gold') >= 1;
        const hasWeapon = window.inventoryManager && window.inventoryManager.hasItem('weapons', 1);

        const canCraft = hasDarkMatter && hasGold && hasWeapon;
        buildButton.disabled = !canCraft;

        if (canCraft) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            buildButton.style.cursor = 'pointer';
            buildButton.style.opacity = '1';
        } else {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            buildButton.style.cursor = 'not-allowed';
            buildButton.style.opacity = '0.5';
        }
    }

    checkRequirements();

    // Build button click handler
    buildButton.addEventListener('click', () => {
        if (buildButton.disabled) return;

        // Consume items
        if (window.tradingGame) {
            window.tradingGame.commodities['dark matter'] -= 1;
            window.tradingGame.commodities['gold'] -= 1;
        }
        if (window.inventoryManager) {
            window.inventoryManager.removeItem('weapons', 1);
        }

        // Add Beta
        window.inventoryManager.addItem('beta', 1);

        // Update displays
        updateInventoryDisplay();
        checkRequirements();

        // Refresh explore panel (updates inventory and crafting requirements)
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            checkRequirements();
        }, 200);
    });

    // Hover effects
    buildButton.addEventListener('mouseenter', () => {
        if (!buildButton.disabled) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    buildButton.addEventListener('mouseleave', () => {
        if (!buildButton.disabled) {
            checkRequirements();
        }
    });

    craftingSection.appendChild(buildButton);
    parentElement.appendChild(craftingSection);
}

// Helper function to create Milky Way Gamma crafting section
function createMilkyWayGammaCraftingSection(parentElement, milkyWayObject) {
    const craftingSection = document.createElement('div');
    craftingSection.style.marginTop = '1rem';
    craftingSection.style.padding = '1rem';
    craftingSection.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    craftingSection.style.borderRadius = '4px';
    craftingSection.style.border = '1px solid rgba(196, 213, 188, 0.1)';

    // Inventory status
    const inventoryDiv = document.createElement('div');
    inventoryDiv.style.display = 'flex';
    inventoryDiv.style.justifyContent = 'space-around';
    inventoryDiv.style.marginBottom = '1rem';
    inventoryDiv.style.fontFamily = 'var(--font-primary)';
    inventoryDiv.style.fontSize = '0.625rem';
    inventoryDiv.style.color = 'var(--color--foreground)';
    inventoryDiv.style.opacity = '0.7';

    function updateInventoryDisplay() {
        inventoryDiv.innerHTML = '';
        const items = [
            { name: 'Aura', id: 'aura', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('aura') : 0 },
            { name: 'Army', id: 'army', quantity: window.inventoryManager ? window.inventoryManager.getItemQuantity('army') : 0 },
            { name: 'Slave', id: 'slaves', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('slaves') : 0 }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    updateInventoryDisplay();
    craftingSection.appendChild(inventoryDiv);

    // Build button
    const buildButton = document.createElement('button');
    buildButton.textContent = 'CRAFT GAMMA';
    buildButton.style.width = '100%';
    buildButton.style.padding = '0.75rem';
    buildButton.style.fontFamily = 'var(--font-primary)';
    buildButton.style.fontWeight = '700';
    buildButton.style.fontSize = '0.625rem';
    buildButton.style.textTransform = 'uppercase';
    buildButton.style.letterSpacing = '0.05em';
    buildButton.style.color = 'var(--color--foreground)';
    buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    buildButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    buildButton.style.borderRadius = '4px';
    buildButton.style.cursor = 'pointer';
    buildButton.style.transition = 'all 0.2s';

    // Check if player has required items
    function checkRequirements() {
        const hasAura = window.tradingGame && window.tradingGame.getCommodityQuantity('aura') >= 1;
        const hasArmy = window.inventoryManager && window.inventoryManager.hasItem('army', 1);
        const hasSlave = window.tradingGame && window.tradingGame.getCommodityQuantity('slaves') >= 1;

        const canCraft = hasAura && hasArmy && hasSlave;
        buildButton.disabled = !canCraft;

        if (canCraft) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            buildButton.style.cursor = 'pointer';
            buildButton.style.opacity = '1';
        } else {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            buildButton.style.cursor = 'not-allowed';
            buildButton.style.opacity = '0.5';
        }
    }

    checkRequirements();

    // Build button click handler
    buildButton.addEventListener('click', () => {
        if (buildButton.disabled) return;

        // Consume items
        if (window.tradingGame) {
            window.tradingGame.commodities['aura'] -= 1;
            window.tradingGame.commodities['slaves'] -= 1;
        }
        if (window.inventoryManager) {
            window.inventoryManager.removeItem('army', 1);
        }

        // Add Gamma
        window.inventoryManager.addItem('gamma', 1);

        // Update displays
        updateInventoryDisplay();
        checkRequirements();

        // Refresh explore panel (updates inventory and crafting requirements)
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            checkRequirements();
        }, 200);
    });

    // Hover effects
    buildButton.addEventListener('mouseenter', () => {
        if (!buildButton.disabled) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    buildButton.addEventListener('mouseleave', () => {
        if (!buildButton.disabled) {
            checkRequirements();
        }
    });

    craftingSection.appendChild(buildButton);
    parentElement.appendChild(craftingSection);
}

// Helper function to create Uranus Merchant crafting section
function createUranusMerchantCraftingSection(parentElement, uranusObject) {
    const craftingSection = document.createElement('div');
    craftingSection.style.marginTop = '1rem';
    craftingSection.style.padding = '1rem';
    craftingSection.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    craftingSection.style.borderRadius = '4px';
    craftingSection.style.border = '1px solid rgba(196, 213, 188, 0.1)';

    // Inventory status
    const inventoryDiv = document.createElement('div');
    inventoryDiv.style.display = 'flex';
    inventoryDiv.style.justifyContent = 'space-around';
    inventoryDiv.style.marginBottom = '1rem';
    inventoryDiv.style.fontFamily = 'var(--font-primary)';
    inventoryDiv.style.fontSize = '0.625rem';
    inventoryDiv.style.color = 'var(--color--foreground)';
    inventoryDiv.style.opacity = '0.7';

    function updateInventoryDisplay() {
        inventoryDiv.innerHTML = '';
        const items = [
            { name: 'Robot', id: 'robot', quantity: window.inventoryManager ? (window.inventoryManager.getItem('robot')?.quantity || 0) : 0 },
            { name: 'Slave', id: 'slaves', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('slaves') : 0 },
            { name: 'Gold', id: 'gold', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('gold') : 0 }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    updateInventoryDisplay();
    craftingSection.appendChild(inventoryDiv);

    // Build button
    const buildButton = document.createElement('button');
    buildButton.textContent = 'TRAIN MERCHANT';
    buildButton.style.width = '100%';
    buildButton.style.padding = '0.75rem';
    buildButton.style.fontFamily = 'var(--font-primary)';
    buildButton.style.fontWeight = '700';
    buildButton.style.fontSize = '0.625rem';
    buildButton.style.textTransform = 'uppercase';
    buildButton.style.letterSpacing = '0.05em';
    buildButton.style.color = 'var(--color--foreground)';
    buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    buildButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    buildButton.style.borderRadius = '4px';
    buildButton.style.cursor = 'pointer';
    buildButton.style.transition = 'all 0.2s';

    // Check if player has required items
    function checkRequirements() {
        const hasRobot = window.inventoryManager && (window.inventoryManager.getItem('robot')?.quantity || 0) >= 1;
        const hasSlave = window.tradingGame && window.tradingGame.getCommodityQuantity('slaves') >= 1;
        const hasGold = window.tradingGame && window.tradingGame.getCommodityQuantity('gold') >= 1;

        const canCraft = hasRobot && hasSlave && hasGold;
        buildButton.disabled = !canCraft;

        if (canCraft) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            buildButton.style.cursor = 'pointer';
            buildButton.style.opacity = '1';
        } else {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            buildButton.style.cursor = 'not-allowed';
            buildButton.style.opacity = '0.5';
        }
    }

    checkRequirements();

    // Build button click handler
    buildButton.addEventListener('click', () => {
        if (buildButton.disabled) return;

        // Consume items
        if (window.inventoryManager) {
            window.inventoryManager.removeItem('robot', 1);
        }
        if (window.tradingGame) {
            window.tradingGame.commodities['slaves'] -= 1;
            window.tradingGame.commodities['gold'] -= 1;
        }

        // Add merchant
        window.inventoryManager.addItem('merchant', 1);

        // Update displays
        updateInventoryDisplay();
        checkRequirements();

        // Refresh explore panel (updates inventory and crafting requirements)
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            checkRequirements();
        }, 200);
    });

    // Hover effects
    buildButton.addEventListener('mouseenter', () => {
        if (!buildButton.disabled) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    buildButton.addEventListener('mouseleave', () => {
        if (!buildButton.disabled) {
            checkRequirements();
        }
    });

    craftingSection.appendChild(buildButton);
    parentElement.appendChild(craftingSection);
}

// Helper function to create Uranus Army crafting section
function createUranusArmyCraftingSection(parentElement, uranusObject) {
    const craftingSection = document.createElement('div');
    craftingSection.style.marginTop = '1rem';
    craftingSection.style.padding = '1rem';
    craftingSection.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    craftingSection.style.borderRadius = '4px';
    craftingSection.style.border = '1px solid rgba(196, 213, 188, 0.1)';

    // Inventory status
    const inventoryDiv = document.createElement('div');
    inventoryDiv.style.display = 'flex';
    inventoryDiv.style.justifyContent = 'space-around';
    inventoryDiv.style.marginBottom = '1rem';
    inventoryDiv.style.fontFamily = 'var(--font-primary)';
    inventoryDiv.style.fontSize = '0.625rem';
    inventoryDiv.style.color = 'var(--color--foreground)';
    inventoryDiv.style.opacity = '0.7';

    function updateInventoryDisplay() {
        inventoryDiv.innerHTML = '';
        const items = [
            { name: 'Weapon', id: 'weapons', quantity: window.inventoryManager ? (window.inventoryManager.getItem('weapons')?.quantity || 0) : 0 },
            { name: 'Slave', id: 'slaves', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('slaves') : 0 },
            { name: 'Gold', id: 'gold', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('gold') : 0 }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    updateInventoryDisplay();
    craftingSection.appendChild(inventoryDiv);

    // Build button
    const buildButton = document.createElement('button');
    buildButton.textContent = 'TRAIN ARMY';
    buildButton.style.width = '100%';
    buildButton.style.padding = '0.75rem';
    buildButton.style.fontFamily = 'var(--font-primary)';
    buildButton.style.fontWeight = '700';
    buildButton.style.fontSize = '0.625rem';
    buildButton.style.textTransform = 'uppercase';
    buildButton.style.letterSpacing = '0.05em';
    buildButton.style.color = 'var(--color--foreground)';
    buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    buildButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    buildButton.style.borderRadius = '4px';
    buildButton.style.cursor = 'pointer';
    buildButton.style.transition = 'all 0.2s';

    // Check if player has required items
    function checkRequirements() {
        const hasWeapon = window.inventoryManager && (window.inventoryManager.getItem('weapons')?.quantity || 0) >= 1;
        const hasSlave = window.tradingGame && window.tradingGame.getCommodityQuantity('slaves') >= 1;
        const hasGold = window.tradingGame && window.tradingGame.getCommodityQuantity('gold') >= 1;

        const canCraft = hasWeapon && hasSlave && hasGold;
        buildButton.disabled = !canCraft;

        if (canCraft) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            buildButton.style.cursor = 'pointer';
            buildButton.style.opacity = '1';
        } else {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            buildButton.style.cursor = 'not-allowed';
            buildButton.style.opacity = '0.5';
        }
    }

    checkRequirements();

    // Build button click handler
    buildButton.addEventListener('click', () => {
        if (buildButton.disabled) return;

        // Consume items
        if (window.inventoryManager) {
            window.inventoryManager.removeItem('weapons', 1);
        }
        if (window.tradingGame) {
            window.tradingGame.commodities['slaves'] -= 1;
            window.tradingGame.commodities['gold'] -= 1;
        }

        // Add army
        window.inventoryManager.addItem('army', 1);

        // Update displays
        updateInventoryDisplay();
        checkRequirements();

        // Refresh explore panel (updates inventory and crafting requirements)
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            checkRequirements();
        }, 200);
    });

    // Hover effects
    buildButton.addEventListener('mouseenter', () => {
        if (!buildButton.disabled) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    buildButton.addEventListener('mouseleave', () => {
        if (!buildButton.disabled) {
            checkRequirements();
        }
    });

    craftingSection.appendChild(buildButton);
    parentElement.appendChild(craftingSection);
}

// Helper function to create Uranus Archon crafting section
function createUranusArchonCraftingSection(parentElement, uranusObject) {
    const craftingSection = document.createElement('div');
    craftingSection.style.marginTop = '1rem';
    craftingSection.style.padding = '1rem';
    craftingSection.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    craftingSection.style.borderRadius = '4px';
    craftingSection.style.border = '1px solid rgba(196, 213, 188, 0.1)';

    // Inventory status
    const inventoryDiv = document.createElement('div');
    inventoryDiv.style.display = 'flex';
    inventoryDiv.style.justifyContent = 'space-around';
    inventoryDiv.style.marginBottom = '1rem';
    inventoryDiv.style.fontFamily = 'var(--font-primary)';
    inventoryDiv.style.fontSize = '0.625rem';
    inventoryDiv.style.color = 'var(--color--foreground)';
    inventoryDiv.style.opacity = '0.7';

    function updateInventoryDisplay() {
        inventoryDiv.innerHTML = '';
        const items = [
            { name: 'Robot', id: 'robot', quantity: window.inventoryManager ? (window.inventoryManager.getItem('robot')?.quantity || 0) : 0 },
            { name: 'Weapon', id: 'weapons', quantity: window.inventoryManager ? (window.inventoryManager.getItem('weapons')?.quantity || 0) : 0 },
            { name: 'Gold', id: 'gold', quantity: window.tradingGame ? window.tradingGame.getCommodityQuantity('gold') : 0 }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
            `;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    updateInventoryDisplay();
    craftingSection.appendChild(inventoryDiv);

    // Build button
    const buildButton = document.createElement('button');
    buildButton.textContent = 'TRAIN ARCHON';
    buildButton.style.width = '100%';
    buildButton.style.padding = '0.75rem';
    buildButton.style.fontFamily = 'var(--font-primary)';
    buildButton.style.fontWeight = '700';
    buildButton.style.fontSize = '0.625rem';
    buildButton.style.textTransform = 'uppercase';
    buildButton.style.letterSpacing = '0.05em';
    buildButton.style.color = 'var(--color--foreground)';
    buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    buildButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    buildButton.style.borderRadius = '4px';
    buildButton.style.cursor = 'pointer';
    buildButton.style.transition = 'all 0.2s';

    // Check if player has required items
    function checkRequirements() {
        const hasRobot = window.inventoryManager && (window.inventoryManager.getItem('robot')?.quantity || 0) >= 1;
        const hasWeapon = window.inventoryManager && (window.inventoryManager.getItem('weapons')?.quantity || 0) >= 1;
        const hasGold = window.tradingGame && window.tradingGame.getCommodityQuantity('gold') >= 1;

        const canCraft = hasRobot && hasWeapon && hasGold;
        buildButton.disabled = !canCraft;

        if (canCraft) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            buildButton.style.cursor = 'pointer';
            buildButton.style.opacity = '1';
        } else {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
            buildButton.style.cursor = 'not-allowed';
            buildButton.style.opacity = '0.5';
        }
    }

    checkRequirements();

    // Build button click handler
    buildButton.addEventListener('click', () => {
        if (buildButton.disabled) return;

        // Consume items
        if (window.inventoryManager) {
            window.inventoryManager.removeItem('robot', 1);
            window.inventoryManager.removeItem('weapons', 1);
        }
        if (window.tradingGame) {
            window.tradingGame.commodities['gold'] -= 1;
        }

        // Add archon
        window.inventoryManager.addItem('archon', 1);

        // Update displays
        updateInventoryDisplay();
        checkRequirements();

        // Refresh explore panel (updates inventory and crafting requirements)
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            checkRequirements();
        }, 200);
    });

    // Hover effects
    buildButton.addEventListener('mouseenter', () => {
        if (!buildButton.disabled) {
            buildButton.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    buildButton.addEventListener('mouseleave', () => {
        if (!buildButton.disabled) {
            checkRequirements();
        }
    });

    craftingSection.appendChild(buildButton);
    parentElement.appendChild(craftingSection);
}

// Helper function to create Black Cube sacrifice button
function createBlackCubeSacrificeButton(parentElement, blackCubeObject) {
    // Initialize sacrifice state if not exists
    if (!blackCubeObject.hasSacrificed9Slaves) {
        blackCubeObject.hasSacrificed9Slaves = false;
    }
    
    const section = document.createElement('div');
    section.style.marginTop = '1rem';
    section.style.paddingTop = '1rem';
    section.style.borderTop = '1px solid rgba(196, 213, 188, 0.2)';
    
    // Update explore content based on state
    if (!blackCubeObject.hasSacrificed9Slaves) {
        blackCubeObject.exploreContent = 'Sacrifice 9 Slaves to Moloch.';
    } else {
        blackCubeObject.exploreContent = 'Sacrifice 1 Baby to Moloch';
    }
    
    const button = document.createElement('button');
    
    // Function to update button state
    const updateButtonState = () => {
        if (!blackCubeObject.hasSacrificed9Slaves) {
            // First stage: need 9 slaves
            const slaveCount = tradingGame && tradingGame.commodities ? (tradingGame.commodities['slaves'] || 0) : 0;
            const hasEnoughSlaves = slaveCount >= 9;
            button.disabled = !hasEnoughSlaves;
            button.style.backgroundColor = hasEnoughSlaves ? 'rgba(196, 213, 188, 0.1)' : 'rgba(196, 213, 188, 0.05)';
            button.style.cursor = hasEnoughSlaves ? 'pointer' : 'not-allowed';
            button.style.opacity = hasEnoughSlaves ? '1' : '0.5';
        } else {
            // Second stage: need 1 baby
            const hasBaby = inventoryManager && inventoryManager.hasItem('baby', 1);
            button.disabled = !hasBaby;
            button.style.backgroundColor = hasBaby ? 'rgba(196, 213, 188, 0.1)' : 'rgba(196, 213, 188, 0.05)';
            button.style.cursor = hasBaby ? 'pointer' : 'not-allowed';
            button.style.opacity = hasBaby ? '1' : '0.5';
        }
    };
    button.textContent = 'SACRIFICE';
    button.style.width = '100%';
    button.style.padding = '0.75rem';
    button.style.fontFamily = 'var(--font-primary)';
    button.style.fontWeight = '700';
    button.style.fontSize = '0.625rem';
    button.style.textTransform = 'uppercase';
    button.style.letterSpacing = '0.05em';
    button.style.color = 'var(--color--foreground)';
    button.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    button.style.borderRadius = '4px';
    button.style.transition = 'all 0.2s';
    
    // Initial button state
    updateButtonState();
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
        if (!button.disabled) {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
        }
    });
    button.addEventListener('mouseleave', () => {
        updateButtonState();
    });
    
    // Click handler
    button.addEventListener('click', () => {
        if (!blackCubeObject.hasSacrificed9Slaves) {
            // First sacrifice: 9 slaves
            const slaveCount = tradingGame && tradingGame.commodities ? (tradingGame.commodities['slaves'] || 0) : 0;
            if (slaveCount < 9) {
                updateButtonState();
                return;
            }
            
            // Remove 9 slaves
            if (tradingGame && tradingGame.commodities) {
                tradingGame.commodities['slaves'] = Math.max(0, (tradingGame.commodities['slaves'] || 0) - 9);
            }
            
            // Gift rewards: 5 fuel and $5000
            if (tradingGame) {
                // Add 5 fuel
                tradingGame.commodities['fuel'] = (tradingGame.commodities['fuel'] || 0) + 5;
                // Add $5000
                tradingGame.money = (tradingGame.money || 0) + 5000;
            }
            
            // Mark as having sacrificed 9 slaves
            blackCubeObject.hasSacrificed9Slaves = true;
            blackCubeObject.exploreContent = 'Sacrifice 1 Baby to Moloch';

            // Award Satanist achievement
            if (window.scoreManager) {
                window.scoreManager.addAchievement('Satanist');
                // Update score display
                if (window.updateScoreDisplay) {
                    window.updateScoreDisplay();
                }
            }
            
            // Automatically travel back to Earth (consumes 1 fuel)
            if (!travelState.isTraveling) {
                startTravel('EARTH');
            }
            
            // Update button state for next stage
            updateButtonState();
        } else {
            // Second sacrifice: 1 baby
            if (!inventoryManager || !inventoryManager.hasItem('baby', 1)) {
                updateButtonState();
                return;
            }
            
            // Remove 1 baby
            inventoryManager.removeItem('baby', 1);

            // Add 1 water (element creation)
            inventoryManager.addItem('water', 1);

            // Award Pedophile achievement
            if (window.scoreManager) {
                window.scoreManager.addAchievement('Pedophile');
                // Update score display
                if (window.updateScoreDisplay) {
                    window.updateScoreDisplay();
                }
            }

            // Remove Anja from greenlist permanently (mutual exclusion)
            const anjaObject = sceneManager.allObjects.find(obj => obj.name === 'Anja');
            if (anjaObject) {
                anjaObject.isGreenlisted = false;
                // Save to localStorage to persist across sessions
                localStorage.setItem('anjaRemoved', 'true');
            }

            // Update explore content (could add a final message here if needed)
            // For now, just keep the same message
        }
        
        // Update UI
        if (window.renderInventory) {
            window.renderInventory();
        }
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }
        
        // Visual feedback
        button.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            updateButtonState();
        }, 200);
    });
    
    section.appendChild(button);
    parentElement.appendChild(section);
}

// Helper function to create Anja pledge button
function createAnjaPledgeButton(parentElement, anjaObject) {
    // Initialize pledge state from localStorage (persistent across sessions)
    const hasPledged = localStorage.getItem('anjaPledged10Gold') === 'true';
    anjaObject.hasPledged10Gold = hasPledged;

    const section = document.createElement('div');
    section.style.marginTop = '1rem';
    section.style.paddingTop = '1rem';
    section.style.borderTop = '1px solid rgba(196, 213, 188, 0.2)';

    // Update explore content based on state
    if (!anjaObject.hasPledged10Gold) {
        anjaObject.exploreContent = 'Pledge 10 Gold to Anu.';
    } else {
        anjaObject.exploreContent = 'Ascend 1 Baby to the Throne';
    }

    const button = document.createElement('button');

    // Function to update button state
    const updateButtonState = () => {
        if (!anjaObject.hasPledged10Gold) {
            // First stage: need 10 gold
            const goldCount = tradingGame && tradingGame.commodities ? (tradingGame.commodities['gold'] || 0) : 0;
            const hasEnoughGold = goldCount >= 10;
            button.disabled = !hasEnoughGold;
            button.style.backgroundColor = hasEnoughGold ? 'rgba(196, 213, 188, 0.1)' : 'rgba(196, 213, 188, 0.05)';
            button.style.cursor = hasEnoughGold ? 'pointer' : 'not-allowed';
            button.style.opacity = hasEnoughGold ? '1' : '0.5';
        } else {
            // Second stage: need 1 baby
            const hasBaby = inventoryManager && inventoryManager.hasItem('baby', 1);
            button.disabled = !hasBaby;
            button.style.backgroundColor = hasBaby ? 'rgba(196, 213, 188, 0.1)' : 'rgba(196, 213, 188, 0.05)';
            button.style.cursor = hasBaby ? 'pointer' : 'not-allowed';
            button.style.opacity = hasBaby ? '1' : '0.5';
        }
    };

    button.textContent = !anjaObject.hasPledged10Gold ? 'PLEDGE' : 'ASCEND';
    button.style.width = '100%';
    button.style.padding = '0.75rem';
    button.style.fontFamily = 'var(--font-primary)';
    button.style.fontWeight = '700';
    button.style.fontSize = '0.625rem';
    button.style.textTransform = 'uppercase';
    button.style.letterSpacing = '0.05em';
    button.style.color = 'var(--color--foreground)';
    button.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    button.style.borderRadius = '4px';
    button.style.transition = 'all 0.2s';

    // Initial button state
    updateButtonState();

    // Hover effects
    button.addEventListener('mouseenter', () => {
        if (!button.disabled) {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
        }
    });
    button.addEventListener('mouseleave', () => {
        updateButtonState();
    });

    // Click handler
    button.addEventListener('click', () => {
        if (!anjaObject.hasPledged10Gold) {
            // First pledge: 10 gold
            const goldCount = tradingGame && tradingGame.commodities ? (tradingGame.commodities['gold'] || 0) : 0;
            if (goldCount < 10) {
                updateButtonState();
                return;
            }

            // Remove 10 gold
            if (tradingGame && tradingGame.commodities) {
                tradingGame.commodities['gold'] = Math.max(0, (tradingGame.commodities['gold'] || 0) - 10);
            }

            // Add 1 aura
            if (tradingGame) {
                tradingGame.commodities['aura'] = (tradingGame.commodities['aura'] || 0) + 1;
            }

            // Award Astral Traveller achievement
            if (window.scoreManager) {
                window.scoreManager.addAchievement('Astral Traveller');
                // Update score display
                if (window.updateScoreDisplay) {
                    window.updateScoreDisplay();
                }
            }

            // Mark as having pledged 10 gold (persistent)
            localStorage.setItem('anjaPledged10Gold', 'true');
            anjaObject.hasPledged10Gold = true;
            anjaObject.exploreContent = 'Ascend 1 Baby to the Throne';

            // Automatically travel back to Earth (consumes 1 fuel)
            if (!travelState.isTraveling) {
                startTravel('EARTH');
            }

            // Update button state for next stage
            updateButtonState();
        } else {
            // Second stage: ascend 1 baby
            if (!inventoryManager || !inventoryManager.hasItem('baby', 1)) {
                updateButtonState();
                return;
            }

            // Remove 1 baby
            inventoryManager.removeItem('baby', 1);

            // Add 1 water (element creation)
            inventoryManager.addItem('water', 1);

            // Award Archangel achievement
            if (window.scoreManager) {
                window.scoreManager.addAchievement('Archangel');
                // Update score display
                if (window.updateScoreDisplay) {
                    window.updateScoreDisplay();
                }
            }

            // Remove Black Cube from greenlist permanently (mutual exclusion)
            const blackCubeObject = sceneManager.allObjects.find(obj => obj.name === 'Black Cube');
            if (blackCubeObject) {
                blackCubeObject.isGreenlisted = false;
                // Save to localStorage to persist across sessions
                localStorage.setItem('blackCubeRemoved', 'true');
            }

            // Update explore content (could add a final message here if needed)
            // For now, just keep the same message
        }

        // Update UI
        if (window.renderInventory) {
            window.renderInventory();
        }
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }

        // Visual feedback
        button.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            updateButtonState();
        }, 200);
    });

    section.appendChild(button);
    parentElement.appendChild(section);
}

// Helper function to create Zeta Reticuli Greys encounter
function createZetaReticuliGreysEncounter(parentElement, zetaReticuliObject) {
    const section = document.createElement('div');
    section.style.marginTop = '1rem';
    section.style.paddingTop = '1rem';
    section.style.borderTop = '1px solid rgba(196, 213, 188, 0.2)';

    // Check player resources and determine encounter type
    const playerMoney = tradingGame ? tradingGame.money || 0 : 0;
    const playerSlaves = tradingGame ? tradingGame.getCommodityQuantity('slaves') || 0 : 0;

    let encounterMessage = '';
    let actionTaken = false;

    if (playerMoney >= 500) {
        // $500 fine
        encounterMessage = 'You are not welcome on Zeta Reticuli. The Greys have charged a $500 fine for trespassing. Please evacuate this system immediately.';
        if (tradingGame) {
            tradingGame.money = Math.max(0, tradingGame.money - 500);
        }
        actionTaken = true;
    } else if (playerSlaves > 0) {
        // Slave confiscation
        encounterMessage = 'You are not welcome on Zeta Reticuli. The Greys have confiscated your Slaves for trespassing. Please evacuate this system immediately.';
        if (tradingGame) {
            tradingGame.commodities['slaves'] = 0; // Remove all slaves
        }
        actionTaken = true;
    } else {
        // Deportation
        encounterMessage = 'You are not welcome on Zeta Reticuli. The Greys have deported you to Earth.';
        // Give 1 fuel and travel to Earth
        if (tradingGame) {
            tradingGame.commodities['fuel'] = (tradingGame.commodities['fuel'] || 0) + 1;
        }
        // Travel to Earth (will consume 1 fuel)
        setTimeout(() => {
            if (!travelState.isTraveling) {
                startTravel('EARTH');
            }
        }, 2000); // Delay to let player read the message
        actionTaken = true;
    }

    // Display the encounter message
    const messageDiv = document.createElement('div');
    messageDiv.style.fontFamily = 'var(--font-primary)';
    messageDiv.style.fontSize = '0.75rem';
    messageDiv.style.lineHeight = '1.4';
    messageDiv.style.color = 'var(--color--foreground)';
    messageDiv.style.textAlign = 'center';
    messageDiv.style.padding = '1rem';
    messageDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.1)'; // Red tint for hostile encounter
    messageDiv.style.border = '1px solid rgba(255, 0, 0, 0.3)';
    messageDiv.style.borderRadius = '4px';
    messageDiv.style.marginBottom = '1rem';
    messageDiv.textContent = encounterMessage;

    section.appendChild(messageDiv);

    // Update explore content to reflect the encounter
    zetaReticuliObject.exploreContent = encounterMessage;

    // Update UI after actions
    if (actionTaken) {
        if (window.renderInventory) {
            window.renderInventory();
        }
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }
    }

    parentElement.appendChild(section);
}

// Helper function to create Gaia BH1 Reptilian Banking System
function createGaiaBH1BankingSystem(parentElement, gaiaBH1Object) {
    const section = document.createElement('div');
    section.style.marginTop = '1rem';
    section.style.paddingTop = '1rem';
    section.style.borderTop = '1px solid rgba(196, 213, 188, 0.2)';

    // Main menu container
    const mainMenu = document.createElement('div');
    mainMenu.id = 'gaia-bh1-main-menu';

    // Title
    const title = document.createElement('div');
    title.style.fontFamily = 'var(--font-primary)';
    title.style.fontSize = '0.875rem';
    title.style.fontWeight = '700';
    title.style.color = 'var(--color--foreground)';
    title.style.textAlign = 'center';
    title.style.marginBottom = '1rem';
    title.textContent = 'REPTILIAN BANKING CONSORTIUM';
    mainMenu.appendChild(title);

    // Create main buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexDirection = 'column';
    buttonsContainer.style.gap = '0.5rem';

    // Borrow button
    const borrowButton = createBankingButton('BORROW', () => {
        showBorrowSubmenu(mainMenu, gaiaBH1Object);
    });
    buttonsContainer.appendChild(borrowButton);

    // Deposit button
    const depositButton = createBankingButton('DEPOSIT', () => {
        showDepositSubmenu(mainMenu, gaiaBH1Object);
    });
    buttonsContainer.appendChild(depositButton);

    // Invest button
    const investButton = createBankingButton('INVEST', () => {
        showInvestSubmenu(mainMenu, gaiaBH1Object);
    });
    buttonsContainer.appendChild(investButton);

    mainMenu.appendChild(buttonsContainer);
    section.appendChild(mainMenu);

    parentElement.appendChild(section);
}

// Helper function to create banking buttons
function createBankingButton(text, onClick) {
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
    button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    button.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.transition = 'all 0.2s';

    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
    });
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    });

    button.addEventListener('click', onClick);

    return button;
}

// Helper function to create back button
function createBackButton(onClick) {
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
    backButton.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    backButton.style.border = '1px solid rgba(196, 213, 188, 0.2)';
    backButton.style.borderRadius = '4px';
    backButton.style.cursor = 'pointer';
    backButton.style.transition = 'all 0.2s';

    backButton.addEventListener('mouseenter', () => {
        backButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    });
    backButton.addEventListener('mouseleave', () => {
        backButton.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    });

    backButton.addEventListener('click', onClick);

    return backButton;
}

// Borrow submenu
function showBorrowSubmenu(mainMenu, gaiaBH1Object) {
    const submenu = document.createElement('div');
    submenu.id = 'gaia-bh1-borrow-submenu';

    // Back button
    const backButton = createBackButton(() => {
        mainMenu.style.display = 'block';
        submenu.remove();
    });
    submenu.appendChild(backButton);

    // Content
    const content = document.createElement('div');
    content.style.fontFamily = 'var(--font-primary)';
    content.style.fontSize = '0.75rem';
    content.style.lineHeight = '1.4';
    content.style.color = 'var(--color--foreground)';
    content.style.textAlign = 'center';
    content.style.marginBottom = '1rem';

    if (tradingGame && tradingGame.gaiaBH1Loan.active) {
        // Show repayment option
        content.innerHTML = `
            <div style="margin-bottom: 1rem;">Loan Status: Active</div>
            <div style="margin-bottom: 1rem;">Amount Owed: $${tradingGame.gaiaBH1Loan.totalOwed}</div>
            <div style="margin-bottom: 1rem;">Turns Remaining: ${tradingGame.gaiaBH1Loan.turnsRemaining}</div>
        `;

        const repayButton = createBankingButton('REPAY $24K', () => {
            if (tradingGame && tradingGame.money >= tradingGame.gaiaBH1Loan.totalOwed) {
                tradingGame.money -= tradingGame.gaiaBH1Loan.totalOwed;
                tradingGame.gaiaBH1Loan.repaid = true;
                tradingGame.gaiaBH1Loan.active = false;

                // Award achievement
                if (window.scoreManager) {
                    window.scoreManager.addAchievement('Beggar');
                }

                // Update UI
                if (window.renderInventory) {
                    window.renderInventory();
                }
                if (window.updateExplorePanel) {
                    window.updateExplorePanel();
                }

                mainMenu.style.display = 'block';
                submenu.remove();
            }
        });

        // Disable repay button if insufficient funds
        if (tradingGame.money < tradingGame.gaiaBH1Loan.totalOwed) {
            repayButton.disabled = true;
            repayButton.style.opacity = '0.5';
            repayButton.style.cursor = 'not-allowed';
        }

        submenu.appendChild(content);
        submenu.appendChild(repayButton);
    } else {
        // Show loan offer
        content.innerHTML = `
            <div style="margin-bottom: 1rem;">The Reptilians offer a $20,000 loan at 20% interest over 10 turns.</div>
            <div style="font-weight: 700; color: #ff6b6b;">Total repayment: $24,000</div>
        `;

        const confirmButton = createBankingButton('CONFIRM LOAN', () => {
            if (tradingGame) {
                tradingGame.money += 20000;
                tradingGame.gaiaBH1Loan.active = true;
                tradingGame.gaiaBH1Loan.turnsRemaining = 10;

                // Update UI
                if (window.renderInventory) {
                    window.renderInventory();
                }
                if (window.updateExplorePanel) {
                    window.updateExplorePanel();
                }

                mainMenu.style.display = 'block';
                submenu.remove();
            }
        });

        submenu.appendChild(content);
        submenu.appendChild(confirmButton);
    }

    // Hide main menu and show submenu
    mainMenu.style.display = 'none';
    mainMenu.parentElement.appendChild(submenu);
}

// Deposit submenu
function showDepositSubmenu(mainMenu, gaiaBH1Object) {
    const submenu = document.createElement('div');
    submenu.id = 'gaia-bh1-deposit-submenu';

    // Back button
    const backButton = createBackButton(() => {
        mainMenu.style.display = 'block';
        submenu.remove();
    });
    submenu.appendChild(backButton);

    // Content
    const content = document.createElement('div');
    content.style.fontFamily = 'var(--font-primary)';
    content.style.fontSize = '0.75rem';
    content.style.lineHeight = '1.4';
    content.style.color = 'var(--color--foreground)';
    content.style.textAlign = 'center';
    content.style.marginBottom = '1rem';

    const accountBalance = tradingGame ? tradingGame.gaiaBH1Account.balance : 0;
    content.innerHTML = `
        <div style="margin-bottom: 1rem;">Account Balance: $${accountBalance}</div>
        <div style="margin-bottom: 1rem;">The Reptilians offer a $5,000 holding account. This account must hold minimum $5,000.</div>
    `;

    submenu.appendChild(content);

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
    amountInput.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    amountInput.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    amountInput.style.borderRadius = '4px';
    amountInput.style.textAlign = 'center';

    inputContainer.appendChild(amountInput);
    submenu.appendChild(inputContainer);

    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexDirection = 'column';
    buttonsContainer.style.gap = '0.5rem';

    // Deposit button
    const depositButton = createBankingButton('DEPOSIT', () => {
        const amount = parseInt(amountInput.value) || 0;
        if (tradingGame && amount > 0 && tradingGame.money >= amount) {
            const newBalance = accountBalance + amount;
            if (newBalance >= 5000) {
                tradingGame.money -= amount;
                tradingGame.gaiaBH1Account.balance = newBalance;
                tradingGame.gaiaBH1Account.active = true;

                // Update UI
                if (window.renderInventory) {
                    window.renderInventory();
                }
                if (window.updateExplorePanel) {
                    window.updateExplorePanel();
                }

                mainMenu.style.display = 'block';
                submenu.remove();
            }
        }
    });

    // Withdraw button
    const withdrawButton = createBankingButton('WITHDRAW', () => {
        const amount = parseInt(amountInput.value) || 0;
        if (tradingGame && amount > 0 && accountBalance >= amount) {
            const newBalance = accountBalance - amount;
            if (!tradingGame.gaiaBH1Account.active || newBalance >= 5000) {
                tradingGame.money += amount;
                tradingGame.gaiaBH1Account.balance = newBalance;

                // Deactivate account if below minimum
                if (newBalance < 5000) {
                    tradingGame.gaiaBH1Account.active = false;
                }

                // Update UI
                if (window.renderInventory) {
                    window.renderInventory();
                }
                if (window.updateExplorePanel) {
                    window.updateExplorePanel();
                }

                mainMenu.style.display = 'block';
                submenu.remove();
            }
        }
    });

    // Close account button (only if account is active)
    if (tradingGame && tradingGame.gaiaBH1Account.active) {
        const closeButton = createBankingButton('CLOSE ACCOUNT', () => {
            if (tradingGame) {
                tradingGame.money += accountBalance;
                tradingGame.gaiaBH1Account.balance = 0;
                tradingGame.gaiaBH1Account.active = false;

                // Update UI
                if (window.renderInventory) {
                    window.renderInventory();
                }
                if (window.updateExplorePanel) {
                    window.updateExplorePanel();
                }

                mainMenu.style.display = 'block';
                submenu.remove();
            }
        });
        buttonsContainer.appendChild(closeButton);
    }

    buttonsContainer.appendChild(depositButton);
    buttonsContainer.appendChild(withdrawButton);
    submenu.appendChild(buttonsContainer);

    // Hide main menu and show submenu
    mainMenu.style.display = 'none';
    mainMenu.parentElement.appendChild(submenu);
}

// Invest submenu
function showInvestSubmenu(mainMenu, gaiaBH1Object) {
    const submenu = document.createElement('div');
    submenu.id = 'gaia-bh1-invest-submenu';

    // Back button
    const backButton = createBackButton(() => {
        mainMenu.style.display = 'block';
        submenu.remove();
    });
    submenu.appendChild(backButton);

    // Content
    const content = document.createElement('div');
    content.style.fontFamily = 'var(--font-primary)';
    content.style.fontSize = '0.75rem';
    content.style.lineHeight = '1.4';
    content.style.color = 'var(--color--foreground)';
    content.style.textAlign = 'center';
    content.style.marginBottom = '1rem';

    if (tradingGame && tradingGame.gaiaBH1Account.balance > 0) {
        // Show investment offer
        if (tradingGame.gaiaBH1Investment.active) {
            content.innerHTML = `
                <div style="margin-bottom: 1rem;">Investment Status: Active</div>
                <div style="margin-bottom: 1rem;">Turns Remaining: ${tradingGame.gaiaBH1Investment.turnsRemaining}</div>
                <div style="margin-bottom: 1rem;">Total Paid: $${tradingGame.gaiaBH1Investment.totalPaid}</div>
            `;
        } else {
            content.innerHTML = `
                <div style="margin-bottom: 1rem;">The Reptilians offer an investment package of $30,000.</div>
                <div style="margin-bottom: 1rem;">This package pays out $4,000 every turn for 10 turns.</div>
                <div style="font-weight: 700; color: #4ecdc4;">Total return: $40,000</div>
            `;

            const investButton = createBankingButton('INVEST', () => {
                if (tradingGame && tradingGame.gaiaBH1Account.balance >= 30000) {
                    tradingGame.gaiaBH1Account.balance -= 30000;
                    tradingGame.gaiaBH1Investment.active = true;
                    tradingGame.gaiaBH1Investment.turnsRemaining = 10;
                    tradingGame.gaiaBH1Investment.totalPaid = 0;

                    // Update UI
                    if (window.renderInventory) {
                        window.renderInventory();
                    }
                    if (window.updateExplorePanel) {
                        window.updateExplorePanel();
                    }

                    mainMenu.style.display = 'block';
                    submenu.remove();
                }
            });

            submenu.appendChild(content);
            submenu.appendChild(investButton);
        }
    } else {
        // No account balance
        content.innerHTML = `
            <div>The Reptilians offer an investment package for account holders.</div>
        `;
        submenu.appendChild(content);
    }

    // Hide main menu and show submenu
    mainMenu.style.display = 'none';
    mainMenu.parentElement.appendChild(submenu);
}

// Helper function to create rainbow confetti animation
function createConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.style.position = 'fixed';
    confettiContainer.style.top = '0';
    confettiContainer.style.left = '0';
    confettiContainer.style.width = '100%';
    confettiContainer.style.height = '100%';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.zIndex = '9999';
    document.body.appendChild(confettiContainer);
    
    const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.position = 'absolute';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = color;
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.borderRadius = '50%';
        confetti.style.opacity = '0.9';
        
        const angle = (Math.random() - 0.5) * 60; // -30 to 30 degrees
        const velocity = 2 + Math.random() * 3; // 2-5
        const rotation = Math.random() * 360;
        
        confetti.style.transform = `rotate(${rotation}deg)`;
        confetti.style.transition = 'none';
        
        confettiContainer.appendChild(confetti);
        
        // Animate confetti falling
        setTimeout(() => {
            const endX = Math.sin(angle * Math.PI / 180) * 200;
            const endY = window.innerHeight + 100;
            confetti.style.transform = `translate(${endX}px, ${endY}px) rotate(${rotation + 720}deg)`;
            confetti.style.transition = `transform ${velocity}s ease-out, opacity ${velocity}s ease-out`;
            confetti.style.opacity = '0';
        }, 10);
        
        // Remove confetti after animation
        setTimeout(() => {
            if (confetti.parentElement) {
                confetti.remove();
            }
        }, velocity * 1000 + 100);
    }
    
    // Remove container after all confetti is gone
    setTimeout(() => {
        if (confettiContainer.parentElement) {
            confettiContainer.remove();
        }
    }, 6000);
}

// Helper function to create donate exotic button for Venus
function createDonateExoticButton(parentElement, venusObject) {
    // Only show button if not already donated
    if (venusObject.hasDonatedExotic) {
        return;
    }
    
    const section = document.createElement('div');
    section.style.marginTop = '1rem';
    section.style.paddingTop = '1rem';
    section.style.borderTop = '1px solid rgba(196, 213, 188, 0.2)';
    
    const hasExotic = tradingGame && tradingGame.getCommodityQuantity('exotic') > 0;
    const button = document.createElement('button');
    button.textContent = 'DONATE EXOTIC';
    button.disabled = !hasExotic;
    button.style.width = '100%';
    button.style.padding = '0.75rem';
    button.style.fontFamily = 'var(--font-primary)';
    button.style.fontWeight = '700';
    button.style.fontSize = '0.625rem';
    button.style.textTransform = 'uppercase';
    button.style.letterSpacing = '0.05em';
    button.style.color = 'var(--color--foreground)';
    button.style.backgroundColor = hasExotic ? 'rgba(196, 213, 188, 0.1)' : 'rgba(196, 213, 188, 0.05)';
    button.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    button.style.borderRadius = '4px';
    button.style.cursor = hasExotic ? 'pointer' : 'not-allowed';
    button.style.opacity = hasExotic ? '1' : '0.5';
    button.style.transition = 'all 0.2s';
    
    // Hover effects
    if (hasExotic) {
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
        });
    }
    
    // Click handler
    button.addEventListener('click', () => {
        if (!hasExotic || venusObject.hasDonatedExotic) return;
        
        // Check if still has exotic
        const currentHasExotic = tradingGame && tradingGame.getCommodityQuantity('exotic') > 0;
        if (!currentHasExotic) return;
        
        // Donate 1 exotic
        tradingGame.commodities['exotic'] = Math.max(0, tradingGame.commodities['exotic'] - 1);
        venusObject.hasDonatedExotic = true;
        
        // Update explore content
        venusObject.exploreContent = 'Tune to Frequency 6 to travel to Mercury.';
        
        // Update UI - refresh inventory and explore panel
        if (window.renderInventory) {
            window.renderInventory();
        }
        if (window.updateExplorePanel) {
            window.updateExplorePanel();
        }
        
        // Visual feedback
        button.style.backgroundColor = 'rgba(196, 213, 188, 0.3)';
        setTimeout(() => {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
        }, 200);
    });
    
    section.appendChild(button);
    parentElement.appendChild(section);
}

// Initialize explore panel
updateExplorePanel();

// Inventory Panel Toggle
const inventoryToggle = document.getElementById('inventory-toggle');
const inventoryClose = document.getElementById('inventory-close');
const inventoryPanel = document.getElementById('inventory-panel');
const inventoryItems = document.getElementById('inventory-items');
const inventoryDescription = document.getElementById('inventory-description');

// Render inventory items
function renderInventory() {
    inventoryItems.innerHTML = '';
    
    // Get items from inventory manager (Body, Soul, Spirit)
    const inventoryItems_list = inventoryManager.getAllItems();
    
    // Get commodities from trading game (only show if quantity > 0)
    const commodities = tradingGame ? tradingGame.getAllCommodities().filter(c => c.quantity > 0) : [];
    
    // Separate Light, Body/Soul/Spirit, and other items
    const specialItems = ['body', 'soul', 'spirit'];
    const lightItem = inventoryItems_list.find(item => item.id === 'light');
    const bodySoulSpirit = inventoryItems_list.filter(item => specialItems.includes(item.id));
    const otherInventoryItems = inventoryItems_list.filter(item => !specialItems.includes(item.id) && item.id !== 'light');
    
    // Render Light first at the top with shine effect (if it exists)
    if (lightItem) {
        const lightElement = createInventoryItemElement(lightItem, true); // true = has shine
        // Hide quantity for light since it can't be stacked
        const quantityEl = lightElement.querySelector('.inventory-item-quantity');
        if (quantityEl) {
            quantityEl.style.display = 'none';
        }
        inventoryItems.appendChild(lightElement);
        
        // Add separator after light if there are other items
        if (bodySoulSpirit.length > 0 || otherInventoryItems.length > 0 || commodities.length > 0 || (tradingGame && tradingGame.money > 0)) {
            const separator = document.createElement('div');
            separator.style.height = '1px';
            separator.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            separator.style.margin = '0.25rem 0';
            inventoryItems.appendChild(separator);
        }
    }
    
    // Render Body/Soul/Spirit next with shine effect
    bodySoulSpirit.forEach(item => {
        const itemElement = createInventoryItemElement(item, true); // true = has shine
        inventoryItems.appendChild(itemElement);
    });
    
    // Add separator if we have Body/Soul/Spirit and other items (but not if light already added separator)
    if (!lightItem && bodySoulSpirit.length > 0 && (otherInventoryItems.length > 0 || commodities.length > 0 || (tradingGame && tradingGame.money > 0))) {
        const separator = document.createElement('div');
        separator.style.height = '1px';
        separator.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
        separator.style.margin = '0.5rem 0';
        inventoryItems.appendChild(separator);
    }
    
    // Render $ (money) - always show, even if 0
    if (tradingGame) {
        const robotIncome = tradingGame.getDeployedRobotIncome();
        const merchantIncome = tradingGame.getDeployedMerchantIncome();
        const archonIncome = tradingGame.getDeployedArchonIncome();
        const totalDeployedIncome = robotIncome + merchantIncome + archonIncome;

        let incomeText = '';
        let descriptionText = 'Currency for trading commodities';

        if (totalDeployedIncome > 0) {
            incomeText = `    <span style="color: #00ff00;">+$${totalDeployedIncome}/turn</span>`;
        }

        const moneyItem = {
            id: 'money',
            name: '$',
            quantity: tradingGame.money + incomeText,
            description: descriptionText
        };
        const moneyElement = createInventoryItemElement(moneyItem, false);
        inventoryItems.appendChild(moneyElement);
        
        // Add separator after money if there are commodities
        if (commodities.length > 0) {
            const separator = document.createElement('div');
            separator.style.height = '1px';
            separator.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
            separator.style.margin = '0.25rem 0';
            inventoryItems.appendChild(separator);
        }
    }
    
    // Render commodities
    commodities.forEach(commodity => {
        let displayQuantity = commodity.quantity;
        let incomeBonus = '';

        // Special handling for slaves - show weapon, army, and archon deployment income
        if (commodity.id === 'slaves' && tradingGame) {
            const weaponIncome = tradingGame.getDeployedWeaponSlaveIncome();
            const armyIncome = tradingGame.getDeployedArmySlaveIncome();
            const archonIncome = tradingGame.getDeployedArchonSlaveIncome();
            const totalSlaveIncome = weaponIncome + armyIncome + archonIncome;
            if (totalSlaveIncome > 0) {
                incomeBonus = `    <span style="color: #00ff00;">+${totalSlaveIncome}/turn</span>`;
            }
        }

        const commodityItem = {
            id: commodity.id,
            name: tradingUI.commodityNames[commodity.id] || commodity.id,
            quantity: displayQuantity + incomeBonus,
            description: `${tradingUI.commodityNames[commodity.id] || commodity.id} commodity`
        };
        const itemElement = createInventoryItemElement(commodityItem, false);
        inventoryItems.appendChild(itemElement);
    });
    
    // Render other inventory items (if any)
    otherInventoryItems.forEach(item => {
        const itemElement = createInventoryItemElement(item, false);
        inventoryItems.appendChild(itemElement);
    });

    // Add inventory space indicator at the bottom
    const spaceIndicator = document.createElement('div');
    spaceIndicator.className = 'inventory-space-indicator';
    const usedSpace = tradingGame ? tradingGame.getInventoryUsed() : 0;
    const totalSpace = tradingGame ? tradingGame.getInventoryCapacity() : 10;
    spaceIndicator.textContent = `INVENTORY: ${usedSpace}/${totalSpace}`;
    inventoryItems.appendChild(spaceIndicator);

    // Add power indicator (only if player has weapons)
    const currentPower = getCurrentPower();
    if (currentPower > 0) {
        const powerIndicator = document.createElement('div');
        powerIndicator.className = 'inventory-space-indicator';
        powerIndicator.textContent = `POWER: ${currentPower}`;
        inventoryItems.appendChild(powerIndicator);
    }
}

// Helper function to create inventory item element
function createInventoryItemElement(item, hasShine = false) {
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item';
        itemElement.dataset.itemId = item.id;
    
    if (hasShine) {
        itemElement.classList.add('inventory-item-shine');
    }
        
        const nameElement = document.createElement('div');
        nameElement.className = 'inventory-item-name';
    nameElement.textContent = item.name || inventoryManager.getItemDisplayName(item.id, item.quantity);
        
        const quantityElement = document.createElement('div');
        quantityElement.className = 'inventory-item-quantity';
        quantityElement.innerHTML = item.quantity;
        
        itemElement.appendChild(nameElement);
        itemElement.appendChild(quantityElement);
        
        itemElement.addEventListener('click', () => {
            // Remove selected class from all items
            document.querySelectorAll('.inventory-item').forEach(el => {
                el.classList.remove('selected');
            });
            
            // Add selected class to clicked item
            itemElement.classList.add('selected');

            // Clear previous description content
            inventoryDescription.innerHTML = '';
            
            // Show description
            let descriptionText = '';
        if (item.description) {
                descriptionText = item.description;
        } else if (inventoryManager.getItemDescription) {
                descriptionText = inventoryManager.getItemDescription(item.id);
            }

            // Add deploy button for robots
            if (item.id === 'robot' && window.inventoryManager && window.tradingGame) {
                const robotItem = window.inventoryManager.getItem('robot');
                if (robotItem && robotItem.quantity > 0) {
                    // Create description with deploy button
                    const descElement = document.createElement('div');
                    descElement.innerHTML = descriptionText;

                    const deployButton = document.createElement('button');
                    deployButton.textContent = 'DEPLOY ROBOT';
                    deployButton.style.width = '100%';
                    deployButton.style.marginTop = '1rem';
                    deployButton.style.padding = '0.5rem';
                    deployButton.style.fontFamily = 'var(--font-primary)';
                    deployButton.style.fontWeight = '700';
                    deployButton.style.fontSize = '0.625rem';
                    deployButton.style.textTransform = 'uppercase';
                    deployButton.style.letterSpacing = '0.05em';
                    deployButton.style.color = 'var(--color--foreground)';
                    deployButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
                    deployButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
                    deployButton.style.borderRadius = '4px';
                    deployButton.style.cursor = 'pointer';
                    deployButton.style.transition = 'all 0.2s';

                    deployButton.addEventListener('click', () => {
                        if (window.tradingGame.deployRobot()) {
                            // Success - refresh inventory and explore panel, clear description
                            if (window.renderInventory) {
                                window.renderInventory();
                            }
                            if (window.updateExplorePanel) {
                                window.updateExplorePanel();
                            }
                            inventoryDescription.innerHTML = '';
                        }
                    });

                    descElement.appendChild(deployButton);
                    inventoryDescription.appendChild(descElement);
                    return;
                }
            }

            // Add transcend button for FTL drives (3 FTL drives = 1 Entropy)
            if (item.id === 'ftl' && window.inventoryManager && window.tradingGame) {
                const ftlItem = window.inventoryManager.getItem('ftl');
                if (ftlItem && ftlItem.quantity >= 3) {
                    // Create description with transcend button
                    const descElement = document.createElement('div');
                    descElement.innerHTML = descriptionText;

                    const transcendButton = document.createElement('button');
                    transcendButton.textContent = 'TRANSCEND (3 FTL → 1 ENTROPY)';
                    transcendButton.style.width = '100%';
                    transcendButton.style.marginTop = '1rem';
                    transcendButton.style.padding = '0.75rem';
                    transcendButton.style.fontFamily = 'var(--font-primary)';
                    transcendButton.style.fontWeight = '700';
                    transcendButton.style.fontSize = '0.625rem';
                    transcendButton.style.textTransform = 'uppercase';
                    transcendButton.style.letterSpacing = '0.05em';
                    transcendButton.style.color = 'var(--color--foreground)';
                    transcendButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
                    transcendButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
                    transcendButton.style.borderRadius = '4px';
                    transcendButton.style.cursor = 'pointer';
                    transcendButton.style.transition = 'all 0.2s';

                    transcendButton.addEventListener('click', () => {
                        // Check if player still has 3 FTL drives
                        const currentFtlItem = window.inventoryManager.getItem('ftl');
                        if (currentFtlItem && currentFtlItem.quantity >= 3) {
                            // Consume 3 FTL drives
                            window.inventoryManager.removeItem('ftl', 3);
                            // Add 1 Entropy
                            window.tradingGame.commodities['entropy'] = (window.tradingGame.commodities['entropy'] || 0) + 1;

                            // Success - refresh inventory and explore panel, clear description
                            if (window.renderInventory) {
                                window.renderInventory();
                            }
                            if (window.updateExplorePanel) {
                                window.updateExplorePanel();
                            }
                            inventoryDescription.innerHTML = '';
                        }
                    });

                    descElement.appendChild(transcendButton);
                    inventoryDescription.appendChild(descElement);
                    return;
                }
            }

            // Add deploy button for Alpha, Beta, Gamma (Deploy Omega)
            if ((item.id === 'alpha' || item.id === 'beta' || item.id === 'gamma') && window.inventoryManager && window.tradingGame) {
                // Check if player has ALL THREE components
                const hasAlpha = window.inventoryManager.hasItem('alpha', 1);
                const hasBeta = window.inventoryManager.hasItem('beta', 1);
                const hasGamma = window.inventoryManager.hasItem('gamma', 1);

                if (hasAlpha && hasBeta && hasGamma) {
                    // Create description with deploy button
                    const descElement = document.createElement('div');
                    descElement.innerHTML = descriptionText;

                    const deployButton = document.createElement('button');
                    deployButton.textContent = 'DEPLOY OMEGA';
                    deployButton.style.width = '100%';
                    deployButton.style.marginTop = '1rem';
                    deployButton.style.padding = '0.75rem';
                    deployButton.style.fontFamily = 'var(--font-primary)';
                    deployButton.style.fontWeight = '700';
                    deployButton.style.fontSize = '0.625rem';
                    deployButton.style.textTransform = 'uppercase';
                    deployButton.style.letterSpacing = '0.05em';
                    deployButton.style.color = 'var(--color--foreground)';
                    deployButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
                    deployButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
                    deployButton.style.borderRadius = '4px';
                    deployButton.style.cursor = 'pointer';
                    deployButton.style.transition = 'all 0.2s';

                    deployButton.addEventListener('click', () => {
                        // Check if player still has all three components
                        const currentHasAlpha = window.inventoryManager.hasItem('alpha', 1);
                        const currentHasBeta = window.inventoryManager.hasItem('beta', 1);
                        const currentHasGamma = window.inventoryManager.hasItem('gamma', 1);

                        if (currentHasAlpha && currentHasBeta && currentHasGamma) {
                            // Consume all three items
                            window.inventoryManager.removeItem('alpha', 1);
                            window.inventoryManager.removeItem('beta', 1);
                            window.inventoryManager.removeItem('gamma', 1);

                            // Start omega deployment
                            startOmegaDeployment();

                            // Success - refresh inventory and explore panel, clear description
                            if (window.renderInventory) {
                                window.renderInventory();
                            }
                            if (window.updateExplorePanel) {
                                window.updateExplorePanel();
                            }
                            inventoryDescription.innerHTML = '';
                        }
                    });

                    descElement.appendChild(deployButton);
                    inventoryDescription.appendChild(descElement);
                    return;
                }
            }

            // Add deploy button for merchants
            if (item.id === 'merchant' && window.inventoryManager && window.tradingGame) {
                const merchantItem = window.inventoryManager.getItem('merchant');
                if (merchantItem && merchantItem.quantity > 0) {
                    // Create description with deploy button
                    const descElement = document.createElement('div');
                    descElement.innerHTML = descriptionText;

                    const deployButton = document.createElement('button');
                    deployButton.textContent = 'DEPLOY MERCHANT';
                    deployButton.style.width = '100%';
                    deployButton.style.marginTop = '1rem';
                    deployButton.style.padding = '0.5rem';
                    deployButton.style.fontFamily = 'var(--font-primary)';
                    deployButton.style.fontWeight = '700';
                    deployButton.style.fontSize = '0.625rem';
                    deployButton.style.textTransform = 'uppercase';
                    deployButton.style.letterSpacing = '0.05em';
                    deployButton.style.color = 'var(--color--foreground)';
                    deployButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
                    deployButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
                    deployButton.style.borderRadius = '4px';
                    deployButton.style.cursor = 'pointer';
                    deployButton.style.transition = 'all 0.2s';

                    deployButton.addEventListener('click', () => {
                        if (window.tradingGame.deployMerchant()) {
                            // Success - refresh inventory and explore panel, clear description
                            if (window.renderInventory) {
                                window.renderInventory();
                            }
                            if (window.updateExplorePanel) {
                                window.updateExplorePanel();
                            }
                            inventoryDescription.innerHTML = '';
                        }
                    });

                    descElement.appendChild(deployButton);
                    inventoryDescription.appendChild(descElement);
                    return;
                }
            }

            // Add deploy button for weapons
            if (item.id === 'weapons' && window.inventoryManager && window.tradingGame) {
                const weaponItem = window.inventoryManager.getItem('weapons');
                if (weaponItem && weaponItem.quantity > 0) {
                    // Create description with deploy button
                    const descElement = document.createElement('div');
                    descElement.innerHTML = descriptionText;

                    const deployButton = document.createElement('button');
                    deployButton.textContent = 'DEPLOY WEAPON';
                    deployButton.style.width = '100%';
                    deployButton.style.marginTop = '1rem';
                    deployButton.style.padding = '0.5rem';
                    deployButton.style.fontFamily = 'var(--font-primary)';
                    deployButton.style.fontWeight = '700';
                    deployButton.style.fontSize = '0.625rem';
                    deployButton.style.textTransform = 'uppercase';
                    deployButton.style.letterSpacing = '0.05em';
                    deployButton.style.color = 'var(--color--foreground)';
                    deployButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
                    deployButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
                    deployButton.style.borderRadius = '4px';
                    deployButton.style.cursor = 'pointer';
                    deployButton.style.transition = 'all 0.2s';

                    deployButton.addEventListener('click', () => {
                        if (window.tradingGame.deployWeapon()) {
                            // Success - refresh inventory and explore panel, clear description
                            if (window.renderInventory) {
                                window.renderInventory();
                            }
                            if (window.updateExplorePanel) {
                                window.updateExplorePanel();
                            }
                            inventoryDescription.innerHTML = '';
                        }
                    });

                    descElement.appendChild(deployButton);
                    inventoryDescription.appendChild(descElement);
                    return;
                }
            }

            // Add deploy button for armies
            if (item.id === 'army' && window.inventoryManager && window.tradingGame) {
                const armyItem = window.inventoryManager.getItem('army');
                if (armyItem && armyItem.quantity > 0) {
                    // Create description with deploy button
                    const descElement = document.createElement('div');
                    descElement.innerHTML = descriptionText;

                    const deployButton = document.createElement('button');
                    deployButton.textContent = 'DEPLOY ARMY';
                    deployButton.style.width = '100%';
                    deployButton.style.marginTop = '1rem';
                    deployButton.style.padding = '0.5rem';
                    deployButton.style.fontFamily = 'var(--font-primary)';
                    deployButton.style.fontWeight = '700';
                    deployButton.style.fontSize = '0.625rem';
                    deployButton.style.textTransform = 'uppercase';
                    deployButton.style.letterSpacing = '0.05em';
                    deployButton.style.color = 'var(--color--foreground)';
                    deployButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
                    deployButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
                    deployButton.style.borderRadius = '4px';
                    deployButton.style.cursor = 'pointer';
                    deployButton.style.transition = 'all 0.2s';

                    deployButton.addEventListener('click', () => {
                        if (window.tradingGame.deployArmy()) {
                            // Success - refresh inventory and explore panel, clear description
                            if (window.renderInventory) {
                                window.renderInventory();
                            }
                            if (window.updateExplorePanel) {
                                window.updateExplorePanel();
                            }
                            inventoryDescription.innerHTML = '';
                        }
                    });

                    descElement.appendChild(deployButton);
                    inventoryDescription.appendChild(descElement);
                    return;
                }
            }

            // Add deploy button for archons
            if (item.id === 'archon' && window.inventoryManager && window.tradingGame) {
                const archonItem = window.inventoryManager.getItem('archon');
                if (archonItem && archonItem.quantity > 0) {
                    // Create description with deploy button
                    const descElement = document.createElement('div');
                    descElement.innerHTML = descriptionText;

                    const deployButton = document.createElement('button');
                    deployButton.textContent = 'DEPLOY ARCHON';
                    deployButton.style.width = '100%';
                    deployButton.style.marginTop = '1rem';
                    deployButton.style.padding = '0.5rem';
                    deployButton.style.fontFamily = 'var(--font-primary)';
                    deployButton.style.fontWeight = '700';
                    deployButton.style.fontSize = '0.625rem';
                    deployButton.style.textTransform = 'uppercase';
                    deployButton.style.letterSpacing = '0.05em';
                    deployButton.style.color = 'var(--color--foreground)';
                    deployButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
                    deployButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
                    deployButton.style.borderRadius = '4px';
                    deployButton.style.cursor = 'pointer';
                    deployButton.style.transition = 'all 0.2s';

                    deployButton.addEventListener('click', () => {
                        if (window.tradingGame.deployArchon()) {
                            // Success - refresh inventory and explore panel, clear description
                            if (window.renderInventory) {
                                window.renderInventory();
                            }
                            if (window.updateExplorePanel) {
                                window.updateExplorePanel();
                            }
                            inventoryDescription.innerHTML = '';
                        }
                    });

                    descElement.appendChild(deployButton);
                    inventoryDescription.appendChild(descElement);
                    return;
                }
            }

            // Default description display
            inventoryDescription.textContent = descriptionText;
        });
        
    return itemElement;
}

// Get current power (based on weapons, armies, and archons in inventory)
function getCurrentPower() {
    if (!window.inventoryManager) return 0;
    const weaponItem = window.inventoryManager.getItem('weapons');
    const armyItem = window.inventoryManager.getItem('army');
    const archonItem = window.inventoryManager.getItem('archon');
    const weaponPower = weaponItem ? weaponItem.quantity * 1 : 0;
    const armyPower = armyItem ? armyItem.quantity * 5 : 0;
    const archonPower = archonItem ? archonItem.quantity * 10 : 0;
    return weaponPower + armyPower + archonPower;
}

// Make renderInventory and updateExplorePanel available globally for trading UI updates
window.renderInventory = renderInventory;
window.updateExplorePanel = updateExplorePanel;
window.updateCurrentInfoBox = updateCurrentInfoBox;

inventoryToggle.addEventListener('click', () => {
    const isOpening = !inventoryPanel.classList.contains('open');
    inventoryPanel.classList.toggle('open');
    inventoryToggle.classList.toggle('hidden');
    
    if (isOpening) {
        // Close control panel and explore if open
        controlPanel.classList.remove('open');
        explorePanel.classList.remove('open');
        // Hide CONSOLE and explore buttons when inventory opens
        panelToggle.classList.add('hidden');
        exploreToggle.classList.add('hidden');
        // Render inventory when opening
        renderInventory();
    } else {
        // Show CONSOLE and explore buttons when inventory closes
        panelToggle.classList.remove('hidden');
        exploreToggle.classList.remove('hidden');
    }
});

inventoryClose.addEventListener('click', () => {
    inventoryPanel.classList.remove('open');
    inventoryToggle.classList.remove('hidden');
    // Show CONSOLE and explore buttons when inventory closes
    panelToggle.classList.remove('hidden');
    exploreToggle.classList.remove('hidden');
    // Clear description
    inventoryDescription.textContent = '';
});

// Explore Panel Toggle
exploreToggle.addEventListener('click', () => {
    const isOpening = !explorePanel.classList.contains('open');
    explorePanel.classList.toggle('open');
    exploreToggle.classList.toggle('hidden');
    
    if (isOpening) {
        // Close control panel and inventory if open
        controlPanel.classList.remove('open');
        inventoryPanel.classList.remove('open');
        // Hide CONSOLE and inventory buttons when explore opens
        panelToggle.classList.add('hidden');
        inventoryToggle.classList.add('hidden');
        // Update explore panel content
        updateExplorePanel();
    } else {
        // Show CONSOLE and inventory buttons when explore closes
        panelToggle.classList.remove('hidden');
        inventoryToggle.classList.remove('hidden');
    }
});

exploreClose.addEventListener('click', () => {
    explorePanel.classList.remove('open');
    exploreToggle.classList.remove('hidden');
    // Show CONSOLE and inventory buttons when explore closes
    panelToggle.classList.remove('hidden');
    inventoryToggle.classList.remove('hidden');
});

// Initialize PillSteppers
const panelContent = document.querySelector('.panel-content');

// Create 5 pillsteppers with placeholder labels
const stepperLabels = [
    'ZOOM',
    'VERTICAL',
    'SPACING',
    'SPEED',
    'FREQUENCY'
];

// steppers array already declared above, now populate it
for (let i = 0; i < 5; i++) {
    const stepperContainer = document.createElement('div');
    stepperContainer.className = 'stepper-container';
    panelContent.appendChild(stepperContainer);
    
    const stepper = new PillStepper(stepperContainer, {
        label: stepperLabels[i],
        min: 0,
        max: 10,
        defaultValue: 5,
        onChange: (value) => {
            if (i === 0) {
                // Zoom control: map value 0-10 to z position 20-5
                // Value 5 = z 10 (current), so: z = 20 - value*2
                targetZoom = 20 - (value * 2);
            } else if (i === 1) {
                // Y position control: map value 0-10 to y position -2 to 6
                // Value 5 = y 2 (current), so: y = -2 + value*0.8
                targetY = -2 + (value * 0.8);
            } else if (i === 2) {
                // Spacing control: map value 0-10 to spacing 1.0 to 4.0
                // Value 5 = spacing 2.5 (current), so: spacing = 1.0 + value*0.3
                targetSpacing = 1.0 + (value * 0.3);
            } else if (i === 3) {
                // Rotation speed control: map value 0-10 to speed 0 to 0.004
                // Value 0 = 0 (stopped), Value 5 = 0.002 (current), Value 10 = 0.004 (max)
                // Formula: speed = value * 0.0004
                rotationSpeed = value * 0.0004;
                
                // Award Time Traveller achievement when speed is adjusted
                if (window.scoreManager) {
                    const isNewAchievement = window.scoreManager.addAchievement('Time Traveller');
                    // Update score display if it exists
                    if (isNewAchievement && window.updateScoreDisplay) {
                        window.updateScoreDisplay();
                    }
                }
            } else if (i === 4) {
                // Frequency control: when frequency is 1, enter combat mode
                // When frequency is 4, hide labels and lines
                // When frequency is 6, Mercury is added to greenlist

                // Combat mode at frequency 1
                if (value === 1) {
                    // Enter voluntary combat mode (keep console visible)
                    if (window.combatManager && !window.combatManager.inCombat) {
                        window.combatManager.enterVoluntaryCombat();
                    }
                } else {
                    // Exit combat mode if not in defend mode
                    if (window.combatManager && window.combatManager.combatMode === 'voluntary') {
                        window.combatManager.exitVoluntaryCombat();
                    }
                }

                // Visual effects at frequency 4
                if (value === 4) {
                    // Hide labels and lines when frequency is 4
                    if (sceneManager) {
                        sceneManager.setLabelsAndLinesVisible(false);
                    }
                } else {
                    // Show labels and lines for other frequencies
                    if (sceneManager) {
                        sceneManager.setLabelsAndLinesVisible(true);
                    }
                }
                // Refresh explore panel to update greenlist display
                if (window.updateExplorePanel) {
                    window.updateExplorePanel();
                }
                // Update any open infobox to reflect new frequency-based availability
                updateCurrentInfoBox();
            }
        }
    });
    
    steppers.push(stepper);
}

// Add SKIP TURN pillstepper (same as others)
const skipTurnContainer = document.createElement('div');
skipTurnContainer.className = 'stepper-container';
panelContent.appendChild(skipTurnContainer);

// Create pillstepper for SKIP TURN (display only, interaction handled separately)
const skipTurnStepper = new PillStepper(skipTurnContainer, {
    label: 'SKIP TURN',
    min: 0,
    max: 1,
    defaultValue: 0,
    onChange: () => {} // Handled by direct click listener
});

// Customize the buttons for SKIP TURN functionality
setTimeout(() => {
    // Hide both buttons - we'll make the entire stepper clickable
    const allButtons = skipTurnContainer.querySelectorAll('.stepper__button');
    allButtons.forEach(btn => {
        btn.style.display = 'none';
    });

    // Make the stepper track area clickable instead
    const stepperWrapper = skipTurnContainer.querySelector('.stepper');
    if (stepperWrapper) {
        stepperWrapper.style.cursor = 'pointer';
        stepperWrapper.addEventListener('click', () => {
            if (!travelState.isTraveling && !skipTurnCooldown) {
                skipTurn();
            }
        });
    }
}, 100);

// Global cooldown state
let skipTurnCooldown = false;
let skipTurnCooldownEnd = 0;

// Session-based skip counter (resets on page reload)
let sessionSkips = 0;

// Skip turn function with cooldown
function skipTurn() {
    if (travelState.isTraveling || skipTurnCooldown) return;

    // Store current location as the "last skipped location" for agro NPCs to target
    localStorage.setItem('player_last_skipped_location', currentLocation);
    console.log(`📍 Player skipped turn at location: ${currentLocation} - agro NPCs will target this location`);

    // Advance all NPC turns simultaneously (let them start moving/animating)
    if (npcManager) {
        npcManager.advanceAllTurnsSimultaneously();
    }

    // Process delayed agro activations BEFORE moving agro NPCs
    if (window.combatManager) {
        window.combatManager.advanceTurn();
    }

    // Move all agro NPCs to the player's last skipped location
    if (npcManager) {
        npcManager.moveAllAgroNPCsOnPlayerSkip();
    }

    // Increment session skip counter
    sessionSkips++;

    // Award $200 bonus for the first skip in this session
    if (sessionSkips === 1) {
        if (tradingGame) {
            tradingGame.money += 200;
            console.log('First skip bonus awarded: +$200 (total: $' + tradingGame.money + ')');

            // Force update the money display by re-rendering inventory
            setTimeout(() => {
                if (window.renderInventory) {
                    window.renderInventory();
                }
            }, 10);
        }
    }

    // Check for Dreamer achievement (5 skips in session)
    if (sessionSkips >= 5 && window.scoreManager && !window.scoreManager.hasAchievement('Dreamer')) {
        const isNewAchievement = window.scoreManager.addAchievement('Dreamer');
        if (isNewAchievement && window.updateScoreDisplay) {
            window.updateScoreDisplay();
        }
    }

    // Award 1 point for skipping a turn
    if (window.scoreManager) {
        window.scoreManager.addScore(1);
        if (window.updateScoreDisplay) {
            window.updateScoreDisplay();
        }
    }

    // Start 30-second cooldown
    skipTurnCooldown = true;
    skipTurnCooldownEnd = Date.now() + (30 * 1000); // 30 seconds from now

    // Update button display
    updateSkipTurnDisplay();

    // Reset cooldown after 30 seconds
    setTimeout(() => {
        skipTurnCooldown = false;
        updateSkipTurnDisplay();
    }, 30 * 1000);

    // Pillstepper value stays at 0 since buttons are hidden
}

// Update the display to show cooldown and hide entire stepper
function updateSkipTurnDisplay() {
    const label = skipTurnContainer.querySelector('.stepper__label');
    const stepper = skipTurnContainer.querySelector('.stepper');

    if (label) {
        if (skipTurnCooldown) {
            const remaining = Math.ceil((skipTurnCooldownEnd - Date.now()) / 1000);
            label.textContent = `COOLDOWN (${remaining}s)`;
            label.style.color = 'rgba(255, 100, 100, 0.8)';
        } else {
            label.textContent = '';
            label.style.color = 'var(--color--foreground)';
        }
    }

    // Hide the entire SKIP TURN stepper during cooldown or travel
    const shouldHide = travelState.isTraveling || skipTurnCooldown;
    skipTurnContainer.style.display = shouldHide ? 'none' : '';

    // Update stepper appearance for clickability (when visible)
    if (stepper && !shouldHide) {
        if (travelState.isTraveling) {
            stepper.style.opacity = '0.5';
            stepper.style.cursor = 'not-allowed';
            stepper.style.pointerEvents = 'none'; // Disable clicks during travel
        } else {
            stepper.style.opacity = '1';
            stepper.style.cursor = 'pointer';
            stepper.style.pointerEvents = 'auto'; // Enable clicks when available
        }
    }

    console.log('SKIP TURN stepper visibility set to:', shouldHide ? 'none' : 'visible', 'traveling:', travelState.isTraveling, 'cooldown:', skipTurnCooldown);
}

// Update cooldown display every second
setInterval(updateSkipTurnDisplay, 1000);

// Hook into travel state changes
const originalStartTravel = window.startTravel;
window.startTravel = function(...args) {
    if (originalStartTravel) originalStartTravel.apply(this, args);
    setTimeout(updateSkipTurnDisplay, 100);
};

const originalOnTravelComplete = window.onTravelComplete;
window.onTravelComplete = function() {
    if (originalOnTravelComplete) originalOnTravelComplete();
    updateSkipTurnDisplay();
};

// Initial display update
updateSkipTurnDisplay();

// Add score and achievements section at the bottom
const scoreSection = document.createElement('div');
scoreSection.className = 'score-section';
scoreSection.style.marginTop = 'auto';
scoreSection.style.paddingTop = '2rem';
scoreSection.style.borderTop = '1px solid rgba(196, 213, 188, 0.2)';

const description = document.createElement('div');
description.className = 'score-description';
description.style.fontSize = '0.625rem';
description.style.lineHeight = '1.5';
description.style.marginBottom = '1.5rem';
description.style.color = 'var(--color--foreground)';
description.innerHTML = 'Ascended Masters have <u>fewer</u> points and achievements.';

const scoreLabel = document.createElement('div');
scoreLabel.className = 'score-label';
scoreLabel.style.fontSize = '0.625rem';
scoreLabel.style.textTransform = 'uppercase';
scoreLabel.style.letterSpacing = '0.1em';
scoreLabel.style.marginBottom = '0.5rem';
scoreLabel.style.color = 'var(--color--foreground)';
scoreLabel.textContent = 'SCORE:';

const scoreValue = document.createElement('div');
scoreValue.className = 'score-value';
scoreValue.style.fontSize = '0.625rem';
scoreValue.style.color = 'var(--color--foreground)';
scoreValue.style.opacity = '0.7';
scoreValue.style.marginBottom = '1rem';

const achievementsLabel = document.createElement('div');
achievementsLabel.className = 'achievements-label';
achievementsLabel.style.fontSize = '0.625rem';
achievementsLabel.style.textTransform = 'uppercase';
achievementsLabel.style.letterSpacing = '0.1em';
achievementsLabel.style.marginTop = '1rem';
achievementsLabel.style.marginBottom = '0.5rem';
achievementsLabel.style.color = 'var(--color--foreground)';
achievementsLabel.textContent = 'ACHIEVEMENTS:';

const achievementsList = document.createElement('div');
achievementsList.className = 'achievements-list';
achievementsList.style.fontSize = '0.625rem';
achievementsList.style.color = 'var(--color--foreground)';
achievementsList.style.opacity = '0.7';
achievementsList.style.lineHeight = '1.5';

// Function to update score and achievements display
function updateScoreDisplay() {
    if (window.scoreManager) {
        scoreValue.textContent = window.scoreManager.getScore().toString();
        const allAchievements = window.scoreManager.getAchievements();

        // Define meta-achievement combinations to hide constituent achievements
        const metaAchievementConstituents = new Set([
            'prostitute', 'transhumanist', 'martian', // Victim
            'saturn worshipper', // Vermin (shared)
            'slaver', 'jew', // Trafficker
            'puppet', 'beggar', // Snake
            'snake', 'ancient', // Mogul
            'satanist', 'pedophile', // Demon
            // Hellion (saturn worshipper, satanist, ancient - already covered)
            'archangel', 'astral traveller', // Angel
            'getaway', // Legend (archangel, getaway, saturn worshipper - already covered)
            'time traveller', 'dreamer', 'station', // Cosmic
            // Void (archangel, satanist, jew - already covered)
            // Nexus (prostitute, beggar, pedophile - already covered)
            // Eclipse (martian, puppet, getaway - already covered)
        ]);

        // Filter out constituent achievements if their meta-achievement is earned
        const metaAchievements = ['Victim', 'Vermin', 'Trafficker', 'Snake', 'Mogul', 'Demon', 'Hellion', 'Angel', 'Legend', 'Cosmic', 'Void', 'Nexus', 'Eclipse'];
        const hasMetaAchievements = metaAchievements.some(meta => allAchievements.includes(meta));

        let displayAchievements;
        if (hasMetaAchievements) {
            // Filter out constituent achievements
            displayAchievements = allAchievements.filter(achievement =>
                !metaAchievementConstituents.has(achievement)
            );
        } else {
            displayAchievements = allAchievements;
        }

        if (displayAchievements.length === 0) {
            achievementsList.textContent = 'None';
        } else {
            achievementsList.textContent = displayAchievements.join(', ');
        }
    }
}

// Make updateScoreDisplay available globally
window.updateScoreDisplay = updateScoreDisplay;

scoreSection.appendChild(description);
scoreSection.appendChild(scoreLabel);
scoreSection.appendChild(scoreValue);
scoreSection.appendChild(achievementsLabel);
scoreSection.appendChild(achievementsList);
panelContent.appendChild(scoreSection);

// Initialize display
updateScoreDisplay();

// Helper function to create Station button (sacred knowledge revelation)
function createStationButton(parentElement, stationObject) {
    // Clear existing content
    parentElement.innerHTML = '';

    // Sacred text revelation
    const sacredText = document.createElement('div');
    sacredText.style.marginBottom = '2rem';
    sacredText.style.padding = '1rem';
    sacredText.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
    sacredText.style.borderRadius = '4px';
    sacredText.style.border = '1px solid rgba(196, 213, 188, 0.1)';
    sacredText.style.fontFamily = 'var(--font-primary)';
    sacredText.style.fontSize = '0.875rem';
    sacredText.style.color = 'var(--color--foreground)';
    sacredText.style.lineHeight = '1.5';
    sacredText.innerHTML = `
        <div style="text-align: center; margin-bottom: 1rem; font-weight: 600; opacity: 0.8;">
            SACRED KNOWLEDGE REVEALED
        </div>
        <div style="text-align: center;">
            You must go three times the Speed of Light to harvest a single moment of Entropy.
        </div>
    `;
    parentElement.appendChild(sacredText);

    // Station button
    const button = document.createElement('button');
    button.textContent = 'STATION';
    button.style.width = '100%';
    button.style.padding = '1rem';
    button.style.fontFamily = 'var(--font-primary)';
    button.style.fontWeight = '700';
    button.style.fontSize = '0.75rem';
    button.style.textTransform = 'uppercase';
    button.style.letterSpacing = '0.1em';
    button.style.color = 'var(--color--foreground)';
    button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    button.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.transition = 'all 0.2s';

    // Check if Station achievement already earned
    const hasStationAchievement = window.scoreManager && window.scoreManager.hasAchievement('Station');
    if (hasStationAchievement) {
        button.disabled = true;
        button.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
        button.style.cursor = 'not-allowed';
        button.style.opacity = '0.5';
        button.textContent = 'STATION ACHIEVED';
    }

    // Hover effects (only if not disabled)
    button.addEventListener('mouseenter', () => {
        if (!button.disabled) {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.25)';
        }
    });

    button.addEventListener('mouseleave', () => {
        if (!button.disabled) {
            button.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
        }
    });

    // Click handler
    button.addEventListener('click', () => {
        if (button.disabled) return;

        // Award Station achievement
        if (window.scoreManager) {
            window.scoreManager.addAchievement('Station');
            // Update score display
            if (window.updateScoreDisplay) {
                window.updateScoreDisplay();
            }
        }

        // Automatically transport to Jupiter
        if (!travelState.isTraveling) {
            startTravel('JUPITER');
        }

        // Disable button after use
        button.disabled = true;
        button.style.backgroundColor = 'rgba(196, 213, 188, 0.05)';
        button.style.cursor = 'not-allowed';
        button.style.opacity = '0.5';
        button.textContent = 'STATION ACHIEVED';

        // Update Jupiter's explore content
        const jupiterObject = sceneManager.allObjects.find(obj => obj.name === 'jupiter');
        if (jupiterObject) {
            jupiterObject.exploreContent = 'Take the 4 Elements to Monolith and Consecrate the Singularity.';
        }
    });

    parentElement.appendChild(button);
}

// Helper function to create Monolith consecration button (final endgame)
function createMonolithButton(parentElement, monolithObject) {
    // Clear existing content
    parentElement.innerHTML = '';

    // Add title/description
    const titleDiv = document.createElement('div');
    titleDiv.style.textAlign = 'center';
    titleDiv.style.marginBottom = '2rem';
    titleDiv.style.fontFamily = 'var(--font-primary)';
    titleDiv.style.fontSize = '1.2rem';
    titleDiv.style.fontWeight = '600';
    titleDiv.style.color = 'var(--color--foreground)';
    titleDiv.textContent = 'THE MONOLITH';
    parentElement.appendChild(titleDiv);

    // Create the large shimmering button (no text)
    const monolithButton = document.createElement('button');
    monolithButton.className = 'monolith-button';
    monolithButton.style.width = '200px';
    monolithButton.style.height = '200px';
    monolithButton.style.borderRadius = '50%';
    monolithButton.style.border = '4px solid gold';
    monolithButton.style.background = 'radial-gradient(circle, #ffd700, gold, #daa520)';
    monolithButton.style.cursor = 'pointer';
    monolithButton.style.position = 'relative';
    monolithButton.style.overflow = 'hidden';
    monolithButton.style.margin = '0 auto';
    monolithButton.style.display = 'block';
    monolithButton.style.animation = 'monolith-shimmer 2s infinite ease-in-out';
    monolithButton.style.boxShadow = '0 0 30px gold';

    // Add sparkle effect overlay
    const sparkleOverlay = document.createElement('div');
    sparkleOverlay.style.position = 'absolute';
    sparkleOverlay.style.top = '0';
    sparkleOverlay.style.left = '0';
    sparkleOverlay.style.width = '100%';
    sparkleOverlay.style.height = '100%';
    sparkleOverlay.style.background = 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.6) 0%, transparent 50%)';
    sparkleOverlay.style.animation = 'monolith-sparkle 3s infinite linear';
    sparkleOverlay.style.pointerEvents = 'none';
    monolithButton.appendChild(sparkleOverlay);

    // Function to check requirements
    function checkMonolithRequirements() {
        const hasEarth = window.inventoryManager && window.inventoryManager.hasItem('earth', 1);
        const hasFire = window.inventoryManager && window.inventoryManager.hasItem('fire', 1);
        const hasWind = window.inventoryManager && window.inventoryManager.hasItem('wind', 1);
        const hasWater = window.inventoryManager && window.inventoryManager.hasItem('water', 1);
        const hasBody = window.inventoryManager && window.inventoryManager.hasItem('body', 1);
        const hasSoul = window.inventoryManager && window.inventoryManager.hasItem('soul', 1);
        const hasSpirit = window.inventoryManager && window.inventoryManager.hasItem('spirit', 1);
        const hasThrone = window.inventoryManager && window.inventoryManager.hasItem('throne', 1);

        return hasEarth && hasFire && hasWind && hasWater && hasBody && hasSoul && hasSpirit && hasThrone;
    }

    // Click handler
    monolithButton.addEventListener('click', () => {
        if (monolithButton.disabled) return;

        const hasRequirements = checkMonolithRequirements();

        if (hasRequirements) {
            // Win condition - show victory screen
            console.log('🎉 MONOLITH: Player has all requirements - WIN condition!');
            showVictoryScreen(parentElement);
        } else {
            // Game over - reincarnation countdown
            showReincarnationCountdown();
        }

        // Disable button after click
        monolithButton.disabled = true;
        monolithButton.style.opacity = '0.5';
        monolithButton.style.cursor = 'not-allowed';
        monolithButton.style.animation = 'none';
    });

    parentElement.appendChild(monolithButton);
}

// Function to show victory screen
function showVictoryScreen(parentElement) {
    // Clear existing content
    parentElement.innerHTML = '';

    // Create victory popup overlay
    const victoryPopup = document.createElement('div');
    victoryPopup.style.position = 'fixed';
    victoryPopup.style.top = '0';
    victoryPopup.style.left = '0';
    victoryPopup.style.width = '100%';
    victoryPopup.style.height = '100%';
    victoryPopup.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
    victoryPopup.style.zIndex = '10000';
    victoryPopup.style.display = 'flex';
    victoryPopup.style.alignItems = 'center';
    victoryPopup.style.justifyContent = 'center';
    victoryPopup.style.flexDirection = 'column';
    victoryPopup.style.padding = '2rem';
    victoryPopup.style.boxSizing = 'border-box';

    // Create confetti animation (reuse Neptune party confetti)
    createRainbowConfetti();

    // Victory banner
    const banner = document.createElement('div');
    banner.style.textAlign = 'center';
    banner.style.marginBottom = '2rem';
    banner.style.fontFamily = 'var(--font-primary)';
    banner.style.fontSize = 'clamp(1.5rem, 4vw, 2.5rem)';
    banner.style.fontWeight = '700';
    banner.style.color = 'gold';
    banner.style.textTransform = 'uppercase';
    banner.style.letterSpacing = '0.1em';
    banner.style.textShadow = '0 0 20px gold, 0 0 40px gold';
    banner.style.lineHeight = '1.2';
    banner.style.maxWidth = '800px';
    banner.style.background = 'rgba(0, 0, 0, 0.7)';
    banner.style.padding = '2rem';
    banner.style.borderRadius = '10px';
    banner.style.border = '2px solid gold';
    banner.textContent = 'You have transcended space and time to escape samsara and reignite the singularity.';
    victoryPopup.appendChild(banner);

    // Achievements section
    const achievementsSection = document.createElement('div');
    achievementsSection.style.textAlign = 'center';
    achievementsSection.style.fontFamily = 'var(--font-primary)';
    achievementsSection.style.color = 'var(--color--foreground)';
    achievementsSection.style.maxWidth = '600px';
    achievementsSection.style.background = 'rgba(20, 20, 20, 0.9)';
    achievementsSection.style.padding = '1.5rem';
    achievementsSection.style.borderRadius = '8px';
    achievementsSection.style.border = '1px solid rgba(196, 213, 188, 0.3)';

    const achievementsTitle = document.createElement('div');
    achievementsTitle.style.fontSize = '1.2rem';
    achievementsTitle.style.fontWeight = '700';
    achievementsTitle.style.marginBottom = '1rem';
    achievementsTitle.style.textTransform = 'uppercase';
    achievementsTitle.style.letterSpacing = '0.05em';
    achievementsTitle.style.color = 'var(--color--foreground)';
    achievementsTitle.textContent = 'ACHIEVEMENTS UNLOCKED:';
    achievementsSection.appendChild(achievementsTitle);

    const achievementsList = document.createElement('div');
    achievementsList.style.fontSize = '0.9rem';
    achievementsList.style.lineHeight = '1.6';
    achievementsList.style.opacity = '0.9';

    // Get achievements using the same filtering logic as updateScoreDisplay
    if (window.scoreManager) {
        const allAchievements = window.scoreManager.getAchievements();

        // Define meta-achievement combinations to hide constituent achievements
        const metaAchievementConstituents = new Set([
            'prostitute', 'transhumanist', 'martian',
            'saturn worshipper',
            'slaver', 'jew',
            'puppet', 'beggar',
            'snake', 'ancient',
            'satanist', 'pedophile',
            'archangel', 'astral traveller',
            'getaway',
            'time traveller', 'dreamer', 'station'
        ]);

        // Filter out constituent achievements if their meta-achievement is earned
        const metaAchievements = ['Victim', 'Vermin', 'Trafficker', 'Snake', 'Mogul', 'Demon', 'Hellion', 'Angel', 'Legend', 'Cosmic', 'Void', 'Nexus', 'Eclipse'];
        const hasMetaAchievements = metaAchievements.some(meta => allAchievements.includes(meta));

        let displayAchievements;
        if (hasMetaAchievements) {
            displayAchievements = allAchievements.filter(achievement =>
                !metaAchievementConstituents.has(achievement)
            );
        } else {
            displayAchievements = allAchievements;
        }

        if (displayAchievements.length === 0) {
            achievementsList.textContent = 'None';
        } else {
            achievementsList.textContent = displayAchievements.join(', ');
        }
    } else {
        achievementsList.textContent = 'None';
    }

    achievementsSection.appendChild(achievementsList);
    victoryPopup.appendChild(achievementsSection);

    // Close button (optional - game ends here)
    const closeButton = document.createElement('button');
    closeButton.textContent = 'CONTINUE JOURNEY';
    closeButton.style.marginTop = '2rem';
    closeButton.style.padding = '1rem 2rem';
    closeButton.style.fontFamily = 'var(--font-primary)';
    closeButton.style.fontSize = '0.9rem';
    closeButton.style.fontWeight = '700';
    closeButton.style.textTransform = 'uppercase';
    closeButton.style.letterSpacing = '0.05em';
    closeButton.style.color = 'var(--color--foreground)';
    closeButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    closeButton.style.border = '1px solid rgba(196, 213, 188, 0.3)';
    closeButton.style.borderRadius = '4px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.transition = 'all 0.2s';

    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.backgroundColor = 'rgba(196, 213, 188, 0.2)';
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
    });

    closeButton.addEventListener('click', () => {
        // For now, just reload the game (could add more sophisticated continuation)
        window.location.reload();
    });

    victoryPopup.appendChild(closeButton);

    document.body.appendChild(victoryPopup);
}

// Function to show reincarnation countdown popup
function showReincarnationCountdown() {
    // Create popup overlay
    const popup = document.createElement('div');
    popup.className = 'reincarnation-popup';
    popup.style.position = 'fixed';
    popup.style.top = '0';
    popup.style.left = '0';
    popup.style.width = '100%';
    popup.style.height = '100%';
    popup.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    popup.style.zIndex = '10000';
    popup.style.display = 'flex';
    popup.style.alignItems = 'center';
    popup.style.justifyContent = 'center';

    const popupContent = document.createElement('div');
    popupContent.style.backgroundColor = 'rgba(20, 20, 20, 0.95)';
    popupContent.style.border = '3px solid #ff0000';
    popupContent.style.padding = '3rem';
    popupContent.style.borderRadius = '10px';
    popupContent.style.textAlign = 'center';
    popupContent.style.maxWidth = '500px';

    const title = document.createElement('div');
    title.style.fontFamily = 'var(--font-primary)';
    title.style.fontSize = '2rem';
    title.style.fontWeight = '700';
    title.style.color = '#ff0000';
    title.style.marginBottom = '1rem';
    title.style.textTransform = 'uppercase';
    title.style.letterSpacing = '0.1em';
    title.textContent = 'REINCARNATION INITIATED';

    const message = document.createElement('div');
    message.style.fontFamily = 'var(--font-primary)';
    message.style.fontSize = '1.2rem';
    message.style.color = 'var(--color--foreground)';
    message.style.marginBottom = '2rem';
    message.textContent = 'Insufficient Elements for Singularity. Beginning reincarnation sequence...';

    const countdownDisplay = document.createElement('div');
    countdownDisplay.style.fontFamily = 'var(--font-primary)';
    countdownDisplay.style.fontSize = '3rem';
    countdownDisplay.style.fontWeight = '700';
    countdownDisplay.style.color = '#ff0000';
    countdownDisplay.style.marginBottom = '1rem';

    popupContent.appendChild(title);
    popupContent.appendChild(message);
    popupContent.appendChild(countdownDisplay);
    popup.appendChild(popupContent);
    document.body.appendChild(popup);

    // Start countdown
    let countdown = 10;
    countdownDisplay.textContent = countdown;

    const countdownInterval = setInterval(() => {
        countdown--;
        countdownDisplay.textContent = countdown;

        if (countdown <= 0) {
            clearInterval(countdownInterval);

            // Game over - reload the page
            message.textContent = 'Reincarnation complete. The cycle begins anew...';
            countdownDisplay.textContent = 'GAME OVER';

            // Auto-reload after 3 seconds
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    }, 1000);
}

// Omega deployment system
function startOmegaDeployment() {
    // Step 1: Get Anunnaki name
    const anunnakiName = prompt('Enter the name of the Anunnaki:');

    if (!anunnakiName || anunnakiName.trim() === '') {
        // Handle cancellation - refund the consumed items
        alert('Omega deployment cancelled - Anunnaki name required');
        window.inventoryManager.addItem('alpha', 1);
        window.inventoryManager.addItem('beta', 1);
        window.inventoryManager.addItem('gamma', 1);
        return;
    }

    // Step 2: Rename and transform moon
    renameAndTransformMoon(anunnakiName.trim());

    // Step 3: Start charging
    startOmegaCharging();
}

function renameAndTransformMoon(anunnakiName) {
    // Find the moon object
    const moonObject = window.sceneManager.allObjects.find(obj => obj.name === 'MOON');
    if (moonObject) {
        // Rename the moon
        moonObject.name = anunnakiName.toUpperCase();

        // Update the label text
        if (moonObject.label && moonObject.label.textContent) {
            moonObject.label.textContent = anunnakiName.toUpperCase();
        }

        // Transform moon to bright pink sphere
        if (moonObject.mesh && moonObject.mesh.material) {
            // Change material to bright pink emissive
            moonObject.mesh.material.color.setHex(0xff1493); // Deep pink
            moonObject.mesh.material.emissive.setHex(0xff1493);
            moonObject.mesh.material.emissiveIntensity = 0.8;
            moonObject.mesh.material.needsUpdate = true;
        }

        // Update infobox content
        moonObject.infoboxContent = `${anunnakiName.toUpperCase()}\n\nThe transformed moon now serves as the Omega weapon platform.`;

        console.log(`🌙 Moon renamed to ${anunnakiName.toUpperCase()} and transformed to bright pink`);
    }
}

function startOmegaCharging() {
    // Initialize omega charging in trading game
    if (window.tradingGame) {
        window.tradingGame.omegaCharge = 0;
        console.log('⚡ Omega charging initiated - 10 turns required');
    }

    // Update moon explore menu to show charging interface
    updateMoonOmegaInterface(false, 0);
}

function updateMoonOmegaInterface(isCharged = false, chargeLevel = 0) {
    // This will be called to update the moon's explore panel
    // For now, just refresh the explore panel to trigger the interface update
    if (window.updateExplorePanel) {
        window.updateExplorePanel();
    }
}

function createMoonOmegaInterface(parentElement, moonObject) {
    if (!window.tradingGame) return;

    const omegaSection = document.createElement('div');
    omegaSection.style.marginTop = '1rem';
    omegaSection.style.padding = '1rem';
    omegaSection.style.backgroundColor = 'rgba(255, 20, 147, 0.1)'; // Pink background
    omegaSection.style.borderRadius = '4px';
    omegaSection.style.border = '1px solid rgba(255, 20, 147, 0.3)';
    omegaSection.style.textAlign = 'center';

    if (window.tradingGame.omegaCharge >= 10) {
        // Omega is fully charged - show destruction interface
        omegaSection.innerHTML = `
            <div style="color: #ff1493; font-weight: 700; margin-bottom: 1rem;">⚡ OMEGA FULLY CHARGED ⚡</div>
            <div style="margin-bottom: 1rem; font-size: 0.75rem;">Select target to destroy:</div>
        `;

        // Create dropdown with destroyable locations
        const selectElement = document.createElement('select');
        selectElement.style.width = '100%';
        selectElement.style.marginBottom = '1rem';
        selectElement.style.padding = '0.5rem';
        selectElement.style.fontFamily = 'var(--font-primary)';
        selectElement.style.backgroundColor = 'rgba(196, 213, 188, 0.1)';
        selectElement.style.border = '1px solid rgba(196, 213, 188, 0.3)';
        selectElement.style.borderRadius = '4px';
        selectElement.style.color = 'var(--color--foreground)';

        // Get all objects with infobox content (except protected ones)
        const destroyableObjects = window.sceneManager.allObjects.filter(obj =>
            obj.infoboxContent &&
            obj.name !== 'MOON' &&
            obj.name !== moonObject.name && // Don't include the renamed moon
            obj.name !== 'ROOT' &&
            obj.name !== 'CROWN' &&
            obj.name !== 'NUCLEUS' &&
            obj.name !== 'MONOLITH'
        );

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select target...';
        selectElement.appendChild(defaultOption);

        // Add destroyable locations
        destroyableObjects.forEach(obj => {
            const option = document.createElement('option');
            option.value = obj.name;
            option.textContent = obj.name;
            selectElement.appendChild(option);
        });

        // Destroy button
        const destroyButton = document.createElement('button');
        destroyButton.textContent = 'DESTROY TARGET';
        destroyButton.style.width = '100%';
        destroyButton.style.padding = '0.75rem';
        destroyButton.style.fontFamily = 'var(--font-primary)';
        destroyButton.style.fontWeight = '700';
        destroyButton.style.fontSize = '0.625rem';
        destroyButton.style.textTransform = 'uppercase';
        destroyButton.style.letterSpacing = '0.05em';
        destroyButton.style.color = 'var(--color--foreground)';
        destroyButton.style.backgroundColor = 'rgba(255, 20, 147, 0.2)';
        destroyButton.style.border = '1px solid rgba(255, 20, 147, 0.5)';
        destroyButton.style.borderRadius = '4px';
        destroyButton.style.cursor = 'pointer';
        destroyButton.style.transition = 'all 0.2s';

        destroyButton.addEventListener('click', () => {
            const targetName = selectElement.value;
            if (!targetName) {
                alert('Please select a target to destroy');
                return;
            }

            // Find and destroy the target
            destroyLocation(targetName);

            // Reset omega charge after use
            window.tradingGame.omegaCharge = 0;

            // Update interface
            updateMoonOmegaInterface(false, 0);
        });

        omegaSection.appendChild(selectElement);
        omegaSection.appendChild(destroyButton);

    } else {
        // Omega is charging - show progress
        const progressPercent = (window.tradingGame.omegaCharge / 10) * 100;
        omegaSection.innerHTML = `
            <div style="color: #ff1493; font-weight: 700; margin-bottom: 1rem;">⚡ OMEGA CHARGING ⚡</div>
            <div style="margin-bottom: 1rem; font-size: 0.75rem;">Charge Level: ${window.tradingGame.omegaCharge}/10 turns</div>
            <div style="width: 100%; height: 20px; background-color: rgba(196, 213, 188, 0.1); border-radius: 10px; margin-bottom: 0.5rem;">
                <div style="width: ${progressPercent}%; height: 100%; background-color: #ff1493; border-radius: 10px; transition: width 0.3s ease;"></div>
            </div>
            <div style="font-size: 0.625rem; opacity: 0.7;">Charging complete in ${10 - window.tradingGame.omegaCharge} turns</div>
        `;
    }

    parentElement.appendChild(omegaSection);
}

function destroyLocation(targetName) {
    console.log(`💥 Destroying ${targetName} with Omega weapon`);

    // Find the target object
    const targetObject = window.sceneManager.allObjects.find(obj => obj.name === targetName);
    if (!targetObject) {
        console.error(`Target ${targetName} not found`);
        return;
    }

    // Create explosion effect (reuse supernova if available, or create simple effect)
    createExplosionEffect(targetObject.position);

    // Remove from scene
    window.sceneManager.removeObject(targetName);

    // Remove from greenlist (mark as permanently removed)
    localStorage.setItem(`${targetName}_removed_from_greenlist`, 'true');

    // Remove any associated NPCs
    if (window.npcManager) {
        // Find NPCs associated with this location
        const locationNpcs = window.npcManager.npcs.filter(npc => npc.homePlanet === targetName);
        locationNpcs.forEach(npc => {
            window.npcManager.removeNpc(npc.id);
            console.log(`💀 ${npc.name} perished with ${targetName}`);
        });
    }

    // Remove from trading locations
    if (window.tradingGame && window.tradingGame.locationPrices[targetName]) {
        delete window.tradingGame.locationPrices[targetName];
    }

    console.log(`💥 ${targetName} completely destroyed and removed from the game`);
}

function createExplosionEffect(position) {
    // Simple explosion effect - could be enhanced with particle system
    console.log(`💥 Explosion at ${position}`);

    // For now, just log the effect. Could add visual explosion later
    // This could reuse the supernova explosion or create a new effect
}

