// objects.js - All scene object definitions
// This file contains all the object creation code for the scene

export function createAllObjects(sceneManager, spacing, planeSize, planesGroup) {
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
        '/zodiac/aries.png',
        '/zodiac/taurus.png',
        '/zodiac/gemini.png',
        '/zodiac/cancer.png',
        '/zodiac/leo.png',
        '/zodiac/virgo.png',
        '/zodiac/libra.png',
        '/zodiac/scorpio.png',
        '/zodiac/sagittarius.png',
        '/zodiac/capricorn.png',
        '/zodiac/aquarius.png',
        '/zodiac/pisces.png'
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

    // Add Large Magellanic Cloud galaxy at fire corner (bottom-right, opposite Andromeda) - identical but smaller particles and more twinkling
    const siriusX = plane2HalfSize + 2.5; // Moved further out into outer space (bottom-right direction)
    const siriusZ = plane2HalfSize + 2.5;
    sceneManager.addObject({
        name: 'Large Magellanic Cloud',
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

    // Add Jupiter - large sphere with rotating texture in random area from 0b to 2a
    // Areas span from y=-2.5 (plane 0) to y=5.0 (plane 2)
    const jupiterY = Math.random() * 7.5 - 2.5; // Random Y between -2.5 and 5.0
    const jupiterX = (Math.random() - 0.5) * 6; // Random X between -3 and 3
    const jupiterZ = (Math.random() - 0.5) * 6; // Random Z between -3 and 3
    // Calculate angle from center to Jupiter position to point outward
    const jupiterAngle = Math.atan2(jupiterZ, jupiterX);
    // Determine region based on Y position
    let jupiterRegion;
    if (jupiterY < 0) {
        jupiterRegion = '0b'; // Top side of plane 0
    } else if (jupiterY < 2.5) {
        jupiterRegion = '1a'; // Bottom side of plane 1
    } else {
        jupiterRegion = '2a'; // Bottom side of plane 2
    }

    sceneManager.addObject({
        name: 'jupiter',
        type: 'gltf',
        modelPath: '/Jupiter_1_142984.glb', // NASA 3D model of Jupiter
        position: [jupiterX, jupiterY, jupiterZ], // Random position in area from 0b to 2a
        // scale will be auto-calculated based on model size, or set manually if needed
        region: jupiterRegion,
        bindingType: 'free',
        lineType: 'laser', // Laser line points outward using angle
        angle: jupiterAngle, // Angle pointing outward from center
        lineColor: 0xffffff,
        lineOpacity: 0.5
    });

    // Add Mercury - small glass sphere in random area from 0b to 2a
    // Areas span from y=-2.5 (plane 0) to y=5.0 (plane 2)
    const mercuryY = Math.random() * 7.5 - 2.5; // Random Y between -2.5 and 5.0
    const mercuryX = (Math.random() - 0.5) * 6; // Random X between -3 and 3
    const mercuryZ = (Math.random() - 0.5) * 6; // Random Z between -3 and 3
    // Calculate angle from center to Mercury position to point outward
    const mercuryAngle = Math.atan2(mercuryZ, mercuryX);
    // Determine region based on Y position
    let mercuryRegion;
    if (mercuryY < 0) {
        mercuryRegion = '0b'; // Top side of plane 0
    } else if (mercuryY < 2.5) {
        mercuryRegion = '1a'; // Bottom side of plane 1
    } else {
        mercuryRegion = '2a'; // Bottom side of plane 2
    }

    sceneManager.addObject({
        name: 'mercury',
        type: 'sphere',
        position: [mercuryX, mercuryY, mercuryZ], // Random position in area from 0b to 2a
        radius: 0.1, // Small sphere (smaller than Mars/Venus)
        color: 0x888888, // Gray color
        emissive: 0x222222, // Dark gray emissive for slight glow
        emissiveIntensity: 0.2,
        metalness: 0.1,
        roughness: 0.3,
        transmission: 0.9, // Glass-like transparency
        ior: 1.5, // Glass index of refraction
        region: mercuryRegion,
        bindingType: 'free',
        lineType: 'laser', // Laser line points outward using angle
        angle: mercuryAngle, // Angle pointing outward from center
        lineColor: 0xffffff,
        lineOpacity: 0.5
    });

    // Add Uranus - glass sphere with vertical rings in random area from 0b to 2a
    // Areas span from y=-2.5 (plane 0) to y=5.0 (plane 2)
    const uranusY = Math.random() * 7.5 - 2.5; // Random Y between -2.5 and 5.0
    const uranusX = (Math.random() - 0.5) * 6; // Random X between -3 and 3
    const uranusZ = (Math.random() - 0.5) * 6; // Random Z between -3 and 3
    // Calculate angle from center to Uranus position to point outward
    const uranusAngle = Math.atan2(uranusZ, uranusX);
    // Determine region based on Y position
    let uranusRegion;
    if (uranusY < 0) {
        uranusRegion = '0b'; // Top side of plane 0
    } else if (uranusY < 2.5) {
        uranusRegion = '1a'; // Bottom side of plane 1
    } else {
        uranusRegion = '2a'; // Bottom side of plane 2
    }

    sceneManager.addObject({
        name: 'uranus',
        type: 'sphere',
        position: [uranusX, uranusY, uranusZ], // Random position in area from 0b to 2a
        radius: 0.2, // Medium-sized sphere
        color: 0x4fd0e7, // Cyan color (Uranus's characteristic color)
        emissive: 0x1a4a55, // Dark cyan emissive for slight glow
        emissiveIntensity: 0.2,
        metalness: 0.1,
        roughness: 0.3,
        transmission: 0.9, // Glass-like transparency
        ior: 1.5, // Glass index of refraction
        verticalRings: true, // Enable vertical rings
        ringCount: 3, // Number of rings
        ringRadius: 0.3, // Ring radius (1.5x planet radius)
        ringTube: 0.015, // Thickness of rings
        ringColor: 0x88aacc, // Light blue-gray for rings
        region: uranusRegion,
        bindingType: 'free',
        lineType: 'laser', // Laser line points outward using angle
        angle: uranusAngle, // Angle pointing outward from center
        lineColor: 0xffffff,
        lineOpacity: 0.5
    });

    // Add Neptune - small blue sphere in random area from 0b to 2a
    // Areas span from y=-2.5 (plane 0) to y=5.0 (plane 2)
    const neptuneY = Math.random() * 7.5 - 2.5; // Random Y between -2.5 and 5.0
    const neptuneX = (Math.random() - 0.5) * 6; // Random X between -3 and 3
    const neptuneZ = (Math.random() - 0.5) * 6; // Random Z between -3 and 3
    // Calculate angle from center to Neptune position to point outward
    const neptuneAngle = Math.atan2(neptuneZ, neptuneX);
    // Determine region based on Y position
    let neptuneRegion;
    if (neptuneY < 0) {
        neptuneRegion = '0b'; // Top side of plane 0
    } else if (neptuneY < 2.5) {
        neptuneRegion = '1a'; // Bottom side of plane 1
    } else {
        neptuneRegion = '2a'; // Bottom side of plane 2
    }

    sceneManager.addObject({
        name: 'neptune',
        type: 'sphere',
        position: [neptuneX, neptuneY, neptuneZ], // Random position in area from 0b to 2a
        radius: 0.12, // Small sphere (slightly larger than Mercury)
        color: 0x4166f5, // Deep blue color (Neptune's characteristic color)
        emissive: 0x1a1f3d, // Dark blue emissive for slight glow
        emissiveIntensity: 0.2,
        metalness: 0.1,
        roughness: 0.4,
        region: neptuneRegion,
        bindingType: 'free',
        lineType: 'laser', // Laser line points outward using angle
        angle: neptuneAngle, // Angle pointing outward from center
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

    // Add combined Messier 87 (glowing region + black hole) in area 0b, positioned in outer space
    // Random position in area 0b (between plane 0 at y=-2.5 and plane 1 at y=0), but further out from center
    const m87Y = -1.25; // Middle of area 0b (between planes 0 and 1)
    const m87OuterRadius = 5.0 + Math.random() * 1.5; // Random radius between 5.0 and 6.5 (further into outer space)
    const m87StartAngle = Math.random() * Math.PI * 2; // Random starting angle
    const m87X = Math.cos(m87StartAngle) * m87OuterRadius;
    const m87Z = Math.sin(m87StartAngle) * m87OuterRadius;
    const m87Angle = Math.atan2(m87Z, m87X); // Angle pointing outward from center

    // Create Messier 87 glowing region
    sceneManager.addObject({
        name: 'Messier 87',
        type: 'glowingregion',
        position: [m87X, m87Y, m87Z], // Random position in area 0b, outer space
        size: 2.5, // Size of the glowing region
        particleCount: 300, // Number of glowing particles
        particleSize: 0.05, // Much smaller particle size
        color: 0x88aaff, // Blue glow color
        opacity: 0.6, // Glow opacity
        region: '0b', // Top side of plane 0
        bindingType: 'free', // Free positioning
        lineType: 'laser',
        angle: m87Angle, // Angle pointing outward from center
        lineColor: 0xffffff,
        lineOpacity: 0.5
    });

    // Create M87 black hole at the center of Messier 87 (same position)
    sceneManager.addObject({
        name: 'M87',
        type: 'blackholesim',
        position: [m87X, m87Y, m87Z], // Same position as Messier 87 (center of glowing region)
        blackHoleRadius: 0.25, // Smaller black hole
        rotationSpeed: 0.0005, // Rotation speed
        region: '0b', // Top side of plane 0
        bindingType: 'free', // Free positioning
        lineType: null // No label or line
    });

    // Store M87 data for star animation - this will be handled in main.js
    // The m87Data object needs to be accessible from the animation loop
    // We'll return it so main.js can use it
    const m87Data = {
        centerX: m87X,
        centerY: m87Y,
        centerZ: m87Z,
        particleOrbits: [], // Will store orbital data for each particle
        m87Object: null // Will store reference to M87 object
    };

    // Initialize M87 particle orbits after object is created
    // Find the M87 object and initialize orbital parameters for each particle
    setTimeout(() => {
        const m87Object = sceneManager.allObjects.find(obj => obj.name === 'Messier 87');
        if (m87Object && m87Object.mesh) {
            m87Data.m87Object = m87Object;
            const geometry = m87Object.mesh.geometry;
            const positions = geometry.attributes.position;
            const particleCount = positions.count;
            
            // Initialize orbital parameters for each particle
            // Note: createGlowingRegion uses: x = r*sin(phi)*cos(theta), y = r*sin(phi)*sin(theta), z = r*cos(phi)
            for (let i = 0; i < particleCount; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);
                const z = positions.getZ(i);
                
                // Calculate initial distance from center
                const radius = Math.sqrt(x * x + y * y + z * z);
                
                // Calculate initial angles matching createGlowingRegion coordinate system
                // z = r*cos(phi) => phi = acos(z/r)
                // x = r*sin(phi)*cos(theta) => theta = atan2(y, x) (since y = r*sin(phi)*sin(theta))
                const phi = Math.acos(Math.max(-1, Math.min(1, z / Math.max(radius, 0.001)))); // Polar angle from Z axis
                const theta = Math.atan2(y, x); // Azimuth angle in XY plane
                
                // Store orbital data
                // Stars orbit primarily in a disk (like a galaxy), with most motion in theta (azimuth)
                // Outer stars move slower (Keplerian motion), inner stars move faster
                const regionSize = 2.5; // M87 region size
                const normalizedRadius = radius / regionSize; // Normalize to 0-1
                const baseSpeed = 0.01 + (1 - normalizedRadius) * 0.02; // Faster near center, slower at edges
                
                m87Data.particleOrbits.push({
                    radius: radius,
                    theta: theta, // Azimuth angle in XY plane
                    phi: phi, // Polar angle from Z axis
                    thetaSpeed: baseSpeed * (0.5 + Math.random() * 0.5), // Random rotation speed around Z axis
                    phiSpeed: (Math.random() - 0.5) * 0.003, // Small random tilt variation (very slow)
                    phiDirection: Math.random() > 0.5 ? 1 : -1 // Random direction for phi variation
                });
            }
        }
    }, 100); // Small delay to ensure object is created

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
			keyTimes="0;0.5;1" keySplines="0.8 0.2 0.6 0.9"
			values="0;2;0"/>
	</circle>
	<circle id="star03">
		<animate attributeName="r" dur="6s" repeatCount="indefinite" calcMode="spline"
			keyTimes="0;0.5;1" keySplines="0.8 0.2 0.6 0.9"
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

    // Add flames at fire corner of plane 3
    const plane3HalfSize = planeSize / 2; // 4
    const plane3FireCornerX = plane3HalfSize - 0.3; // Bottom-right corner X
    const plane3FireCornerZ = plane3HalfSize - 0.3; // Bottom-right corner Z

    sceneManager.addObject({
        name: 'flames',
        type: 'flames',
        position: [plane3FireCornerX, (3 - 1) * spacing, plane3FireCornerZ], // At plane 3
        size: 0.08, // Smaller size
        region: '3b', // Above plane 3 (top side)
        bindingType: 'relative',
        planeIndex: 3,
        offset: 0, // At the plane
        lineType: null // No label
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

    // Return m87Data so main.js can use it for animation
    return m87Data;
}

