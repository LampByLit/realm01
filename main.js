import * as THREE from 'three';
import { PillStepper } from './pillstepper.js';
import { SceneManager } from './scene-manager.js';

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

// Add 4 elemental symbols orbiting around plane 2 corners
const plane2HalfSize = planeSize / 2; // 4
const orbitRadius = 1.5; // Distance "out a bit" from corners
const orbitalSpeed = 0.007; // Orbital speed

// Earth symbol 🜃 - top-right corner (same corner as waterfall)
const earthCornerX = plane2HalfSize - 0.3; // Same as waterfall corner
const earthCornerZ = -plane2HalfSize + 0.3;
const earthStartAngle = Math.atan2(earthCornerZ, earthCornerX); // Angle to corner
const earthOrbitX = earthCornerX + Math.cos(earthStartAngle) * orbitRadius;
const earthOrbitZ = earthCornerZ + Math.sin(earthStartAngle) * orbitRadius;

sceneManager.addObject({
    name: 'EARTH',
    type: 'symbol',
    symbol: '🜃',
    position: [earthOrbitX, (2 - 1) * spacing - 0.5, earthOrbitZ], // Below plane 2
    size: 0.4,
    region: '2a', // Below plane 2
    bindingType: 'relative',
    planeIndex: 2,
    offset: -0.5, // Below the plane
    lineType: null, // No line
    orbitalSpeed: orbitalSpeed,
    orbitalRadius: orbitRadius,
    orbitalCenterX: earthCornerX,
    orbitalCenterZ: earthCornerZ,
    orbitalAngle: earthStartAngle
});

// Add Milky Way galaxy - positioned more to one side, away from corner
const milkyWayX = plane2HalfSize - 1.5; // More toward the center, away from corner
const milkyWayZ = -plane2HalfSize + 1.5; // More toward the center, away from corner
sceneManager.addObject({
    name: 'MILKY WAY',
    type: 'galaxy',
    position: [milkyWayX, (2 - 1) * spacing - 0.5, milkyWayZ],
    size: 0.1, // Smaller star size
    region: '2a', // Below plane 2
    bindingType: 'relative',
    planeIndex: 2,
    offset: -0.5, // Below the plane
    lineType: 'leader', // Leader line with label
    rotationSpeed: 0.003, // Slower rotation speed
    maxRadius: 2.5, // Larger spread radius
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add second galaxy at water corner (top-left) - perpendicular angle
const galaxy2X = -plane2HalfSize + 1.5; // Water corner (top-left)
const galaxy2Z = -plane2HalfSize + 1.5; // Water corner (top-left)
sceneManager.addObject({
    name: 'ANDROMEDA',
    type: 'galaxy',
    position: [galaxy2X, (2 - 1) * spacing - 0.5, galaxy2Z],
    size: 0.06, // Even smaller star size
    region: '2a', // Below plane 2
    bindingType: 'relative',
    planeIndex: 2,
    offset: -0.5, // Below the plane
    lineType: 'leader', // Leader line with label
    rotationSpeed: 0.003, // Same slow rotation speed
    maxRadius: 3.5, // Even more spread out
    perpendicularAngle: true, // Rotate 90 degrees for perpendicular orientation
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Air symbol 🜁 - bottom-left corner (opposite corner)
const airCornerX = -plane2HalfSize + 0.3;
const airCornerZ = plane2HalfSize - 0.3;
const airStartAngle = Math.atan2(airCornerZ, airCornerX);
const airOrbitX = airCornerX + Math.cos(airStartAngle) * orbitRadius;
const airOrbitZ = airCornerZ + Math.sin(airStartAngle) * orbitRadius;

sceneManager.addObject({
    name: 'AIR',
    type: 'symbol',
    symbol: '🜁',
    position: [airOrbitX, (2 - 1) * spacing - 0.5, airOrbitZ],
    size: 0.4,
    region: '2a', // Below plane 2
    bindingType: 'relative',
    planeIndex: 2,
    offset: -0.5, // Below the plane
    lineType: null,
    orbitalSpeed: orbitalSpeed,
    orbitalRadius: orbitRadius,
    orbitalCenterX: airCornerX,
    orbitalCenterZ: airCornerZ,
    orbitalAngle: airStartAngle
});

// Moon phases object - cycles through moon phases, positioned where moon sphere was
sceneManager.addObject({
    name: 'MOON',
    type: 'cyclingsymbol',
    phaseCount: 8, // 8 moon phases
    position: [-2.5, 1.25, 2], // Initial position (will be updated by binding)
    size: 0.5,
    region: '2a', // Bottom side of plane 2
    bindingType: 'elastic',
    planeA: 1, // Between plane 1
    planeB: 2, // and plane 2
    percentage: 0.75, // 75% of the way from plane 1 to plane 2 (closer to plane 2)
    lineType: 'leader', // Leader line extends to nearest screen edge
    lineColor: 0xffffff,
    lineOpacity: 0.5,
    cycleSpeed: 0.02 // Cycle speed
});

// Water symbol 🜄 - top-left corner
const waterCornerX = -plane2HalfSize + 0.3;
const waterCornerZ = -plane2HalfSize + 0.3;
const waterStartAngle = Math.atan2(waterCornerZ, waterCornerX);
const waterOrbitX = waterCornerX + Math.cos(waterStartAngle) * orbitRadius;
const waterOrbitZ = waterCornerZ + Math.sin(waterStartAngle) * orbitRadius;

sceneManager.addObject({
    name: 'WATER',
    type: 'symbol',
    symbol: '🜄',
    position: [waterOrbitX, (2 - 1) * spacing - 0.5, waterOrbitZ],
    size: 0.4,
    region: '2a', // Below plane 2
    bindingType: 'relative',
    planeIndex: 2,
    offset: -0.5, // Below the plane
    lineType: null,
    orbitalSpeed: orbitalSpeed,
    orbitalRadius: orbitRadius,
    orbitalCenterX: waterCornerX,
    orbitalCenterZ: waterCornerZ,
    orbitalAngle: waterStartAngle
});

// Fire symbol 🜂 - bottom-right corner
const fireCornerX = plane2HalfSize - 0.3;
const fireCornerZ = plane2HalfSize - 0.3;
const fireStartAngle = Math.atan2(fireCornerZ, fireCornerX);
const fireOrbitX = fireCornerX + Math.cos(fireStartAngle) * orbitRadius;
const fireOrbitZ = fireCornerZ + Math.sin(fireStartAngle) * orbitRadius;

sceneManager.addObject({
    name: 'FIRE',
    type: 'symbol',
    symbol: '🜂',
    position: [fireOrbitX, (2 - 1) * spacing - 0.5, fireOrbitZ],
    size: 0.4,
    region: '2a', // Below plane 2
    bindingType: 'relative',
    planeIndex: 2,
    offset: -0.5, // Below the plane
    lineType: null,
    orbitalSpeed: orbitalSpeed,
    orbitalRadius: orbitRadius,
    orbitalCenterX: fireCornerX,
    orbitalCenterZ: fireCornerZ,
    orbitalAngle: fireStartAngle
});

// Add 12 astrological symbols in low orbit, shallow outer space (between planes 3 and 4)
// Plane 3 is at Y = 5.0, Plane 4 is at Y = 7.5, so midpoint is Y = 6.25
const astrologicalImagePaths = [
    'assets/zodiac/aries.png',
    'assets/zodiac/taurus.png',
    'assets/zodiac/gemini.png',
    'assets/zodiac/cancer.png',
    'assets/zodiac/leo.png',
    'assets/zodiac/virgo.png',
    'assets/zodiac/libra.png',
    'assets/zodiac/scorpio.png',
    'assets/zodiac/sagittarius.png',
    'assets/zodiac/capricorn.png',
    'assets/zodiac/aquarius.png',
    'assets/zodiac/pisces.png'
]; // Image paths for zodiac signs: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces
const astroOrbitRadius = 6.0; // Much larger radius for wider spread
const astroOrbitalSpeed = 0.0035; // Reduced orbital speed (half of original 0.007)
const astroY = 6.25; // Between planes 3 and 4 (plane 3 at 5.0, plane 4 at 7.5)

// Create 12 astrological symbols evenly spaced in a circle
for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2; // Evenly spaced around circle
    const startAngle = angle;
    const orbitX = Math.cos(startAngle) * astroOrbitRadius;
    const orbitZ = Math.sin(startAngle) * astroOrbitRadius;
    
    sceneManager.addObject({
        name: `ASTRO_${i + 1}`,
        type: 'symbol',
        imagePath: astrologicalImagePaths[i], // Use image path instead of Unicode symbol
        position: [orbitX, astroY, orbitZ], // Between planes 3 and 4
        size: 0.4,
        region: '3b', // Above plane 3
        bindingType: 'free', // Free positioning between planes
        lineType: null, // No line
        orbitalSpeed: astroOrbitalSpeed,
        orbitalRadius: astroOrbitRadius,
        orbitalCenterX: 0, // Orbit around center
        orbitalCenterZ: 0,
        orbitalAngle: startAngle
    });
}

// Add SIRIUS galaxy at fire corner (bottom-right, opposite Andromeda) - identical but smaller particles and more twinkling
const siriusX = plane2HalfSize - 1.5; // Fire corner (bottom-right, opposite Andromeda)
const siriusZ = plane2HalfSize - 1.5;
sceneManager.addObject({
    name: 'SIRIUS',
    type: 'galaxy',
    position: [siriusX, (2 - 1) * spacing - 0.5, siriusZ],
    size: 0.04, // Smaller particles than Andromeda (0.06)
    region: '2a', // Below plane 2
    bindingType: 'relative',
    planeIndex: 2,
    offset: -0.5, // Below the plane
    lineType: 'laser', // Laser line with fixed diagonal angle
    angle: -Math.PI / 3, // Different angle (-60 degrees) to avoid collision
    rotationSpeed: 0.003, // Same slow rotation speed
    maxRadius: 3.5, // Same spread as Andromeda
    perpendicularAngle: true, // Perpendicular orientation
    twinkleSpeed: 0.05, // Faster twinkling than Andromeda
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add Mars - small red sphere in random area from 0b to 2a
// Areas span from y=-2.5 (plane 0) to y=5.0 (plane 2)
const marsY = Math.random() * 7.5 - 2.5; // Random Y between -2.5 and 5.0
const marsX = (Math.random() - 0.5) * 6; // Random X between -3 and 3
const marsZ = (Math.random() - 0.5) * 6; // Random Z between -3 and 3
// Calculate angle from center to Mars position to point outward
const marsAngle = Math.atan2(marsZ, marsX);
// Determine region based on Y position
let marsRegion;
if (marsY < 0) {
    marsRegion = '0b'; // Top side of plane 0
} else if (marsY < 2.5) {
    marsRegion = '1a'; // Bottom side of plane 1
} else {
    marsRegion = '2a'; // Bottom side of plane 2
}

sceneManager.addObject({
    name: 'mars',
    type: 'sphere',
    position: [marsX, marsY, marsZ], // Random position in area from 0b to 2a
    radius: 0.15, // Small red sphere
    color: 0xff0000, // Red color
    emissive: 0x330000, // Dark red emissive for slight glow
    emissiveIntensity: 0.3,
    metalness: 0.2,
    roughness: 0.8,
    region: marsRegion,
    bindingType: 'free',
    lineType: 'laser', // Laser line points outward using angle
    angle: marsAngle, // Angle pointing outward from center
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add Venus - small pale sphere in random area from 0b to 2b (exactly like Mars but pale colored)
// Areas span from y=-2.5 (plane 0) to y=5.0 (top of area 2b, between plane 2 and plane 3)
const venusY = Math.random() * 7.5 - 2.5; // Random Y between -2.5 and 5.0
const venusX = (Math.random() - 0.5) * 6; // Random X between -3 and 3
const venusZ = (Math.random() - 0.5) * 6; // Random Z between -3 and 3
// Calculate angle from center to Venus position to point outward
const venusAngle = Math.atan2(venusZ, venusX);
// Determine region based on Y position (2b or lower)
let venusRegion;
if (venusY < 0) {
    venusRegion = '0b'; // Top side of plane 0
} else if (venusY < 2.5) {
    venusRegion = '1a'; // Bottom side of plane 1
} else if (venusY < 5.0) {
    venusRegion = '2b'; // Top side of plane 2 (between plane 2 and plane 3)
} else {
    venusRegion = '2a'; // Bottom side of plane 2 (fallback, shouldn't happen with current range)
}

sceneManager.addObject({
    name: 'venus',
    type: 'sphere',
    position: [venusX, venusY, venusZ], // Random position in area from 0b to 2a
    radius: 0.15, // Small pale sphere (same size as Mars)
    color: 0xf5f5dc, // Pale beige/cream color
    emissive: 0x333322, // Dark pale emissive for slight glow
    emissiveIntensity: 0.3,
    metalness: 0.2,
    roughness: 0.8,
    region: venusRegion,
    bindingType: 'free',
    lineType: 'laser', // Laser line points outward using angle
    angle: venusAngle, // Angle pointing outward from center
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add the orb object between planes 2 and 3 (region 2b) - RELATIVE to plane 2
sceneManager.addObject({
    name: 'Nucleus',
    type: 'orb',
    position: [0, 3.75, 0], // Initial position (will be updated by binding)
    size: 0.6, // Size in world units (will be converted to screen size)
    region: '2b',
    bindingType: 'relative',
    planeIndex: 2, // Bound to plane 2
    offset: 1.25, // 1.25 units above plane 2 (3.75 - 2.5 = 1.25)
    lineType: 'leader',
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add black hole (Gaia BH1) in area 0b (top side of plane 0) at random location
const gaiaBH1X = (Math.random() - 0.5) * 6; // Random between -3 and 3
const gaiaBH1Z = (Math.random() - 0.5) * 6; // Random between -3 and 3
// Calculate angle from center to Gaia BH1 position to point outward
const gaiaBH1Angle = Math.atan2(gaiaBH1Z, gaiaBH1X);

sceneManager.addObject({
    name: 'Gaia BH1',
    type: 'blackhole',
    position: [gaiaBH1X, -1.25, gaiaBH1Z], // Random position in region 0b (between plane 0 at y=-2.5 and plane 1 at y=0)
    size: 0.25, // Smaller black sphere
    ringRadius: 0.5, // Tighter rings closer to sphere
    ringTube: 0.05, // Thickness of the rings
    particleCount: 200, // Number of accretion disk particles
    particleSize: 0.04, // Smaller particles
    rotationSpeed: 0.01, // Rotation speed
    region: '0b', // Top side of plane 0
    bindingType: 'free',
    lineType: 'laser',
    angle: gaiaBH1Angle, // Angle pointing outward from center
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add 4 unlabeled black planets on outer boundaries of inner universe
// Position them at the edges of the plane structure (planeSize/2 = 4) with random Y positions
const boundaryHalfSize = planeSize / 2; // 4
const boundaryOffset = 0.2; // Slight offset from exact edge
const planetMinY = -2.5; // Plane 0
const planetMaxY = 7.5; // Plane 4

for (let i = 0; i < 4; i++) {
    // Random Y position within universe bounds
    const randomY = Math.random() * (planetMaxY - planetMinY) + planetMinY;
    
    // Position on outer boundaries - alternate between edges
    let randomX, randomZ;
    const edge = i % 4;
    if (edge === 0) {
        // Top edge (negative Z)
        randomX = (Math.random() - 0.5) * planeSize * 0.8; // Random X along edge
        randomZ = -boundaryHalfSize + boundaryOffset;
    } else if (edge === 1) {
        // Right edge (positive X)
        randomX = boundaryHalfSize - boundaryOffset;
        randomZ = (Math.random() - 0.5) * planeSize * 0.8; // Random Z along edge
    } else if (edge === 2) {
        // Bottom edge (positive Z)
        randomX = (Math.random() - 0.5) * planeSize * 0.8; // Random X along edge
        randomZ = boundaryHalfSize - boundaryOffset;
    } else {
        // Left edge (negative X)
        randomX = -boundaryHalfSize + boundaryOffset;
        randomZ = (Math.random() - 0.5) * planeSize * 0.8; // Random Z along edge
    }
    
    sceneManager.addObject({
        name: `BLACK_PLANET_${i + 1}`,
        type: 'blackcircle',
        position: [randomX, randomY, randomZ],
        size: 0.25, // Same size as other black circles
        region: '2b', // Will be auto-determined based on Y position
        bindingType: 'free',
        lineType: null // No label
    });
}

// Add crystal object in region 0a (below plane 0) - FREE with LEFTHAND label at bottom
sceneManager.addObject({
    name: 'ROOT',
    type: 'crystal',
    position: [0, -3.5, 0], // Below plane 0 (plane 0 is at y = -2.5)
    size: 0.8, // Size in world units
    region: '0a', // Below plane 0
    bindingType: 'free',
    lineType: 'lefthand', // Lefthand line with fixed position label
    lefthandLabelPosition: 0.0, // Bottom position (0.0 = bottom)
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add particle sphere object in region 0b (top side of plane 0) at random location - FREE
const randomX0b = (Math.random() - 0.5) * 6; // Random between -3 and 3
const randomZ0b = (Math.random() - 0.5) * 6; // Random between -3 and 3
// Calculate angle from center to Zeta Reticuli position to point outward
const zetaReticuliAngle = Math.atan2(randomZ0b, randomX0b);

sceneManager.addObject({
    name: 'Zeta Reticuli',
    type: 'particlesphere',
    position: [randomX0b, -1.25, randomZ0b], // Random position in region 0b (between plane 0 at y=-2.5 and plane 1 at y=0)
    size: 1.2, // Larger size in world units
    region: '0b', // Top side of plane 0
    bindingType: 'free',
    lineType: 'laser',
    angle: zetaReticuliAngle, // Angle pointing outward from center
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add glowing region in area 0b (top side of plane 0) - random location avoiding collisions
// Black cube is at [0, 1.25, 0] (but same Y level as TARANTULA), Zeta Reticuli is at randomX0b, randomZ0b
let tarantulaX, tarantulaZ;
let tarantulaAttempts = 0;
const minDistanceFromObjects = 2.5; // Minimum distance from other objects
const blackCubeX = 0;
const blackCubeZ = 0;
do {
    tarantulaX = (Math.random() - 0.5) * 6; // Random between -3 and 3
    tarantulaZ = (Math.random() - 0.5) * 6; // Random between -3 and 3
    // Check distance from black cube (at [0, 1.25, 0] but same Y level)
    const distFromBlackCube = Math.sqrt((tarantulaX - blackCubeX) * (tarantulaX - blackCubeX) + (tarantulaZ - blackCubeZ) * (tarantulaZ - blackCubeZ));
    // Also check distance from Zeta Reticuli
    const distFromZeta = Math.sqrt((tarantulaX - randomX0b) * (tarantulaX - randomX0b) + (tarantulaZ - randomZ0b) * (tarantulaZ - randomZ0b));
    tarantulaAttempts++;
    if ((distFromBlackCube >= minDistanceFromObjects && distFromZeta >= minDistanceFromObjects) || tarantulaAttempts > 50) break;
} while (Math.sqrt((tarantulaX - blackCubeX) * (tarantulaX - blackCubeX) + (tarantulaZ - blackCubeZ) * (tarantulaZ - blackCubeZ)) < minDistanceFromObjects || 
         Math.sqrt((tarantulaX - randomX0b) * (tarantulaX - randomX0b) + (tarantulaZ - randomZ0b) * (tarantulaZ - randomZ0b)) < minDistanceFromObjects);

// Calculate angle from center to TARANTULA position to point outward
const tarantulaAngle = Math.atan2(tarantulaZ, tarantulaX);

sceneManager.addObject({
    name: 'TARANTULA',
    type: 'glowingregion',
    position: [tarantulaX, -1.25, tarantulaZ], // Random position in region 0b, avoiding collisions
    size: 2.5, // Size of the glowing region
    particleCount: 300, // Number of glowing particles
    particleSize: 0.05, // Much smaller particle size
    color: 0x88aaff, // Blue glow color
    opacity: 0.6, // Glow opacity
    region: '0b', // Top side of plane 0
    bindingType: 'elastic',
    planeA: 0,
    planeB: 1,
    percentage: 0.5, // 50% of the way between planes 0 and 1
    lineType: 'laser',
    angle: tarantulaAngle, // Angle pointing outward from center
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add shader sphere in region 1b (top side of plane 1) at random location - ELASTIC between planes 1 and 2
const randomX = (Math.random() - 0.5) * 6; // Random between -3 and 3
const randomZ = (Math.random() - 0.5) * 6; // Random between -3 and 3
sceneManager.addObject({
    name: 'Pleiades',
    type: 'shader',
    position: [randomX, 1.25, randomZ], // Initial position (will be updated by binding)
    radius: 0.015, // Radius for IcosahedronGeometry
    detail: 4, // Detail level for IcosahedronGeometry
    region: '1b', // Top side of plane 1
    bindingType: 'elastic',
    planeA: 1, // Between plane 1
    planeB: 2, // and plane 2
    percentage: 0.4, // 40% of the way from plane 1 to plane 2 (keeps it away from both planes)
    lineType: 'leader',
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add a test object in the top-left of area 2b - ELASTIC between planes 2 and 3
sceneManager.addObject({
    name: 'MONOLITH',
    type: 'box',
    position: [-3, 4, 3], // Initial position (will be updated by binding)
    size: [0.4, 0.8, 0.12], // 1:2 aspect ratio: even smaller, width 0.4, height 0.8, thin depth
    color: 0xffffff, // White/clear for mirror
    region: '2b',
    bindingType: 'elastic',
    planeA: 2, // Between plane 2
    planeB: 3, // and plane 3
    percentage: 0.6, // 60% of the way from plane 2 to plane 3
    lineType: 'laser',
    lineColor: 0xffffff,
    lineOpacity: 0.5,
    // Mirror material properties
    transmission: 0.0, // Not transparent
    roughness: 0.0, // Perfectly smooth for mirror reflection
    ior: 1.5, // Standard for mirrors
    metalness: 1.0, // Fully metallic for mirror
    emissiveIntensity: 0.0 // No glow
});

// Add cone cluster in area 2b at random location - ELASTIC between planes 2 and 3
// Ensure it's not too close to NUCLEUS (which is at [0, 3.75, 0])
let randomX2b, randomZ2b;
let attempts = 0;
const minDistanceFromNucleus = 2.5; // Minimum distance from NUCLEUS
do {
    randomX2b = (Math.random() - 0.5) * 6; // Random between -3 and 3
    randomZ2b = (Math.random() - 0.5) * 6; // Random between -3 and 3
    const distanceFromNucleus = Math.sqrt(randomX2b * randomX2b + randomZ2b * randomZ2b);
    attempts++;
    if (distanceFromNucleus >= minDistanceFromNucleus || attempts > 50) break; // Stop after 50 attempts
} while (Math.sqrt(randomX2b * randomX2b + randomZ2b * randomZ2b) < minDistanceFromNucleus);

sceneManager.addObject({
    name: 'STATION',
    type: 'conecluster',
    position: [randomX2b, 3.75, randomZ2b], // Random position in region 2b (will be updated by binding)
    coneRadius: 0.05,
    coneHeight: 0.2,
    distance: 0.15,
    color: 0xffffff, // White/clear for mirror
    emissiveIntensity: 0.0, // No glow for mirror
    rotationSpeed: 0.01, // Rotation speed matching p5.js frameCount * 0.01
    region: '2b',
    bindingType: 'elastic',
    planeA: 2, // Between plane 2
    planeB: 3, // and plane 3
    percentage: 0.5, // 50% of the way (middle of region 2b)
    lineType: 'laser', // Laser line with fixed diagonal angle
    lineColor: 0xffffff,
    lineOpacity: 0.5,
    // Mirror material properties
    transmission: 0.0, // Not transparent
    roughness: 0.0, // Perfectly smooth for mirror reflection
    ior: 1.5, // Standard for mirrors
    metalness: 1.0 // Fully metallic for mirror
});

// Add a test object on plane 2a (bottom side of plane 2) - ELASTIC with LEFTY line
sceneManager.addObject({
    name: 'earth',
    type: 'sphere',
    position: [2, 1.25, -2], // Initial position (will be updated by binding)
    radius: 0.25,
    color: 0xffffff, // White/clear for mirror
    region: '2a', // Bottom side of plane 2
    bindingType: 'elastic',
    planeA: 1, // Between plane 1
    planeB: 2, // and plane 2
    percentage: 0.5, // 50% of the way (middle)
    lineType: 'lefty', // Lefty line extends to left screen edge
    lineColor: 0xffffff,
    lineOpacity: 0.5,
    // Mirror material properties
    transmission: 0.0, // Not transparent
    roughness: 0.0, // Perfectly smooth for mirror reflection
    ior: 1.5, // Standard for mirrors
    metalness: 1.0, // Fully metallic for mirror
    emissiveIntensity: 0.0 // No glow
});

// Add crown on 4b (top side of plane 4) - RELATIVE to plane 4, always on top of highest plane
sceneManager.addObject({
    name: 'CROWN',
    type: 'pyramid',
    position: [0, (4 - 1) * spacing + 0.5, 0], // Above plane 4 (will be updated by binding)
    radius: 0.3,
    height: 0.45, // Pyramid height
    color: 0xffffff, // White/clear for mirror
    region: '4b', // Always in area 4b, on top of highest plane
    bindingType: 'relative',
    planeIndex: 4, // Bound to plane 4 (highest plane)
    offset: 0.5, // 0.5 units above plane 4
    lineType: 'lefthand', // Lefthand line with fixed position label
    lefthandLabelPosition: 1.0, // Top position, will be positioned at 24px from top to match menu button
    lineColor: 0xffffff,
    lineOpacity: 0.5,
    // Mirror material properties
    transmission: 0.0, // Not transparent
    roughness: 0.0, // Perfectly smooth for mirror reflection
    ior: 1.5, // Standard for mirrors
    metalness: 1.0, // Fully metallic for mirror
    emissiveIntensity: 0.0 // No glow
});

// Add Pluto - positioned far outside the planes structure
sceneManager.addObject({
    name: 'pluto',
    type: 'box',
    position: [6, 0, 6], // Far outside the plane structure, lowered on Y axis
    size: [0.05, 0.05, 0.05],
    color: 0x000000, // Black
    region: '4b', // Above plane 4 region
    bindingType: 'free',
    lineType: 'laser', // Laser line with sprite label
    lineColor: 0xffffff,
    lineOpacity: 0.5,
    // Black material properties (not fully metallic so base color shows)
    transmission: 0.0, // Not transparent
    roughness: 0.1, // Slightly rough
    ior: 1.5,
    metalness: 0.3, // Lower metalness so black base color shows through
    emissiveIntensity: 0.0 // No glow
});

// Add clouds in area 4b (bottom side of top plane) - ELASTIC between planes 3 and 4
sceneManager.addObject({
    name: 'CLOUDS',
    type: 'cloud',
    position: [0, 6.25, 0], // Initial position (will be updated by binding)
    size: 0.5, // Size multiplier (reduced from 1.0)
    layerCount: 5, // Number of cloud layers
    region: '4b', // Bottom side of plane 4 (top plane)
    bindingType: 'elastic',
    planeA: 3, // Between plane 3
    planeB: 4, // and plane 4
    percentage: 0.5, // 50% of the way (middle of region 4b)
    lineType: null // No line or label for clouds
});

// Add Anja planet SVG in area 4a (bottom side of plane 4, between planes 3 and 4)
// Note: Full SVG content would be very long - using simplified version
const anjaSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" fill="none" overflow="visible">
<defs>
<clipPath id="mask1"><polygon fill="red" points="483.25 194.06 316.75 194.06 296.43 237.17 304.65 421.98 495.35 421.98 503.57 237.17 483.25 194.06"/></clipPath>
<clipPath id="mask2"><polygon fill="red" points="483.25 194.06 316.75 194.06 296.43 237.17 304.65 421.98 495.35 421.98 503.57 237.17 483.25 194.06"/></clipPath>
<radialGradient id="pinkPlanetGrad1" cx="74.71" cy="73.44" r="105.13"><stop offset="0" stop-color="#fc007d"/><stop offset="1" stop-color="#181743" stop-opacity="0"/></radialGradient>
<radialGradient id="bluePlanetGrad1" cx="74.71" cy="73.44" r="105.13"><stop offset="0" stop-color="#0064e9"/><stop offset="1" stop-color="#181743" stop-opacity="0"/></radialGradient>
<symbol viewBox="0 0 287 287" id="pinkPlanet"><circle cx="143.5" cy="143.5" r="143.5" fill="url(#pinkPlanetGrad1)"/></symbol>
<symbol id="bluePlanet" viewBox="0 0 287 287"><circle cx="143.5" cy="143.5" r="143.5" fill="url(#bluePlanetGrad1)"/></symbol>
</defs>
<g clip-path="url(#mask1)"><use class="pinkPlanet" xlink:href="#pinkPlanet" width="87" height="87" x="360" y="270"/></g>
<g clip-path="url(#mask2)"><use class="bluePlanet" xlink:href="#bluePlanet" width="87" height="87" x="360" y="270"/></g>
<circle cx="403.5" cy="313.5" r="20" fill="#0064e9"/>
<ellipse cx="403.5" cy="313.5" rx="50" ry="10" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2" opacity="0.9"/>
<ellipse cx="403.5" cy="313.5" rx="70" ry="9" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="1.8" opacity="0.85"/>
<ellipse cx="403.5" cy="313.5" rx="90" ry="9" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.7" opacity="0.8"/>
<ellipse cx="403.5" cy="313.5" rx="110" ry="8" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.6" opacity="0.75"/>
<ellipse cx="403.5" cy="313.5" rx="130" ry="8" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" opacity="0.7"/>
<ellipse cx="403.5" cy="313.5" rx="150" ry="7" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.4" opacity="0.65"/>
<ellipse cx="403.5" cy="313.5" rx="170" ry="7" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.3" opacity="0.6"/>
<ellipse cx="403.5" cy="313.5" rx="190" ry="6" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" opacity="0.55"/>
<ellipse cx="403.5" cy="313.5" rx="210" ry="6" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.1" opacity="0.5"/>
<ellipse cx="403.5" cy="313.5" rx="230" ry="5" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1" opacity="0.45"/>
<ellipse cx="403.5" cy="313.5" rx="250" ry="5" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="0.9" opacity="0.4"/>
<ellipse cx="403.5" cy="313.5" rx="270" ry="4" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="0.8" opacity="0.35"/>
<ellipse cx="403.5" cy="313.5" rx="290" ry="4" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.7" opacity="0.3"/>
<ellipse cx="403.5" cy="313.5" rx="310" ry="3" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="0.6" opacity="0.25"/>
<ellipse cx="403.5" cy="313.5" rx="330" ry="3" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" opacity="0.2"/>
<ellipse cx="403.5" cy="313.5" rx="350" ry="2" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="0.4" opacity="0.15"/>
<ellipse cx="403.5" cy="313.5" rx="360" ry="2" fill="none" stroke="rgba(255,255,255,0.11)" stroke-width="0.35" opacity="0.13"/>
<ellipse cx="403.5" cy="313.5" rx="370" ry="2" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.3" opacity="0.12"/>
<ellipse cx="403.5" cy="313.5" rx="380" ry="2" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="0.25" opacity="0.11"/>
<ellipse cx="403.5" cy="313.5" rx="390" ry="2" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.2" opacity="0.1"/>
<ellipse cx="403.5" cy="313.5" rx="395" ry="1.5" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="0.15" opacity="0.09"/>
<ellipse cx="403.5" cy="313.5" rx="400" ry="1" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.2" opacity="0.08"/>
<ellipse cx="403.5" cy="313.5" rx="403" ry="1" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.1" opacity="0.07"/>
</svg>`;

sceneManager.addObject({
    name: 'anja',
    type: 'svg',
    position: [0, 7.0, 0], // Center position in area 4a (will be updated by binding)
    size: 1.2, // Large size to match plane width (planeSize = 8 units)
    svgContent: anjaSVG,
    region: '4a', // Bottom side of plane 4 (between planes 3 and 4)
    bindingType: 'elastic',
    planeA: 3, // Between plane 3
    planeB: 4, // and plane 4
    percentage: 0.8, // 80% of the way (closer to plane 4, higher up)
    lineType: 'leader',
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add black cube SVG cube in area 0b (top side of bottom plane) - RELATIVE to plane 0
const blackCubeSVG = `<svg width="512" height="512" viewBox="0 0 512 640" fill="none" overflow="visible" xmlns="http://www.w3.org/2000/svg">
<use href="#cube" x="128" y="320" stroke-width="2"  opacity="0.3">
	<animate attributeName="stroke" dur="6s" repeatCount="indefinite"
			 values="#FF9AA2;#FFB7B2;#FFDAC1;#E2F0CB;#B5EAD7;#C7CEEA;#FF9AA2"/>
</use>
<use href="#cube" x="128" y="128" stroke-width="2">
	<animate attributeName="stroke" dur="6s" repeatCount="indefinite"
			 values="#FF9AA2;#FFB7B2;#FFDAC1;#E2F0CB;#B5EAD7;#C7CEEA;#FF9AA2"/>
</use>
<defs>
	<g id="cube">
		<use href="#cube_outline" stroke-linejoin="round" stroke-width="16" fill="url(#stars)"/>
		<use href="#cube_base" stroke-width=".5"/>
		<use href="#cube_outline" stroke-linejoin="round" stroke-width="6" stroke="#141417"/>
	</g>	
	<g id="cube_outline">
		<path>
			<animate attributeName="d" dur="1.5s" repeatCount="indefinite" calcMode="spline"
			keyTimes="0;0.5;0.5;1"
			keySplines="0.8 0.2 0.6 0.9; 0.8 0.2 0.6 0.9; 0.8 0.2 0.6 0.9"
			values="M10 64 L128 0 L246 64 L246 192 L128 256 L10 192Z;
					M40 20 L216 20 L216 108 L216 236 L40 236 L40 172Z;
					M216 20 L40 20 L40 108 L40 236 L216 236 L216 172Z;
					M246 64 L128 0 L10 64 L10 192 L128 256 L246 192Z"/>
		</path>
	</g>
	<g id="cube_base">
		<path fill="#fff1">
		<animate attributeName="d" dur="1.5s" repeatCount="indefinite" calcMode="spline"
			keyTimes="0;0.5;1"
			keySplines="0.8 0.2 0.6 0.9; 0.8 0.2 0.6 0.9"
			values="M10 64 L128 0 L246 64 L128 128Z;
					M40 20 L216 20 L216 108 L40 108Z;
					M128 0 L246 64 L128 128 L10 64Z"/>
		</path>
		<path>
		<animate attributeName="d" dur="1.5s" repeatCount="indefinite" calcMode="spline"
			keyTimes="0;0.5;0.5;1"
			keySplines="0.8 0.2 0.6 0.9; 0.8 0.2 0.6 0.9; 0.8 0.2 0.6 0.9"
			values="M10 64 L128 128 L128 256 L10 192Z;
					M40 20 L40 108 L40 236 L40 172Z;
					M216 20 L216 108 L216 236 L216 172Z;
					M246 64 L128 128 L128 256 L246 192Z"/>
		<animate attributeName="fill" dur="1.5s" repeatCount="indefinite" keyTimes="0;0.5;0.5;1"
			values="#fff0;#fff0;#fff2;#fff2"/>
		</path>
		<path fill="#407080">
		<animate attributeName="d" dur="1.5s" repeatCount="indefinite" calcMode="spline"
			keyTimes="0;0.5;1"
			keySplines="0.8 0.2 0.6 0.9; 0.8 0.2 0.6 0.9"
			values="M246 64 L128 128 L128 256 L246 192Z;
					M216 108 L40 108 L40 236 L216 236Z;
					M128 128 L10 64 L10 192 L128 256Z"/>
			<animate attributeName="fill" dur="1.5s" repeatCount="indefinite" keyTimes="0;0.5;1"
				values="#fff2;#fff1;#fff0"/>
		</path>
	</g>
	<linearGradient id="fade" gradientTransform="rotate(90)">
    	<stop offset="0" stop-color="#14141700"/>
    	<stop offset="0.25" stop-color="#141417ff"/>
    </linearGradient>
	<linearGradient id="sky" gradientTransform="rotate(90)">
    	<stop offset="0.5" stop-color="#141417"/>
    	<stop offset="1" stop-color="#40354a"/>
    </linearGradient>
	<pattern id="stars" x="0" y="0" width="50%" height="50%" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
		<rect width="256" height="256" fill="url(#sky)"/>
		<use href="#star01" x="24" y="32"  fill="white"/>
		<use href="#star01" x="64" y="96"  fill="#ad9dcb" transform="rotate(90 80 112)"/>
		<use href="#star01" x="224" y="102"  fill="#ad9dcb"/>
		<use href="#star01" x="192" y="112"  fill="#E0E8EA" transform="rotate(90 80 112)"/>
		<use href="#star02" x="16" y="64"  fill="#ad9dcb"/>
		<use href="#star03" x="96" y="16"  fill="#E0E8EA"/>
		<use href="#star04" x="64" y="64"  fill="white"/>
		<use href="#star04" x="8" y="16"  fill="#ad9dcb"/>
		<use href="#star04" x="110" y="96"  fill="#E0E8EA"/>
		<use href="#star02" x="160" y="24"  fill="#ad9dcb"/>
		<use href="#star03" x="196" y="60"  fill="#E0E8EA"/>
		<use href="#star04" x="64" y="212"  fill="white"/>
		<use href="#star04" x="218" y="216"  fill="#ad9dcb"/>
		<use href="#star03" x="228" y="220"  fill="#E0E8EA"/>
		<use href="#star02" x="140" y="128"  fill="#ad9dcb"/>
		<use href="#star03" x="24" y="140"  fill="#E0E8EA"/>
		<use href="#star04" x="95" y="160"  fill="white"/>
		<use href="#star04" x="180" y="128"  fill="#ad9dcb"/>
		<use href="#star03" x="200" y="136"  fill="#E0E8EA"/>
		<use href="#star10" x="120" y="120"  stroke="#E0E8EA"/>
		<use href="#star11" x="48" y="64"  stroke="#ad9dcb"/>
	</pattern>
	<path id="star01" transform="scale(0.5)">
		<animate attributeName="d" dur="3s" repeatCount="indefinite" calcMode="spline"
			keyTimes="0;0.5;1" keySplines="0.8 0.2 0.6 0.9; 0.8 0.2 0.6 0.9"
			values="M16 0 Q16 16 24 16 Q16 16 16 32 Q16 16 8 16 Q16 16 16 0Z;
					M16 8 Q16 16 32 16 Q16 16 16 24 Q16 16 0 16 Q16 16 16 8Z;
					M16 0 Q16 16 24 16 Q16 16 16 32 Q16 16 8 16 Q16 16 16 0Z"/>
	</path>
	<circle id="star02">
		<animate attributeName="r" dur="3s" repeatCount="indefinite" calcMode="spline"
			keyTimes="0;0.5;1" keySplines="0.8 0.2 0.6 0.9; 0.8 0.2 0.6 0.9"
			values="0;2;0"/>
	</circle>
	<circle id="star03">
		<animate attributeName="r" dur="6s" repeatCount="indefinite" calcMode="spline"
			keyTimes="0;0.5;1" keySplines="0.8 0.2 0.6 0.9; 0.8 0.2 0.6 0.9"
			values="3;1;3"/>
	</circle>
	<circle id="star04" r="1"/>
	<path id="star10" stroke-width="2">
		<animate attributeName="d" dur="5s" repeatCount="indefinite" 
			keyTimes="0;0.90;0.97;1"
			keySplines="0 0.4 1 0.2; 0 0.4 1 0.2; 0 0.4 1 0.2"
			values="M64 0 L64 0Z; M64 0 L64 0Z; M48 12 L0 48Z; M0 48 L0 48Z"/>
		<animate attributeName="opacity" dur="5s" repeatCount="indefinite"
			keyTimes="0;0.90;0.97;1"
			values="1; 1; 0.6; 0"/>
	</path>
	<path id="star11" stroke-width="3">
		<animate attributeName="d" dur="6s" repeatCount="indefinite" delay="3s"
			keyTimes="0;0.90;0.95;1"
			keySplines="0 0.4 1 0.2; 0 0.4 1 0.2; 0 0.4 1 0.2"
			values="M64 0 L64 0Z; M64 0 L64 0Z; M48 12 L0 48Z; M0 48 L0 48Z"/>
		<animate attributeName="opacity" dur="6s" repeatCount="indefinite" delay="3s"
			keyTimes="0;0.90;0.95;1"
			values="1; 1; 0.6; 0"/>
	</path>
</defs>
</svg>`;

sceneManager.addObject({
    name: 'BLACK CUBE',
    type: 'svg',
    position: [0, 1.25, 0], // Initial position (will be updated by binding)
    size: 0.3, // Size multiplier (reduced from 0.8)
    svgContent: blackCubeSVG,
    region: '0b', // Top side of plane 0 (bottom plane)
    bindingType: 'relative',
    planeIndex: 0, // Bound to plane 0
    offset: 1.25, // 1.25 units above plane 0
    lineType: 'leader',
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add the sun orbiting at the very edge of the universe
const sunOrbitRadius = 15; // Very far out at the edge
const sunOrbitalSpeed = 0.001; // Slow orbital speed
const sunStartAngle = 0; // Start at angle 0
// Raise sun higher - plane 3 is at y = 5, plane 4 is at y = 7.5
const sunY = 7.0; // Higher up, closer to plane 4

sceneManager.addObject({
    name: 'SUN',
    type: 'sun',
    position: [sunOrbitRadius, sunY, 0], // Start at edge, higher up
    size: 0.3, // Much smaller size
    region: '3b', // Above plane 3
    bindingType: 'free',
    orbitalSpeed: sunOrbitalSpeed,
    orbitalRadius: sunOrbitRadius,
    orbitalCenterX: 0,
    orbitalCenterZ: 0,
    orbitalAngle: sunStartAngle,
    lineType: null // No line
});

// Add second sun - metallic blue sphere, far away on outer edge but much lower
const blueSunOrbitRadius = 15; // Same distance as original sun (very far out at the edge)
const blueSunOrbitalSpeed = 0.001; // Slow orbital speed
const blueSunStartAngle = Math.PI; // Start at opposite side from original sun (180 degrees)
const blueSunY = -1.0; // Much lower, near plane 0 area

sceneManager.addObject({
    name: 'BLUE_SUN',
    type: 'sphere',
    position: [blueSunOrbitRadius, blueSunY, 0], // Start at edge, much lower
    radius: 0.3, // Same size as original sun
    color: 0x002244, // Darker blue color
    emissive: 0x000811, // Very dark blue emissive for subtle glow
    emissiveIntensity: 0.2, // Lower emissive intensity
    metalness: 1.0, // Fully metallic
    roughness: 0.1, // Smooth and shiny
    transmission: 0.0, // Not transparent
    ior: 1.5,
    region: '0b', // Near plane 0 area
    bindingType: 'free',
    orbitalSpeed: blueSunOrbitalSpeed,
    orbitalRadius: blueSunOrbitRadius,
    orbitalCenterX: 0,
    orbitalCenterZ: 0,
    orbitalAngle: blueSunStartAngle,
    lineType: null // No line
});

// Add 3D black hole simulation (Sagittarius) in area 0b (inner space, top side of plane 0)
const sagittariusSimX = (Math.random() - 0.5) * 6; // Random between -3 and 3
const sagittariusSimZ = (Math.random() - 0.5) * 6; // Random between -3 and 3
// Calculate angle from center to position to point outward
const sagittariusSimAngle = Math.atan2(sagittariusSimZ, sagittariusSimX);

sceneManager.addObject({
    name: 'Sagittarius',
    type: 'blackholesim',
    position: [sagittariusSimX, -1.25, sagittariusSimZ], // Random position in region 0b (between plane 0 at y=-2.5 and plane 1 at y=0)
    blackHoleRadius: 0.25, // Smaller black hole
    rotationSpeed: 0.0005, // Rotation speed
    region: '0b', // Top side of plane 0
    bindingType: 'free',
    lineType: 'laser',
    angle: sagittariusSimAngle, // Angle pointing outward from center
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add star sphere centered on Nucleus - separated from Saturn's simulation
// Nucleus is at [0, 3.75, 0], so star sphere is centered there
sceneManager.addObject({
    name: 'SATURN_STAR_SPHERE',
    type: 'starsphere',
    position: [0, 3.75, 0], // Centered on Nucleus
    starCount: 5000, // 5000 stars
    radius: 100, // Star sphere radius
    region: '2b', // Same region as Nucleus
    bindingType: 'free',
    lineType: null // No label line
});

// Add Saturn simulation object in area 0b (top side of plane 0) at opposite corner from waterfall
// Waterfall is at top-right corner (X = planeSize/2 - 0.3, Z = -planeSize/2 + 0.3)
// Saturn goes to bottom-left corner (opposite)
// Note: Saturn now only contains planet + rings, stars are separate (SATURN_STAR_SPHERE)
const planeHalfSize0b = planeSize / 2; // 4
const saturnX = -planeHalfSize0b + 0.3; // Bottom-left corner (negative X)
const saturnZ = planeHalfSize0b - 0.3; // Bottom-left corner (positive Z)

sceneManager.addObject({
    name: 'SATURN',
    type: 'simulation',
    position: [saturnX, -1.25, saturnZ], // Bottom-left corner in region 0b (opposite from waterfall)
    size: 0.15, // Smaller size
    region: '0b', // Top side of plane 0
    bindingType: 'free',
    lineType: 'leader', // Leader line extends to nearest screen edge
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add supernova object at same level as nucleus (y=3.75) but far in outer space
// Nucleus is at [0, 3.75, 0], place supernova far from center at same Y level
const supernovaDistance = 15; // Far in outer space
const supernovaAngle = Math.random() * Math.PI * 2; // Random angle around center
const supernovaX = Math.cos(supernovaAngle) * supernovaDistance;
const supernovaZ = Math.sin(supernovaAngle) * supernovaDistance;
const supernovaY = 3.75; // Same level as nucleus

sceneManager.addObject({
    name: 'supernova',
    type: 'supernova',
    position: [supernovaX, supernovaY, supernovaZ], // Far in outer space, same level as nucleus
    size: 0.02, // Very small size for the supernova visualization
    region: '2b', // Same region as nucleus
    bindingType: 'free',
    lineType: 'leader', // Leader line extends to nearest screen edge
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add Atlantis animated SVG in area 0b (top side of plane 0) on the outskirts
// Position on the outer edges of area 0b (near the boundaries of the plane structure)
const atlantisEdgeOffset = 0.3; // Offset from exact edge
// Randomly choose which edge to place it on
const atlantisEdge = Math.floor(Math.random() * 4);
let atlantisX, atlantisZ;
if (atlantisEdge === 0) {
    // Top edge (negative Z)
    atlantisX = (Math.random() - 0.5) * planeSize * 0.7; // Random X along edge
    atlantisZ = -planeHalfSize0b + atlantisEdgeOffset;
} else if (atlantisEdge === 1) {
    // Right edge (positive X)
    atlantisX = planeHalfSize0b - atlantisEdgeOffset;
    atlantisZ = (Math.random() - 0.5) * planeSize * 0.7; // Random Z along edge
} else if (atlantisEdge === 2) {
    // Bottom edge (positive Z)
    atlantisX = (Math.random() - 0.5) * planeSize * 0.7; // Random X along edge
    atlantisZ = planeHalfSize0b - atlantisEdgeOffset;
} else {
    // Left edge (negative X)
    atlantisX = -planeHalfSize0b + atlantisEdgeOffset;
    atlantisZ = (Math.random() - 0.5) * planeSize * 0.7; // Random Z along edge
}
// Calculate angle from center to Atlantis position to point outward
const atlantisAngle = Math.atan2(atlantisZ, atlantisX);

const atlantisSVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" overflow="visible" xmlns="http://www.w3.org/2000/svg">
<defs>
	<linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
		<stop offset="0%" stop-color="#1a4d7a" stop-opacity="0.8">
			<animate attributeName="stop-opacity" dur="3s" repeatCount="indefinite" values="0.8;0.6;0.8"/>
		</stop>
		<stop offset="50%" stop-color="#0a2d4a" stop-opacity="0.9">
			<animate attributeName="stop-opacity" dur="3s" repeatCount="indefinite" values="0.9;0.7;0.9"/>
		</stop>
		<stop offset="100%" stop-color="#0a1a2a" stop-opacity="1.0">
			<animate attributeName="stop-opacity" dur="3s" repeatCount="indefinite" values="1.0;0.8;1.0"/>
		</stop>
	</linearGradient>
	<pattern id="waves" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
		<path d="M0,50 Q25,30 50,50 T100,50" stroke="#4a9dd0" stroke-width="2" fill="none" opacity="0.6">
			<animate attributeName="d" dur="2s" repeatCount="indefinite" 
				values="M0,50 Q25,30 50,50 T100,50;M0,50 Q25,70 50,50 T100,50;M0,50 Q25,30 50,50 T100,50"/>
		</path>
		<path d="M0,70 Q25,50 50,70 T100,70" stroke="#6ab3e0" stroke-width="1.5" fill="none" opacity="0.4">
			<animate attributeName="d" dur="2.5s" repeatCount="indefinite" 
				values="M0,70 Q25,50 50,70 T100,70;M0,70 Q25,90 50,70 T100,70;M0,70 Q25,50 50,70 T100,70"/>
		</path>
	</pattern>
</defs>
<circle cx="256" cy="256" r="200" fill="url(#waterGradient)" opacity="0.9">
	<animate attributeName="r" dur="4s" repeatCount="indefinite" values="200;210;200"/>
</circle>
<circle cx="256" cy="256" r="180" fill="url(#waves)" opacity="0.7"/>
<circle cx="256" cy="256" r="150" fill="url(#waterGradient)" opacity="0.8">
	<animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.8;0.6;0.8"/>
</circle>
<path d="M 200 256 Q 256 200 312 256 Q 256 312 200 256" fill="#2c5a7a" opacity="0.6">
	<animateTransform attributeName="transform" type="rotate" values="0 256 256;360 256 256" dur="8s" repeatCount="indefinite"/>
</path>
<circle cx="256" cy="256" r="100" fill="#1a4d7a" opacity="0.5">
	<animate attributeName="r" dur="5s" repeatCount="indefinite" values="100;110;100"/>
	<animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0.5;0.7;0.5"/>
</circle>
</svg>`;

sceneManager.addObject({
    name: 'Atlantis',
    type: 'svg',
    position: [atlantisX, -1.25, atlantisZ], // Random position in region 0b (between plane 0 at y=-2.5 and plane 1 at y=0)
    size: 0.05, // Very small size - much smaller than black cube (0.3)
    svgContent: atlantisSVG,
    region: '0b', // Top side of plane 0
    bindingType: 'free',
    lineType: 'laser',
    angle: atlantisAngle, // Angle pointing outward from center
    lineColor: 0xffffff,
    lineOpacity: 0.5
});

// Add 5 randomly placed very small black circles around the interior of the universe
for (let i = 0; i < 5; i++) {
    // Random position within the universe (between planes 0 at y=-2.5 and plane 4 at y=7.5)
    const randomX = (Math.random() - 0.5) * 6; // Random between -3 and 3
    const randomY = Math.random() * 10 - 2.5; // Random between -2.5 and 7.5 (covers planes 0-4)
    const randomZ = (Math.random() - 0.5) * 6; // Random between -3 and 3
    
    sceneManager.addObject({
        name: `BLACK_CIRCLE_${i}`,
        type: 'blackcircle',
        position: [randomX, randomY, randomZ],
        size: 0.1, // Small circle
        region: '2b', // Middle region (will be auto-determined)
        bindingType: 'free',
        lineType: null // No label
    });
}

// Add 5 randomly placed mirror balls around the interior of the universe
for (let i = 0; i < 5; i++) {
    // Random position within the universe (between planes 0 at y=-2.5 and plane 4 at y=7.5)
    const randomX = (Math.random() - 0.5) * 6; // Random between -3 and 3
    const randomY = Math.random() * 10 - 2.5; // Random between -2.5 and 7.5 (covers planes 0-4)
    const randomZ = (Math.random() - 0.5) * 6; // Random between -3 and 3
    
    sceneManager.addObject({
        name: `MIRROR_BALL_${i}`,
        type: 'sphere',
        position: [randomX, randomY, randomZ],
        radius: 0.08, // Smaller mirror ball
        color: 0xffffff, // White/clear for mirror
        emissive: 0x000000,
        emissiveIntensity: 0, // No glow
        metalness: 1.0, // Fully metallic for mirror
        roughness: 0.0, // Perfectly smooth for mirror reflection
        transmission: 0.0, // Not transparent
        ior: 1.5, // Standard for mirrors
        region: '2b', // Middle region (will be auto-determined)
        bindingType: 'free',
        lineType: null // No label
    });
}

// Add a 2D black ball on the outside of the interior, at fixed radius from nucleus
// Nucleus is at [0, 3.75, 0], so place black circle at same Y level
const nucleusRadius = 3.5; // Fixed radius from nucleus
const blackBallAngle = Math.random() * Math.PI * 2; // Random angle around nucleus
const blackBallX = Math.cos(blackBallAngle) * nucleusRadius;
const blackBallZ = Math.sin(blackBallAngle) * nucleusRadius;
const blackBallY = 3.75; // Same level as nucleus

sceneManager.addObject({
    name: 'BLACK_BALL',
    type: 'blackcircle',
    position: [blackBallX, blackBallY, blackBallZ],
    size: 0.3, // Larger black circle
    region: '2b', // Same region as nucleus
    bindingType: 'free',
    lineType: null // No label
});

// Add all objects to the planes group
sceneManager.addAllToGroup(planesGroup);

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
    
    // Restore cloud dummy meshes (they were already invisible, but just in case)
    cloudDummies.forEach(dummy => {
        dummy.visible = false; // Keep them invisible
    });
    
    // Set environment map on scene (all materials will use it)
    scene.environment = envMap;
    
    // Clean up
    pmremGenerator.dispose();
    
    return envMap;
}

// Generate environment map after initial scene setup
generateEnvironmentMap();

// Set up environment map regeneration callback for SceneManager
sceneManager.onEnvironmentUpdate = generateEnvironmentMap;

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
// Celestial events system (shooting star, comet, eclipse)
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

function createEclipse() {
    // Create eclipse overlay that gradually fades background to white and back (10 seconds total)
    const eclipseOverlay = document.createElement('div');
    eclipseOverlay.className = 'eclipse-overlay';
    eclipseOverlay.style.position = 'fixed';
    eclipseOverlay.style.top = '0';
    eclipseOverlay.style.left = '0';
    eclipseOverlay.style.width = '100%';
    eclipseOverlay.style.height = '100%';
    eclipseOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0)';
    eclipseOverlay.style.pointerEvents = 'none';
    eclipseOverlay.style.zIndex = '9999';
    eclipseOverlay.style.transition = 'background-color 5s ease-in-out';
    
    body.appendChild(eclipseOverlay);
    
    // Fade to white over 5 seconds
    setTimeout(() => {
        eclipseOverlay.style.backgroundColor = 'rgba(255, 255, 255, 1)';
    }, 10);
    
    // Fade back to transparent over 5 seconds (starts at 5 seconds, completes at 10 seconds)
    setTimeout(() => {
        eclipseOverlay.style.transition = 'background-color 5s ease-in-out';
        eclipseOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0)';
    }, 5000);
    
    // Remove overlay after animation completes (10 seconds total)
    setTimeout(() => {
        if (eclipseOverlay.parentNode) {
            eclipseOverlay.parentNode.removeChild(eclipseOverlay);
        }
    }, 10000);
    
    // Schedule next event
    scheduleNextCelestialEvent();
}

function scheduleNextCelestialEvent() {
    // Random delay between 70-120 seconds
    const minDelay = 70000; // 70 seconds
    const maxDelay = 120000; // 120 seconds
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    
    // Randomly choose one of three events (equal probability)
    const eventType = Math.floor(Math.random() * 3);
    
    celestialEventTimeout = setTimeout(() => {
        if (eventType === 0) {
            createShootingStar();
        } else if (eventType === 1) {
            createComet();
        } else {
            createEclipse();
        }
    }, delay);
}

// Start the celestial events system after a short initial delay
setTimeout(() => {
    scheduleNextCelestialEvent();
}, 5000); // First event after 5 seconds

function animate() {
    requestAnimationFrame(animate);
    
    // Update star twinkling time
    if (starMaterial && starMaterial.uniforms) {
        starMaterial.uniforms.uTime.value += 0.016; // ~60fps
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
    
    renderer.render(scene, camera);
}

animate();

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

// Control Panel Toggle
const panelToggle = document.getElementById('panel-toggle');
const panelClose = document.getElementById('panel-close');
const controlPanel = document.getElementById('control-panel');

panelToggle.addEventListener('click', () => {
    controlPanel.classList.toggle('open');
    panelToggle.classList.toggle('hidden');
});

panelClose.addEventListener('click', () => {
    controlPanel.classList.remove('open');
    panelToggle.classList.remove('hidden');
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



