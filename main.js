import * as THREE from 'three';
import { PillStepper } from './pillstepper.js';
import { SceneManager } from './scene-manager.js';
import { InventoryManager } from './inventory-manager.js';
import { createAllObjects } from './objects.js';

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
            currentLocation = travelState.destinationName; // Update current location
            updateExplorePanel(); // Update explore panel when landing
            
            console.log(`Travel complete! Arrived at ${travelState.destinationName}`);
            console.log('Final spaceship position:', travelState.spaceship.position);
            console.log('Destination position:', finalEndPos);
            console.log('Distance difference:', travelState.spaceship.position.distanceTo(finalEndPos));
            
            // Hide spaceship after a brief moment
            setTimeout(() => {
                if (travelState.spaceship) {
                    travelState.spaceship.visible = false;
                }
            }, 500);
            
            // Re-enable travel button
            const travelButton = document.getElementById('travel-button');
            if (travelButton) {
                travelButton.disabled = false;
                travelButton.textContent = 'VISIT MARS';
            }
        }
    }
    
    renderer.render(scene, camera);
}

animate();

// Show info box with content
function showInfoBox(content, objectName) {
    const infoBox = document.getElementById('object-info-box');
    const contentDiv = document.getElementById('info-box-content');
    const travelButton = document.getElementById('travel-button');
    
    if (infoBox && contentDiv) {
        contentDiv.textContent = content;
        infoBox.classList.add('show');
        
        // Show travel button for Mars
        if (objectName === 'mars') {
            travelButton.style.display = 'block';
            travelButton.textContent = 'VISIT MARS';
            travelButton.onclick = () => startTravel('mars');
        } else {
            travelButton.style.display = 'none';
        }
    }
}

// Hide info box
function hideInfoBox() {
    const infoBox = document.getElementById('object-info-box');
    if (infoBox) {
        infoBox.classList.remove('show');
    }
}

// Create spaceship sprite
function createSpaceship() {
    // Create UFO sprite using canvas (to avoid CORS issues)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Draw UFO shape
    const centerX = 128;
    const centerY = 128;
    
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
    
    // Find destination object
    const destinationObj = sceneManager.allObjects.find(obj => obj.name === destinationName);
    if (!destinationObj) {
        console.error('Destination object not found:', destinationName);
        return;
    }
    
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
            
            if (sceneObject) {
                // Check if it's Mars
                if (sceneObject.name === 'mars') {
                    event.stopPropagation(); // Prevent event from bubbling
                    showInfoBox('MARS\n\nThis is placeholder text for Mars. More information will be added here.', 'mars');
                    return;
                } else if (sceneObject.name === 'earth') {
                    // Check if it's Earth
                    event.stopPropagation(); // Prevent event from bubbling
                    showInfoBox('EARTH\n\nThis is placeholder text for Earth. More information will be added here.', 'earth');
                    return;
                } else {
                    // Hide info box for other objects (for now)
                    hideInfoBox();
                    return;
                }
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
        
        if (clickedObject) {
            // Check if it's Mars
            if (clickedObject.name === 'mars') {
                showInfoBox('MARS\n\nThis is placeholder text for Mars. More information will be added here.', 'mars');
                return;
            } else {
                // Hide info box for other objects (for now)
                hideInfoBox();
                return;
            }
        }
    }
    
    // If clicked outside labels, hide info box
    hideInfoBox();
}

// Add click event listener
window.addEventListener('click', onMouseClick);

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
        // Hide inventory and explore buttons when VIEW opens
        inventoryToggle.classList.add('hidden');
        exploreToggle.classList.add('hidden');
    } else {
        // Show inventory and explore buttons when VIEW closes
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

// Render explore content based on current location
function renderExploreContent() {
    if (!exploreContent || !currentLocation) return;
    
    // Clear existing content
    exploreContent.innerHTML = '';
    
    // Location-specific content will go here
    // For now, just show a placeholder
    const locationName = currentLocation.toUpperCase();
    const placeholder = document.createElement('p');
    placeholder.textContent = `Exploring ${locationName}...`;
    placeholder.style.color = 'var(--color--foreground)';
    placeholder.style.opacity = '0.7';
    placeholder.style.padding = '1rem';
    exploreContent.appendChild(placeholder);
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
    const items = inventoryManager.getAllItems();
    
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item';
        itemElement.dataset.itemId = item.id;
        
        const nameElement = document.createElement('div');
        nameElement.className = 'inventory-item-name';
        nameElement.textContent = inventoryManager.getItemDisplayName(item.id, item.quantity);
        
        const quantityElement = document.createElement('div');
        quantityElement.className = 'inventory-item-quantity';
        quantityElement.textContent = item.quantity;
        
        itemElement.appendChild(nameElement);
        itemElement.appendChild(quantityElement);
        
        itemElement.addEventListener('click', () => {
            // Remove selected class from all items
            document.querySelectorAll('.inventory-item').forEach(el => {
                el.classList.remove('selected');
            });
            
            // Add selected class to clicked item
            itemElement.classList.add('selected');
            
            // Show description
            inventoryDescription.textContent = inventoryManager.getItemDescription(item.id);
        });
        
        inventoryItems.appendChild(itemElement);
    });
}

inventoryToggle.addEventListener('click', () => {
    const isOpening = !inventoryPanel.classList.contains('open');
    inventoryPanel.classList.toggle('open');
    inventoryToggle.classList.toggle('hidden');
    
    if (isOpening) {
        // Close control panel and explore if open
        controlPanel.classList.remove('open');
        explorePanel.classList.remove('open');
        // Hide VIEW and explore buttons when inventory opens
        panelToggle.classList.add('hidden');
        exploreToggle.classList.add('hidden');
        // Render inventory when opening
        renderInventory();
    } else {
        // Show VIEW and explore buttons when inventory closes
        panelToggle.classList.remove('hidden');
        exploreToggle.classList.remove('hidden');
    }
});

inventoryClose.addEventListener('click', () => {
    inventoryPanel.classList.remove('open');
    inventoryToggle.classList.remove('hidden');
    // Show VIEW and explore buttons when inventory closes
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
        // Hide VIEW and inventory buttons when explore opens
        panelToggle.classList.add('hidden');
        inventoryToggle.classList.add('hidden');
        // Update explore panel content
        updateExplorePanel();
    } else {
        // Show VIEW and inventory buttons when explore closes
        panelToggle.classList.remove('hidden');
        inventoryToggle.classList.remove('hidden');
    }
});

exploreClose.addEventListener('click', () => {
    explorePanel.classList.remove('open');
    exploreToggle.classList.remove('hidden');
    // Show VIEW and inventory buttons when explore closes
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
    'COLOR INTENSITY'
];

const steppers = [];

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
            } else {
                console.log(`Stepper ${i + 1} value:`, value);
            }
        }
    });
    
    steppers.push(stepper);
}



