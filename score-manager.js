// ScoreManager - Manages player score and achievements
// No persistence - all data resets on page reload (incognito mode behavior)
export class ScoreManager {
    constructor() {
        this.score = 0;
        this.achievements = [];
    }
    
    // Add achievement (if not already earned)
    addAchievement(achievementName) {
        if (!this.achievements.includes(achievementName)) {
            this.achievements.push(achievementName);
            this.checkMetaAchievements(); // Check for meta-achievements after adding
            return true; // New achievement
        }
        return false; // Already had this achievement
    }

    // Check for meta-achievements based on combinations
    checkMetaAchievements() {
        // Define meta-achievement combinations
        const metaAchievements = {
            'Victim': ['prostitute', 'transhumanist', 'martian'],
            'Vermin': ['prostitute', 'transhumanist', 'saturn worshipper'],
            'Trafficker': ['prostitute', 'slaver', 'jew'],
            'Snake': ['jew', 'puppet', 'beggar'],
            'Mogul': ['snake', 'jew', 'puppet', 'ancient'],
            'Demon': ['saturn worshipper', 'satanist', 'pedophile'],
            'Hellion': ['saturn worshipper', 'satanist', 'ancient'],
            'Angel': ['archangel', 'astral traveller', 'ancient'],
            'Legend': ['archangel', 'getaway', 'saturn worshipper'],
            'Cosmic': ['time traveller', 'dreamer', 'station'],
            'Void': ['archangel', 'satanist', 'jew'],
            'Nexus': ['prostitute', 'beggar', 'pedophile'],
            'Eclipse': ['martian', 'puppet', 'getaway'],
            // New esoteric meta-achievements (made from existing achievements)
            'Hermetic': ['astral traveller', 'ancient', 'archangel'],
            'Nephilim': ['martian', 'transhumanist', 'saturn worshipper'],
            'Chimera': ['prostitute', 'beggar', 'puppet'],
            'Oracle': ['dreamer', 'time traveller', 'station'],
            'Aether': ['astral traveller', 'time traveller', 'archangel'],
            'Singularity': ['transhumanist', 'martian', 'dreamer'],
            'Zodiac': ['saturn worshipper', 'astral traveller', 'station'],
            // Meta-meta achievements (sets of sets)
            'Apotheosis': ['hermetic', 'angel', 'cosmic'],
            'Abyss': ['demon', 'void', 'nexus'],
            'Pantheon': ['mogul', 'legend', 'apotheosis'],
            // Additional esoteric combinations
            'Ascendant': ['hermetic', 'nephilim', 'oracle'],
            'Labyrinth': ['chimera', 'singularity', 'zodiac'],
            'Genesis': ['aether', 'nephilim', 'station']
        };

        // Check each meta-achievement
        for (const [metaName, requiredAchievements] of Object.entries(metaAchievements)) {
            if (!this.achievements.includes(metaName)) { // Don't check if already earned
                const hasAllRequired = requiredAchievements.every(achievement =>
                    this.achievements.includes(achievement)
                );
                if (hasAllRequired) {
                    this.achievements.push(metaName);
                    console.log(`🏆 Meta-achievement unlocked: ${metaName}`);
                }
            }
        }
    }
    
    // Add score points
    addScore(points) {
        this.score += points;
    }
    
    // Get current score
    getScore() {
        return this.score;
    }
    
    // Get all achievements
    getAchievements() {
        return [...this.achievements]; // Return copy
    }
    
    // Check if achievement is earned
    hasAchievement(achievementName) {
        return this.achievements.includes(achievementName);
    }
}

