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
            return true; // New achievement
        }
        return false; // Already had this achievement
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

