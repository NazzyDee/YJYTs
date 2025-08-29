/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
    JournalHistoryEntry, CravingsHistoryEntry, GoalEntry, GratitudeEntry,
    ThoughtDiaryEntry, MeditationEntry, ValuesHistoryEntry, AuditHistoryEntry, AdhdHistoryEntry,
    OppositeActionHistoryEntry, ProblemSolvingHistoryEntry
} from '../types';
import { ALL_TOOLS } from '../data/tools';
import { ACHIEVEMENTS_DEFINITIONS } from '../data/achievements';

// Define a unified history item type
interface UnifiedHistoryItem {
    date: string;
    tool: string;
    icon: React.ReactNode;
    description: string;
    navigateTo: string;
}

export const JourneyPage = ({ navigate, unlockedAchievements }: { navigate: (page: string) => void, unlockedAchievements: string[] }) => {
    const [allHistory, setAllHistory] = useState<any>({});
    const [unifiedHistory, setUnifiedHistory] = useState<UnifiedHistoryItem[]>([]);

    // Load all history data from localStorage
    useEffect(() => {
        const historyKeys = {
            'journal': 'journalHistory', 'cravings': 'cravingsHistory', 'gratitude': 'gratitudeHistory',
            'breathing': 'breathingHistory', 'meditation': 'meditationHistory', 'grounding': 'groundingHistory',
            'thought-diary': 'thoughtDiaryHistory', 'safety-plan': 'safetyPlan', 'relapse-prevention': 'relapsePreventionPlan',
            'values-exercise': 'valuesHistory', 'goals': 'goals', 'audit': 'auditHistory', 'adhd': 'adhdHistory',
            'opposite-action': 'oppositeActionHistory', 'problem-solving': 'problemSolvingHistory'
        };

        const loadedHistory: any = {};
        for (const [toolId, storageKey] of Object.entries(historyKeys)) {
            const isPlan = toolId === 'safety-plan' || toolId === 'relapse-prevention';
            const data = JSON.parse(localStorage.getItem(storageKey) || (isPlan ? '{}' : '[]'));
            if (Array.isArray(data)) {
                // Sort arrays by date for consistent "last used" logic
                data.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
            }
            loadedHistory[toolId] = data;
        }
        setAllHistory(loadedHistory);
    }, []);

    // Create a unified, sorted history list from all tool data
    useEffect(() => {
        if (Object.keys(allHistory).length === 0) return;

        const tempUnifiedHistory: UnifiedHistoryItem[] = [];
        const toolMap = ALL_TOOLS.reduce((acc, tool) => {
            acc[tool.id] = tool;
            return acc;
        }, {} as Record<string, (typeof ALL_TOOLS)[0]>);

        const historyBuilders: Record<string, (item: any) => { date: string, description: string }> = {
            journal: (item: JournalHistoryEntry) => ({ date: item.date, description: `Logged feeling: ${item.data.feeling}` }),
            goals: (item: GoalEntry) => ({ date: item.createdAt, description: `${item.status === 'completed' ? 'Completed' : 'Created'}: ${item.title}` }),
            cravings: (item: CravingsHistoryEntry) => ({ date: item.date, description: `Logged craving with intensity ${item.intensity}/10` }),
            gratitude: (item: GratitudeEntry) => ({ date: item.date, description: `Logged ${item.items.length} things you're grateful for` }),
            breathing: (item: { date: string }) => ({ date: item.date, description: 'Completed a breathing exercise' }),
            grounding: (item: { date: string }) => ({ date: item.date, description: 'Completed a grounding exercise' }),
            meditation: (item: MeditationEntry) => ({ date: item.date, description: `Listened to "${item.title}"` }),
            'thought-diary': (item: ThoughtDiaryEntry) => ({ date: item.date, description: `Completed an entry about: "${item.data.situation.substring(0, 30)}..."` }),
            'values-exercise': (item: ValuesHistoryEntry) => ({ date: item.date, description: `Identified top values: ${item.top5.join(', ')}` }),
            audit: (item: AuditHistoryEntry) => ({ date: item.date, description: `Completed with a score of ${item.score}` }),
            adhd: (item: AdhdHistoryEntry) => ({ date: item.date, description: `Completed with ${item.score}/6 positive answers` }),
            'opposite-action': (item: OppositeActionHistoryEntry) => ({ date: item.date, description: `Practiced with emotion: ${item.emotion}` }),
            'problem-solving': (item: ProblemSolvingHistoryEntry) => ({ date: item.date, description: `Created a plan for: "${item.problemDefinition.substring(0, 30)}..."` }),
        };

        for (const [toolId, builder] of Object.entries(historyBuilders)) {
            (allHistory[toolId] || []).forEach((item: any) => {
                const built = builder(item);
                tempUnifiedHistory.push({
                    ...built,
                    tool: toolMap[toolId].title,
                    icon: toolMap[toolId].icon,
                    navigateTo: toolMap[toolId].navigate,
                });
            });
        }

        tempUnifiedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setUnifiedHistory(tempUnifiedHistory);
    }, [allHistory]);
    
    // Helper function to render a summary LIST ITEM for a given tool
    const renderToolSummaryItem = (tool: (typeof ALL_TOOLS)[0]) => {
        const historyData = allHistory[tool.id];
        let summaryText: React.ReactNode;
        
        if (!historyData || (Array.isArray(historyData) && historyData.length === 0) || (typeof historyData === 'object' && !Array.isArray(historyData) && Object.keys(historyData).length === 0)) {
            summaryText = <span className="tool-summary-status-prompt">Tap to get started</span>;
        } else if (Array.isArray(historyData)) {
            summaryText = (
                <span className="tool-summary-status">
                    {historyData.length} entr{historyData.length === 1 ? 'y' : 'ies'}
                </span>
            );
        } else { // For non-array data like plans
             summaryText = <span className="tool-summary-status-prompt">Plan created</span>;
        }

        return (
            <li key={tool.id} className="tool-summary-item" onClick={() => navigate(tool.navigate)}>
                <div className="journey-history-icon">{tool.icon}</div>
                <div className="tool-summary-details">
                    <span className="tool-summary-title">{tool.title}</span>
                </div>
                {summaryText}
            </li>
        );
    };

    return (
        <div className="page-container">
            <header className="page-header-text">
                <h1 className="app-title">My Journey</h1>
                <p className="app-subtitle">An overview of your progress and history.</p>
            </header>
            <main>
                 <section>
                    <h2 className="section-title">Summary</h2>
                     <div className="card no-hover journey-achievements-summary-card" onClick={() => navigate('achievements')}>
                        <div className="achievement-summary-icon">🏆</div>
                        <div className="achievement-summary-details">
                            <h3 className="card-title">Achievements</h3>
                            <p className="card-subtitle">View your unlocked awards and progress.</p>
                        </div>
                        <div className="achievement-summary-count">
                            <span>{unlockedAchievements.length}</span>
                            <span className="achievement-summary-total">/ {Object.keys(ACHIEVEMENTS_DEFINITIONS).length}</span>
                        </div>
                    </div>

                    <ul className="tool-summary-list">
                        {ALL_TOOLS.map(tool => renderToolSummaryItem(tool))}
                    </ul>
                </section>
                
                <section>
                    <h2 className="section-title">Full History</h2>
                    <div className="card no-hover journey-full-history-card">
                         <div className="journey-card-content">
                            {unifiedHistory.length > 0 ? (
                                <ul className="journey-full-history-list">
                                    {unifiedHistory.map((item, index) => (
                                         <li key={index} className="journey-full-history-item" onClick={() => navigate(item.navigateTo)}>
                                            <div className="journey-history-icon">{item.icon}</div>
                                            <div className="journey-history-details">
                                                <span className="journey-history-tool-title">{item.tool}</span>
                                                <span className="journey-history-description">{item.description}</span>
                                            </div>
                                            <span className="journey-history-date">{new Date(item.date).toLocaleDateString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="no-data-placeholder">
                                    <p>Your journey history will appear here as you use the tools.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};