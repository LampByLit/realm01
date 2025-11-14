// SceneObject - Encapsulates a 3D object with label and leader/laser line
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class SceneObject {
    constructor(config, scene, camera, renderer, sceneManager) {
        this.name = config.name;
        this.position = new THREE.Vector3(...config.position);
        this.region = config.region; // e.g., "2b" for top side of plane 2
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.sceneManager = sceneManager;
        this.planesGroup = null; // Will be set when added to group
        
        // Store infobox and explore content for click handling
        this.infoboxContent = config.infoboxContent;
        this.isGreenlisted = config.isGreenlisted;
        this.exploreContent = config.exploreContent;
        this.hasDonatedExotic = config.hasDonatedExotic || false;
        
        // Binding system: 'relative', 'elastic', or 'free'
        this.bindingType = config.bindingType || 'free';
        
        if (this.bindingType === 'relative') {
            // Relative to a single plane
            this.planeIndex = config.planeIndex; // Which plane (0-4)
            this.offset = config.offset; // Offset from plane Y position
        } else if (this.bindingType === 'elastic') {
            // Percentage between two planes
            this.planeA = config.planeA; // Lower plane index
            this.planeB = config.planeB; // Upper plane index
            this.percentage = config.percentage; // 0.0 to 1.0 (0 = at planeA, 1 = at planeB)
        }
        // 'free' objects have no binding - use fixed coordinates
        
        // Create the 3D mesh, HTML orb, or canvas crystal
        if (config.type === 'orb') {
            this.orbElement = this.createOrb(config);
            this.mesh = null; // No 3D mesh for orb type
            this.crystalElement = null;
            this.cloudElement = null;
        } else if (config.type === 'cloud') {
            this.cloudElement = this.createCloud(config); // Store reference to wrapper
            this.cloudWrapper = this.cloudElement; // Also store as wrapper for consistency
            this.mesh = null; // No 3D mesh for cloud type initially
            this.orbElement = null;
            this.crystalElement = null;
            this.svgElement = null;
        } else if (config.type === 'svg') {
            this.svgElement = this.createSVG(config);
            this.mesh = null; // No 3D mesh for SVG type initially
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
        } else if (config.type === 'crystal') {
            this.mesh = this.createCrystal(config); // Crystal creates a sprite mesh
            this.crystalElement = this.mesh; // Store reference
            this.orbElement = null;
            this.cloudElement = null;
        } else if (config.type === 'particlesphere') {
            this.mesh = this.createParticleSphere(config); // Particle sphere creates a sprite mesh
            this.crystalElement = this.mesh; // Store reference
            this.orbElement = null;
            this.cloudElement = null;
        } else if (config.type === 'shader') {
            this.mesh = this.createShaderSphere(config);
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
        } else if (config.type === 'conecluster') {
            this.mesh = this.createConeCluster(config);
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
        } else if (config.type === 'symbol') {
            this.mesh = this.createSymbol(config);
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
        } else if (config.type === 'cyclingsymbol') {
            this.mesh = this.createCyclingSymbol(config);
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
        } else if (config.type === 'galaxy') {
            this.mesh = this.createGalaxy(config);
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
        } else if (config.type === 'glowingregion') {
            this.mesh = this.createGlowingRegion(config);
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
        } else if (config.type === 'simulation') {
            this.mesh = this.createSimulation(config);
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
        } else if (config.type === 'starsphere') {
            this.mesh = this.createStarSphere(config);
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
        } else if (config.type === 'supernova') {
            this.mesh = this.createSupernova(config);
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
        } else if (config.type === 'sun') {
            this.sunElement = this.createSun(config);
            this.mesh = null; // No 3D mesh for sun type initially
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
        } else if (config.type === 'flames') {
            this.flamesElement = this.createFlames(config);
            this.mesh = null; // No 3D mesh for flames type
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
            this.sunElement = null;
        } else if (config.type === 'blackhole') {
            this.mesh = this.createBlackHole(config);
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
        } else if (config.type === 'blackcircle') {
            this.mesh = this.createBlackCircle(config);
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
        } else if (config.type === 'blackholesim') {
            this.mesh = this.createBlackHoleSim(config);
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
        } else if (config.type === 'gltf') {
            // GLTF models load asynchronously, so mesh will be null initially
            this.mesh = null;
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
            this.loadGLTF(config);
        } else {
            this.mesh = this.createMesh(config);
            this.orbElement = null;
            this.crystalElement = null;
            this.cloudElement = null;
        }
        
        // Create leader, laser, lefty, or lefthand line (if lineType is specified)
        if (config.lineType === 'laser') {
            this.line = this.createLaserLine(config);
        } else if (config.lineType === 'lefty') {
            this.line = this.createLeftyLine(config);
        } else if (config.lineType === 'lefthand') {
            this.line = this.createLefthandLine(config);
        } else if (config.lineType) {
            // Only create leader line if lineType is specified (not null/undefined)
            this.line = this.createLeaderLine(config);
        } else {
            // No line type specified - no line or label
            this.line = null;
            this.label = null;
        }
        
        // Position objects
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            
            // Store orbital parameters if provided
            if (config.orbitalSpeed !== undefined) {
                this.mesh.userData.orbitalSpeed = config.orbitalSpeed;
                this.mesh.userData.orbitalRadius = config.orbitalRadius || 1.0;
                this.mesh.userData.orbitalCenterX = config.orbitalCenterX || 0;
                this.mesh.userData.orbitalCenterZ = config.orbitalCenterZ || 0;
                this.mesh.userData.orbitalAngle = config.orbitalAngle || 0;
            }
            
            // Apply rotation if specified (for upside-down pyramids, etc.)
            // Don't rotate crystal sprite or symbol sprite - they should face camera
            if (config.rotation && config.type !== 'crystal' && config.type !== 'symbol') {
                this.mesh.rotation.set(...config.rotation);
            }
        }
        
        // Create label only if line exists
        if (this.line) {
            // For lefty and lefthand lines, label is HTML element, not sprite
            if (config.lineType === 'lefty') {
                this.label = this.createLeftyLabel(config.name);
            } else if (config.lineType === 'lefthand') {
                this.label = this.createLefthandLabel(config.name, config.lefthandLabelPosition, config.lefthandOffset || 0);
            } else {
                this.label = this.createLabel(config.name);
                this.label.position.copy(this.position);
            }
            
            // Position line at object location (line points are relative)
            // For lefty and lefthand lines, add directly to scene (not group) and position at origin
            if (config.lineType === 'lefty' || config.lineType === 'lefthand') {
                this.line.position.set(0, 0, 0); // Position at origin, will use world coordinates
                this.scene.add(this.line);
            } else {
                this.line.position.copy(this.position);
            }
            
            this.updateLine();
        }
    }
    
    createMesh(config) {
        let geometry;
        
        switch (config.type) {
            case 'sphere':
                geometry = new THREE.SphereGeometry(config.radius || 0.3, 32, 32);
                break;
            case 'box':
                geometry = new THREE.BoxGeometry(...(config.size || [0.5, 0.5, 0.5]));
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(config.radius || 0.3, config.tube || 0.1, 16, 100);
                break;
            case 'pyramid':
                // Create a square pyramid using ConeGeometry with 4 segments
                const pyramidRadius = config.radius || 0.3;
                const pyramidHeight = config.height || (pyramidRadius * 1.5);
                geometry = new THREE.ConeGeometry(pyramidRadius, pyramidHeight, 4);
                break;
            default:
                geometry = new THREE.SphereGeometry(0.3, 32, 32);
        }
        
        // Create Jupiter texture if textureRotation is enabled
        let jupiterTexture = null;
        if (config.textureRotation && config.name === 'jupiter') {
            jupiterTexture = this.createJupiterTexture();
            // Store rotation speed for animation
            this.textureRotationSpeed = config.textureRotationSpeed || 0.001;
            this.textureRotationOffset = 0;
        }
        
        // Use MeshPhysicalMaterial if transmission or ior are specified, otherwise MeshStandardMaterial
        const usePhysicalMaterial = (config.transmission !== undefined && config.transmission > 0) || 
                                    (config.ior !== undefined && config.ior !== 1.5);
        
        const material = usePhysicalMaterial 
            ? new THREE.MeshPhysicalMaterial({
                color: config.color || 0x8685ef,
                emissive: config.color || 0x8685ef,
                emissiveIntensity: config.emissiveIntensity !== undefined ? config.emissiveIntensity : 0.6,
                metalness: config.metalness !== undefined ? config.metalness : 0.4,
                roughness: config.roughness !== undefined ? config.roughness : 0.6,
                transmission: config.transmission !== undefined ? config.transmission : 0.0,
                ior: config.ior !== undefined ? config.ior : 1.5,
                map: jupiterTexture || null,
            })
            : new THREE.MeshStandardMaterial({
                color: config.color || 0x8685ef,
                emissive: config.color || 0x8685ef,
                emissiveIntensity: config.emissiveIntensity !== undefined ? config.emissiveIntensity : 0.6,
                metalness: config.metalness !== undefined ? config.metalness : 0.4,
                roughness: config.roughness !== undefined ? config.roughness : 0.6,
                map: jupiterTexture || null,
            });
        
        // Store texture reference for rotation
        if (jupiterTexture) {
            this.jupiterTexture = jupiterTexture;
            jupiterTexture.wrapS = THREE.RepeatWrapping;
            jupiterTexture.wrapT = THREE.ClampToEdgeWrapping;
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Add vertical rings if specified (for Uranus)
        if (config.verticalRings) {
            const group = new THREE.Group();
            group.add(mesh);
            
            const ringCount = config.ringCount || 3;
            const ringRadius = config.ringRadius || (config.radius * 1.5 || 0.45);
            const ringTube = config.ringTube || 0.02;
            const ringColor = config.ringColor || 0x88aacc;
            
            // Create vertical rings (torus rotated 90 degrees around Z axis)
            for (let i = 0; i < ringCount; i++) {
                const ringGeometry = new THREE.TorusGeometry(
                    ringRadius + (i * ringTube * 2), // Slightly larger radius for each ring
                    ringTube,
                    16,
                    100
                );
                const ringMaterial = new THREE.MeshPhysicalMaterial({
                    color: ringColor,
                    transparent: true,
                    opacity: 0.6,
                    transmission: 0.8,
                    ior: 1.5,
                    metalness: 0.1,
                    roughness: 0.3
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                // Rotate 90 degrees around Y axis to make rings vertical (standing upright like hula hoops)
                ring.rotation.y = Math.PI / 2;
                group.add(ring);
            }
            
            return group;
        }
        
        return mesh;
    }
    
    createJupiterTexture() {
        // Create a procedural Jupiter texture with bands and swirls
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Base Jupiter colors
        const baseColors = [
            { r: 216, g: 202, b: 157 }, // Tan/beige
            { r: 200, g: 180, b: 140 }, // Lighter tan
            { r: 180, g: 150, b: 120 }, // Orange-tan
            { r: 160, g: 130, b: 100 }, // Darker orange
            { r: 140, g: 110, b: 90 },  // Brown-orange
        ];
        
        // Create horizontal bands (Jupiter's characteristic bands)
        for (let y = 0; y < size; y++) {
            const bandIndex = Math.floor((y / size) * baseColors.length);
            const color = baseColors[bandIndex];
            
            // Add some variation and swirls
            const noise = Math.sin(y * 0.1) * 0.3 + Math.sin(y * 0.05) * 0.2;
            const r = Math.max(0, Math.min(255, color.r + noise * 30));
            const g = Math.max(0, Math.min(255, color.g + noise * 20));
            const b = Math.max(0, Math.min(255, color.b + noise * 15));
            
            ctx.fillStyle = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
            ctx.fillRect(0, y, size, 1);
        }
        
        // Add swirl patterns (Great Red Spot and other features)
        for (let i = 0; i < 5; i++) {
            const centerX = Math.random() * size;
            const centerY = Math.random() * size;
            const radius = 30 + Math.random() * 40;
            
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            const swirlColor = i === 0 ? 'rgba(200, 100, 80, 0.4)' : 'rgba(180, 150, 120, 0.2)'; // Red spot for first swirl
            gradient.addColorStop(0, swirlColor);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add some horizontal streaks for cloud bands
        for (let i = 0; i < 20; i++) {
            const y = Math.random() * size;
            const width = 2 + Math.random() * 3;
            const alpha = 0.1 + Math.random() * 0.2;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(0, y, size, width);
        }
        
        // Add lighting/shadow effects like the CSS (box-shadow and gradient overlay)
        // Create gradient overlay: linear-gradient(-90deg, transparent 30%, black)
        // This creates a shadow on the left side (like box-shadow: inset 20px 0 20px black)
        const gradient = ctx.createLinearGradient(0, 0, size, 0);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent on left
        gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0)'); // Still transparent at 30%
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)'); // Dark shadow on right
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // Add additional shadow effect on the left edge (simulating inset shadow)
        const leftShadowGradient = ctx.createRadialGradient(0, size/2, 0, 0, size/2, size * 0.15);
        leftShadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        leftShadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = leftShadowGradient;
        ctx.fillRect(0, 0, size * 0.2, size);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createOrb(config) {
        // Create HTML element for CSS orb animation
        const orbWrapper = document.createElement('div');
        orbWrapper.className = 'orb-wrapper';
        orbWrapper.style.position = 'fixed';
        orbWrapper.style.pointerEvents = 'none';
        orbWrapper.style.zIndex = '10';
        orbWrapper.style.transformOrigin = 'center center';
        
        const orb = document.createElement('div');
        orb.className = 'orb';
        orbWrapper.appendChild(orb);
        document.body.appendChild(orbWrapper);
        
        // Store size for later calculations
        this.orbSize = config.size || 0.6;
        this.orbWrapper = orbWrapper;
        
        return orbWrapper;
    }
    
    createSun(config) {
        // Create HTML element for CSS sun animation
        const sunWrapper = document.createElement('div');
        sunWrapper.className = 'sun-wrapper';
        sunWrapper.style.position = 'fixed';
        sunWrapper.style.pointerEvents = 'none';
        sunWrapper.style.zIndex = '10';
        sunWrapper.style.transformOrigin = 'center center';
        
        const parentSun = document.createElement('div');
        parentSun.className = 'parent-sun';
        
        const sun = document.createElement('div');
        sun.className = 'sun';
        
        // Create 30 span elements for the rotating rings
        for (let i = 1; i <= 30; i++) {
            const span = document.createElement('span');
            // Random rotation for each span
            const randomY = Math.random() * 20;
            const randomX = Math.random() * 20;
            span.style.transform = `rotateY(${i * randomY}deg) rotateX(${i * randomX}deg)`;
            sun.appendChild(span);
        }
        
        // Add the rotate div
        const rotate = document.createElement('div');
        rotate.className = 'rotate';
        sun.appendChild(rotate);
        
        parentSun.appendChild(sun);
        sunWrapper.appendChild(parentSun);
        document.body.appendChild(sunWrapper);
        
        // Store size for later calculations
        this.sunSize = config.size || 1.0;
        this.sunWrapper = sunWrapper;
        
        // Store orbital parameters
        if (config.orbitalSpeed !== undefined) {
            this.orbitalSpeed = config.orbitalSpeed;
            this.orbitalRadius = config.orbitalRadius || 10.0;
            this.orbitalAngle = config.orbitalAngle || 0;
            this.orbitalCenterX = config.orbitalCenterX || 0;
            this.orbitalCenterZ = config.orbitalCenterZ || 0;
        }
        
        return sunWrapper;
    }
    
    createFlames(config) {
        // Create HTML element for CSS fire animation
        const flamesWrapper = document.createElement('div');
        flamesWrapper.className = 'fire-wrapper';
        flamesWrapper.style.position = 'fixed';
        flamesWrapper.style.pointerEvents = 'none';
        flamesWrapper.style.zIndex = '-50'; // Start with low z-index, will be updated based on depth
        flamesWrapper.style.transformOrigin = 'center center';
        
        const fire = document.createElement('div');
        fire.className = 'fire';
        
        // Create 50 particle elements for the fire animation with chaotic properties
        for (let i = 1; i <= 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            // Add random horizontal drift for more chaos
            const randomX = Math.random();
            particle.style.setProperty('--random-x', randomX);
            fire.appendChild(particle);
        }
        
        flamesWrapper.appendChild(fire);
        document.body.appendChild(flamesWrapper);
        
        // Store size for later calculations
        this.flamesSize = config.size || 1.0;
        this.flamesWrapper = flamesWrapper;
        
        return flamesWrapper;
    }
    
    createBlackHole(config) {
        // Create a group to hold the black hole sphere and particle rings
        const blackHoleGroup = new THREE.Group();
        
        // Create the black sphere (event horizon)
        const sphereSize = config.size || 0.4;
        const sphereGeometry = new THREE.SphereGeometry(sphereSize, 32, 32);
        const sphereMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0x000000,
            metalness: 0.0,
            roughness: 1.0
        });
        const blackSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        blackHoleGroup.add(blackSphere);
        
        const ringRadius = (config.ringRadius || sphereSize * 1.8); // Tighter rings
        const particleCount = config.particleCount || 200;
        const ringsPerRing = Math.floor(particleCount / 10); // Distribute particles across 10 rings
        
        const particleMaterial = new THREE.PointsMaterial({
            size: config.particleSize || 0.05,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        const particleRings = [];
        
        // Create 10 rings total (2 original + 8 new)
        // Ring configurations: [rotationX, rotationY, rotationZ, axis description]
        const ringConfigs = [
            [Math.PI / 2, 0, 0, 'horizontal'], // Horizontal (equatorial) - like Saturn
            [0, Math.PI / 2, 0, 'vertical'], // Vertical (polar) - like Uranus
            [Math.PI / 4, 0, 0, 'tilted1'], // Tilted 45 degrees
            [-Math.PI / 4, 0, 0, 'tilted2'], // Tilted -45 degrees
            [0, Math.PI / 4, 0, 'tilted3'], // Tilted around Y
            [0, -Math.PI / 4, 0, 'tilted4'], // Tilted around Y opposite
            [Math.PI / 3, Math.PI / 3, 0, 'diagonal1'], // Diagonal orientation
            [-Math.PI / 3, Math.PI / 3, 0, 'diagonal2'], // Diagonal orientation
            [Math.PI / 6, Math.PI / 6, Math.PI / 4, 'complex1'], // Complex orientation
            [Math.PI / 3, -Math.PI / 6, -Math.PI / 4, 'complex2'] // Complex orientation
        ];
        
        for (let ringIdx = 0; ringIdx < ringConfigs.length; ringIdx++) {
            const [rotX, rotY, rotZ, ringType] = ringConfigs[ringIdx];
            const ringGeometry = new THREE.BufferGeometry();
            const ringPositions = new Float32Array(ringsPerRing * 3);
            const ringColors = new Float32Array(ringsPerRing * 3);
            const ringSizes = new Float32Array(ringsPerRing);
            
            for (let i = 0; i < ringsPerRing; i++) {
                const i3 = i * 3;
                const angle = (i / ringsPerRing) * Math.PI * 2;
                const distance = ringRadius * (0.95 + Math.random() * 0.1); // Tight ring
                
                // Start with a ring in XY plane (horizontal)
                let x = Math.cos(angle) * distance;
                let y = (Math.random() - 0.5) * 0.1; // Very thin height variation
                let z = Math.sin(angle) * distance;
                
                // Apply rotations to orient the ring
                // Rotate around X axis
                const y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
                const z1 = y * Math.sin(rotX) + z * Math.cos(rotX);
                y = y1;
                z = z1;
                
                // Rotate around Y axis
                const x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
                const z2 = -x * Math.sin(rotY) + z * Math.cos(rotY);
                x = x1;
                z = z2;
                
                // Rotate around Z axis
                const x2 = x * Math.cos(rotZ) - y * Math.sin(rotZ);
                const y2 = x * Math.sin(rotZ) + y * Math.cos(rotZ);
                x = x2;
                y = y2;
                
                ringPositions[i3] = x;
                ringPositions[i3 + 1] = y;
                ringPositions[i3 + 2] = z;
                
                const intensity = 0.7 + Math.random() * 0.3;
                ringColors[i3] = 1.0 * intensity; // R
                ringColors[i3 + 1] = 0.4 * intensity; // G
                ringColors[i3 + 2] = 0.0; // B
                
                ringSizes[i] = 0.02 + Math.random() * 0.03;
            }
            
            ringGeometry.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
            ringGeometry.setAttribute('color', new THREE.BufferAttribute(ringColors, 3));
            ringGeometry.setAttribute('size', new THREE.BufferAttribute(ringSizes, 1));
            
            const ringParticles = new THREE.Points(ringGeometry, particleMaterial.clone());
            blackHoleGroup.add(ringParticles);
            particleRings.push(ringParticles);
        }
        
        // Store rotation speed for animation
        blackHoleGroup.userData.rotationSpeed = config.rotationSpeed || 0.01;
        blackHoleGroup.userData.isBlackHole = true;
        blackHoleGroup.userData.particleRings = particleRings;
        
        return blackHoleGroup;
    }
    
    createBlackCircle(config) {
        // Create a canvas for the black circle
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Draw a pure black circle
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // Create sprite material
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1.0
        });
        
        // Create sprite
        const sprite = new THREE.Sprite(spriteMaterial);
        const size = config.size || 0.1;
        sprite.scale.set(size, size, 1);
        
        return sprite;
    }
    
    createBlackHoleSim(config) {
        // Create a group for the black hole simulation
        const blackHoleSimGroup = new THREE.Group();
        
        const blackHoleRadius = config.blackHoleRadius || 0.3;
        const diskInnerRadius = blackHoleRadius * 1.1;
        const diskOuterRadius = blackHoleRadius * 4.5;
        
        // Create black hole sphere
        const blackHoleGeometry = new THREE.SphereGeometry(blackHoleRadius, 64, 64);
        const blackHoleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const blackHoleMesh = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
        blackHoleSimGroup.add(blackHoleMesh);
        
        // Create accretion disk texture procedurally
        const canvas = document.createElement('canvas');
        const textureSize = 512;
        canvas.width = textureSize;
        canvas.height = textureSize;
        const context = canvas.getContext('2d');
        const centerX = textureSize / 2;
        const centerY = textureSize / 2;
        
        // Create radial gradient
        const gradient = context.createRadialGradient(
            centerX, centerY, textureSize * 0.15,
            centerX, centerY, textureSize * 0.48
        );
        gradient.addColorStop(0, 'rgba(255, 255, 220, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 220, 150, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 140, 80, 0.9)');
        gradient.addColorStop(0.7, 'rgba(150, 180, 200, 0.5)');
        gradient.addColorStop(1, 'rgba(50, 70, 100, 0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, textureSize, textureSize);
        
        // Add streaky elements
        context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        context.lineWidth = 1;
        context.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 150; i++) {
            const angle = Math.random() * Math.PI * 2;
            const startRadius = textureSize * (0.15 + Math.random() * 0.1);
            const endRadius = textureSize * (0.3 + Math.random() * 0.2);
            const startX = centerX + Math.cos(angle) * startRadius;
            const startY = centerY + Math.sin(angle) * startRadius;
            const endX = centerX + Math.cos(angle + (Math.random() - 0.5) * 0.5) * endRadius;
            const endY = centerY + Math.sin(angle + (Math.random() - 0.5) * 0.5) * endRadius;
            
            const cpAngle = angle + (Math.random() - 0.5) * 0.3;
            const cpRadius = (startRadius + endRadius) / 2 * (1 + (Math.random()-0.5)*0.2);
            const cpX = centerX + Math.cos(cpAngle) * cpRadius;
            const cpY = centerY + Math.sin(cpAngle) * cpRadius;
            
            context.beginPath();
            context.moveTo(startX, startY);
            context.quadraticCurveTo(cpX, cpY, endX, endY);
            context.stroke();
        }
        context.globalCompositeOperation = 'source-over';
        
        const diskTexture = new THREE.CanvasTexture(canvas);
        diskTexture.wrapS = THREE.RepeatWrapping;
        diskTexture.wrapT = THREE.RepeatWrapping;
        diskTexture.colorSpace = THREE.SRGBColorSpace;
        
        // Create main disk
        const diskGeometry = new THREE.RingGeometry(diskInnerRadius, diskOuterRadius, 128, 8);
        const diskMaterial = new THREE.MeshBasicMaterial({
            map: diskTexture,
            side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        const diskMesh = new THREE.Mesh(diskGeometry, diskMaterial);
        diskMesh.rotation.x = -Math.PI / 2;
        blackHoleSimGroup.add(diskMesh);
        
        // Create lensed arcs
        const lensingGeometry = new THREE.RingGeometry(
            diskInnerRadius * 0.9,
            diskOuterRadius * 0.6,
            128,
            5,
            0,
            Math.PI * 2
        );
        const lensingMaterial = new THREE.MeshBasicMaterial({
            map: diskTexture,
            side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        // Top arc
        const lensedTop = new THREE.Mesh(lensingGeometry.clone(), lensingMaterial.clone());
        lensedTop.position.y = blackHoleRadius * 0.2;
        lensedTop.rotation.x = Math.PI * 0.55;
        blackHoleSimGroup.add(lensedTop);
        
        // Bottom arc
        const lensedBottom = new THREE.Mesh(lensingGeometry.clone(), lensingMaterial.clone());
        lensedBottom.position.y = -blackHoleRadius * 0.2;
        lensedBottom.rotation.x = -Math.PI * 0.55;
        blackHoleSimGroup.add(lensedBottom);
        
        // Store for animation
        blackHoleSimGroup.userData.isBlackHoleSim = true;
        blackHoleSimGroup.userData.rotationSpeed = config.rotationSpeed || 0.0005;
        
        return blackHoleSimGroup;
    }
    
    createCloud(config) {
        // Create HTML element for CSS cloud animation
        const cloudWrapper = document.createElement('div');
        cloudWrapper.className = 'cloud-wrapper';
        cloudWrapper.style.position = 'fixed';
        cloudWrapper.style.pointerEvents = 'none';
        cloudWrapper.style.zIndex = '100'; // Higher than orb (10) to ensure visibility
        cloudWrapper.style.transformOrigin = 'center center';
        cloudWrapper.style.visibility = 'visible';
        cloudWrapper.style.opacity = '1';
        cloudWrapper.style.display = 'block';
        cloudWrapper.style.left = '0px';
        cloudWrapper.style.top = '0px';
        cloudWrapper.style.width = '512px';
        cloudWrapper.style.height = '512px';
        
        // Create cloud base container
        const cloudBase = document.createElement('div');
        cloudBase.className = 'cloud-base';
        cloudBase.style.position = 'absolute';
        cloudBase.style.left = '50%';
        cloudBase.style.top = '50%';
        cloudBase.style.width = '20px';
        cloudBase.style.height = '20px';
        cloudBase.style.marginLeft = '-10px';
        cloudBase.style.marginTop = '-10px';
        
        // Store cloud layers for animation
        this.cloudLayers = [];
        
        // Create multiple cloud layers
        const layerCount = config.layerCount || 5;
        for (let j = 0; j < layerCount + Math.round(Math.random() * 10); j++) {
            const cloudLayer = document.createElement('div');
            cloudLayer.className = 'cloud-layer';
            cloudLayer.style.position = 'absolute';
            cloudLayer.style.left = '50%';
            cloudLayer.style.top = '50%';
            cloudLayer.style.width = '256px';
            cloudLayer.style.height = '256px';
            cloudLayer.style.marginLeft = '-128px';
            cloudLayer.style.marginTop = '-128px';
            cloudLayer.style.opacity = '0.3'; // Dimmer (reduced from 0.8)
            cloudLayer.style.transition = 'opacity 0.5s ease-out';
            
            // Random position and rotation
            const x = 256 - (Math.random() * 512);
            const y = 256 - (Math.random() * 512);
            const z = 100 - (Math.random() * 200);
            const a = Math.random() * 360;
            const s = 0.25 + Math.random();
            
            // Store animation data
            cloudLayer.data = {
                x: x * 0.2,
                y: y * 0.2,
                z: z,
                a: a,
                s: s,
                speed: 0.1 * Math.random()
            };
            
            const t = `translateX(${cloudLayer.data.x}px) translateY(${cloudLayer.data.y}px) translateZ(${cloudLayer.data.z}px) rotateZ(${a}deg) scale(${s})`;
            cloudLayer.style.transform = t;
            
            cloudBase.appendChild(cloudLayer);
            this.cloudLayers.push(cloudLayer);
        }
        
        cloudWrapper.appendChild(cloudBase);
        document.body.appendChild(cloudWrapper);
        
        // Store size and wrapper for later calculations
        this.cloudSize = config.size || 1.0;
        this.cloudWrapper = cloudWrapper;
        
        // Initial position update
        this.updateCloudPosition();
        
        return cloudWrapper;
    }
    
    createSVG(config) {
        // Create HTML element for SVG animation
        const svgWrapper = document.createElement('div');
        svgWrapper.className = 'svg-wrapper';
        svgWrapper.style.position = 'fixed';
        svgWrapper.style.pointerEvents = 'none';
        svgWrapper.style.zIndex = '10';
        svgWrapper.style.transformOrigin = 'center center';
        svgWrapper.style.width = '512px';
        svgWrapper.style.height = '640px'; // Taller to accommodate reflection
        svgWrapper.style.marginLeft = '-256px';
        svgWrapper.style.marginTop = '-320px'; // Center on the taller height
        svgWrapper.style.visibility = 'visible';
        svgWrapper.style.opacity = '1';
        svgWrapper.style.display = 'block';
        
        // Create SVG element with the provided content
        const svgContent = config.svgContent || '';
        svgWrapper.innerHTML = svgContent;
        
        document.body.appendChild(svgWrapper);
        
        // Store size and wrapper for later calculations
        this.svgSize = config.size || 1.0;
        this.svgWrapper = svgWrapper;
        
        // Don't update position immediately - wait for mesh to be created in addToGroup
        // Position will be updated in the animation loop
        
        return svgWrapper;
    }
    
    createCrystal(config) {
        // Create canvas element for crystal animation (will be used as texture)
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 512; // Higher resolution for better quality
        
        // Store size for later calculations
        this.crystalSize = config.size || 0.8;
        this.crystalCanvas = canvas;
        
        // Initialize crystal animation
        this.initCrystalAnimation();
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        // Update texture every frame
        texture.userData.update = () => {
            texture.needsUpdate = true;
        };
        this.crystalTexture = texture;
        
        // Create sprite material
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.01,
            depthWrite: true, // Write to depth buffer so it can be behind planes
            depthTest: true, // Test depth so planes can render in front
        });
        
        // Create sprite
        const sprite = new THREE.Sprite(spriteMaterial);
        const size = this.crystalSize;
        sprite.scale.set(size, size, 1);
        
        // Store sprite as mesh so it can be added to group
        this.mesh = sprite;
        this.crystalSprite = sprite;
        
        return sprite;
    }
    
    createParticleSphere(config) {
        // Create canvas element for particle sphere animation (will be used as texture)
        const canvas = document.createElement('canvas');
        const s = canvas.width = canvas.height = 512; // Higher resolution for better quality
        
        // Store size for later calculations
        this.particleSphereSize = config.size || 0.8;
        this.particleSphereCanvas = canvas;
        
        // Initialize particle sphere animation
        this.initParticleSphereAnimation(s);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        // Update texture every frame
        texture.userData.update = () => {
            texture.needsUpdate = true;
        };
        this.particleSphereTexture = texture;
        
        // Create sprite material
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.01,
            depthWrite: true,
            depthTest: true,
        });
        
        // Create sprite
        const sprite = new THREE.Sprite(spriteMaterial);
        const size = this.particleSphereSize;
        sprite.scale.set(size, size, 1);
        
        // Store sprite as mesh so it can be added to group
        this.mesh = sprite;
        this.particleSphereSprite = sprite;
        
        return sprite;
    }
    
    createShaderSphere(config) {
        // Extract shader code from webpack bundle
        const fragmentShader = `
#define GLSLIFY 1
varying vec2 vUv;
varying float noise;
uniform float time;

void main() {
  // black and white
  vec3 blackAndWhite = vec3(1. - 2.0 * noise);
  
  //
  float r = 1. - 2.0 * noise;
  float g = 0.0;
  float b = 1. - 1.0 * noise;
  vec3 foo = vec3(r, g, b);

  gl_FragColor = vec4( foo, 1.0 );
}
        `;
        
        const vertexShader = `
#define GLSLIFY 1
uniform float time;

varying vec2 vUv;
varying float noise;

vec3 mod289_1_0(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289_1_0(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute_1_1(vec4 x) {
  return mod289_1_0(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt_1_2(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade_1_3(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
float cnoise_1_4(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod289_1_0(Pi0);
  Pi1 = mod289_1_0(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute_1_1(permute_1_1(ix) + iy);
  vec4 ixy0 = permute_1_1(ixy + iz0);
  vec4 ixy1 = permute_1_1(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt_1_2(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt_1_2(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade_1_3(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

// Classic Perlin noise, periodic variant
float pnoise_1_5(vec3 P, vec3 rep) {
  vec3 Pi0 = mod(floor(P), rep);
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
  Pi0 = mod289_1_0(Pi0);
  Pi1 = mod289_1_0(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute_1_1(permute_1_1(ix) + iy);
  vec4 ixy0 = permute_1_1(ixy + iz0);
  vec4 ixy1 = permute_1_1(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt_1_2(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt_1_2(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade_1_3(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

float fac = 10.0;

float turbulence( vec3 p ) {
  float t = -.5;
  for (float f = 1.0 ; f <= 1.0 ; f++ ) {
    float power = pow( 2.0, f );
    t += abs(pnoise_1_5( vec3( power * p ), vec3( fac, fac, fac ) ) / power );
  }
  return t;
}

void main() {
  vUv = uv;

  // get a turbulent 3d noise using the normal, normal to high freq
  noise = 10.0 *  -.10 * turbulence( .5 * normal + time );
  // get a 3d noise using the position, low frequency
  float b = 5.0 * pnoise_1_5( 0.05 * position, vec3( 100.0 ) );
  // compose both noises - moderate displacement for visibility
  float displacement = (- 0.5 * noise) + (b * 0.1);

  // move the position along the normal and transform it
  vec3 newPosition = position + normal * displacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
}
        `;
        
        // Create geometry - IcosahedronGeometry with radius 20, detail 4 (scaled down)
        const radius = config.radius || 0.3;
        const detail = config.detail || 4;
        const geometry = new THREE.IcosahedronGeometry(radius, detail);
        
        // Create shader material with time uniform
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                resolution: { value: new THREE.Vector2() }
            },
            fragmentShader: fragmentShader,
            vertexShader: vertexShader
        });
        
        // Store material reference for updating time
        this.shaderMaterial = material;
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.set(0, Math.PI, 0);
        
        return mesh;
    }
    
    createConeCluster(config) {
        // Create a group to hold all cones
        const group = new THREE.Group();
        
        // Cone parameters
        const coneRadius = config.coneRadius || 0.25;
        const coneHeight = config.coneHeight || 1.0;
        const distance = config.distance || 0.7; // Distance from center
        
        // Material for cones - use mirror material if specified
        const useMirror = config.metalness !== undefined && config.metalness >= 1.0;
        const material = useMirror
            ? new THREE.MeshPhysicalMaterial({
                color: config.color || 0xffffff,
                metalness: config.metalness !== undefined ? config.metalness : 1.0,
                roughness: config.roughness !== undefined ? config.roughness : 0.0,
                transmission: config.transmission !== undefined ? config.transmission : 0.0,
                ior: config.ior !== undefined ? config.ior : 1.5,
                emissiveIntensity: config.emissiveIntensity !== undefined ? config.emissiveIntensity : 0.0,
            })
            : new THREE.MeshStandardMaterial({
                color: config.color || 0x00aaff, // Blue color matching p5.js background
                emissive: config.color || 0x00aaff,
                emissiveIntensity: config.emissiveIntensity !== undefined ? config.emissiveIntensity : 0.6,
            });
        
        // Create 6 cones in cardinal directions
        // Up (Y+)
        const coneUp = new THREE.Mesh(
            new THREE.ConeGeometry(coneRadius, coneHeight, 32),
            material
        );
        coneUp.position.set(0, distance, 0);
        group.add(coneUp);
        
        // Down (Y-)
        const coneDown = new THREE.Mesh(
            new THREE.ConeGeometry(coneRadius, coneHeight, 32),
            material
        );
        coneDown.position.set(0, -distance, 0);
        coneDown.rotation.x = Math.PI; // Flip upside down
        group.add(coneDown);
        
        // Right (X+)
        const coneRight = new THREE.Mesh(
            new THREE.ConeGeometry(coneRadius, coneHeight, 32),
            material
        );
        coneRight.position.set(distance, 0, 0);
        coneRight.rotation.z = Math.PI / 2; // Rotate 90 degrees
        group.add(coneRight);
        
        // Left (X-)
        const coneLeft = new THREE.Mesh(
            new THREE.ConeGeometry(coneRadius, coneHeight, 32),
            material
        );
        coneLeft.position.set(-distance, 0, 0);
        coneLeft.rotation.z = -Math.PI / 2; // Rotate -90 degrees
        group.add(coneLeft);
        
        // Forward (Z+)
        const coneForward = new THREE.Mesh(
            new THREE.ConeGeometry(coneRadius, coneHeight, 32),
            material
        );
        coneForward.position.set(0, 0, distance);
        coneForward.rotation.x = -Math.PI / 2; // Rotate to point forward
        group.add(coneForward);
        
        // Back (Z-)
        const coneBack = new THREE.Mesh(
            new THREE.ConeGeometry(coneRadius, coneHeight, 32),
            material
        );
        coneBack.position.set(0, 0, -distance);
        coneBack.rotation.x = Math.PI / 2; // Rotate to point back
        group.add(coneBack);
        
        // Store rotation speed for animation
        group.userData.rotationSpeed = config.rotationSpeed || 0.01;
        
        return group;
    }
    
    createSymbol(config) {
        // Store size and symbol for later calculations
        this.symbolSize = config.size || 0.5;
        this.symbolText = config.symbol || '';
        
        // Check if this is an astrological symbol - use image texture instead of canvas text
        const isAstrological = (this.name && this.name.startsWith('ASTRO')) || config.imagePath;
        
        let texture;
        
        if (isAstrological && config.imagePath) {
            // Load image texture for astrological symbols or Jupiter
            const loader = new THREE.TextureLoader();
            texture = loader.load(config.imagePath, 
                // onLoad callback
                (loadedTexture) => {
                    loadedTexture.needsUpdate = true;
                    // For Jupiter, add shadow overlay effects and set up animation
                    if (config.name === 'jupiter' && config.textureAnimation) {
                        this.setupJupiterAnimation(loadedTexture, config);
                    }
                },
                // onProgress callback (optional)
                undefined,
                // onError callback
                (error) => {
                    console.error('Error loading image:', config.imagePath, error);
                }
            );
            texture.transparent = true;
            
            // Store animation properties for Jupiter
            if (config.name === 'jupiter' && config.textureAnimation) {
                this.textureAnimationSpeed = config.textureAnimationSpeed || 0.00033;
                this.textureAnimationOffset = 0;
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
            }
        } else {
            // Create canvas element for text symbol (will be used as texture)
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 256; // Higher resolution for better quality
            
            this.symbolCanvas = canvas;
            
            // Initialize symbol rendering
            this.initSymbolRendering();
            
            // Create texture from canvas
            texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            this.symbolTexture = texture;
        }
        
        // For Jupiter, create overlay texture with shadow effects and store texture reference
        let finalTexture = texture;
        if (config.name === 'jupiter' && config.textureAnimation) {
            // Store texture reference for animation BEFORE creating overlay
            this.jupiterTexture = texture;
            this.textureAnimationSpeed = config.textureAnimationSpeed || 0.00033;
            this.textureAnimationOffset = 0;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            finalTexture = this.createJupiterOverlay(texture);
        }
        
        // Create sprite material
        const spriteMaterial = new THREE.SpriteMaterial({
            map: finalTexture,
            transparent: true,
            alphaTest: 0.01,
            depthWrite: true,
            depthTest: true,
        });
        
        // Create sprite
        const sprite = new THREE.Sprite(spriteMaterial);
        const size = this.symbolSize;
        sprite.scale.set(size, size, 1);
        
        // Set renderOrder for astrological symbols so they render after planes but respect depth
        // This allows planes to occlude them when they pass behind
        if (isAstrological || config.name === 'jupiter') {
            sprite.renderOrder = 1; // Render after planes (which have renderOrder 0 or default)
        }
        
        // Store sprite as mesh so it can be added to group
        this.mesh = sprite;
        this.symbolSprite = sprite;
        
        return sprite;
    }
    
    initSymbolRendering() {
        const canvas = this.symbolCanvas;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up text rendering
        const fontSize = 180; // Large font size for symbol
        
        // Check if this is an astrological symbol by name or Unicode range
        // Use a monospace font that doesn't have emoji glyphs to force text rendering
        const isAstrological = (this.name && this.name.startsWith('ASTRO')) || /[\u2648-\u2653]/.test(this.symbolText);
        
        // For astrological symbols, use monospace font which typically doesn't have emoji support
        // This forces the browser to render the Unicode characters as text symbols, not emojis
        const fontFamily = isAstrological 
            ? '"Courier New", Courier, "Lucida Console", Monaco, monospace' // Monospace fonts don't have emoji glyphs
            : '"Times New Roman", "Times", serif';
        
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = '#ffffff'; // White symbol
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw symbol
        ctx.fillText(this.symbolText, canvas.width / 2, canvas.height / 2);
        
        // Update texture
        if (this.symbolTexture) {
            this.symbolTexture.needsUpdate = true;
        }
    }
    
    createJupiterOverlay(baseTexture) {
        // Create a canvas overlay with shadow effects like the CSS :before pseudo-element
        // This simulates: box-shadow: inset 20px 0 20px black and linear-gradient(-90deg, transparent 30%, black)
        const canvas = document.createElement('canvas');
        const size = 512; // Match texture size
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Draw the base Jupiter texture first
        // We'll composite this with the overlay
        // For now, create the overlay gradient/shadow effects
        const gradient = ctx.createLinearGradient(0, 0, size, 0);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent on left
        gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0)'); // Still transparent at 30%
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)'); // Dark shadow on right
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // Add inset shadow effect on left edge (simulating box-shadow: inset 20px 0 20px black)
        const leftShadowGradient = ctx.createRadialGradient(0, size/2, 0, 0, size/2, size * 0.15);
        leftShadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        leftShadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = leftShadowGradient;
        ctx.fillRect(0, 0, size * 0.2, size);
        
        // Create overlay texture
        const overlayTexture = new THREE.CanvasTexture(canvas);
        overlayTexture.needsUpdate = true;
        
        // Store base texture for animation
        this.jupiterBaseTexture = baseTexture;
        this.jupiterOverlayTexture = overlayTexture;
        
        // Return base texture (overlay will be applied via shader or compositing)
        // For now, we'll animate the base texture and the overlay will be static
        return baseTexture;
    }
    
    setupJupiterAnimation(texture, config) {
        // Store texture reference for animation
        this.jupiterTexture = texture;
        this.textureAnimationSpeed = config.textureAnimationSpeed || 0.00033;
        this.textureAnimationOffset = 0;
    }
    
    loadGLTF(config) {
        // Load GLTF/GLB model asynchronously
        const loader = new GLTFLoader();
        const modelPath = config.modelPath || config.imagePath; // Support both property names
        
        console.log(`Loading GLTF model: ${this.name} from ${modelPath}`);
        
        loader.load(
            modelPath,
            // onLoad callback
            (gltf) => {
                console.log(`GLTF model loaded: ${this.name}`, gltf);
                // Get the scene from the GLTF (contains the model)
                const model = gltf.scene;
                
                // Calculate bounding box to determine appropriate scale
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const maxDimension = Math.max(size.x, size.y, size.z);
                console.log(`Model bounding box size:`, size, `Max dimension: ${maxDimension}`);
                
                // Calculate appropriate scale to make model visible (target size around 0.5-1.0 units)
                let scale = config.scale;
                if (!scale) {
                    // Auto-scale: make the largest dimension approximately 0.5 units
                    scale = 0.5 / maxDimension;
                    console.log(`Auto-calculated scale: ${scale}`);
                }
                model.scale.set(scale, scale, scale);
                const finalSize = size.clone().multiplyScalar(scale);
                console.log(`Applied scale: ${scale}, final size:`, finalSize, `position:`, this.position);
                
                // Set position
                model.position.copy(this.position);
                
                // Apply rotation if specified
                if (config.rotation) {
                    model.rotation.set(...config.rotation);
                }
                
                // Store the model as mesh
                this.mesh = model;
                
                // Make sure model is visible
                model.visible = true;
                
                // Traverse and ensure all children are visible and properly configured
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.visible = true;
                        child.frustumCulled = false; // Disable frustum culling to ensure visibility
                        // Ensure materials are visible and have proper settings
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => {
                                    if (mat) {
                                        mat.visible = true;
                                        mat.needsUpdate = true;
                                    }
                                });
                            } else {
                                child.material.visible = true;
                                child.material.needsUpdate = true;
                            }
                        }
                        console.log(`Mesh found: ${child.name || 'unnamed'}, visible: ${child.visible}, position:`, child.position);
                    }
                });
                
                // Add to planes group if it exists (set in addToGroup)
                if (this.planesGroup) {
                    this.planesGroup.add(model);
                    console.log(`Added ${this.name} to planesGroup at position:`, model.position);
                } else if (this.sceneManager && this.sceneManager.planesGroup) {
                    // Fallback: use scene manager's group reference
                    this.planesGroup = this.sceneManager.planesGroup;
                    this.planesGroup.add(model);
                    console.log(`Added ${this.name} to sceneManager.planesGroup at position:`, model.position);
                } else {
                    // Fallback: add directly to scene
                    this.scene.add(model);
                    console.log(`Added ${this.name} directly to scene at position:`, model.position);
                }
                
                // Update line position if line exists
                if (this.line) {
                    this.updateLine();
                }
                
                // Store GLTF reference for potential animation
                this.gltf = gltf;
                
                // Trigger environment map regeneration if needed
                if (this.sceneManager && this.sceneManager.onEnvironmentUpdate) {
                    this.sceneManager.onEnvironmentUpdate();
                }
                
                console.log(`${this.name} fully loaded and added to scene. Scale: ${scale}, Final size:`, size.multiplyScalar(scale));
            },
            // onProgress callback (optional)
            (progress) => {
                if (progress.lengthComputable) {
                    const percentComplete = (progress.loaded / progress.total) * 100;
                    console.log(`Loading ${this.name}: ${percentComplete.toFixed(1)}%`);
                }
            },
            // onError callback
            (error) => {
                console.error(`Error loading GLTF model ${this.name}:`, error);
            }
        );
    }
    
    createCyclingSymbol(config) {
        // Create canvas element for cycling symbol
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 256;
        
        // Store size and phase count for cycling
        this.symbolSize = config.size || 0.5;
        this.symbolCanvas = canvas;
        this.phaseCount = config.phaseCount || 8; // Number of moon phases
        this.currentPhaseIndex = 0;
        this.cycleSpeed = config.cycleSpeed || 0.02; // Speed of cycling
        this.cycleTime = 0;
        
        // Initialize symbol rendering
        this.drawMoonPhase(0);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        this.symbolTexture = texture;
        
        // Create sprite material
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.01,
            depthWrite: true,
            depthTest: true,
        });
        
        // Create sprite
        const sprite = new THREE.Sprite(spriteMaterial);
        const size = this.symbolSize;
        sprite.scale.set(size, size, 1);
        
        // Store sprite as mesh
        this.mesh = sprite;
        this.symbolSprite = sprite;
        
        // Mark as cycling symbol for update
        sprite.userData.isCyclingSymbol = true;
        
        return sprite;
    }
    
    drawMoonPhase(phaseIndex) {
        const canvas = this.symbolCanvas;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 80;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set drawing style
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        
        // Normalize phase index to 0-7
        const phase = phaseIndex % 8;
        
        // Draw moon phase based on index
        switch(phase) {
            case 0: // Full Moon
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 1: // Waxing Crescent
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(centerX - radius * 0.6, centerY, radius * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                break;
            case 2: // First Quarter
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, -Math.PI / 2, Math.PI / 2);
                ctx.lineTo(centerX, centerY + radius);
                ctx.lineTo(centerX, centerY - radius);
                ctx.closePath();
                ctx.fill();
                break;
            case 3: // Waxing Gibbous
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(centerX - radius * 0.3, centerY, radius * 0.9, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                break;
            case 4: // New Moon (dark circle)
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 5: // Waning Gibbous
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(centerX + radius * 0.3, centerY, radius * 0.9, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                break;
            case 6: // Last Quarter
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, Math.PI / 2, -Math.PI / 2);
                ctx.lineTo(centerX, centerY - radius);
                ctx.lineTo(centerX, centerY + radius);
                ctx.closePath();
                ctx.fill();
                break;
            case 7: // Waning Crescent
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(centerX + radius * 0.6, centerY, radius * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                break;
        }
        
        // Update texture
        if (this.symbolTexture) {
            this.symbolTexture.needsUpdate = true;
        }
    }
    
    createGalaxy(config) {
        // Create a spiral galaxy using points
        // Use more particles for Large Magellanic Cloud and Andromeda
        let starCount;
        if (config.name === 'Large Magellanic Cloud') {
            starCount = Math.floor(Math.random() * 200) + 150; // 150-349 particles for Large Magellanic Cloud
        } else if (config.name === 'ANDROMEDA') {
            starCount = Math.floor(Math.random() * 100) + 200; // 200-299 particles for Andromeda
        } else {
            starCount = Math.floor(Math.random() * 100); // Random number of stars like original
        }
        const galaxyGeometry = new THREE.BufferGeometry();
        const galaxyPositions = new Float32Array(starCount * 3);
        const galaxyColors = new Float32Array(starCount * 3);
        
        // Store initial positions and angles for rotation
        const initialAngles = [];
        const radii = [];
        const chaosOffsets = []; // Store random chaos offsets for each star
        
        // Random initial rotation angle around Z axis (perpendicular to galaxy plane)
        // If perpendicularAngle is true, add 90 degrees for perpendicular orientation
        let randomRotationZ = Math.random() * Math.PI * 2;
        if (config.perpendicularAngle) {
            randomRotationZ += Math.PI / 2; // Rotate 90 degrees for perpendicular
        }
        
        // Initialize spiral positions - more compact and chaotic
        const maxRadius = config.maxRadius || 1.5; // Maximum radius (configurable, default 1.5)
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            const angle = Math.random() * Math.PI * 2; // Random starting angle
            const radius = (i / starCount) * maxRadius; // Spiral radius increases more gradually
            
            // Add chaos - random offsets to make it look irregular
            const chaosX = (Math.random() - 0.5) * 0.3; // Random X offset
            const chaosY = (Math.random() - 0.5) * 0.1; // Small Y offset for slight thickness
            const chaosZ = (Math.random() - 0.5) * 0.3; // Random Z offset
            
            initialAngles.push(angle);
            radii.push(radius);
            chaosOffsets.push({ x: chaosX, y: chaosY, z: chaosZ });
            
            // Initial position in spiral with chaos
            const baseX = Math.cos(angle) * radius;
            const baseY = Math.sin(angle) * radius;
            
            // Apply random rotation around Z axis (perpendicular to galaxy plane)
            const rotatedX = baseX * Math.cos(randomRotationZ) - baseY * Math.sin(randomRotationZ);
            const rotatedY = baseX * Math.sin(randomRotationZ) + baseY * Math.cos(randomRotationZ);
            
            galaxyPositions[i3] = rotatedX + chaosX;
            galaxyPositions[i3 + 1] = rotatedY + chaosY; // Galaxy plane is XY, Z is depth
            galaxyPositions[i3 + 2] = chaosZ; // Keep Z near 0 for flat galaxy
            
            // Color: depends on galaxy type
            if (config.name === 'ANDROMEDA' || config.name === 'Large Magellanic Cloud') {
                // Pale blue stars for Andromeda and Large Magellanic Cloud
                const blueIntensity = 0.6 + Math.random() * 0.3; // Vary brightness
                galaxyColors[i3] = blueIntensity * 0.7; // R (pale)
                galaxyColors[i3 + 1] = blueIntensity * 0.85; // G (pale)
                galaxyColors[i3 + 2] = blueIntensity; // B (more blue)
            } else {
                // Yellow and white stars for Milky Way
                const colorMix = Math.random(); // Random mix between yellow and white
                if (colorMix < 0.7) {
                    // Yellow stars (70% chance)
                    const yellowIntensity = 0.8 + Math.random() * 0.2; // Vary brightness
                    galaxyColors[i3] = yellowIntensity; // R
                    galaxyColors[i3 + 1] = yellowIntensity * 0.9; // G (slightly less)
                    galaxyColors[i3 + 2] = yellowIntensity * 0.3; // B (very little blue)
                } else {
                    // White stars (30% chance)
                    const whiteIntensity = 0.9 + Math.random() * 0.1; // Vary brightness
                    galaxyColors[i3] = whiteIntensity; // R
                    galaxyColors[i3 + 1] = whiteIntensity; // G
                    galaxyColors[i3 + 2] = whiteIntensity; // B
                }
            }
        }
        
        galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(galaxyPositions, 3));
        galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(galaxyColors, 3));
        
        // Store animation data
        galaxyGeometry.userData.starCount = starCount;
        galaxyGeometry.userData.initialAngles = initialAngles;
        galaxyGeometry.userData.radii = radii;
        galaxyGeometry.userData.chaosOffsets = chaosOffsets;
        galaxyGeometry.userData.initialRotationZ = randomRotationZ; // Store initial rotation around Z axis
        galaxyGeometry.userData.rotationAngle = 0;
        galaxyGeometry.userData.rotationSpeed = config.rotationSpeed !== undefined ? config.rotationSpeed : 0.01; // Faster rotation speed
        galaxyGeometry.userData.isAndromeda = config.name === 'ANDROMEDA' || config.name === 'Large Magellanic Cloud'; // Track if this is Andromeda or Large Magellanic Cloud for blinking
        galaxyGeometry.userData.isSirius = config.name === 'Large Magellanic Cloud'; // Track if this is Large Magellanic Cloud for more twinkling
        galaxyGeometry.userData.blinkTime = 0; // Blinking animation timer
        galaxyGeometry.userData.twinkleSpeed = config.twinkleSpeed || 0.01; // Twinkling speed (faster for Large Magellanic Cloud)
        
        // Galaxy material - use colors from attributes
        const galaxyMaterial = new THREE.PointsMaterial({
            size: config.size || 0.1,
            sizeAttenuation: true,
            vertexColors: true, // Use colors from geometry
            transparent: true,
            opacity: 0.8
        });
        
        const galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
        
        // Disable frustum culling so galaxy is always visible regardless of camera position
        galaxy.frustumCulled = false;
        
        // Ensure bounding sphere is computed for proper rendering
        galaxyGeometry.computeBoundingSphere();
        
        // Also store on mesh for easier access (after galaxy is created)
        galaxy.userData.isGalaxy = true;
        galaxy.userData.rotationSpeed = galaxyGeometry.userData.rotationSpeed;
        
        return galaxy;
    }
    
    createGlowingRegion(config) {
        // Create a glowing region using particles with emissive colors
        const particleCount = config.particleCount || 200;
        const regionGeometry = new THREE.BufferGeometry();
        const regionPositions = new Float32Array(particleCount * 3);
        const regionColors = new Float32Array(particleCount * 3);
        const regionSizes = new Float32Array(particleCount);
        
        // Region size
        const regionSize = config.size || 2.0;
        const glowColor = config.color || 0x88aaff; // Default blue glow
        
        // Extract RGB from color
        const r = ((glowColor >> 16) & 0xFF) / 255;
        const g = ((glowColor >> 8) & 0xFF) / 255;
        const b = (glowColor & 0xFF) / 255;
        
        // Randomly distribute particles in a sphere
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Random position in sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = Math.random() * regionSize;
            
            regionPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            regionPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            regionPositions[i3 + 2] = radius * Math.cos(phi);
            
            // Vary color intensity for glow effect
            const intensity = 0.5 + Math.random() * 0.5;
            regionColors[i3] = r * intensity;
            regionColors[i3 + 1] = g * intensity;
            regionColors[i3 + 2] = b * intensity;
            
            // Vary particle sizes
            regionSizes[i] = 0.1 + Math.random() * 0.2;
        }
        
        regionGeometry.setAttribute('position', new THREE.BufferAttribute(regionPositions, 3));
        regionGeometry.setAttribute('color', new THREE.BufferAttribute(regionColors, 3));
        regionGeometry.setAttribute('size', new THREE.BufferAttribute(regionSizes, 1));
        
        // Glowing material with emissive properties
        const regionMaterial = new THREE.PointsMaterial({
            size: config.particleSize || 0.15,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: config.opacity || 0.7,
            blending: THREE.AdditiveBlending, // Additive blending for glow effect
            depthWrite: false
        });
        
        const region = new THREE.Points(regionGeometry, regionMaterial);
        
        // Disable frustum culling so glowing region is always visible regardless of camera position
        region.frustumCulled = false;
        
        // Ensure bounding sphere is computed for proper rendering
        regionGeometry.computeBoundingSphere();
        
        // Store for potential animation
        region.userData.isGlowingRegion = true;
        region.userData.particleCount = particleCount;
        region.userData.regionSize = regionSize;
        
        return region;
    }
    
    createStarSphere(config) {
        // Create a star sphere with shader-based colored stars
        // Extracted from createSimulation to be a standalone object
        const nStars = config.starCount || 5000;
        const radius = config.radius || 100;
        const points = new Float32Array(nStars * 3);
        const rand = new Float32Array(nStars);
        
        const posTmp = new THREE.Vector3();
        const spherical = new THREE.Spherical(radius, Math.PI * 0.5, 0);
        
        for (let i = 0; i < nStars; i++) {
            const theta = Math.random() * Math.PI * 2.0;
            const phi = Math.acos(Math.random() * 2.0 - 1.0);
            
            spherical.set(radius, phi, theta);
            posTmp.setFromSpherical(spherical);
            posTmp.toArray(points, i * 3);
            
            rand[i] = Math.random();
        }
        
        const starsGeo = new THREE.BufferGeometry();
        starsGeo.setAttribute('position', new THREE.BufferAttribute(points, 3));
        starsGeo.setAttribute('random', new THREE.BufferAttribute(rand, 1));
        
        const starsMat = new THREE.ShaderMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            vertexShader: `
                attribute float random;
                varying vec3 vPos;
                
                void main() {
                    vPos = position;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = 10.0 + random * 10.0;
                }
            `,
            fragmentShader: `
                varying vec3 vPos;
                
                float rand(vec2 co) {
                    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                void main() {
                    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
                    vec2 centre = uv - 0.5;
                    
                    vec3 rgb = vec3(
                        rand(vPos.xy),
                        rand(vPos.xz),
                        rand(vPos.yz)
                    );
                    
                    vec3 col = vec3(0.5) + rgb * 0.5;
                    float a = smoothstep(0.8, 1.0, 1.0 - length(centre) * 2.0);
                    
                    gl_FragColor = vec4(col, a);
                }
            `
        });
        
        const stars = new THREE.Points(starsGeo, starsMat);
        stars.frustumCulled = false;
        starsGeo.computeBoundingSphere();
        
        return stars;
    }
    
    createSimulation(config) {
        // Create a space scene simulation with planet and rings (stars removed - now separate object)
        // Adapted from the provided shader code
        const sky = new THREE.Group();
        
        // Create planet with shader
        const planetGeo = new THREE.SphereGeometry(1, 64, 64);
        const planetMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 }
            },
            transparent: true,
            vertexShader: `
                varying vec3 vPos;
                
                void main() {
                    vPos = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vPos;
                uniform float uTime;
                
                // Simplex 3D Noise by Ian McEwan, Ashima Arts
                vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
                vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
                
                float snoise(vec3 v){ 
                    const vec2  C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                    
                    vec3 i  = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);
                    
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g.xyz, l.zxy);
                    vec3 i2 = max(g.xyz, l.zxy);
                    
                    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
                    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
                    vec3 x3 = x0 - 1. + 3.0 * C.xxx;
                    
                    i = mod(i, 289.0);
                    vec4 p = permute(permute(permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                    
                    float n_ = 1.0/7.0;
                    vec3  ns = n_ * D.wyz - D.xzx;
                    
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);
                    
                    vec4 x = x_ * ns.x + ns.yyyy;
                    vec4 y = y_ * ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    
                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                    
                    vec3 p0 = vec3(a0.xy, h.x);
                    vec3 p1 = vec3(a0.zw, h.y);
                    vec3 p2 = vec3(a1.xy, h.z);
                    vec3 p3 = vec3(a1.zw, h.w);
                    
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
                    
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                }
                
                vec3 hex2rgb(int hex) {
                    return vec3(
                        float((hex >> 16) & 0xFF) / 255.0,
                        float((hex >> 8) & 0xFF) / 255.0,
                        float(hex & 0xFF) / 255.0
                    );
                }
                
                mat2 rotate2d(float _angle) {
                    return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
                }
                
                #define PI 3.1415926
                #define HP PI * 0.5
                
                void main() {
                    float len = length(vPos);
                    vec3 position = vPos;
                    position.xz *= rotate2d(uTime * 0.0001);
                    vec3 rotated = position;
                    position.y = acos(position.y);
                    
                    vec3 samplePos = position * vec3(1.0, 50.0, 1.0);
                    float noise = snoise(samplePos);
                    vec3 color1 = hex2rgb(0xfcdf9b);
                    vec3 color2 = hex2rgb(0xd7ba92);
                    vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
                    
                    samplePos = position * vec3(0.2, 2.0, 0.2);
                    noise = snoise(samplePos);
                    color1 = hex2rgb(0xa28973);
                    color2 = hex2rgb(0xd3a875);
                    vec3 secondary = mix(color1, color2, noise * 0.5 + 0.5);
                    float colorMix = snoise(position * vec3(0.01, 4.0, 0.01));
                    color = mix(color, secondary, colorMix * 0.5 + 0.5);
                    
                    vec3 stormColor1 = hex2rgb(0xbb915f);
                    vec3 stormColor2 = hex2rgb(0xcca270);
                    
                    float stormPhi = PI * 0.36;
                    float stormTheta = PI * -0.125;
                    float stormPR = sin(stormPhi) * len;
                    vec3 stormPos = vec3(
                        stormPR * sin(stormTheta),
                        cos(stormPhi) * len,
                        stormPR * cos(stormTheta)
                    );
                    
                    vec3 stormProd = stormPos * rotated;
                    float stormDist = len * acos((stormProd.x + stormProd.y + stormProd.z) / pow(len, 2.0));
                    float storm = smoothstep(0.05, 0.15, stormDist);
                    
                    vec3 stormRot = position * 4.0;
                    stormRot.xy *= rotate2d(stormDist * 0.1 * PI * 4.0);
                    float stormNoise = snoise(stormRot);
                    vec3 stormColor = mix(stormColor1, stormColor2, stormNoise * 0.5 + 0.5);
                    
                    color = mix(stormColor, color, storm);
                    
                    samplePos = position * vec3(1.0, 7.0, 2.0);
                    noise = snoise(samplePos);
                    color = mix(color, vec3(1.0) * noise, smoothstep(0.5, 1.0, noise) * 0.7);
                    
                    vec2 polePos = vec2(0.0, -0.5);
                    vec2 sPos = vec2(position.y, length(position.xz));
                    float poleDist = 1.0 - smoothstep(0.5, 1.0, length(sPos - polePos));
                    color = mix(color, vec3(0.95, 0.98, 1.0), poleDist * 0.95);
                    
                    vec3 shadowA = vec3(PI * -0.2, PI * 0.2, PI * 0.2);
                    float shadowTheta = atan(shadowA.x, shadowA.z);
                    float shadowPhi = acos(clamp(shadowA.y / len, -1.0, 1.0));
                    
                    float sinPhiRadius = sin(shadowPhi) * len;
                    vec3 shadowPos = vec3(
                        sinPhiRadius * sin(shadowTheta),
                        cos(shadowPhi) * len,
                        sinPhiRadius * cos(shadowTheta)
                    );
                    
                    vec3 prod = shadowPos * vPos;
                    float dist = len * acos((prod.x + prod.y + prod.z) / pow(len, 2.0));
                    color = mix(color, color * 0.1, smoothstep(HP - 0.6, HP - 0.2, dist));
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });
        
        const planet = new THREE.Mesh(planetGeo, planetMat);
        sky.add(planet);
        
        // Create rings
        const ringsGeo = new THREE.PlaneGeometry(1, 1);
        const ringsMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 }
            },
            transparent: true,
            side: THREE.DoubleSide,
            vertexShader: `
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform float uTime;
                
                float rand(vec2 co) {
                    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                
                float snoise(vec2 v){
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy));
                    vec2 x0 = v - i + dot(i, C.xx);
                    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod(i, 289.0);
                    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                    m = m*m;
                    m = m*m;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }
                
                #define PI 3.1415926
                
                vec3 hex2rgb(int hex) {
                    return vec3(
                        float((hex >> 16) & 0xFF) / 255.0,
                        float((hex >> 8) & 0xFF) / 255.0,
                        float(hex & 0xFF) / 255.0
                    );
                }
                
                void main() {
                    vec2 uv = vUv - 0.5;
                    float len = length(uv * 2.0);
                    float color = mix(0.7, 0.8, snoise(vec2(len * 400.0, 0.7) * 0.5 + 0.5));
                    
                    float len2 = length(uv * 50.0);
                    float bk = smoothstep(-0.775, -0.65, snoise(vec2(len2, 2.65)));
                    
                    float alpha = smoothstep(0.9, 0.9125, sin(len * 3.1415926));
                    alpha *= step(0.3, len) * smoothstep(0.25, 0.7, len);
                    alpha *= bk;
                    
                    float uvA = atan(uv.y, uv.x);
                    float uvL = length(uv);
                    
                    float shadowA = PI * -0.25;
                    vec2 shadowPos = vec2(cos(shadowA) * uvL, sin(shadowA) * uvL);
                    
                    color *= clamp(smoothstep(0.125, 0.13, distance(uv, shadowPos)), 0.1, 1.0);
                    
                    vec3 color1 = hex2rgb(0xfcdfb9);
                    vec3 color2 = hex2rgb(0xf7faf2);
                    
                    vec3 final = mix(color1, color2, color) * color * 1.5;
                    
                    gl_FragColor = vec4(final, alpha);
                }
            `
        });
        
        const rings = new THREE.Mesh(ringsGeo, ringsMat);
        rings.scale.setScalar(8);
        rings.rotation.x = Math.PI * 0.5;
        sky.add(rings);
        
        // Store materials for animation updates
        sky.userData.planetMat = planetMat;
        sky.userData.ringsMat = ringsMat;
        sky.userData.isSimulation = true;
        
        // Scale the entire simulation
        const scale = config.size || 0.3;
        sky.scale.setScalar(scale);
        
        return sky;
    }
    
    createSupernova(config) {
        // Create a supernova visualization based on the provided code
        const supernovaGroup = new THREE.Group();
        
        // Noise functions for shaders
        const noiseFunctions = `
            vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
            vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
            vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
            vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
            float snoise(vec3 v){
                const vec2 C=vec2(1.0/6.0,1.0/3.0);
                const vec4 D=vec4(0.0,0.5,1.0,2.0);
                vec3 i=floor(v+dot(v,C.yyy));
                vec3 x0=v-i+dot(i,C.xxx);
                vec3 g=step(x0.yzx,x0.xyz);
                vec3 l=1.0-g;
                vec3 i1=min(g.xyz,l.zxy);
                vec3 i2=max(g.xyz,l.zxy);
                vec3 x1=x0-i1+C.xxx;
                vec3 x2=x0-i2+C.yyy;
                vec3 x3=x0-D.yyy;
                i=mod289(i);
                vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
                float n_=0.142857142857;
                vec3 ns=n_*D.wyz-D.xzx;
                vec4 j=p-49.0*floor(p*ns.z*ns.z);
                vec4 x_=floor(j*ns.z);
                vec4 y_=floor(j-7.0*x_);
                vec4 x=x_*ns.x+ns.yyyy;
                vec4 y=y_*ns.x+ns.yyyy;
                vec4 h=1.0-abs(x)-abs(y);
                vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
                vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0;
                vec4 sh=-step(h,vec4(0.0));
                vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
                vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
                vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
                p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
                vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
                m=m*m;
                return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
            }
        `;
        
        // Supernova theme colors
        const supernovaColors = {
            core: new THREE.Color(1.0, 0.9, 0.95),
            shell: new THREE.Color(1.0, 0.1, 0.2),
            diskA: new THREE.Color(1.0, 0.2, 0.4),
            diskB: new THREE.Color(0.9, 0.1, 0.8),
            emberA: new THREE.Color(1.0, 0.95, 0.95),
            emberB: new THREE.Color(1.0, 0.3, 0.3),
            prominence: new THREE.Color(1.0, 0.2, 0.5)
        };
        
        // Core group
        const coreGroup = new THREE.Group();
        
        // Star core
        const starGeometry = new THREE.IcosahedronGeometry(4, 5);
        const starMaterial = new THREE.ShaderMaterial({
            uniforms: { 
                time: { value: 0 }, 
                uCore: { value: supernovaColors.core.clone() } 
            },
            vertexShader: `
                uniform float time;
                varying vec3 vN;
                ${noiseFunctions}
                void main(){
                    vN = normalize(normal);
                    float displacement = snoise(normal * 4.0 + time * 0.8) * 0.45;
                    vec3 newPosition = position + normal * displacement;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time; 
                uniform vec3 uCore; 
                varying vec3 vN;
                ${noiseFunctions}
                void main(){
                    float pulse = pow(0.5 + 0.5*sin(time*2.15), 1.7);
                    float fres = pow(1.0 - abs(dot(vN, vec3(0,0,1))), 3.0);
                    float surfaceNoise = snoise(vN * 8.0 + time * 1.2);
                    vec3 col = uCore * (0.4 + 1.5*fres) * (0.4 + 1.0*pulse) * (1.0 + 0.2 * surfaceNoise);
                    col = clamp(col, 0.0, 0.95);
                    gl_FragColor = vec4(col, 1.0);
                }
            `,
            blending: THREE.AdditiveBlending, 
            depthWrite: false
        });
        coreGroup.add(new THREE.Mesh(starGeometry, starMaterial));
        
        // Shell
        const shellGeometry = new THREE.IcosahedronGeometry(8, 5);
        const shellMaterial = new THREE.ShaderMaterial({
            uniforms: { 
                time: { value: 0 }, 
                uShell: { value: supernovaColors.shell.clone() } 
            },
            vertexShader: `
                uniform float time;
                varying vec3 vN; 
                varying vec2 vUv;
                ${noiseFunctions}
                void main(){ 
                    vN = normalize(normal); 
                    vUv = uv; 
                    float displacement = snoise(position * 2.0 + time * 0.5) * 1.2;
                    vec3 newPosition = position + normal * displacement;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition,1.0); 
                }
            `,
            fragmentShader: `
                uniform float time; 
                uniform vec3 uShell; 
                varying vec3 vN; 
                varying vec2 vUv;
                ${noiseFunctions}
                void main(){
                    float fres = pow(1.0 - abs(dot(vN, vec3(0,0,1))), 0.6);
                    float n = snoise(vec3(vUv*8.0 + vec2(time*0.3, 0.0), time*0.3));
                    float fil = smoothstep(0.55, 0.82, n) * pow(abs(vUv.y*2.0 - 1.0), 14.0);
                    vec3 color = uShell * (0.1 + 2.0*fil + 0.8*fres);
                    float alpha = clamp(0.1 + 0.6*fres + 0.7*fil, 0.0, 1.0);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true, 
            blending: THREE.AdditiveBlending, 
            depthWrite: false
        });
        coreGroup.add(new THREE.Mesh(shellGeometry, shellMaterial));
        
        // Disk particles - reduced count for better performance
        const particleCount = 3000;
        const diskPositions = new Float32Array(particleCount * 3);
        const diskSeeds = new Float32Array(particleCount);
        const diskBands = new Float32Array(particleCount);
        for (let i = 0; i < particleCount; i++) {
            const r = 8 + Math.random()*20;
            const theta = Math.random()*Math.PI*2;
            diskPositions[i*3]     = Math.cos(theta)*r;
            diskPositions[i*3 + 1] = (Math.random() - 0.5) * 4.0;
            diskPositions[i*3 + 2] = Math.sin(theta)*r;
            diskSeeds[i] = Math.random()*1000.0;
            diskBands[i] = (r - 8.0) / 20.0;
        }
        const diskGeom = new THREE.BufferGeometry();
        diskGeom.setAttribute('position', new THREE.BufferAttribute(diskPositions, 3));
        diskGeom.setAttribute('aSeed', new THREE.BufferAttribute(diskSeeds, 1));
        diskGeom.setAttribute('aBand', new THREE.BufferAttribute(diskBands, 1));
        const diskMat = new THREE.ShaderMaterial({
            uniforms: { 
                uColorA: { value: supernovaColors.diskA.clone() }, 
                uColorB: { value: supernovaColors.diskB.clone() }, 
                time: { value: 0 } 
            },
            vertexShader: `
                uniform float time; 
                attribute float aSeed; 
                attribute float aBand;
                varying float vMix; 
                varying float vAlpha;
                vec2 rot(vec2 p, float a){ float c=cos(a), s=sin(a); return vec2(c*p.x - s*p.y, s*p.x + c*p.y); }
                void main(){
                    vec3 p = position;
                    float r = length(p.xz);
                    float speed = (14.5 / max(16.0, r*r));
                    float angle = -time * speed;
                    vec2 xz = rot(p.xz, angle);
                    float breathe = 1.0 + 0.011*sin(time*0.8 + aSeed);
                    p.xz = xz * breathe;
                    p.y *= (1.0 + 0.2*sin(time*1.4 + aSeed*2.0 + r*0.2));
                    vec4 mvp = modelViewMatrix * vec4(p, 1.0);
                    gl_Position = projectionMatrix * mvp;
                    gl_PointSize = (65.0 / -mvp.z) * (1.0 - aBand);
                    vMix = aBand;
                    vAlpha = 0.4 + 0.4 * sin(time*3.0 + aSeed);
                }
            `,
            fragmentShader: `
                uniform vec3 uColorA; 
                uniform vec3 uColorB; 
                varying float vMix; 
                varying float vAlpha;
                void main(){
                    if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
                    vec3 col = mix(uColorA, uColorB, vMix);
                    gl_FragColor = vec4(col * 1.2, vAlpha);
                }
            `,
            transparent: true, 
            blending: THREE.AdditiveBlending, 
            depthWrite: false
        });
        const diskPoints = new THREE.Points(diskGeom, diskMat);
        diskPoints.frustumCulled = false;
        diskGeom.computeBoundingSphere();
        supernovaGroup.add(diskPoints);
        
        // Ember particles - reduced count for better performance
        const emberCount = 500;
        const emberPos = new Float32Array(emberCount * 3);
        const emberSeeds = new Float32Array(emberCount * 4);
        for (let i = 0; i < emberCount; i++) {
            emberPos.set([0,0,0], i*3);
            emberSeeds.set([Math.random(), 0.1 + Math.random()*0.9, Math.random()*10, 0.5 + Math.random()], i*4);
        }
        const emberGeom = new THREE.BufferGeometry();
        emberGeom.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
        emberGeom.setAttribute('aSeed', new THREE.BufferAttribute(emberSeeds, 4));
        const emberMat = new THREE.ShaderMaterial({
            uniforms: { 
                uEmberA: { value: supernovaColors.emberA.clone() }, 
                uEmberB: { value: supernovaColors.emberB.clone() }, 
                time: { value: 0 }
            },
            vertexShader: `
                uniform float time; 
                attribute vec4 aSeed; 
                varying float vLife;
                void main() {
                    float life = mod(time * aSeed.y * 0.3 + aSeed.x, 1.0);
                    vec3 p = normalize(vec3(
                        sin(aSeed.z * 1.2),
                        cos(aSeed.z * 1.7),
                        sin(aSeed.z * 1.1)
                    )) * (8.0 + life * 60.0);
                    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
                    gl_PointSize = (150.0 / -mvPosition.z) * (1.0 - life) * aSeed.w;
                    gl_Position = projectionMatrix * mvPosition;
                    vLife = life;
                }
            `,
            fragmentShader: `
                uniform vec3 uEmberA; 
                uniform vec3 uEmberB; 
                varying float vLife;
                void main() {
                    if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
                    float opacity = pow(1.0 - vLife, 2.0);
                    vec3 col = mix(uEmberA, uEmberB, vLife);
                    gl_FragColor = vec4(col * 1.4, opacity);
                }
            `,
            transparent: true, 
            blending: THREE.AdditiveBlending, 
            depthWrite: false
        });
        const emberPoints = new THREE.Points(emberGeom, emberMat);
        emberPoints.frustumCulled = false;
        emberGeom.computeBoundingSphere();
        supernovaGroup.add(emberPoints);
        
        // Prominence particles - reduced count for better performance
        const prominenceCount = 100;
        const prominencePos = new Float32Array(prominenceCount * 3);
        const prominenceSeeds = new Float32Array(prominenceCount * 4);
        for (let i = 0; i < prominenceCount; i++) {
            prominencePos.set([0, 0, 0], i * 3);
            prominenceSeeds.set([
                Math.random(),
                0.1 + Math.random() * 0.4,
                5.0 + Math.random() * 25.0,
                0.5 + Math.random() * 1.5
            ], i * 4);
        }
        const prominenceGeom = new THREE.BufferGeometry();
        prominenceGeom.setAttribute('position', new THREE.BufferAttribute(prominencePos, 3));
        prominenceGeom.setAttribute('aSeed', new THREE.BufferAttribute(prominenceSeeds, 4));
        const prominenceMat = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: supernovaColors.prominence.clone() },
                time: { value: 0 }
            },
            vertexShader: `
                uniform float time;
                attribute vec4 aSeed;
                varying float vLife;
                vec4 quat_from_axis_angle(vec3 axis, float angle) {
                    vec4 qr;
                    float half_angle = (angle * 0.5);
                    qr.x = axis.x * sin(half_angle);
                    qr.y = axis.y * sin(half_angle);
                    qr.z = axis.z * sin(half_angle);
                    qr.w = cos(half_angle);
                    return qr;
                }
                vec3 rotate_vertex_position(vec3 position, vec4 q) {
                    return position + 2.0 * cross(q.xyz, cross(q.xyz, position) + q.w * position);
                }
                void main() {
                    float life = mod(time * aSeed.y + aSeed.x, 1.0);
                    vLife = life;
                    float arc = sin(life * 3.14159);
                    vec3 p = vec3(0.0, 0.0, 0.0);
                    p.y = arc * aSeed.z;
                    p.x = (life - 0.5) * 16.0;
                    vec3 axis = normalize(vec3(aSeed.x - 0.5, aSeed.y - 0.5, aSeed.z - 0.5));
                    float angle = aSeed.x * 6.28318;
                    vec4 q = quat_from_axis_angle(axis, angle);
                    p = rotate_vertex_position(p, q);
                    p += normalize(p) * 8.0;
                    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
                    gl_PointSize = (250.0 / -mvPosition.z) * arc * (1.0 - life) * aSeed.w;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying float vLife;
                void main() {
                    if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
                    float opacity = pow(sin(vLife * 3.14159), 1.5) * 0.8;
                    gl_FragColor = vec4(uColor * 1.5, opacity);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const prominencePoints = new THREE.Points(prominenceGeom, prominenceMat);
        prominencePoints.frustumCulled = false;
        prominenceGeom.computeBoundingSphere();
        coreGroup.add(prominencePoints);
        
        supernovaGroup.add(coreGroup);
        
        // Store materials for animation updates
        supernovaGroup.userData.starMat = starMaterial;
        supernovaGroup.userData.shellMat = shellMaterial;
        supernovaGroup.userData.diskMat = diskMat;
        supernovaGroup.userData.emberMat = emberMat;
        supernovaGroup.userData.prominenceMat = prominenceMat;
        supernovaGroup.userData.coreGroup = coreGroup;
        supernovaGroup.userData.isSupernova = true;
        
        // Scale the entire supernova
        const scale = config.size || 0.2;
        supernovaGroup.scale.setScalar(scale);
        
        return supernovaGroup;
    }
    
    initCrystalAnimation() {
        const canvas = this.crystalCanvas;
        const ctx = canvas.getContext('2d');
        
        // Canvas size is already set to 512x512 in createCrystal
        // Initialize with transparent background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const max = 80;
        const count = 150;
        let p = [];
        let r = 0;
        
        // Create points for the 3D shape
        for (let a = 0; a < max; a++) {
            p.push([Math.cos(r), Math.sin(r), 0]);
            r += Math.PI * 2 / max;
        }
        for (let a = 0; a < max; a++) p.push([0, p[a][0], p[a][1]]);
        for (let a = 0; a < max; a++) p.push([p[a][1], 0, p[a][0]]);
        
        // Store animation state
        this.crystalP = p;
        this.crystalCount = count;
        this.crystalMax = max;
        this.crystalCtx = ctx;
        
        // Start animation
        this.animateCrystal();
    }
    
    animateCrystal() {
        if (!this.crystalCanvas || !this.crystalCtx) return;
        
        const ctx = this.crystalCtx;
        const p = this.crystalP;
        const max = this.crystalMax;
        let count = this.crystalCount;
        
        ctx.globalCompositeOperation = "source-over";
        // Use a very subtle fade to create trails, but make it almost transparent
        ctx.fillStyle = "rgba(0,0,0,0.01)";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.globalCompositeOperation = "lighter";
        
        let tim = count / 5;
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        
        for (let e = 0; e < 3; e++) {
            tim *= 1.7;
            const s = 1 - e / 3;
            let a = tim / 59;
            const yp = Math.cos(a);
            const yp2 = Math.sin(a);
            a = tim / 23;
            const xp = Math.cos(a);
            const xp2 = Math.sin(a);
            const p2 = [];
            
            for (let a = 0; a < p.length; a++) {
                let x = p[a][0], y = p[a][1], z = p[a][2];
                let y1 = y * yp + z * yp2;
                let z1 = y * yp2 - z * yp;
                let x1 = x * xp + z1 * xp2;
                z = x * xp2 - z1 * xp;
                z1 = Math.pow(2, z * s);
                x = x1 * z1;
                y = y1 * z1;
                p2.push([x, y, z]);
            }
            
            const scale = s * (ctx.canvas.width * 0.3); // Scale relative to canvas size
            
            for (let d = 0; d < 3; d++) {
                for (let a = 0; a < max; a++) {
                    const b = p2[d * max + a];
                    const c = p2[((a + 1) % max) + d * max];
                    ctx.beginPath();
                    ctx.strokeStyle = "hsla(" + ((a / max * 360) | 0) + ",70%,60%,0.15)";
                    ctx.lineWidth = Math.pow(6, b[2]);
                    ctx.moveTo(b[0] * scale + centerX, b[1] * scale + centerY);
                    ctx.lineTo(c[0] * scale + centerX, c[1] * scale + centerY);
                    ctx.stroke();
                }
            }
        }
        
        this.crystalCount = count + 1;
        
        // Update texture
        if (this.crystalTexture) {
            this.crystalTexture.needsUpdate = true;
        }
        
        // Continue animation
        if (this.crystalCanvas) {
            requestAnimationFrame(() => this.animateCrystal());
        }
    }
    
    initParticleSphereAnimation(s) {
        const canvas = this.particleSphereCanvas;
        const ctx = canvas.getContext('2d');
        
        // Initialize particle sphere state
        const particles = [];
        const rot = {
            x: 0,
            y: 0,
            z: 0,
            cos: {
                x: 1,
                y: 1,
                z: 1
            },
            sin: {
                x: 0,
                y: 0,
                z: 0
            },
            vel: {
                x: Math.random() / 80,
                y: Math.random() / 80,
                z: Math.random() / 80
            }
        };
        
        const r = 100;
        const d = 180;
        const fl = 250;
        const vp = s / 2;
        
        // Particle constructor
        function Particle() {
            const a = Math.random() * Math.PI * 2;
            const b = Math.random() * Math.PI * 2;
            const cosa = Math.cos(a);
            const cosb = Math.cos(b);
            const sina = Math.sin(a);
            const sinb = Math.sin(b);
            
            this.x = r * cosa * sinb;
            this.y = r * sina * sinb;
            this.z = r * cosb;
            
            this.color = 'hsla(hue,80%,50%,alp)'.replace('hue', (a + b) / Math.PI * 90);
            this.screen = {};
        }
        
        Particle.prototype.setScreen = function() {
            let x = this.x;
            let y = this.y;
            let z = this.z;
            
            // rotations
            // around x
            let z1 = z;
            z = z * rot.cos.x - y * rot.sin.x;
            y = y * rot.cos.x + z1 * rot.sin.x;
            
            // around y
            let x1 = x;
            x = x * rot.cos.y - z * rot.sin.y;
            z = z * rot.cos.y + x1 * rot.sin.y;
            
            // around z
            let y1 = y;
            y = y * rot.cos.z - x * rot.sin.z;
            x = x * rot.cos.z + y1 * rot.sin.z;
            
            // translation
            z += d;
            
            // calculations
            const scale = fl / z;
            this.screen.scale = scale;
            this.screen.x = vp + scale * x;
            this.screen.y = vp + scale * y;
            this.screen.z = z; // indexing stuff
        };
        
        Particle.prototype.render = function() {
            const x = this.screen.x;
            const y = this.screen.y;
            const radius = this.screen.scale * 5;
            const color = ctx.createRadialGradient(x, y, 0, x, y, radius);
            
            color.addColorStop(0, this.color.replace('alp', 1));
            color.addColorStop(1, this.color.replace('alp', 0));
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        };
        
        // Create particles
        for (let i = 0; i < 300; ++i) {
            particles.push(new Particle());
        }
        
        // Store animation state
        this.particleSphereParticles = particles;
        this.particleSphereRot = rot;
        this.particleSphereCtx = ctx;
        this.particleSphereS = s;
        
        // Start animation
        this.animateParticleSphere();
    }
    
    animateParticleSphere() {
        if (!this.particleSphereCanvas || !this.particleSphereCtx) return;
        
        const ctx = this.particleSphereCtx;
        const particles = this.particleSphereParticles;
        const rot = this.particleSphereRot;
        const s = this.particleSphereS;
        
        ctx.clearRect(0, 0, s, s);
        
        rot.x += rot.vel.x;
        rot.y += rot.vel.y;
        rot.z += rot.vel.z;
        
        rot.cos.x = Math.cos(rot.x);
        rot.sin.x = Math.sin(rot.x);
        rot.cos.y = Math.cos(rot.y);
        rot.sin.y = Math.sin(rot.y);
        rot.cos.z = Math.cos(rot.z);
        rot.sin.z = Math.sin(rot.z);
        
        particles.forEach(particle => particle.setScreen());
        particles.sort((a, b) => b.screen.z - a.screen.z);
        particles.forEach(particle => particle.render());
        
        // Update texture
        if (this.particleSphereTexture) {
            this.particleSphereTexture.needsUpdate = true;
        }
        
        // Continue animation
        if (this.particleSphereCanvas) {
            requestAnimationFrame(() => this.animateParticleSphere());
        }
    }
    
    createLabel(text) {
        const textCanvas = document.createElement('canvas');
        const textContext = textCanvas.getContext('2d');
        const font = 'bold 48px Inter, sans-serif';
        textContext.font = font;
        
        // Measure text width to determine canvas size
        const textToRender = text.toUpperCase();
        const textMetrics = textContext.measureText(textToRender);
        const textWidth = textMetrics.width;
        
        // Add padding on both sides (at least 32px each side)
        const padding = 64;
        textCanvas.width = Math.max(256, Math.ceil(textWidth) + padding);
        textCanvas.height = 64;
        
        // Reset context after canvas resize
        textContext.font = font;
        textContext.fillStyle = '#ffffff'; // White text
        textContext.textAlign = 'center';
        textContext.textBaseline = 'middle';
        textContext.fillText(textToRender, textCanvas.width / 2, 32);
        
        const textTexture = new THREE.CanvasTexture(textCanvas);
        textTexture.needsUpdate = true;
        const textMaterial = new THREE.SpriteMaterial({ 
            map: textTexture,
            transparent: true
        });
        const sprite = new THREE.Sprite(textMaterial);
        
        // Scale to prevent squishing - scale X based on canvas width, keep Y at natural scale
        // This ensures text isn't compressed vertically
        const baseScaleX = 0.3;
        const baseScaleY = 0.3; // Use same scale for Y to prevent compression
        const aspectRatio = textCanvas.width / textCanvas.height;
        sprite.scale.set(baseScaleX * aspectRatio, baseScaleY, 1);
        
        return sprite;
    }
    
    createLeaderLine(config) {
        // Leader line extends to nearest screen edge
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: config.lineColor || 0xffffff,
            opacity: config.lineOpacity || 0.5,
            transparent: true
        });
        
        const linePoints = [
            new THREE.Vector3(0, 0, 0), // Start at object (relative)
            new THREE.Vector3(0, 0, 0)  // End will be calculated
        ];
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.userData.type = 'leader'; // Mark as leader line
        
        return line;
    }
    
    createLaserLine(config) {
        // Laser line extends at fixed diagonal angle on x,z plane (45 degrees)
        // This makes it visually distinct from leader lines which use cardinal directions
        const angle = config.angle !== undefined ? config.angle : Math.PI / 4; // 45 degrees
        const length = config.length || 6;
        
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: config.lineColor || 0xffffff,
            opacity: config.lineOpacity || 0.5,
            transparent: true
        });
        
        const linePoints = [
            new THREE.Vector3(0, 0, 0), // Start at object
            new THREE.Vector3(
                Math.cos(angle) * length,
                0,
                Math.sin(angle) * length
            ) // End at angle on x,z plane
        ];
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.userData.type = 'laser'; // Mark as laser line
        
        return line;
    }
    
    createLeftyLine(config) {
        // Lefty line extends to the left (negative X direction)
        const length = config.length || 10; // Long enough to reach screen edge
        
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: config.lineColor || 0xffffff,
            opacity: config.lineOpacity || 0.5,
            transparent: true
        });
        
        const linePoints = [
            new THREE.Vector3(0, 0, 0), // Start at object
            new THREE.Vector3(-length, 0, 0) // End to the left
        ];
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.userData.type = 'lefty'; // Mark as lefty line
        
        return line;
    }
    
    createLefthandLine(config) {
        // Lefthand line extends to the left (similar to lefty)
        const length = config.length || 10; // Long enough to reach screen edge
        
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: config.lineColor || 0xffffff,
            opacity: config.lineOpacity || 0.5,
            transparent: true
        });
        
        const linePoints = [
            new THREE.Vector3(0, 0, 0), // Start at object
            new THREE.Vector3(-length, 0, 0) // End to the left
        ];
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.userData.type = 'lefthand'; // Mark as lefthand line
        
        return line;
    }
    
    createLeftyLabel(text) {
        // Create wrapper container for label (no background needed - line terminates at label)
        const wrapper = document.createElement('div');
        wrapper.className = 'lefty-label-wrapper';
        wrapper.style.position = 'fixed';
        wrapper.style.left = '0';
        wrapper.style.top = '50%';
        wrapper.style.transform = 'translateY(-50%)';
        wrapper.style.pointerEvents = 'auto'; // Enable pointer events for clicking
        wrapper.style.cursor = 'pointer'; // Show pointer cursor
        wrapper.style.zIndex = '100';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        
        // Create label text element
        const labelEl = document.createElement('div');
        labelEl.className = 'lefty-label';
        labelEl.textContent = text.toUpperCase();
        labelEl.style.position = 'relative';
        // Adjust left offset for mobile
        const leftOffset = window.innerWidth <= 768 ? 16 : 24;
        labelEl.style.left = `${leftOffset}px`;
        labelEl.style.color = '#ffffff'; // White text
        labelEl.style.fontFamily = 'var(--font-primary)';
        labelEl.style.fontSize = '0.625rem';
        labelEl.style.fontWeight = '700';
        labelEl.style.textTransform = 'uppercase';
        labelEl.style.letterSpacing = '0.1em';
        labelEl.style.zIndex = '101';
        labelEl.style.pointerEvents = 'none'; // Prevent text element from blocking clicks
        
        wrapper.appendChild(labelEl);
        document.body.appendChild(wrapper);
        
        // Store reference to wrapper and SceneObject for position updates and click detection
        wrapper.userData = { labelEl, sceneObject: this };
        
        return wrapper; // Return wrapper element
    }
    
    createLefthandLabel(text, positionPercentage, offset = 0) {
        // Create wrapper container for label and background
        const wrapper = document.createElement('div');
        wrapper.className = 'lefthand-label-wrapper';
        wrapper.style.position = 'fixed';
        wrapper.style.left = '0';
        wrapper.style.pointerEvents = 'auto'; // Enable pointer events for clicking
        wrapper.style.cursor = 'pointer'; // Show pointer cursor
        wrapper.style.zIndex = '100';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        
        // Position from bottom: 0.0 = bottom, 1.0 = top
        // Use top positioning: 0.0 = bottom means top: 100%, 1.0 = top means top: 0%
        // For positions very close to 1.0 (top), use pixel-based positioning to match menu button
        // For position 0.0 (bottom), add minimum offset to bring it up from the very bottom
        if (positionPercentage >= 0.98) {
            // For positions at top (0.98+), position at 24px from top to match menu button
            wrapper.style.top = '24px';
        } else if (positionPercentage <= 0.02) {
            // For positions at bottom (0.0-0.02), position at 20px from bottom (brings it up)
            wrapper.style.bottom = '20px';
            wrapper.style.top = 'auto';
        } else {
            // For other positions, use percentage
            const topPosition = (1.0 - positionPercentage) * 100; // Convert to percentage
            wrapper.style.top = `${topPosition}%`;
        }
        wrapper.style.transform = `translateY(-50%)`; // Center vertically
        if (offset !== 0) {
            // Apply offset in pixels (positive offset moves down)
            wrapper.style.marginTop = `${offset}px`;
        }
        
        // Create label text element (no background needed - line terminates at label)
        const labelEl = document.createElement('div');
        labelEl.className = 'lefthand-label';
        labelEl.textContent = text.toUpperCase();
        labelEl.style.position = 'relative';
        // Adjust left offset for mobile
        const leftOffset = window.innerWidth <= 768 ? 16 : 24;
        labelEl.style.left = `${leftOffset}px`;
        labelEl.style.color = '#ffffff'; // White text
        labelEl.style.fontFamily = 'var(--font-primary)';
        labelEl.style.fontSize = '0.625rem';
        labelEl.style.fontWeight = '700';
        labelEl.style.textTransform = 'uppercase';
        labelEl.style.letterSpacing = '0.1em';
        labelEl.style.zIndex = '101';
        
        labelEl.style.pointerEvents = 'none'; // Prevent text element from blocking clicks
        
        wrapper.appendChild(labelEl);
        document.body.appendChild(wrapper);
        
        // Store position percentage and SceneObject for updates and click detection
        wrapper.userData = { labelEl, positionPercentage, offset, sceneObject: this };
        
        return wrapper; // Return wrapper element
    }
    
    updateLine() {
        if (!this.line) return;
        
        if (this.line.userData.type === 'lefty') {
            // Lefty lines are in world space, need to update based on object's world position
            // Get the object's world position (accounting for group rotation)
            const worldPosition = new THREE.Vector3();
            if (this.mesh) {
                this.mesh.getWorldPosition(worldPosition);
            } else if (this.orbElement || this.crystalElement || this.cloudElement || this.svgElement || this.sunElement) {
                // For orb/crystal/cloud/svg, use position directly - will be transformed by group
                worldPosition.copy(this.position);
            } else {
                worldPosition.copy(this.position);
            }
            
            // Calculate where the left screen edge is in world space
            const leftEdgeWorld = this.calculateLeftEdgeWorldPosition();
            
            // Update line geometry with world coordinates
            const positions = this.line.geometry.attributes.position;
            positions.setXYZ(0, worldPosition.x, worldPosition.y, worldPosition.z);
            positions.setXYZ(1, leftEdgeWorld.x, leftEdgeWorld.y, leftEdgeWorld.z);
            positions.needsUpdate = true;
            
            // Update label vertical position based on object's screen Y
            if (this.label && this.label.style) {
                const vector = worldPosition.clone();
                vector.project(this.camera);
                const screenY = (-vector.y * 0.5 + 0.5) * window.innerHeight;
                this.label.style.top = `${screenY}px`;
                this.label.style.transform = 'translateY(-50%)';
            }
        } else if (this.line.userData.type === 'lefthand') {
            // Lefthand lines connect object to fixed label position on left edge
            // Get the object's world position (accounting for group rotation)
            const worldPosition = new THREE.Vector3();
            if (this.mesh && this.mesh.getWorldPosition) {
                this.mesh.getWorldPosition(worldPosition);
            } else if (this.orbElement || this.crystalElement || this.cloudElement || this.svgElement || this.sunElement) {
                // For HTML-based objects, use position directly - will be transformed by group
                worldPosition.copy(this.position);
            } else {
                worldPosition.copy(this.position);
            }
            
            // Calculate where the label is positioned on the left edge in world space
            const labelWorldPosition = this.calculateLefthandLabelWorldPosition();
            
            // Update line geometry with world coordinates
            // Check if geometry exists and has valid positions
            if (this.line.geometry && this.line.geometry.attributes && this.line.geometry.attributes.position) {
                const positions = this.line.geometry.attributes.position;
                // Validate positions are valid numbers
                if (isFinite(worldPosition.x) && isFinite(worldPosition.y) && isFinite(worldPosition.z) &&
                    isFinite(labelWorldPosition.x) && isFinite(labelWorldPosition.y) && isFinite(labelWorldPosition.z)) {
                    positions.setXYZ(0, worldPosition.x, worldPosition.y, worldPosition.z);
                    positions.setXYZ(1, labelWorldPosition.x, labelWorldPosition.y, labelWorldPosition.z);
                    positions.needsUpdate = true;
                }
            }
            
            // Label position is fixed, no need to update
        } else {
            // Update line start position (relative to line's position)
            const positions = this.line.geometry.attributes.position;
            positions.setXYZ(0, 0, 0, 0);
            
            if (this.line.userData.type === 'leader') {
                // Calculate direction to nearest screen edge
                const direction = this.calculateScreenEdgeDirection();
                const length = 6; // Default length
                
                positions.setXYZ(1, 
                    direction.x * length,
                    0,
                    direction.z * length
                );
            }
            // Laser lines are already set in createLaserLine
            
            positions.needsUpdate = true;
            
            // Update sprite label position (at end of line in world space)
            if (this.label) {
                const endPoint = new THREE.Vector3(
                    positions.getX(1),
                    positions.getY(1),
                    positions.getZ(1)
                );
                // Line is positioned at this.position, so add relative endPoint
                // For cloud/orb/crystal, use mesh position if available, otherwise use this.position
                const lineStartPos = this.mesh ? this.mesh.position : this.position;
                this.label.position.copy(lineStartPos.clone().add(endPoint));
            }
        }
    }
    
    calculateScreenEdgeDirection() {
        // Calculate direction to nearest screen edge based on camera projection
        try {
            // Get world position for accurate projection
            const worldPosition = new THREE.Vector3();
            if (this.mesh) {
                this.mesh.getWorldPosition(worldPosition);
            } else if (this.orbElement || this.crystalElement || this.cloudElement || this.particleSphereCanvas) {
                // For HTML-based objects or sprite-based objects, position is tracked via mesh or directly
                worldPosition.copy(this.position);
            } else {
                worldPosition.copy(this.position);
            }
            const vector = worldPosition.clone();
            vector.project(this.camera);
            
            const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const screenY = (-vector.y * 0.5 + 0.5) * window.innerHeight;
            
            const distToLeft = screenX;
            const distToRight = window.innerWidth - screenX;
            const distToTop = screenY;
            const distToBottom = window.innerHeight - screenY;
            
            const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
            
            if (minDist === distToLeft) {
                return new THREE.Vector3(-1, 0, 0); // Left
            } else if (minDist === distToRight) {
                return new THREE.Vector3(1, 0, 0); // Right
            } else if (minDist === distToTop) {
                return new THREE.Vector3(0, 0, -1); // Top
            } else {
                return new THREE.Vector3(0, 0, 1); // Bottom
            }
        } catch (e) {
            // Fallback to left if projection fails
            return new THREE.Vector3(-1, 0, 0);
        }
    }
    
    calculateLeftEdgeWorldPosition() {
        // Calculate where the lefty label's right edge is in world space
        // This is where the line should terminate (at the start of the label area)
        // Get the object's world position to determine depth
        const worldPosition = new THREE.Vector3();
        if (this.mesh) {
            this.mesh.getWorldPosition(worldPosition);
        } else {
            worldPosition.copy(this.position);
        }
        
        // Project object to get its screen position (for Y coordinate)
        const objectScreenPos = worldPosition.clone();
        objectScreenPos.project(this.camera);
        
        // The label area width adjusts for mobile (120px desktop, 100px mobile)
        // We want the line to end at the right edge of the label area
        // Convert to NDC X coordinate
        // Screen X: 0 = left, window.innerWidth = right
        // NDC X: -1 = left, 1 = right
        const labelRightEdgeScreenX = window.innerWidth <= 768 ? 100 : 120; // pixels from left edge
        const ndcX = (labelRightEdgeScreenX / window.innerWidth) * 2.0 - 1.0;
        
        // Create a point at the label's right edge (where label area ends)
        // NDC: x is right edge of label area, y is same as object, z is same as object (depth)
        const leftEdgeNDC = new THREE.Vector3(ndcX, objectScreenPos.y, objectScreenPos.z);
        
        // Unproject to get world space point
        const leftEdgeWorld = leftEdgeNDC.clone();
        leftEdgeWorld.unproject(this.camera);
        
        return leftEdgeWorld;
    }
    
    calculateLefthandLabelWorldPosition() {
        // Calculate where the lefthand label's right edge is in world space
        // This is where the line should terminate (at the start of the label background)
        // Get the label's position percentage and offset
        const positionPercentage = this.label.userData.positionPercentage;
        const offset = this.label.userData.offset || 0;
        
        // Convert percentage to screen Y coordinate (0.0 = bottom, 1.0 = top)
        // Position from bottom: 0.0 = bottom, 1.0 = top
        // For positions at top (0.98+), use fixed 24px from top to match menu button
        // For positions at bottom (0.0-0.02), use 20px from bottom (brings it up)
        let screenY;
        if (positionPercentage >= 0.98) {
            screenY = 24 + offset; // 24px from top + offset
        } else if (positionPercentage <= 0.02) {
            // For bottom positions, 20px from bottom
            screenY = window.innerHeight - 20 + offset; // 20px from bottom + offset
        } else {
            // top: 0% = top of screen, top: 100% = bottom of screen
            const topPercent = (1.0 - positionPercentage) * 100;
            screenY = (topPercent / 100) * window.innerHeight + offset;
        }
        
        // Convert screen Y to NDC Y (-1 to 1, where -1 is bottom, 1 is top)
        // Screen Y: 0 = top, window.innerHeight = bottom
        // NDC Y: -1 = bottom, 1 = top
        const ndcY = 1.0 - (screenY / window.innerHeight) * 2.0;
        
        // Get object's world position to determine depth
        const worldPosition = new THREE.Vector3();
        if (this.mesh && this.mesh.getWorldPosition) {
            this.mesh.getWorldPosition(worldPosition);
        } else {
            // For objects without mesh yet (crystal/orb) or if mesh is null, use position
            worldPosition.copy(this.position);
        }
        
        // Project object to get its depth (z in NDC)
        const objectScreenPos = worldPosition.clone();
        objectScreenPos.project(this.camera);
        
        // The label area width adjusts for mobile (120px desktop, 100px mobile)
        // We want the line to end at the right edge of the label area
        // Convert to NDC X coordinate
        // Screen X: 0 = left, window.innerWidth = right
        // NDC X: -1 = left, 1 = right
        const labelRightEdgeScreenX = window.innerWidth <= 768 ? 100 : 120; // pixels from left edge
        const ndcX = (labelRightEdgeScreenX / window.innerWidth) * 2.0 - 1.0;
        
        // Create a point at the label's right edge (where background ends)
        // NDC: x is right edge of label, y is label position, z is same as object (depth)
        const labelNDC = new THREE.Vector3(ndcX, ndcY, objectScreenPos.z);
        
        // Unproject to get world space point
        const labelWorld = labelNDC.clone();
        labelWorld.unproject(this.camera);
        
        return labelWorld;
    }
    
    update() {
        // Update orb position if it's an orb type
        if (this.orbElement) {
            this.updateOrbPosition();
        }
        // Update sun position and orbital motion if it's a sun type
        if (this.sunElement) {
            // Update orbital motion
            if (this.orbitalSpeed !== undefined) {
                this.orbitalAngle = (this.orbitalAngle || 0) + this.orbitalSpeed;
                const x = this.orbitalCenterX + Math.cos(this.orbitalAngle) * this.orbitalRadius;
                const z = this.orbitalCenterZ + Math.sin(this.orbitalAngle) * this.orbitalRadius;
                this.position.x = x;
                this.position.z = z;
                // Update mesh position if it exists (Y stays the same, level with nucleus)
                if (this.mesh) {
                    this.mesh.position.x = x;
                    this.mesh.position.z = z;
                    // Keep Y at the same level (don't update Y during orbit)
                }
            }
            this.updateSunPosition();
        }
        // Update cloud position and animation if it's a cloud type
        if (this.cloudElement) {
            this.updateCloudPosition();
            this.updateCloudAnimation();
        }
        // Update flames position if it's a flames type
        if (this.flamesElement) {
            this.updateFlamesPosition();
        }
        // Update SVG position if it's an SVG type
        if (this.svgElement) {
            this.updateSVGPosition();
        }
        // Crystal is now a sprite mesh, so it updates automatically with the group
        // No need for separate position update
        // Update shader time uniform if it's a shader type
        if (this.shaderMaterial) {
            this.shaderMaterial.uniforms.time.value += 0.0025;
        }
        // Update cone cluster rotation if it's a conecluster type
        if (this.mesh && this.mesh.userData && this.mesh.userData.rotationSpeed) {
            const speed = this.mesh.userData.rotationSpeed;
            // Rotate on all three axes like the p5.js code
            this.mesh.rotation.y += speed;
            this.mesh.rotation.x += speed;
            this.mesh.rotation.z += speed;
        }
        // Update black hole simulation rotation if it's a blackholesim type
        if (this.mesh && this.mesh.userData && this.mesh.userData.isBlackHoleSim) {
            const rotationSpeed = this.mesh.userData.rotationSpeed || 0.0005;
            // Rotate the entire black hole sim group
            this.mesh.rotation.y += rotationSpeed;
        }
        // Update black hole rotation if it's a blackhole type
        if (this.mesh && this.mesh.userData && this.mesh.userData.isBlackHole) {
            const rotationSpeed = this.mesh.userData.rotationSpeed || 0.01;
            // Rotate the entire black hole group
            this.mesh.rotation.y += rotationSpeed;
            // Rotate all particle rings at different speeds for dynamic effect
            if (this.mesh.userData.particleRings && Array.isArray(this.mesh.userData.particleRings)) {
                this.mesh.userData.particleRings.forEach((ring, index) => {
                    // Vary rotation speeds and axes for each ring
                    const speedMultiplier = 0.8 + (index % 3) * 0.2; // Vary between 0.8 and 1.2
                    if (index % 2 === 0) {
                        ring.rotation.y += rotationSpeed * speedMultiplier;
                    } else {
                        ring.rotation.x += rotationSpeed * speedMultiplier;
                    }
                });
            }
        }
        // Update simulation shader time if it's a simulation type
        if (this.mesh && this.mesh.userData && this.mesh.userData.isSimulation) {
            const now = performance.now();
            if (this.mesh.userData.planetMat) {
                this.mesh.userData.planetMat.uniforms.uTime.value = now;
            }
            if (this.mesh.userData.ringsMat) {
                this.mesh.userData.ringsMat.uniforms.uTime.value = now;
            }
        }
        // Update supernova shader time and rotation if it's a supernova type
        if (this.mesh && this.mesh.userData && this.mesh.userData.isSupernova) {
            const time = performance.now() * 0.001; // Convert to seconds
            if (this.mesh.userData.starMat) {
                this.mesh.userData.starMat.uniforms.time.value = time;
            }
            if (this.mesh.userData.shellMat) {
                this.mesh.userData.shellMat.uniforms.time.value = time;
            }
            if (this.mesh.userData.diskMat) {
                this.mesh.userData.diskMat.uniforms.time.value = time;
            }
            if (this.mesh.userData.emberMat) {
                this.mesh.userData.emberMat.uniforms.time.value = time;
            }
            if (this.mesh.userData.prominenceMat) {
                this.mesh.userData.prominenceMat.uniforms.time.value = time;
            }
            // Rotate core group slowly
            if (this.mesh.userData.coreGroup) {
                this.mesh.userData.coreGroup.rotation.y += 0.0005;
            }
        }
        // Update galaxy spiral rotation if it's a galaxy type
        if (this.mesh && this.mesh.userData && this.mesh.userData.isGalaxy && this.mesh.geometry) {
            const geometry = this.mesh.geometry;
            const positions = geometry.attributes.position;
            
            if (!positions || !geometry.userData.starCount) return; // Safety check
            
            const starCount = geometry.userData.starCount;
            const initialAngles = geometry.userData.initialAngles;
            const radii = geometry.userData.radii;
            const chaosOffsets = geometry.userData.chaosOffsets;
            const initialRotationZ = geometry.userData.initialRotationZ || 0;
            
            // Initialize rotation angle if needed
            if (geometry.userData.rotationAngle === undefined) {
                geometry.userData.rotationAngle = 0;
            }
            if (geometry.userData.rotationSpeed === undefined) {
                geometry.userData.rotationSpeed = this.mesh.userData.rotationSpeed || 0.01;
            }
            
            // Update rotation angle
            geometry.userData.rotationAngle += geometry.userData.rotationSpeed;
            const angle = geometry.userData.rotationAngle;
            
            // Update blinking for Andromeda and Sirius
            let blinkOpacity = 1.0;
            if (geometry.userData.isAndromeda) {
                const twinkleSpeed = geometry.userData.twinkleSpeed || 0.01;
                geometry.userData.blinkTime = (geometry.userData.blinkTime || 0) + twinkleSpeed;
                
                if (geometry.userData.isSirius) {
                    // More dramatic twinkling for Large Magellanic Cloud - faster and more variation
                    const fastTwinkle = Math.sin(geometry.userData.blinkTime * 2) * 0.5 + 0.5;
                    const slowTwinkle = Math.sin(geometry.userData.blinkTime * 0.5) * 0.5 + 0.5;
                    blinkOpacity = 0.3 + 0.7 * (fastTwinkle * 0.6 + slowTwinkle * 0.4); // More variation
                } else {
                    // Slow sine wave for gentle blinking (period ~6 seconds) for Andromeda
                    blinkOpacity = 0.4 + 0.6 * (Math.sin(geometry.userData.blinkTime) * 0.5 + 0.5);
                }
            }
            
            // Update star positions in spiral pattern with chaos
            const positionsArray = positions.array;
            const colors = geometry.attributes.color;
            const colorsArray = colors ? colors.array : null;
            let colorsUpdated = false;
            
            for (let i = 0; i < starCount; i++) {
                const i3 = i * 3;
                // Different rotation speeds for spiral effect - inner stars rotate faster
                const spiralSpeed = 0.1 + (i / starCount) * 0.05; // Varies from 0.1 to 0.15
                const spiralAngle = initialAngles[i] + angle * spiralSpeed;
                const radius = radii[i];
                
                // Base spiral position (in XY plane)
                const baseX = Math.cos(spiralAngle) * radius;
                const baseY = Math.sin(spiralAngle) * radius;
                
                // Apply initial rotation around Z axis (keeps galaxy steady on its plane)
                const rotatedX = baseX * Math.cos(initialRotationZ) - baseY * Math.sin(initialRotationZ);
                const rotatedY = baseX * Math.sin(initialRotationZ) + baseY * Math.cos(initialRotationZ);
                
                // Add chaos offsets for irregular appearance
                const chaos = chaosOffsets[i];
                positionsArray[i3] = rotatedX + chaos.x;
                positionsArray[i3 + 1] = rotatedY + chaos.y; // Galaxy plane is XY
                positionsArray[i3 + 2] = chaos.z; // Keep Z near 0 for flat galaxy
                
                // Update colors for blinking (Andromeda only)
                if (colorsArray && geometry.userData.isAndromeda) {
                    colorsUpdated = true;
                    // Store original colors if not already stored
                    if (!geometry.userData.originalColors) {
                        geometry.userData.originalColors = new Float32Array(colorsArray.length);
                        geometry.userData.originalColors.set(colorsArray);
                    }
                    // Apply blinking opacity to colors
                    const origR = geometry.userData.originalColors[i3];
                    const origG = geometry.userData.originalColors[i3 + 1];
                    const origB = geometry.userData.originalColors[i3 + 2];
                    colorsArray[i3] = origR * blinkOpacity; // R
                    colorsArray[i3 + 1] = origG * blinkOpacity; // G
                    colorsArray[i3 + 2] = origB * blinkOpacity; // B
                }
            }
            
            positions.needsUpdate = true;
            if (colors && colorsUpdated) colors.needsUpdate = true;
        }
        // Update cycling symbol animation if it's a cyclingsymbol type
        if (this.mesh && this.mesh.userData && this.mesh.userData.isCyclingSymbol) {
            this.cycleTime = (this.cycleTime || 0) + (this.cycleSpeed || 0.02);
            const phaseCount = this.phaseCount || 8;
            const newIndex = Math.floor(this.cycleTime) % phaseCount;
            if (newIndex !== this.currentPhaseIndex) {
                this.currentPhaseIndex = newIndex;
                this.drawMoonPhase(newIndex);
            }
        }
        // Update symbol orbital motion if it's a symbol type with orbital parameters
        if (this.mesh && this.mesh.userData && this.mesh.userData.orbitalSpeed !== undefined) {
            const orbitalSpeed = this.mesh.userData.orbitalSpeed;
            const orbitalRadius = this.mesh.userData.orbitalRadius || 1.0;
            const centerX = this.mesh.userData.orbitalCenterX || 0;
            const centerZ = this.mesh.userData.orbitalCenterZ || 0;
            
            // Update orbital angle
            this.mesh.userData.orbitalAngle = (this.mesh.userData.orbitalAngle || 0) + orbitalSpeed;
            
            // Calculate new position in orbit
            const x = centerX + Math.cos(this.mesh.userData.orbitalAngle) * orbitalRadius;
            const z = centerZ + Math.sin(this.mesh.userData.orbitalAngle) * orbitalRadius;
            
            // Update position (Y stays the same, bound to plane)
            this.position.x = x;
            this.position.z = z;
            if (this.mesh) {
                this.mesh.position.x = x;
                this.mesh.position.z = z;
            }
            if (this.label instanceof THREE.Sprite) {
                this.label.position.x = x;
                this.label.position.z = z;
            }
            if (this.line && this.line.userData && this.line.userData.type !== 'lefty' && this.line.userData.type !== 'lefthand') {
                this.line.position.x = x;
                this.line.position.z = z;
            }
        }
        // Update Jupiter texture animation (background-position animation like CSS)
        // CSS: background-position: 0 0 to 100% 0 (animates horizontally)
        if (this.jupiterTexture && this.textureAnimationSpeed !== undefined) {
            // Animate background-position from 0 0 to 100% 0 (CSS: background-position: 0 0 to 100% 0)
            // This scrolls the texture horizontally, matching the CSS animation
            this.textureAnimationOffset = (this.textureAnimationOffset || 0) + this.textureAnimationSpeed;
            // Wrap around when it reaches 1.0 (100%)
            if (this.textureAnimationOffset >= 1.0) {
                this.textureAnimationOffset = this.textureAnimationOffset % 1.0;
            }
            // Set texture offset (this is like background-position in CSS)
            this.jupiterTexture.offset.x = this.textureAnimationOffset;
        }
        // Update line based on camera position (if line exists)
        if (this.line) {
            this.updateLine();
        }
    }
    
    updateOrbPosition() {
        if (!this.orbElement || !this.orbWrapper) return;
        
        // Get world position (accounting for group rotation)
        const worldPosition = new THREE.Vector3();
        if (this.mesh) {
            this.mesh.getWorldPosition(worldPosition);
        } else {
            // For orb without mesh, use position directly but need to account for group transform
            // We'll project the position to screen space
            worldPosition.copy(this.position);
        }
        
        // Project to screen coordinates
        const vector = worldPosition.clone();
        vector.project(this.camera);
        
        // Convert NDC to screen coordinates
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
        
        // Calculate size based on distance from camera
        const distance = this.camera.position.distanceTo(worldPosition);
        // Convert world size to screen size (approximate)
        // Using a simple perspective calculation
        const fov = this.camera.fov * (Math.PI / 180);
        const screenSize = (this.orbSize / distance) * (window.innerHeight / (2 * Math.tan(fov / 2))) * 2;
        
        // Apply transform
        this.orbWrapper.style.left = `${x}px`;
        this.orbWrapper.style.top = `${y}px`;
        this.orbWrapper.style.width = `${screenSize}px`;
        this.orbWrapper.style.height = `${screenSize}px`;
        this.orbWrapper.style.transform = `translate(-50%, -50%)`;
    }
    
    updateSunPosition() {
        if (!this.sunElement || !this.sunWrapper) return;
        
        // Get world position (accounting for group rotation)
        const worldPosition = new THREE.Vector3();
        if (this.mesh) {
            this.mesh.getWorldPosition(worldPosition);
        } else {
            // For sun without mesh, use position directly but need to account for group transform
            worldPosition.copy(this.position);
        }
        
        // Project to screen coordinates
        const vector = worldPosition.clone();
        vector.project(this.camera);
        
        // Convert NDC to screen coordinates
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
        
        // Calculate size based on distance from camera
        const distance = this.camera.position.distanceTo(worldPosition);
        // Convert world size to screen size (approximate)
        const fov = this.camera.fov * (Math.PI / 180);
        const screenSize = (this.sunSize / distance) * (window.innerHeight / (2 * Math.tan(fov / 2))) * 2;
        
        // Apply transform
        this.sunWrapper.style.left = `${x}px`;
        this.sunWrapper.style.top = `${y}px`;
        this.sunWrapper.style.width = `${screenSize}px`;
        this.sunWrapper.style.height = `${screenSize}px`;
        this.sunWrapper.style.transform = `translate(-50%, -50%)`;
    }
    
    updateFlamesPosition() {
        if (!this.flamesElement || !this.flamesWrapper) return;
        
        // Get world position (accounting for group rotation)
        const worldPosition = new THREE.Vector3();
        if (this.mesh) {
            this.mesh.getWorldPosition(worldPosition);
        } else {
            // For flames without mesh, use position directly
            worldPosition.copy(this.position);
        }
        
        // Project to screen coordinates
        const vector = worldPosition.clone();
        vector.project(this.camera);
        
        // Convert NDC to screen coordinates
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
        
        // Calculate size based on distance from camera
        const distance = this.camera.position.distanceTo(worldPosition);
        // Convert world size to screen size (approximate)
        const fov = this.camera.fov * (Math.PI / 180);
        const screenSize = (this.flamesSize / distance) * (window.innerHeight / (2 * Math.tan(fov / 2))) * 2;
        
        // Adjust z-index based on depth to respect 3D ordering
        // vector.z is in normalized device coordinates (-1 to 1, where 1 is furthest)
        // Use depth to set z-index: further objects get lower z-index
        // Convert z from [-1, 1] to a z-index range
        // Objects closer to camera (lower z) should have higher z-index
        const depthZ = vector.z; // -1 (near) to 1 (far)
        // Map to z-index: closer objects (z near -1) get higher z-index
        // Use range from -100 (far) to 0 (near) so it appears behind canvas content
        const zIndex = Math.round(depthZ * 50) - 50; // Range: -100 to 0
        this.flamesWrapper.style.zIndex = zIndex.toString();
        
        // Apply transform
        this.flamesWrapper.style.left = `${x}px`;
        this.flamesWrapper.style.top = `${y}px`;
        this.flamesWrapper.style.width = `${screenSize}px`;
        this.flamesWrapper.style.height = `${screenSize}px`;
        this.flamesWrapper.style.transform = `translate(-50%, -50%)`;
    }
    
    updateCloudPosition() {
        // Use cloudWrapper if available, otherwise cloudElement
        const wrapper = this.cloudWrapper || this.cloudElement;
        if (!wrapper) {
            return;
        }
        
        // Get world position (accounting for group rotation)
        const worldPosition = new THREE.Vector3();
        if (this.mesh) {
            this.mesh.getWorldPosition(worldPosition);
        } else {
            // For cloud without mesh, use position directly but need to account for group transform
            // Apply group rotation if mesh exists in group
            worldPosition.copy(this.position);
        }
        
        // Project to screen coordinates
        const vector = worldPosition.clone();
        vector.project(this.camera);
        
        // Convert NDC to screen coordinates
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
        
        // Check if position is valid (not NaN or Infinity)
        if (!isFinite(vector.z) || !isFinite(x) || !isFinite(y)) {
            return; // Skip update if position is invalid
        }
        
        // Calculate size based on distance from camera
        const distance = this.camera.position.distanceTo(worldPosition);
        const fov = this.camera.fov * (Math.PI / 180);
        // Scale cloud size appropriately - smaller and more subtle
        const baseScreenSize = (this.cloudSize / distance) * (window.innerHeight / (2 * Math.tan(fov / 2))) * 2;
        const screenSize = Math.max(150, baseScreenSize * 1.5); // Minimum 150px (reduced from 300px), less scaling
        
        // Store scale factor for cloud layers
        const scaleFactor = screenSize / 512; // Original wrapper is 512px
        
        // Apply transform - center the cloud wrapper
        wrapper.style.left = `${x}px`;
        wrapper.style.top = `${y}px`;
        wrapper.style.width = `${screenSize}px`;
        wrapper.style.height = `${screenSize}px`;
        wrapper.style.marginLeft = `${-screenSize / 2}px`;
        wrapper.style.marginTop = `${-screenSize / 2}px`;
        wrapper.style.transform = 'none';
        wrapper.style.display = 'block';
        wrapper.style.visibility = 'visible';
        
        // Scale cloud layers to match wrapper size
        if (this.cloudLayers && this.cloudLayers.length > 0) {
            this.cloudLayers.forEach((layer, index) => {
                if (layer && layer.style) {
                    const layerSize = 256 * scaleFactor;
                    layer.style.width = `${layerSize}px`;
                    layer.style.height = `${layerSize}px`;
                    layer.style.marginLeft = `${-layerSize / 2}px`;
                    layer.style.marginTop = `${-layerSize / 2}px`;
                    layer.style.backgroundSize = `${layerSize}px ${layerSize}px`;
                    layer.style.display = 'block';
                    layer.style.visibility = 'visible';
                }
            });
        }
    }
    
    updateCloudAnimation() {
        const wrapper = this.cloudWrapper || this.cloudElement;
        if (!this.cloudLayers || !wrapper) return;
        
        // Get world rotation angles from the planes group
        const planesGroup = this.planesGroup || this.scene.children.find(child => child.userData && child.userData.isPlanesGroup);
        const worldYAngle = planesGroup ? planesGroup.rotation.y * (180 / Math.PI) : 0;
        const worldXAngle = planesGroup ? planesGroup.rotation.x * (180 / Math.PI) : 0;
        
        // Update each cloud layer
        for (let j = 0; j < this.cloudLayers.length; j++) {
            const layer = this.cloudLayers[j];
            if (!layer || !layer.data) continue;
            
            // Update rotation
            layer.data.a += layer.data.speed;
            
            // Apply transform with rotation compensation
            const t = `translateX(${layer.data.x}px) translateY(${layer.data.y}px) translateZ(${layer.data.z}px) rotateY(${-worldYAngle}deg) rotateX(${-worldXAngle}deg) rotateZ(${layer.data.a}deg) scale(${layer.data.s})`;
            layer.style.transform = t;
        }
    }
    
    updateSVGPosition() {
        const wrapper = this.svgWrapper || this.svgElement;
        if (!wrapper) {
            return;
        }
        
        // Get world position (accounting for group rotation)
        const worldPosition = new THREE.Vector3();
        if (this.mesh) {
            this.mesh.getWorldPosition(worldPosition);
        } else {
            // For SVG without mesh, use position directly but need to account for group transform
            // We'll project the position to screen space
            worldPosition.copy(this.position);
        }
        
        // Validate world position before projecting
        if (!isFinite(worldPosition.x) || !isFinite(worldPosition.y) || !isFinite(worldPosition.z)) {
            return; // Skip update if position is invalid
        }
        
        // Project to screen coordinates
        const vector = worldPosition.clone();
        vector.project(this.camera);
        
        // Validate projected coordinates
        if (!isFinite(vector.x) || !isFinite(vector.y) || !isFinite(vector.z)) {
            return; // Skip update if projection failed
        }
        
        // Convert NDC to screen coordinates
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
        
        // Final validation of screen coordinates
        if (!isFinite(x) || !isFinite(y)) {
            return; // Skip update if screen coordinates are invalid
        }
        
        // Calculate size based on distance from camera
        const distance = this.camera.position.distanceTo(worldPosition);
        const fov = this.camera.fov * (Math.PI / 180);
        // Convert world size to screen size (approximate)
        // Using a simple perspective calculation
        const baseScreenSize = (this.svgSize / distance) * (window.innerHeight / (2 * Math.tan(fov / 2))) * 2;
        // Allow smaller minimum size for very small objects like Atlantis
        const minSize = (this.name === 'Atlantis') ? 30 : 100; // Much smaller minimum for Atlantis
        const screenWidth = Math.max(minSize, baseScreenSize * 1.5);
        const screenHeight = screenWidth * (640 / 512); // Maintain aspect ratio (640/512 = 1.25)
        
        // Apply transform - center the SVG wrapper
        wrapper.style.left = `${x}px`;
        wrapper.style.top = `${y}px`;
        wrapper.style.width = `${screenWidth}px`;
        wrapper.style.height = `${screenHeight}px`;
        wrapper.style.marginLeft = `${-screenWidth / 2}px`;
        wrapper.style.marginTop = `${-screenHeight / 2}px`;
        wrapper.style.transform = 'none';
        wrapper.style.display = 'block';
        wrapper.style.visibility = 'visible';
    }
    
    addToGroup(group) {
        // Store reference to planes group for cloud animation and GLTF models
        if (group && group.userData && group.userData.isPlanesGroup) {
            this.planesGroup = group;
        }
        
        // For GLTF type, mesh will be null initially (loads asynchronously)
        // The model will add itself to the group when it loads (handled in loadGLTF)
        if (this.mesh) {
            group.add(this.mesh);
        }
        
        // For orb type, create a dummy invisible mesh to track position in group
        // Crystal now has a real mesh (sprite), so it doesn't need a dummy
        if (this.orbElement && !this.mesh) {
            // Create a tiny invisible sphere to track position
            const geometry = new THREE.SphereGeometry(0.01, 8, 8);
            const material = new THREE.MeshBasicMaterial({ visible: false });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.copy(this.position);
        }
        
        // For cloud type, create a dummy invisible mesh to track position in group
        if (this.cloudElement && !this.mesh) {
            // Create a tiny invisible sphere to track position
            // Make sure it doesn't affect reflections by using MeshBasicMaterial
            // and marking it to not cast/receive shadows or affect environment
            const geometry = new THREE.SphereGeometry(0.01, 8, 8);
            const material = new THREE.MeshBasicMaterial({ 
                visible: false,
                transparent: true,
                opacity: 0
            });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.copy(this.position);
            // Ensure it doesn't affect environment map
            this.mesh.visible = false;
            this.mesh.castShadow = false;
            this.mesh.receiveShadow = false;
            // Mark it so environment map generator can skip it if needed
            this.mesh.userData.isCloudDummy = true;
        }
        
        // For flames type, create a dummy invisible mesh to track position in group
        if (this.flamesElement && !this.mesh) {
            // Create a tiny invisible sphere to track position
            const geometry = new THREE.SphereGeometry(0.01, 8, 8);
            const material = new THREE.MeshBasicMaterial({ visible: false });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.copy(this.position);
        }
        
        // For SVG type, create a dummy invisible mesh to track position in group
        if (this.svgElement && !this.mesh) {
            // Create a tiny invisible sphere to track position
            const geometry = new THREE.SphereGeometry(0.01, 8, 8);
            const material = new THREE.MeshBasicMaterial({ visible: false });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.copy(this.position);
        }
        
        // For sun type, create a dummy invisible mesh to track position in group
        if (this.sunElement && !this.mesh) {
            // Create a tiny invisible sphere to track position
            const geometry = new THREE.SphereGeometry(0.01, 8, 8);
            const material = new THREE.MeshBasicMaterial({ visible: false });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.copy(this.position);
        }
        
        // Add objects to group (positions are already set in world space)
        // But since they're being added to a group, we need to convert to local space
        // Actually, Three.js handles this automatically if we set position before adding
        if (this.mesh) {
            group.add(this.mesh);
        }
        if (this.label instanceof THREE.Sprite) {
            // Only add sprite labels to group, HTML labels are already in DOM
            group.add(this.label);
        }
        // Lefty and lefthand lines are added directly to scene, not group (to avoid rotation)
        if (this.line && this.line.userData && this.line.userData.type !== 'lefty' && this.line.userData.type !== 'lefthand') {
            group.add(this.line);
            // Ensure line position is set correctly
            this.line.position.copy(this.position);
        }
    }
    
    remove() {
        if (this.mesh) {
            this.mesh.parent?.remove(this.mesh);
        }
        if (this.orbElement && this.orbWrapper && this.orbWrapper.parentNode) {
            // Remove orb HTML element from DOM
            this.orbWrapper.parentNode.removeChild(this.orbWrapper);
        }
        if (this.sunElement && this.sunWrapper && this.sunWrapper.parentNode) {
            // Remove sun HTML element from DOM
            this.sunWrapper.parentNode.removeChild(this.sunWrapper);
        }
        if (this.flamesElement && this.flamesWrapper && this.flamesWrapper.parentNode) {
            // Remove flames HTML element from DOM
            this.flamesWrapper.parentNode.removeChild(this.flamesWrapper);
        }
        if (this.cloudElement && this.cloudWrapper && this.cloudWrapper.parentNode) {
            // Remove cloud HTML element from DOM
            this.cloudWrapper.parentNode.removeChild(this.cloudWrapper);
        }
        if (this.crystalElement && this.crystalCanvas) {
            // Stop crystal animation
            this.crystalCanvas = null;
            this.crystalCtx = null;
            if (this.crystalTexture) {
                this.crystalTexture.dispose();
            }
        }
        if (this.particleSphereCanvas) {
            // Stop particle sphere animation
            this.particleSphereCanvas = null;
            this.particleSphereCtx = null;
            if (this.particleSphereTexture) {
                this.particleSphereTexture.dispose();
            }
        }
        if (this.label instanceof THREE.Sprite) {
            this.label.parent?.remove(this.label);
        } else if (this.label && this.label.parentNode) {
            // Remove HTML label wrapper from DOM
            this.label.parentNode.removeChild(this.label);
        }
        this.line.parent?.remove(this.line);
    }
}
