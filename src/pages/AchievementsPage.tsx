/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ACHIEVEMENTS_DEFINITIONS } from '../data/achievements';

// --- Achievements Page Component ---
export const AchievementsPage = ({ navigate }: { navigate: (page: string) => void }) => {
    const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

    useEffect(() => {
        setUnlockedAchievements(JSON.parse(localStorage.getItem('unlockedAchievements') || '[]') as string[]);
    }, []);

    const totalAchievements = Object.keys(ACHIEVEMENTS_DEFINITIONS).length;
    const unlockedCount = unlockedAchievements.length;
    const progress = totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0;

    return (
        <div className="page-container achievements-page">
            <header className="page-header-text" style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                <button onClick={() => navigate('journey')} className="back-button" aria-label="Go Back to Journey">
                     <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                </button>
                 <h1 className="app-title">My Achievements</h1>
            </header>
            <main>
                <div className="card no-hover achievements-progress-card">
                    <h3>Your Progress</h3>
                    <p>{unlockedCount} / {totalAchievements} Unlocked</p>
                    <div className="achievements-progress-bar-container">
                        <div className="achievements-progress-bar" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <div className="achievements-grid">
                    {Object.entries(ACHIEVEMENTS_DEFINITIONS).map(([key, achievement]) => {
                        const isUnlocked = unlockedAchievements.includes(key);
                        return (
                            <div key={key} className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                                <div className="achievement-icon">{achievement.icon}</div>
                                <div className="achievement-details">
                                    <h4 className="achievement-title">{achievement.title}</h4>
                                    <p className="achievement-description">{achievement.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};
