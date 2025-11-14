// SceneManager - Organizes objects by plane regions
import * as THREE from 'three';
import { SceneObject } from './scene-object.js';

export class SceneManager {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.objects = new Map(); // Map of region -> array of objects
        this.allObjects = []; // Flat list for easy iteration
        this.lefthandLabels = new Map(); // Map of position percentage -> array of objects for auto-offset
    }
    
    // Get region string from Y position
    // Planes: 0 (Y=-2.5), 1 (Y=0), 2 (Y=2.5), 3 (Y=5), 4 (Y=7.5)
    getRegionFromY(y) {
        const planePositions = [-2.5, 0, 2.5, 5, 7.5];
        
        if (y < planePositions[0]) {
            return '0a'; // Below plane 0
        }
        
        for (let i = 0; i < planePositions.length - 1; i++) {
            if (y >= planePositions[i] && y < planePositions[i + 1]) {
                return `${i}b`; // Top side of plane i
            }
        }
        
        return '4b'; // Above plane 4
    }
    
    // Add an object to the scene
    addObject(config) {
        // Auto-determine region if not specified
        if (!config.region && config.position) {
            config.region = this.getRegionFromY(config.position[1]);
        }
        
        // Calculate auto-offset for lefthand labels BEFORE creating object
        let lefthandOffset = 0;
        if (config.lineType === 'lefthand' && config.lefthandLabelPosition !== undefined) {
            const positionKey = config.lefthandLabelPosition;
            if (!this.lefthandLabels.has(positionKey)) {
                this.lefthandLabels.set(positionKey, []);
            }
            const existingLabels = this.lefthandLabels.get(positionKey);
            lefthandOffset = existingLabels.length * 40; // 40px offset per label
            // Store offset in config so SceneObject can use it
            config.lefthandOffset = lefthandOffset;
        }
        
        const obj = new SceneObject(config, this.scene, this.camera, this.renderer, this);
        
        // Track lefthand labels for future auto-offset calculations
        if (config.lineType === 'lefthand' && config.lefthandLabelPosition !== undefined) {
            const positionKey = config.lefthandLabelPosition;
            this.lefthandLabels.get(positionKey).push(obj);
        }
        
        // Initialize bound object positions (if binding is set)
        // We need spacing value - for now use 2.5 as default, will be updated in animation loop
        if (obj.bindingType === 'relative' || obj.bindingType === 'elastic') {
            this.updateObjectPosition(obj, 2.5); // Use default spacing for initial position
        }
        
        // Store by region
        if (!this.objects.has(config.region)) {
            this.objects.set(config.region, []);
        }
        this.objects.get(config.region).push(obj);
        
        // Also store in flat list
        this.allObjects.push(obj);
        
        // Regenerate environment map when new objects are added
        // Skip regeneration for cloud objects (HTML-only, don't affect reflections)
        if (this.onEnvironmentUpdate && config.type !== 'cloud') {
            this.onEnvironmentUpdate();
        }
        
        return obj;
    }
    
    // Helper to update a single object's position based on binding
    updateObjectPosition(obj, spacing) {
        if (obj.bindingType === 'relative') {
            const planeY = (obj.planeIndex - 1) * spacing;
            obj.position.y = planeY + obj.offset;
            if (obj.mesh) {
                obj.mesh.position.y = obj.position.y;
                obj.mesh.position.x = obj.position.x;
                obj.mesh.position.z = obj.position.z;
            }
            if (obj.label instanceof THREE.Sprite) {
                obj.label.position.y = obj.position.y;
            }
            // Lefty and lefthand lines are in world space, don't update their position here
            if (obj.line && obj.line.userData && obj.line.userData.type !== 'lefty' && obj.line.userData.type !== 'lefthand') {
                obj.line.position.copy(obj.position);
            }
            if (obj.line) {
                obj.updateLine(); // Recalculate line and label position
            }
        } else if (obj.bindingType === 'elastic') {
            const planeAY = (obj.planeA - 1) * spacing;
            const planeBY = (obj.planeB - 1) * spacing;
            obj.position.y = planeAY + (planeBY - planeAY) * obj.percentage;
            if (obj.mesh) {
                obj.mesh.position.y = obj.position.y;
                obj.mesh.position.x = obj.position.x;
                obj.mesh.position.z = obj.position.z;
            }
            if (obj.label instanceof THREE.Sprite) {
                obj.label.position.y = obj.position.y;
            }
            // Lefty and lefthand lines are in world space, don't update their position here
            if (obj.line && obj.line.userData && obj.line.userData.type !== 'lefty' && obj.line.userData.type !== 'lefthand') {
                obj.line.position.copy(obj.position);
            }
            if (obj.line) {
                obj.updateLine(); // Recalculate line and label position
            }
        }
        // 'free' objects don't need updating
    }
    
    // Get all objects in a specific region
    getObjectsInRegion(region) {
        return this.objects.get(region) || [];
    }
    
    // Get all objects between two planes
    getObjectsBetweenPlanes(planeA, planeB) {
        const regions = [];
        const minPlane = Math.min(planeA, planeB);
        const maxPlane = Math.max(planeA, planeB);
        
        for (let i = minPlane; i <= maxPlane; i++) {
            regions.push(`${i}a`);
            if (i < maxPlane) {
                regions.push(`${i}b`);
            }
        }
        
        return regions.flatMap(region => this.getObjectsInRegion(region));
    }
    
    // Update all objects (for leader line recalculation)
    update() {
        this.allObjects.forEach(obj => obj.update());
    }
    
    // Update bound objects when spacing changes
    updateBoundObjects(spacing) {
        this.allObjects.forEach(obj => {
            this.updateObjectPosition(obj, spacing);
        });
    }
    
    // Add all objects to a group
    addAllToGroup(group) {
        this.allObjects.forEach(obj => obj.addToGroup(group));
    }
    
    // Remove an object
    removeObject(name) {
        const obj = this.allObjects.find(o => o.name === name);
        if (obj) {
            obj.remove();
            const region = obj.region;
            const regionObjects = this.objects.get(region);
            if (regionObjects) {
                const index = regionObjects.indexOf(obj);
                if (index > -1) regionObjects.splice(index, 1);
            }
            const allIndex = this.allObjects.indexOf(obj);
            if (allIndex > -1) this.allObjects.splice(allIndex, 1);
        }
    }
    
    // Toggle visibility of all labels and lines
    setLabelsAndLinesVisible(visible) {
        this.allObjects.forEach(obj => {
            // Hide/show label
            if (obj.label) {
                if (obj.label instanceof THREE.Sprite) {
                    obj.label.visible = visible;
                } else if (obj.label instanceof HTMLElement) {
                    // HTML label (lefty or lefthand)
                    obj.label.style.display = visible ? 'block' : 'none';
                }
            }
            
            // Hide/show line
            if (obj.line) {
                if (obj.line instanceof THREE.Line || obj.line instanceof THREE.LineSegments) {
                    obj.line.visible = visible;
                } else if (obj.line instanceof HTMLElement) {
                    // HTML line (if any)
                    obj.line.style.display = visible ? 'block' : 'none';
                }
            }
        });
    }
}

