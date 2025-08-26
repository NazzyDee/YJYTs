/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// TypeScript declaration for Google Analytics gtag function and non-standard browser APIs
declare global {
    interface Window {
        gtag?: (command: string, actionOrId: string, params?: { [key: string]: any }) => void;
    }
    interface Navigator {
        standalone?: boolean;
        contacts?: {
            select: (props: string[], opts: { multiple: boolean }) => Promise<any[]>;
        };
    }
}

// --- Achievement Definitions ---
const ACHIEVEMENTS_DEFINITIONS = {
    // Journaling
    'journal_1': { title: 'First Entry', description: 'Log your first journal entry.', icon: '✍️', check: ({ journalHistory }: { journalHistory: any[] }) => journalHistory.length >= 1 },
    'journal_5': { title: 'Journal Novice', description: 'Log 5 journal entries.', icon: '📓', check: ({ journalHistory }: { journalHistory: any[] }) => journalHistory.length >= 5 },
    'journal_25': { title: 'Journal Adept', description: 'Log 25 journal entries.', icon: '📚', check: ({ journalHistory }: { journalHistory: any[] }) => journalHistory.length >= 25 },
    'journal_100': { title: 'Journal Master', description: 'Log 100 journal entries.', icon: '📜', check: ({ journalHistory }: { journalHistory: any[] }) => journalHistory.length >= 100 },
    'journal_7_days': { title: 'Consistent Logger', description: 'Log an entry for 7 consecutive days.', icon: '🗓️', check: ({ journalHistory }: { journalHistory: { date: string }[] }) => {
        if (journalHistory.length < 7) return false;
        const dates = [...new Set(journalHistory.map((e: {date: string}) => new Date(e.date).toDateString()))].map(d => new Date(d).getTime());
        if (dates.length < 7) return false;
        dates.sort((a, b) => b - a);
        for (let i = 0; i < 6; i++) {
            const diff = dates[i] - dates[i + 1];
            if (diff > 24 * 60 * 60 * 1000 * 1.5) return false; // Allow 1.5 days for flexibility
        }
        return true;
    }},
    'journal_moods': { title: 'Full Spectrum', description: 'Log an entry for each of the 6 main mood groups.', icon: '🎨', check: ({ journalHistory }: { journalHistory: { data: { feeling: string } }[] }) => {
        const moodGroups = new Set();
        const moodMap = { "Happy": ["Joyful", "Content", "Pleased", "Excited", "Proud", "Optimistic"], "Sad": ["Lonely", "Heartbroken", "Gloomy", "Disappointed", "Hopeless", "Grieving"], "Angry": ["Frustrated", "Annoyed", "Resentful", "Irritated", "Furious", "Jealous"], "Anxious": ["Worried", "Overwhelmed", "Stressed", "Nervous", "Scared", "Insecure"], "Surprised": ["Shocked", "Confused", "Amazed", "Startled", "Awed"], "Calm": ["Peaceful", "Relaxed", "Relieved", "Serene", "Tranquil", "Grateful"] };
        const reverseMoodMap: { [key: string]: string } = {};
        for (const group in moodMap) {
            moodMap[group as keyof typeof moodMap].forEach(feeling => reverseMoodMap[feeling] = group);
            reverseMoodMap[group] = group;
        }
        journalHistory.forEach(entry => {
            const group = reverseMoodMap[entry.data.feeling];
            if (group) moodGroups.add(group);
        });
        return moodGroups.size >= 6;
    }},
    // Cravings
    'craving_1': { title: 'First Craving Logged', description: 'Log your first craving.', icon: '📈', check: ({ cravingsHistory }: { cravingsHistory: any[] }) => cravingsHistory.length >= 1 },
    'craving_10': { title: 'Craving Analyst', description: 'Log 10 cravings.', icon: '📊', check: ({ cravingsHistory }: { cravingsHistory: any[] }) => cravingsHistory.length >= 10 },
    'craving_25': { title: 'Pattern Seeker', description: 'Log 25 cravings to better understand your triggers.', icon: '🧠', check: ({ cravingsHistory }: { cravingsHistory: any[] }) => cravingsHistory.length >= 25 },
    // Tool Usage
    'tool_first_use': { title: 'First Step', description: 'Use any tool for the first time.', icon: '🛠️', check: (data: any) => Object.keys(data).some(key => key.endsWith('History') && data[key].length > 0) || ['safetyPlan', 'relapsePreventionPlan'].some(key => Object.keys(data[key]).length > 0) || data.goals.length > 0 },
    'tool_breathing_1': { title: 'Deep Breather', description: 'Complete a breathing exercise.', icon: '😮‍💨', check: ({ breathingHistory }: { breathingHistory: any[] }) => breathingHistory.length >= 1 },
    'tool_breathing_10': { title: 'Zen Master', description: 'Complete 10 breathing exercises.', icon: '🧘', check: ({ breathingHistory }: { breathingHistory: any[] }) => breathingHistory.length >= 10 },
    'tool_grounding_1': { title: 'Grounded', description: 'Complete the 5-4-3-2-1 exercise.', icon: '👣', check: ({ groundingHistory }: { groundingHistory: any[] }) => groundingHistory.length >= 1 },
    'tool_grounding_10': { title: 'Centered', description: 'Complete 10 grounding exercises.', icon: '🌳', check: ({ groundingHistory }: { groundingHistory: any[] }) => groundingHistory.length >= 10 },
    'tool_values_1': { title: 'Self-Aware', description: 'Complete the Core Values exercise.', icon: '🧭', check: ({ valuesHistory }: { valuesHistory: any[] }) => valuesHistory.length >= 1 },
    'tool_values_2': { title: 'Re-evaluation', description: 'Complete the Core Values exercise more than once.', icon: '🗺️', check: ({ valuesHistory }: { valuesHistory: any[] }) => valuesHistory.length >= 2 },
    'tool_safety_plan': { title: 'Planner', description: 'Start your Safety Plan.', icon: '🛡️', check: ({ safetyPlan }: { safetyPlan: object }) => Object.keys(safetyPlan).length > 0 },
    'tool_safety_plan_full': { title: 'Well Prepared', description: 'Fill out every section of the Safety Plan.', icon: '🏰', check: ({ safetyPlan }: { safetyPlan: { [key: string]: any } }) => Object.values(safetyPlan).filter(v => (Array.isArray(v) ? v.length > 0 : !!v)).length >= 7 },
    'tool_relapse_plan_start': { title: 'Prevention Planner', description: 'Start your Relapse Prevention Plan.', icon: '🛤️', check: ({ relapsePreventionPlan }: { relapsePreventionPlan: object }) => Object.keys(relapsePreventionPlan).length > 0 },
    'tool_relapse_plan_full': { title: 'Forward Thinker', description: 'Fill out every section of the Relapse Prevention Plan.', icon: '🗺️', check: ({ relapsePreventionPlan }: { relapsePreventionPlan: { [key: string]: any } }) => Object.values(relapsePreventionPlan).filter(v => (Array.isArray(v) ? v.length > 0 : !!v)).length >= 4 },
    'tool_goal_setter': { title: 'Goal Setter', description: 'Create your first S.M.A.R.T. goal.', icon: '🎯', check: ({ goals }: { goals: any[] }) => goals.length >= 1 },
    'tool_audit_1': { title: 'Self-Reflection', description: 'Complete the AUDIT screener for the first time.', icon: '🔍', check: ({ auditHistory }: { auditHistory: any[] }) => auditHistory.length >= 1 },
    'tool_audit_2': { title: 'Check-in', description: 'Complete the AUDIT screener more than once.', icon: '🔄', check: ({ auditHistory }: { auditHistory: any[] }) => auditHistory.length >= 2 },
    'tool_adhd_1': { title: 'Insight Seeker', description: 'Complete the ADHD screener for the first time.', icon: '💡', check: ({ adhdHistory }: { adhdHistory: any[] }) => adhdHistory.length >= 1 },
    'tool_adhd_2': { title: 'Self-Awareness Check', description: 'Complete the ADHD screener more than once.', icon: '🤔', check: ({ adhdHistory }: { adhdHistory: any[] }) => adhdHistory.length >= 2 },
    'tool_gratitude_1': { title: 'Grateful Heart', description: 'Log your first gratitude entry.', icon: '💖', check: ({ gratitudeHistory }: { gratitudeHistory: any[] }) => gratitudeHistory.length >= 1 },
    'tool_gratitude_10': { title: 'Attitude of Gratitude', description: 'Log 10 gratitude entries.', icon: '✨', check: ({ gratitudeHistory }: { gratitudeHistory: any[] }) => gratitudeHistory.length >= 10 },
    'tool_thought_diary_1': { title: 'Mindful Observer', description: 'Complete your first Thought Diary entry.', icon: '🧐', check: ({ thoughtDiaryHistory }: { thoughtDiaryHistory: any[] }) => thoughtDiaryHistory.length >= 1 },
    'tool_thought_diary_5': { title: 'Cognitive Reframer', description: 'Complete 5 Thought Diary entries.', icon: '🔄', check: ({ thoughtDiaryHistory }: { thoughtDiaryHistory: any[] }) => thoughtDiaryHistory.length >= 5 },
    'tool_meditation_1': { title: 'Inner Peace', description: 'Complete your first Guided Meditation.', icon: '🧘‍♀️', check: ({ meditationHistory }: { meditationHistory: any[] }) => meditationHistory.length >= 1 },
    'tool_meditation_5': { title: 'Meditation Regular', description: 'Complete 5 Guided Meditations.', icon: '🕉️', check: ({ meditationHistory }: { meditationHistory: any[] }) => meditationHistory.length >= 5 },
    // Goals
    'goal_complete_1': { title: 'Goal Achiever', description: 'Complete your first goal.', icon: '✔️', check: ({ goals }: { goals: { status: string }[] }) => goals.some(g => g.status === 'completed') },
    'goal_complete_5': { title: 'High Achiever', description: 'Complete 5 goals.', icon: '🌟', check: ({ goals }: { goals: { status: string }[] }) => goals.filter(g => g.status === 'completed').length >= 5 },
    'goal_complete_10': { title: 'Unstoppable', description: 'Complete 10 goals.', icon: '🚀', check: ({ goals }: { goals: { status: string }[] }) => goals.filter(g => g.status === 'completed').length >= 10 },
    'goal_value_aligned': { title: 'Value-Aligned', description: 'Create a goal linked to one of your core values.', icon: '🔗', check: ({ goals }: { goals: { relevantValues?: string[] }[] }) => goals.some(g => g.relevantValues && g.relevantValues.length > 0) },
    // Financial
    'financial_100': { title: 'Money Saver', description: 'Save $100 by tracking substance costs.', icon: '💰', check: ({ journalHistory }: { journalHistory: { data: { cost?: string } }[] }) => journalHistory.reduce((sum, e) => sum + (parseFloat(e.data.cost || '0') || 0), 0) >= 100 },
    'financial_500': { title: 'Smart Spender', description: 'Save $500 by tracking substance costs.', icon: '💵', check: ({ journalHistory }: { journalHistory: { data: { cost?: string } }[] }) => journalHistory.reduce((sum, e) => sum + (parseFloat(e.data.cost || '0') || 0), 0) >= 500 },
    'financial_1000': { title: 'Financially Savvy', description: 'Save $1000 by tracking substance costs.', icon: '🏦', check: ({ journalHistory }: { journalHistory: { data: { cost?: string } }[] }) => journalHistory.reduce((sum, e) => sum + (parseFloat(e.data.cost || '0') || 0), 0) >= 1000 },
    // Engagement
    'engagement_3_days': { title: 'Welcome Back', description: 'Open the app on 3 different days.', icon: '👋', check: ({ loginHistory }: { loginHistory: string[] }) => new Set(loginHistory.map(d => new Date(d).toDateString())).size >= 3 },
    'engagement_7_days': { title: 'Regular User', description: 'Open the app on 7 different days.', icon: '🤗', check: ({ loginHistory }: { loginHistory: string[] }) => new Set(loginHistory.map(d => new Date(d).toDateString())).size >= 7 },
    'engagement_30_days': { title: 'Committed', description: 'Open the app on 30 different days.', icon: '💖', check: ({ loginHistory }: { loginHistory: string[] }) => new Set(loginHistory.map(d => new Date(d).toDateString())).size >= 30 },
    'engagement_night_owl': { title: 'Night Owl', description: 'Log an entry between 10 PM and 4 AM.', icon: '🦉', check: ({ journalHistory }: { journalHistory: { date: string }[] }) => journalHistory.some(e => { const h = new Date(e.date).getHours(); return h >= 22 || h < 4; }) },
    'engagement_early_bird': { title: 'Early Bird', description: 'Log an entry between 4 AM and 8 AM.', icon: '🐦', check: ({ journalHistory }: { journalHistory: { date: string }[] }) => journalHistory.some(e => { const h = new Date(e.date).getHours(); return h >= 4 && h < 8; }) },
    'engagement_3_tools': { title: 'Explorer', description: 'Use 3 different tools.', icon: '🗺️', check: (data: any) => ['groundingHistory', 'breathingHistory', 'valuesHistory', 'safetyPlan', 'goals', 'auditHistory', 'adhdHistory', 'gratitudeHistory', 'thoughtDiaryHistory', 'meditationHistory', 'relapsePreventionPlan'].filter(k => data[k] && (Array.isArray(data[k]) ? data[k].length > 0 : Object.keys(data[k]).length > 0)).length >= 3 },
    'engagement_all_tools': { title: 'Toolkit Master', description: 'Use all available tools at least once.', icon: '🧰', check: (data: any) => ['groundingHistory', 'breathingHistory', 'valuesHistory', 'safetyPlan', 'goals', 'auditHistory', 'adhdHistory', 'gratitudeHistory', 'thoughtDiaryHistory', 'meditationHistory', 'relapsePreventionPlan'].every(k => data[k] && (Array.isArray(data[k]) ? data[k].length > 0 : Object.keys(data[k]).length > 0)) },
    'engagement_profile_full': { title: 'Profile Complete', description: 'Fill out all fields in your profile.', icon: '🆔', check: ({ userProfile }: { userProfile: object }) => userProfile && Object.values(userProfile).every(v => v !== '') },
    'engagement_discord': { title: 'Community Member', description: 'Visit the Discord Community.', icon: '💬', check: ({ events }: { events: string[] }) => events.includes('discord_visit') },
    'engagement_1_month_user': { title: 'One Month In', description: 'Use the app for a month since your first entry.', icon: '🌱', check: ({ journalHistory }: { journalHistory: { date: string }[] }) => journalHistory.length > 0 && (new Date().getTime() - new Date(journalHistory[journalHistory.length - 1].date).getTime()) >= 30 * 86400000 },
    'engagement_25_unlocked': { title: 'Quarter Century', description: 'Unlock 25 achievements.', icon: '🌟', check: ({ unlockedAchievements }: { unlockedAchievements: any[] }) => unlockedAchievements.length >= 25 },
    'engagement_40_unlocked': { title: 'Almost There', description: 'Unlock 40 achievements.', icon: '🌠', check: ({ unlockedAchievements }: { unlockedAchievements: any[] }) => unlockedAchievements.length >= 40 },
    'engagement_share_plan': { title: 'Helping Hand', description: 'Share your safety plan with a contact.', icon: '💌', check: ({ events }: { events: string[] }) => events.includes('share_safety_plan') },
    'engagement_weekend': { title: 'Weekend Warrior', description: 'Log an entry on a Saturday and a Sunday.', icon: '😎', check: ({ journalHistory }: { journalHistory: { date: string }[] }) => { const days = new Set(journalHistory.map(e => new Date(e.date).getDay())); return days.has(6) && days.has(0); }},
    'engagement_full_house': { title: 'Full House', description: 'Have at least one entry in Journal, Cravings, and Goals.', icon: '🏡', check: ({ journalHistory, cravingsHistory, goals }: { journalHistory: any[], cravingsHistory: any[], goals: any[] }) => journalHistory.length > 0 && cravingsHistory.length > 0 && goals.length > 0 }
};

// --- Single Source of Truth for All Tools ---
const ALL_TOOLS = [
    {
        id: 'journal',
        title: 'Daily Journal',
        subtitle: 'Log mood and substance use',
        icon: <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-8v-2h8v2zm0-4h-8v-2h8v2zM13 9V3.5L18.5 9H13z"/></svg>,
        navigate: 'journal',
        category: 'Trackers',
    },
    {
        id: 'gratitude',
        title: 'Gratitude Log',
        subtitle: 'Record things you are thankful for',
        icon: <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
        navigate: 'gratitude',
        category: 'Trackers',
    },
    {
        id: 'cravings',
        title: 'Craving Tracker',
        subtitle: 'Monitor and manage cravings',
        icon: <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>,
        navigate: 'cravings',
        category: 'Trackers',
    },
    {
        id: 'breathing',
        title: 'Breathing',
        subtitle: 'Calm your mind and body',
        icon: <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 6.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5S10.62 8.5 12 8.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>,
        navigate: 'breathing',
        category: 'Exercises',
    },
    {
        id: 'meditation',
        title: 'Guided Meditation',
        subtitle: 'Audio exercises for mindfulness',
        icon: <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM15.5 12c0-1.93-1.57-3.5-3.5-3.5S8.5 10.07 8.5 12H7c0-2.76 2.24-5 5-5s5 2.24 5 5h-1.5z"/></svg>,
        navigate: 'meditation',
        category: 'Exercises',
    },
    {
        id: 'grounding',
        title: '5-4-3-2-1',
        subtitle: 'Grounding technique',
        icon: <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M5 15.5c0 2.54 1.63 4.78 3.93 5.61.4.15.87.15 1.27 0C12.5 20.28 14.13 18.04 14.13 15.5V11H5v4.5zM19 11h-3.13c0-2.54-1.63-4.78-3.93-5.61-.4-.15-.87-.15-1.27 0C8.5 6.22 6.87 8.46 6.87 11H3c0-4.99 4.02-9 9-9s9 4.01 9 9z"/></svg>,
        navigate: 'grounding',
        category: 'Exercises',
    },
    {
        id: 'thought-diary',
        title: 'Thought Diary',
        subtitle: 'CBT-based thought reframing',
        icon: <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-11h2v2h-2v-2zm0 4h2v6h-2v-6z"/></svg>,
        navigate: 'thought-diary',
        category: 'Exercises',
    },
    {
        id: 'values',
        title: 'Core Values',
        subtitle: 'Discover your guiding principles',
        icon: <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 8.5l10 13.5L22 8.5L12 2zm0 2.31l7.5 5.19L12 18.31L4.5 9.5L12 4.31z"/></svg>,
        navigate: 'values-exercise',
        category: 'Exercises',
    },
    {
        id: 'safety-plan',
        title: 'Safety Plan',
        subtitle: 'Your guide for tough moments',
        icon: <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>,
        navigate: 'safety-plan',
        category: 'Exercises',
    },
    {
        id: 'relapse-prevention',
        title: 'Relapse Prevention',
        subtitle: 'Plan for handling triggers',
        icon: <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>,
        navigate: 'relapse-prevention',
        category: 'Exercises',
    },
    {
        id: 'audit',
        title: 'AUDIT Screener',
        subtitle: 'Alcohol Use Disorders Identification Test',
        icon: <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>,
        navigate: 'audit',
        category: 'Exercises',
    },
    {
        id: 'adhd',
        title: 'ADHD Screener',
        subtitle: 'Adult Self-Report Scale (ASRS)',
        icon: <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4C9.24 4 7 6.24 7 9c0 2.24 1.76 4.09 4 4.43V19h2v-5.57c2.24-.34 4-2.19 4-4.43 0-2.76-2.24-5-5-5zm-3.5 5c-.83 0-1.5-.67-1.5-1.5S7.67 6 8.5 6s1.5.67 1.5 1.5S9.33 9 8.5 9zm3.5 2c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.5-2c-.83 0-1.5-.67-1.5-1.5S14.67 6 15.5 6s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>,
        navigate: 'adhd',
        category: 'Exercises',
    },
    {
        id: 'goals',
        title: 'My Goals',
        subtitle: 'Set and track S.M.A.R.T. goals',
        icon: <svg className="card-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>,
        navigate: 'goals',
        category: 'Growth',
    }
];

// --- Type Definitions for History ---
interface AuditHistoryEntry {
    score: number;
    date: string;
}

interface AdhdHistoryEntry {
    score: number;
    date: string;
    answers: { [key: number]: number };
}

interface JournalHistoryEntry {
    date: string;
    data: {
        feeling: string;
        substance: string;
        place?: string;
        amount: string;
        unit: string;
        cost?: string;
    };
}

interface CravingsHistoryEntry {
    date: string;
    intensity: number;
    trigger?: string;
    copingMechanism?: string;
}

interface GoalEntry {
    id: string;
    title: string; // Specific
    measurable: string;
    achievable: string;
    relevant: string;
    relevantValues?: string[]; // Optional linked values
    targetDate: string; // Time-bound
    status: 'active' | 'completed';
    createdAt: string;
}

interface GratitudeEntry {
    date: string;
    items: string[];
}

interface ThoughtDiaryEntry {
    date: string;
    data: {
        situation: string;
        thoughts: string;
        feelings: string;
        evidenceFor: string;
        evidenceAgainst: string;
        alternativeThought: string;
        outcome: string;
    };
}

interface MeditationEntry {
    date: string;
    title: string;
    duration: number; // in seconds
}

interface ValuesHistoryEntry {
    date: string;
    top5: string[];
}


// --- Toast Notification Component ---
const Toast = ({ message, icon, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="toast-notification">
            <div className="toast-icon">{icon}</div>
            <div className="toast-content">
                <p className="toast-title">Achievement Unlocked!</p>
                <p className="toast-message">{message}</p>
            </div>
        </div>
    );
};

// --- Reusable Info Tooltip Component ---
const InfoTooltip = ({ text }) => {
    return (
        <div className="info-tooltip-container">
            <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            <span className="tooltip-text">{text}</span>
        </div>
    );
};


// --- Achievements Page Component ---
const AchievementsPage = ({ navigate }) => {
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


// --- Google Analytics Utility ---
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
    if (window.gtag) {
        window.gtag('event', action, {
            'event_category': category,
            'event_label': label,
            'value': value,
        });
    }
};

// --- Login Page Component ---
const LoginPage = ({ onLoginSuccess }) => {
    const [pin, setPin] = useState('');
    const [username, setUsername] = useState('');
    const [firstPinAttempt, setFirstPinAttempt] = useState('');
    const [error, setError] = useState('');
    const [setupStage, setSetupStage] = useState('login'); // 'login', 'createPin', 'confirmPin', 'createUsername'
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmDeleteText, setConfirmDeleteText] = useState('');
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [flashingDotIndex, setFlashingDotIndex] = useState<number | null>(null);
    const [flickeringButton, setFlickeringButton] = useState<string | null>(null);

    useEffect(() => {
        const storedPin = localStorage.getItem('userPIN');
        if (!storedPin) {
            setSetupStage('createPin');
        }
    }, []);

    const handlePinChange = (value) => {
        if (pin.length < 4) {
            const currentIndex = pin.length;
            setFlashingDotIndex(currentIndex);
            setFlickeringButton(value);
            setPin(pin + value);

            setTimeout(() => {
                setFlashingDotIndex(null);
            }, 300); // Match CSS animation duration
            setTimeout(() => {
                setFlickeringButton(null);
            }, 300);
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError('');
    };

    const handleUsernameSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) {
            localStorage.setItem('userPIN', firstPinAttempt);
            const userProfile = {
                username: username.trim(),
                gender: '',
                dob: '',
                emergencyContactName: '',
                emergencyContactPhone: ''
            };
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            localStorage.removeItem('username'); // Clean up old key
            onLoginSuccess();
        } else {
            setError('Username cannot be empty.');
        }
    };

    const handlePinSubmit = (e) => {
        e.preventDefault();

        switch(setupStage) {
            case 'login': {
                const storedPin = localStorage.getItem('userPIN');
                if (pin === storedPin) {
                    trackEvent('login', 'Authentication', 'login_success');
                    onLoginSuccess();
                } else {
                    setError('Incorrect PIN. Please try again.');
                    setPin('');
                }
                break;
            }
            case 'createPin': {
                setFirstPinAttempt(pin);
                setPin('');
                setError('');
                setSetupStage('confirmPin');
                break;
            }
            case 'confirmPin': {
                if (pin === firstPinAttempt) {
                    setPin('');
                    setError('');
                    setShowPrivacyModal(true); // Show privacy modal before username creation
                } else {
                    setError('PINs do not match. Please start over.');
                    setPin('');
                    setFirstPinAttempt('');
                    setSetupStage('createPin');
                }
                break;
            }
        }
    };
    
    const handleForgotPin = () => {
        setShowConfirmModal(true);
        setConfirmDeleteText(''); // Reset on open
    };

    const handleConfirmDelete = () => {
        localStorage.clear(); // Clear all data
        setShowConfirmModal(false);
        window.location.reload(); // Reload the app to reset its state
    };
    
    const handlePrivacyAccept = () => {
        setShowPrivacyModal(false);
        setSetupStage('createUsername');
    };

    if (setupStage === 'createUsername') {
        return (
            <div className="page-container">
                <div className="login-container">
                    <div className="app-logo-container">
                        <svg className="logo-graphic" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8"/>
                            <path d="M50 50 L 78 22 L 65 65 Z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeWidth="4" />
                            <path d="M50 50 L 22 78 L 35 35 Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="4" />
                        </svg>
                        <h1 className="logo-text">Your Journey<br/>Your Tools</h1>
                    </div>
                    <div className="card login-card">
                        <h2>Create Your Profile</h2>
                        <form onSubmit={handleUsernameSubmit}>
                            <div className="form-group">
                                <label htmlFor="username">What should we call you?</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your name or nickname"
                                    autoFocus
                                />
                            </div>
                            {error && <p className="pin-error">{error}</p>}
                            <button type="submit" className="log-button" style={{marginTop: '1.5rem'}}>Get Started</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
    
    const getPinTitle = () => {
        switch(setupStage) {
            case 'login': return 'Enter Your PIN';
            case 'createPin': return 'Create a 4-Digit PIN';
            case 'confirmPin': return 'Confirm Your PIN';
            default: return '';
        }
    };

    return (
        <div className="page-container">
            <div className="login-container">
                <div className="app-logo-container">
                    <svg className="logo-graphic" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8"/>
                        <path d="M50 50 L 78 22 L 65 65 Z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeWidth="4" />
                        <path d="M50 50 L 22 78 L 35 35 Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="4" />
                    </svg>
                    <h1 className="logo-text">Your Journey<br/>Your Tools</h1>
                </div>

                <div className="card login-card">
                    <h2>{getPinTitle()}</h2>
                    <div className="pin-input-container">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''} ${flashingDotIndex === i ? 'flashing' : ''}`}></div>
                        ))}
                    </div>
                    <div className="pin-error">{error}</div>
                    <form onSubmit={handlePinSubmit}>
                        <div className="pin-keypad">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button type="button" key={num} onClick={() => handlePinChange(num.toString())} className={flickeringButton === num.toString() ? 'flickering' : ''}>{num}</button>
                            ))}
                            <button type="button" onClick={handleDelete} aria-label="Delete">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 11H6.83l3.58-3.59L9 6l-6 6 6 6 1.41-1.41L6.83 13H21v-2Z" fill="currentColor"/></svg>
                            </button>
                            <button type="button" onClick={() => handlePinChange('0')} className={flickeringButton === '0' ? 'flickering' : ''}>0</button>
                            <button type="submit" className="confirm-button" disabled={pin.length < 4} aria-label="Confirm PIN">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z" fill="currentColor"/></svg>
                            </button>
                        </div>
                    </form>
                    {setupStage === 'login' && <button className="forgot-pin-button" onClick={handleForgotPin}>Forgot PIN?</button>}
                </div>
            </div>

            {showConfirmModal && (
                <div className="confirm-modal-overlay">
                    <div className="card confirm-modal-content">
                        <h3>Reset Your Account?</h3>
                        <p>Forgetting your PIN requires resetting the app. This will permanently delete all your data, including your PIN, profile, and all journal entries. This action cannot be undone.</p>
                        <p style={{ marginTop: '1rem' }}>Please type "<strong>delete</strong>" to confirm.</p>
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <input
                                type="text"
                                value={confirmDeleteText}
                                onChange={(e) => setConfirmDeleteText(e.target.value)}
                                placeholder='Type to confirm...'
                                autoFocus
                            />
                        </div>
                        <div className="confirm-modal-actions">
                            <button className="modal-button cancel" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                            <button className="modal-button confirm" onClick={handleConfirmDelete} disabled={confirmDeleteText !== 'delete'}>Reset and Delete</button>
                        </div>
                    </div>
                </div>
            )}
             {showPrivacyModal && (
                <div className="confirm-modal-overlay">
                    <div className="card confirm-modal-content">
                        <h3>Your Privacy Matters</h3>
                        <p style={{textAlign: 'left'}}>
                            <strong>Your Journey, Your Tools</strong> is a privacy-focused application. All the data you enter, including your PIN, journal entries, goals, and personal information, is stored <strong>exclusively on your device</strong>.
                            <br/><br/>
                            We do not have a server, and we do not collect, view, or share any of your personal data. This means your information remains private to you.
                             <br/><br/>
                            The only exception is the optional, anonymous usage data we collect via Google Analytics to help us understand which features are most used and improve the app.
                        </p>
                        <div className="confirm-modal-actions" style={{justifyContent: 'center'}}>
                            <button className="modal-button confirm" style={{backgroundColor: 'var(--accent-teal)', color: 'var(--bg-dark)'}} onClick={handlePrivacyAccept}>I Understand</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Journal Page Component ---
const JournalPage = ({ navigate }) => {
    const moodGroups = {
        Happy: ["Joyful", "Content", "Pleased", "Excited", "Proud", "Optimistic"],
        Sad: ["Lonely", "Heartbroken", "Gloomy", "Disappointed", "Hopeless", "Grieving"],
        Angry: ["Frustrated", "Annoyed", "Resentful", "Irritated", "Furious", "Jealous"],
        Anxious: ["Worried", "Overwhelmed", "Stressed", "Nervous", "Scared", "Insecure"],
        Surprised: ["Shocked", "Confused", "Amazed", "Startled", "Awed"],
        Calm: ["Peaceful", "Relaxed", "Relieved", "Serene", "Tranquil", "Grateful"]
    };

    const moodMetadata = {
        Happy: { color: '#27ae60', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM8.5 11.5c.83 0 1.5-.67 1.5-1.5S9.33 8.5 8.5 8.5 7 9.17 7 10s.67 1.5 1.5 1.5zm7 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg> },
        Sad: { color: '#3498db', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM8.5 11.5c.83 0 1.5-.67 1.5-1.5S9.33 8.5 8.5 8.5 7 9.17 7 10s.67 1.5 1.5 1.5zm7 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM12 14c-2.33 0-4.31 1.46-5.11 3.5h10.22c-.8-2.04-2.78-3.5-5.11-3.5z"/></svg> },
        Angry: { color: '#e74c3c', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM8.27 12.12c.34-.01.67.12.91.36.24.24.37.57.36.91-.01.34-.14.66-.37.9-.23.24-.56.37-.9.36-.34.01-.67-.12-.91-.36s-.37-.57-.36-.91c.01-.34.14-.66.37.9.24-.23.56-.36.9-.36zm7.46 0c.34-.01.67.12.91.36.24.24.37.57.36.91-.01.34-.14.66-.37.9-.23.24-.56.37-.9.36-.34.01-.67-.12-.91-.36s-.37-.57-.36-.91c.01-.34.14-.66.37.9.24-.23.56-.36.9-.36zM12 14c-1.68 0-3.18.8-4.1 2.01.21.05.42.08.64.08h6.92c.22 0 .43-.03.64-.08C15.18 14.8 13.68 14 12 14zm-3.5-5.04l-1.06-1.06c-.2-.2-.2-.51 0-.71s.51-.2.71 0l1.06 1.06c.2.2.2.51 0 .71-.2.2-.51.2-.71 0zm7 0l1.06-1.06c.2-.2.51-.2.71 0s.2.51 0 .71l-1.06 1.06c-.2.2-.51.2-.71 0-.2-.2-.2-.51 0-.71z"/></svg> },
        Anxious: { color: '#f39c12', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM9.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-5.09-4.24l-1.41-1.41c-.2-.2-.2-.51 0-.71s.51-.2.71 0l1.41 1.41c.2.2.2.51 0 .71-.2.2-.51.2-.71 0zm8.6.01l1.41-1.41c.2-.2.51-.2.71 0s.2.51 0 .71l-1.41 1.41c-.2.2-.51.2-.71 0-.2-.2-.2-.51 0-.71zM8 16h8v-1.5c0-.83-.67-1.5-1.5-1.5h-5C8.67 13 8 13.67 8 14.5V16z"/></svg> },
        Surprised: { color: '#9b59b6', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM9.5 10c.83 0 1.5-.67 1.5-1.5S10.33 7 9.5 7 8 7.67 8 8.5 8.67 10 9.5 10zm5 0c.83 0 1.5-.67 1.5-1.5S15.33 7 14.5 7s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-2.5 2c-1.93 0-3.5 1.57-3.5 3.5S10.07 19 12 19s3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 14 12 14s1.5.67 1.5 1.5S12.83 17 12 17z"/></svg> },
        Calm: { color: '#1abc9c', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM8 12.5h8v-1H8v1zm1.5-3C10.33 9.5 11 8.83 11 8s-.67-1.5-1.5-1.5S8 7.17 8 8s.67 1.5 1.5 1.5zm5 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5 1.5z"/></svg> }
    };

    const allSearchableMoods = useMemo(() => {
        const headings = Object.keys(moodGroups);
        const feelings = Object.values(moodGroups).flat();
        return [...new Set([...headings, ...feelings])];
    }, []);

    const substanceUnits = {
        'Alcohol': ['Standard Drink(s)', 'Shot(s)', 'Glass(es) of Wine', 'Can(s) of Beer'],
        'Cannabis': ['Gram(s)', 'Joint(s)', 'Edible(s)'],
        'Cocaine': ['Line(s)', 'Gram(s)', 'Dose(s)'],
        'MDMA (Ecstasy)': ['Pill(s)', 'Dose(s)', 'Gram(s)'],
        'Heroin': ['Dose(s)', 'Point(s)', 'Gram(s)', 'Bag(s)'],
        'Methamphetamine (Ice)': ['Point(s)', 'Gram(s)', 'Dose(s)'],
        'Inhalants': ['Dose(s)', 'Can(s)'],
        'Ketamine': ['Dose(s)', 'Gram(s)', 'Line(s)'],
        'LSD (Acid)': ['Tab(s)', 'Dose(s)'],
        'Other': ['Dose(s)', 'Pill(s)', 'Gram(s)']
    };
     const substanceOrder = [
        'Alcohol',
        'Cannabis',
        'Cocaine',
        'MDMA (Ecstasy)',
        'Heroin',
        'Methamphetamine (Ice)',
        'Inhalants',
        'Ketamine',
        'LSD (Acid)',
        'Other'
    ];

    const [feeling, setFeeling] = useState('');
    const [feelingSearch, setFeelingSearch] = useState('');
    const [feelingSuggestions, setFeelingSuggestions] = useState<string[]>([]);
    const [entryDateTime, setEntryDateTime] = useState(new Date());
    const [substance, setSubstance] = useState('');
    const [place, setPlace] = useState('');
    const [amount, setAmount] = useState('');
    const [unit, setUnit] = useState('');
    const [cost, setCost] = useState('');
    const [history, setHistory] = useState([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showMoodSelector, setShowMoodSelector] = useState(false);
    const [selectedMoodGroup, setSelectedMoodGroup] = useState<keyof typeof moodGroups | null>(null);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('journalHistory') || '[]');
        setHistory(storedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);
    
    const handleFeelingSearchChange = (e) => {
        const value = e.target.value;
        setFeelingSearch(value);
        if (value) {
            setFeelingSuggestions(allSearchableMoods.filter(f => f.toLowerCase().startsWith(value.toLowerCase())));
        } else {
            setFeelingSuggestions([]);
        }
    };

    const selectFeeling = (selectedFeeling) => {
        setFeeling(selectedFeeling);
        setFeelingSearch(selectedFeeling);
        setFeelingSuggestions([]);
    };
    
    const handleCloseMoodSelector = () => {
        setShowMoodSelector(false);
        setSelectedMoodGroup(null); // Reset view on close
    };

    const handleMoodSelect = (mood) => {
        selectFeeling(mood);
        handleCloseMoodSelector();
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateStr = e.target.value; // YYYY-MM-DD
        if (!dateStr) return;
        const [year, month, day] = dateStr.split('-').map(Number);
        if (!year || !month || !day) return;
        const newDate = new Date(entryDateTime);
        newDate.setFullYear(year, month - 1, day);
        setEntryDateTime(newDate);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const timeStr = e.target.value; // HH:mm
        if (!timeStr) return;
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return;
        const newDate = new Date(entryDateTime);
        newDate.setHours(hours, minutes);
        setEntryDateTime(newDate);
    };

    const toISODateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const toISOTimeString = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const handleLogEntry = (e) => {
        e.preventDefault();
        const newEntry = {
            date: entryDateTime.toISOString(),
            data: {
                feeling,
                substance,
                place,
                amount,
                unit,
                cost
            }
        };

        const updatedHistory = [newEntry, ...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        localStorage.setItem('journalHistory', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
        
        // Reset form
        setFeeling('');
        setFeelingSearch('');
        setSubstance('');
        setPlace('');
        setAmount('');
        setUnit('');
        setCost('');
        setEntryDateTime(new Date());

        // Show confirmation
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
        window.dispatchEvent(new Event('app:action'));
    };

    const isLogButtonDisabled = !feeling || !substance || !amount || !unit;

    return (
        <div className="page-container" style={{paddingTop: '1rem'}}>
            <header className="page-header-text" style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                     <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                </button>
                 <h1 className="app-title">Daily Journal</h1>
            </header>

            <main>
                <form onSubmit={handleLogEntry} className="card tracker-section">
                    <p className="tracker-description">Log your mood and substance use to gain insight.</p>

                    <div className="form-group">
                        <label>How are you feeling?</label>
                        <div className="feeling-input-container">
                            <input
                                type="text"
                                value={feelingSearch}
                                onChange={handleFeelingSearchChange}
                                onBlur={() => setTimeout(() => setFeelingSuggestions([]), 150)}
                                onFocus={handleFeelingSearchChange}
                                placeholder="Type to search for a feeling..."
                                required
                            />
                            {feelingSuggestions.length > 0 && (
                                <ul className="feeling-suggestions-list">
                                    {feelingSuggestions.map(f => <li key={f} onMouseDown={() => selectFeeling(f)}>{f}</li>)}
                                </ul>
                            )}
                        </div>
                        <div className="feeling-wheel-prompt">
                           <button type="button" className="link-button" onClick={() => setShowMoodSelector(true)}>Click here to select your mood</button>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Date & Time of Use</label>
                        <div className="date-time-inputs">
                            <input
                                type="date"
                                value={toISODateString(entryDateTime)}
                                onChange={handleDateChange}
                                required
                            />
                            <input
                                type="time"
                                value={toISOTimeString(entryDateTime)}
                                onChange={handleTimeChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Substance</label>
                        <select value={substance} onChange={(e) => { setSubstance(e.target.value); setUnit(''); }} required>
                            <option value="" disabled>Select Substance</option>
                            {substanceOrder.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Place or People (Optional)</label>
                        <input type="text" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="e.g., At home, with friends" />
                    </div>

                    <div className="form-group">
                        <label>Amount / Quantity</label>
                        <div className="amount-inputs">
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 1" required />
                            <select value={unit} onChange={(e) => setUnit(e.target.value)} disabled={!substance} required>
                                <option value="" disabled>{substance ? 'Select Unit' : 'Select Substance First'}</option>
                                {substance && substanceUnits[substance as keyof typeof substanceUnits] && substanceUnits[substance as keyof typeof substanceUnits].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Cost (Optional)</label>
                        <div className="cost-input-container">
                            <span>$</span>
                            <input
                                type="number"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                placeholder="e.g., 20.50"
                                step="0.01"
                                min="0"
                            />
                        </div>
                    </div>

                    <button type="submit" className="log-button" disabled={isLogButtonDisabled} style={{marginTop: '1rem'}}>Log Entry</button>
                    {showConfirmation && <p className="confirmation-message">Entry Logged Successfully!</p>}
                </form>

                <section className="history-section">
                    <hr className="history-divider" />
                    <h3 className="history-title">History</h3>
                    {history.length > 0 ? (
                        <ul className="history-list">
                            {history.slice(0, 5).map(entry => {
                                const entryDate = new Date(entry.date);
                                const formattedDate = entryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }); // e.g., "24 July"
                                const formattedTime = entryDate.toLocaleTimeString('en-US', { timeStyle: 'short' }); // e.g., "3:30 PM"

                                return (
                                    <li key={entry.date} className="history-item">
                                        <div className="history-feeling">{entry.data.feeling}</div>
                                        <div className="history-details">
                                            <span><strong>{entry.data.substance}</strong> - {entry.data.amount} {entry.data.unit}</span>
                                            <span>{formattedDate} at {formattedTime}</span>
                                            {entry.data.place && <span className="location-text">Place/People: {entry.data.place}</span>}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="no-history-message">No entries yet. Your history will appear here.</p>
                    )}
                </section>
            </main>
            {showMoodSelector && (
                 <div className="mood-selector-overlay" onClick={handleCloseMoodSelector}>
                    <div className="card mood-selector-content" onClick={(e) => e.stopPropagation()}>
                        {selectedMoodGroup ? (
                            <div className="mood-details-view">
                                <header className="mood-details-header">
                                     <button onClick={() => setSelectedMoodGroup(null)} className="back-button" aria-label="Back to mood groups">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                                    </button>
                                    <button className="mood-header-selectable" onClick={() => handleMoodSelect(selectedMoodGroup)}>
                                        <div className="mood-card-icon" style={{ '--mood-color': moodMetadata[selectedMoodGroup].color } as React.CSSProperties}>
                                            {moodMetadata[selectedMoodGroup].icon}
                                        </div>
                                        <h3>{selectedMoodGroup}</h3>
                                    </button>
                                </header>
                                <div className="mood-chip-container">
                                    {moodGroups[selectedMoodGroup].map(mood => (
                                        <button key={mood} className="mood-chip" onClick={() => handleMoodSelect(mood)}>
                                            {mood}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="app-title">How are you feeling?</h2>
                                <p>Select a general mood group to see more specific feelings.</p>
                                <div className="mood-grid">
                                    {Object.keys(moodGroups).map((group) => (
                                        <button key={group} className="mood-category-card" style={{ '--mood-color': moodMetadata[group as keyof typeof moodMetadata].color } as React.CSSProperties} onClick={() => setSelectedMoodGroup(group as keyof typeof moodGroups)}>
                                            <div className="mood-card-icon">{moodMetadata[group as keyof typeof moodMetadata].icon}</div>
                                            <h4 className="mood-card-title">{group}</h4>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- HomePage Component ---
const HomePage = ({ userProfile, pinnedTools, togglePin, navigate }) => {
    const [lastUseDate, setLastUseDate] = useState<Date | null>(null);
    const [soberTime, setSoberTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const loadLastUseDate = () => {
            const journalHistory: JournalHistoryEntry[] = JSON.parse(localStorage.getItem('journalHistory') || '[]');
            if (journalHistory.length > 0) {
                const sortedHistory = [...journalHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setLastUseDate(new Date(sortedHistory[0].date));
            } else {
                setLastUseDate(null);
            }
        };

        loadLastUseDate();
        
        window.addEventListener('app:action', loadLastUseDate);
        
        return () => {
            window.removeEventListener('app:action', loadLastUseDate);
        };
    }, []);

    useEffect(() => {
        if (!lastUseDate) {
            setSoberTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            return;
        }

        const intervalId = setInterval(() => {
            const now = new Date().getTime();
            const lastUseTime = lastUseDate.getTime();
            const diff = now - lastUseTime;

            if (diff < 0) return;

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setSoberTime({ days, hours, minutes, seconds });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [lastUseDate]);

    return (
        <div className="page-container">
            <header className="app-header">
                <div className="header-content">
                    <h1 className="welcome-message">Hello, {userProfile.username}</h1>
                    <p className="app-subtitle">Welcome back to your journey.</p>
                </div>
            </header>
            <main>
                <section>
                    <h2 className="section-title">My Progress</h2>
                    <div className="card no-hover sober-clock-card">
                        <h3 className="card-title" style={{marginBottom: 0}}>Time Sober</h3>
                        {lastUseDate ? (
                            <div className="sober-clock-container">
                                <div className="time-segment">
                                    <span className="time-value">{soberTime.days}</span>
                                    <span className="time-label">Days</span>
                                </div>
                                <div className="time-segment">
                                    <span className="time-value">{String(soberTime.hours).padStart(2, '0')}</span>
                                    <span className="time-label">Hours</span>
                                </div>
                                <div className="time-segment">
                                    <span className="time-value">{String(soberTime.minutes).padStart(2, '0')}</span>
                                    <span className="time-label">Minutes</span>
                                </div>
                                <div className="time-segment">
                                    <span className="time-value">{String(soberTime.seconds).padStart(2, '0')}</span>
                                    <span className="time-label">Seconds</span>
                                </div>
                            </div>
                        ) : (
                            <div className="sober-clock-prompt">
                                <p>Log your last use in the Daily Journal to start the clock.</p>
                                <button className="dashboard-card-cta" style={{marginTop: '1rem'}} onClick={() => navigate('journal')}>
                                    Go to Journal
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="section-title">My Pinned Tools</h2>
                    {pinnedTools.length > 0 ? (
                        <div className="card-grid home-grid">
                            {ALL_TOOLS.filter(tool => pinnedTools.includes(tool.id)).map(tool => (
                                <ToolCard key={tool.id} tool={tool} navigate={navigate} isPinned={true} togglePin={togglePin} />
                            ))}
                        </div>
                    ) : (
                        <div className="card no-hover empty-home-prompt">
                           <p>Your dashboard is empty. Go to the <strong>Tools</strong> tab to pin your favorite features for quick access here!</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

// --- ToolCard Component (reusable) ---
const ToolCard = ({ tool, navigate, isPinned, togglePin }) => {
    const handleClick = () => {
        if (tool.external) {
            window.open(tool.navigate, '_blank');
        } else {
            navigate(tool.navigate);
        }
    };

    return (
        <div className="card" onClick={handleClick}>
             <button
                className={`card-pin-button ${isPinned ? 'pinned' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    togglePin(tool.id);
                }}
                aria-label={isPinned ? `Unpin ${tool.title}` : `Pin ${tool.title}`}
            >
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1.03 1.03.01.01c.38.38 1.02.38 1.41 0l.01-.01L13 21v-7h6v-2c-1.66 0-3-1.34-3-3z"/>
                </svg>
            </button>
            {tool.icon}
            <h3 className="card-title">{tool.title}</h3>
            <p className="card-subtitle">{tool.subtitle}</p>
        </div>
    );
};

// --- ToolsPage Component ---
const ToolsPage = ({ navigate, pinnedTools, togglePin }) => {
    const categories = ALL_TOOLS.reduce((acc, tool) => {
        (acc[tool.category] = acc[tool.category] || []).push(tool);
        return acc;
    }, {});

    const categoryOrder = ['Trackers', 'Exercises', 'Growth'];

    return (
        <div className="page-container">
            <header className="page-header-text">
                <h1 className="app-title">Tools</h1>
                <p className="app-subtitle">Explore all available resources.</p>
            </header>
            <main>
                {categoryOrder.map(category => (
                    <section key={category}>
                        <h2 className="section-title">{category}</h2>
                        <div className="card-grid home-grid">
                            {categories[category].map(tool => (
                                <ToolCard
                                    key={tool.id}
                                    tool={tool}
                                    navigate={navigate}
                                    isPinned={pinnedTools.includes(tool.id)}
                                    togglePin={togglePin}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </main>
        </div>
    );
};


// --- Profile Page Component ---
const ProfilePage = ({ navigate }) => {
    const [profile, setProfile] = useState({
        username: '',
        gender: '',
        dob: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactEmail: ''
    });
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const storedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        setProfile(p => ({ ...p, ...storedProfile }));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('userProfile', JSON.stringify(profile));
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
        window.dispatchEvent(new Event('app:action'));
        window.dispatchEvent(new CustomEvent('app:profile_updated', { detail: profile }));
    };

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('home')} className="back-button" aria-label="Go Back to Home">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                <h1 className="app-title">My Profile</h1>
            </header>
            <main>
                <form onSubmit={handleSave} className="card profile-form">
                    <p className="tracker-description">This information is stored only on your device and is never shared.</p>
                    
                    <div className="form-group">
                        <label htmlFor="username">Name / Nickname</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={profile.username}
                            onChange={handleChange}
                            placeholder="How should we call you?"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="dob">Date of Birth</label>
                        <input
                            id="dob"
                            name="dob"
                            type="date"
                            value={profile.dob}
                            onChange={handleChange}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="gender">Gender</label>
                        <select id="gender" name="gender" value={profile.gender} onChange={handleChange}>
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                    </div>

                    <h3 className="profile-section-title">Emergency Contact</h3>
                    <p className="tracker-description" style={{textAlign: 'left', marginTop: '-1rem'}}>This person can be contacted in case of an emergency. You can also share your Safety Plan with them.</p>

                    <div className="form-group">
                        <label htmlFor="emergencyContactName">Contact Name</label>
                        <input
                            id="emergencyContactName"
                            name="emergencyContactName"
                            type="text"
                            value={profile.emergencyContactName}
                            onChange={handleChange}
                            placeholder="e.g., Jane Doe"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="emergencyContactPhone">Contact Phone</label>
                        <input
                            id="emergencyContactPhone"
                            name="emergencyContactPhone"
                            type="tel"
                            value={profile.emergencyContactPhone}
                            onChange={handleChange}
                            placeholder="e.g., (555) 123-4567"
                        />
                    </div>
                    
                     <div className="form-group">
                        <label htmlFor="emergencyContactEmail">Contact Email</label>
                        <input
                            id="emergencyContactEmail"
                            name="emergencyContactEmail"
                            type="email"
                            value={profile.emergencyContactEmail}
                            onChange={handleChange}
                            placeholder="e.g., jane.doe@example.com"
                        />
                    </div>

                    <button type="submit" className="log-button" style={{ marginTop: '1rem' }}>Save Profile</button>
                    {showConfirmation && <p className="confirmation-message">Profile saved successfully!</p>}
                </form>
            </main>
        </div>
    );
};

// --- Privacy Policy Page Component ---
const PrivacyPage = ({ navigate }) => {
    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('home')} className="back-button" aria-label="Go Back to Home">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                <h1 className="app-title">Privacy Policy</h1>
            </header>
            <main>
                <div className="card no-hover" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                    <p style={{ lineHeight: 1.7, color: 'var(--text-muted)' }}>
                        <strong>Your Journey, Your Tools</strong> is a privacy-focused application. All the data you enter, including your PIN, journal entries, goals, and personal information, is stored <strong>exclusively on your device</strong>.
                        <br /><br />
                        We do not have a server, and we do not collect, view, or share any of your personal data. This means your information remains private to you.
                        <br /><br />
                        The only exception is the optional, anonymous usage data we collect via Google Analytics to help us understand which features are most used and improve the app.
                    </p>
                </div>
            </main>
        </div>
    );
};


// --- Gratitude Log Page Component ---
const GratitudeLogPage = ({ navigate }) => {
    const [items, setItems] = useState(['', '', '']);
    const [history, setHistory] = useState<GratitudeEntry[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('gratitudeHistory') || '[]') as GratitudeEntry[];
        setHistory(storedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);

    const handleItemChange = (index: number, value: string) => {
        const newItems = [...items];
        newItems[index] = value;
        setItems(newItems);
    };

    const handleLogEntry = (e: React.FormEvent) => {
        e.preventDefault();
        const newEntry = {
            date: new Date().toISOString(),
            items: items.filter(item => item.trim() !== '')
        };

        if (newEntry.items.length < 3) return; // Ensure all three are filled

        const updatedHistory = [newEntry, ...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        localStorage.setItem('gratitudeHistory', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);

        setItems(['', '', '']);
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
        window.dispatchEvent(new Event('app:action'));
    };
    
    const isLogButtonDisabled = items.some(item => item.trim() === '');

    return (
        <div className="page-container" style={{paddingTop: '1rem'}}>
            <header className="page-header-text" style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                     <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                </button>
                 <h1 className="app-title">Gratitude Log</h1>
            </header>

            <main>
                <form onSubmit={handleLogEntry} className="card tracker-section">
                    <p className="tracker-description">Take a moment to list three things you are grateful for today.</p>
                    
                    {items.map((item, index) => (
                         <div className="form-group" key={index}>
                            <label htmlFor={`gratitude-item-${index + 1}`}>Thing #{index + 1}</label>
                            <textarea
                                id={`gratitude-item-${index + 1}`}
                                value={item}
                                onChange={(e) => handleItemChange(index, e.target.value)}
                                placeholder="What went well today? What are you thankful for?"
                                rows={3}
                                required
                            />
                        </div>
                    ))}
                    
                    <button type="submit" className="log-button" disabled={isLogButtonDisabled} style={{marginTop: '1rem'}}>Log Gratitude</button>
                    {showConfirmation && <p className="confirmation-message">Gratitude logged successfully!</p>}
                </form>

                <section className="history-section">
                    <hr className="history-divider" />
                    <h3 className="history-title">History</h3>
                    {history.length > 0 ? (
                        <ul className="history-list">
                            {history.slice(0, 10).map(entry => (
                                <li key={entry.date} className="history-item gratitude-history-item">
                                    <div className="gratitude-history-item-date">
                                        {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                    <ul className="gratitude-history-item-list">
                                        {entry.items.map((gratitudeItem, idx) => (
                                            <li key={idx}>{gratitudeItem}</li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-history-message">Your gratitude history will appear here.</p>
                    )}
                </section>
            </main>
        </div>
    );
};


// --- Guided Meditation Page ---
const MEDITATION_TRACKS = [
    {
        id: 'breathing_meditation',
        title: 'Breathing Meditation',
        subtitle: 'From UCLA Health',
        duration: 300,
        url: 'https://www.uclahealth.org/marc/mpeg/01_Breathing_Meditation.mp3',
    },
    {
        id: 'mindful_break',
        title: '5-Minute Mindful Break',
        subtitle: 'Coming Soon',
        duration: 323,
        url: null,
    },
    {
        id: 'body_scan',
        title: 'Body Scan for Relaxation',
        subtitle: 'Coming Soon',
        duration: 1200,
        url: null,
    },
];

const GuidedMeditationPage = ({ navigate }) => {
    const [selectedTrack, setSelectedTrack] = useState<(typeof MEDITATION_TRACKS)[number] | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [history, setHistory] = useState<MeditationEntry[]>([]);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('meditationHistory') || '[]') as MeditationEntry[];
        setHistory(storedHistory);
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setCurrentTime(audio.currentTime);

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
        };
    }, [selectedTrack]);

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };
    
    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            const newTime = Number(e.target.value);
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleSessionEnd = () => {
        if (!selectedTrack) return;
        setIsPlaying(false);
        const newEntry: MeditationEntry = {
            date: new Date().toISOString(),
            title: selectedTrack.title,
            duration: selectedTrack.duration,
        };

        const updatedHistory = [newEntry, ...history];
        localStorage.setItem('meditationHistory', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
        window.dispatchEvent(new Event('app:action'));
    };
    
    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    if (selectedTrack && selectedTrack.url) {
        return (
            <div className="page-container" style={{ paddingTop: '1rem' }}>
                <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <button onClick={() => setSelectedTrack(null)} className="back-button" aria-label="Back to Meditation List">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                    </button>
                    <h1 className="app-title">Now Playing</h1>
                </header>
                <main>
                    <div className="card meditation-player-card">
                        <div className="meditation-player-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM15.5 12c0-1.93-1.57-3.5-3.5-3.5S8.5 10.07 8.5 12H7c0-2.76 2.24-5 5-5s5 2.24 5 5h-1.5z"/></svg>
                        </div>
                        <h2 className="meditation-player-title">{selectedTrack.title}</h2>
                        <p className="meditation-player-subtitle">{selectedTrack.subtitle}</p>

                        <div className="meditation-player-controls">
                            <input
                                type="range"
                                className="meditation-progress-bar"
                                value={currentTime}
                                max={duration || 1}
                                onChange={handleProgressChange}
                            />
                            <div className="meditation-time-display">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                            <button className={`meditation-play-button ${isPlaying ? 'playing' : ''}`} onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
                                {isPlaying ? (
                                    <svg className="pause-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                ) : (
                                    <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                )}
                            </button>
                        </div>
                        <audio ref={audioRef} src={selectedTrack.url} onEnded={handleSessionEnd}></audio>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                </button>
                <h1 className="app-title">Guided Meditation</h1>
            </header>
            <main>
                <div className="meditation-list">
                    {MEDITATION_TRACKS.map(track => (
                        <button key={track.id} className="card meditation-item" onClick={() => setSelectedTrack(track)} disabled={!track.url}>
                            <div className="meditation-item-info">
                                <h3 className="meditation-item-title">{track.title}</h3>
                                <p className="meditation-item-subtitle">{track.subtitle}</p>
                            </div>
                            <span className="meditation-item-duration">{formatTime(track.duration)}</span>
                        </button>
                    ))}
                </div>
                <section className="history-section">
                    <hr className="history-divider" />
                    <h3 className="history-title">History</h3>
                    {history.length > 0 ? (
                        <ul className="history-list">
                             {history.slice(0, 5).map((entry, index) => (
                                <li key={index} className="history-item">
                                    <div className="history-details" style={{flexGrow: 1}}>
                                        <span><strong>{entry.title}</strong></span>
                                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                                    </div>
                                    <span>{formatTime(entry.duration)}</span>
                                </li>
                             ))}
                        </ul>
                    ) : (
                        <p className="no-history-message">You haven't completed any meditations yet.</p>
                    )}
                </section>
            </main>
        </div>
    );
};


// --- Helper component for dynamic string list in Safety Plan ---
const DynamicListSection = ({ title, description, items, setItems, placeholder }) => {
    const [newItem, setNewItem] = useState('');

    const handleAddItem = () => {
        if (newItem.trim()) {
            setItems([...items, newItem.trim()]);
            setNewItem('');
        }
    };

    const handleRemoveItem = (indexToRemove) => {
        setItems(items.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="plan-form-section">
            <div className="plan-section-header">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
            {items.length > 0 && (
                <div className="list-item-container">
                    {items.map((item, index) => (
                        <div key={index} className="list-item">
                            <input type="text" value={item} readOnly disabled style={{flexGrow: 1}}/>
                            <button type="button" onClick={() => handleRemoveItem(index)} className="remove-list-item-btn" aria-label={`Remove ${item}`}>
                                 <svg viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="form-group" style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center', marginTop: items.length > 0 ? '1rem' : '0' }}>
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder={placeholder}
                    style={{flexGrow: 1}}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); }}}
                />
                <button type="button" onClick={handleAddItem} className="add-list-item-btn" style={{background: 'transparent', border: '1px solid var(--border-color)', padding: '0.7rem', flexShrink: 0, borderRadius: '8px', marginTop: 0}}>
                    Add
                </button>
            </div>
        </div>
    );
};

// --- Helper component for dynamic contact list in Safety Plan ---
const DynamicContactListSection = ({ title, description, contacts, setContacts, placeholderName, placeholderPhone, children }: { title: string, description: string, contacts: any[], setContacts: (newContacts: any[]) => void, placeholderName: string, placeholderPhone: string, children?: React.ReactNode }) => {
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');

    const handleAddContact = () => {
        if (newName.trim()) {
            setContacts([...contacts, { id: Date.now(), name: newName.trim(), phone: newPhone.trim() }]);
            setNewName('');
            setNewPhone('');
        }
    };

    const handleRemoveContact = (idToRemove) => {
        setContacts(contacts.filter(c => c.id !== idToRemove));
    };

    return (
        <div className="plan-form-section">
            <div className="plan-section-header">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
            {children}
            {contacts.length > 0 && (
                <div className="contact-list">
                    {contacts.map((contact) => (
                        <div key={contact.id} className="contact-item" style={{flexDirection: 'column', alignItems: 'stretch', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', gap: '0.75rem'}}>
                           <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                             <strong style={{color: 'var(--text-light)'}}>{contact.name}</strong>
                             <button type="button" onClick={() => handleRemoveContact(contact.id)} className="remove-contact-btn" aria-label={`Remove ${contact.name}`}>
                                <svg viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                             </button>
                           </div>
                           <p style={{color: 'var(--text-muted)'}}>{contact.phone || 'No phone number'}</p>
                        </div>
                    ))}
                </div>
            )}
             <div className="form-group" style={{marginTop: '1rem'}}>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={placeholderName} />
                <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder={placeholderPhone} />
             </div>
             <button type="button" onClick={handleAddContact} className="add-contact-btn" style={{alignSelf: 'flex-end'}}>
                 <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                 Add Contact
             </button>
        </div>
    );
};

// --- Safety Plan Page Component ---
const SafetyPlanPage = ({ navigate }) => {
    const [plan, setPlan] = useState({
        warningSigns: '',
        copingStrategies: [],
        socialSettings: [],
        peopleForHelp: [],
        professionals: [],
        safeEnvironment: '',
        reasonsForLiving: '',
    });
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const storedPlan = JSON.parse(localStorage.getItem('safetyPlan') || '{}');
        // Ensure all keys are present with correct types
        setPlan(p => ({
            warningSigns: storedPlan.warningSigns || '',
            copingStrategies: storedPlan.copingStrategies || [],
            socialSettings: storedPlan.socialSettings || [],
            peopleForHelp: storedPlan.peopleForHelp || [],
            professionals: storedPlan.professionals || [],
            safeEnvironment: storedPlan.safeEnvironment || '',
            reasonsForLiving: storedPlan.reasonsForLiving || '',
        }));

        const storedProfile = JSON.parse(localStorage.getItem('userProfile') || null);
        setUserProfile(storedProfile);
    }, []);

    const handleSave = (e) => {
        e.preventDefault();
        localStorage.setItem('safetyPlan', JSON.stringify(plan));
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
        window.dispatchEvent(new Event('app:action'));
    };

    const handleShare = async () => {
        const planText = `
My Safety Plan (from Your Journey Your Tools):

**1. Warning Signs (thoughts, images, mood, situation, behavior):**
${plan.warningSigns || 'Not specified'}

**2. Internal Coping Strategies (things I can do to take my mind off problems without contacting anyone else):**
${plan.copingStrategies.length > 0 ? plan.copingStrategies.map(s => `- ${s}`).join('\n') : 'Not specified'}

**3. People and Social Settings That Provide Distraction:**
${plan.socialSettings.length > 0 ? plan.socialSettings.map(s => `- ${s}`).join('\n') : 'Not specified'}

**4. People Whom I Can Ask for Help:**
${plan.peopleForHelp.length > 0 ? plan.peopleForHelp.map(p => `- ${p.name}${p.phone ? ` (${p.phone})` : ''}`).join('\n') : 'Not specified'}

**5. Professionals or Agencies I Can Contact During a Crisis:**
${plan.professionals.length > 0 ? plan.professionals.map(p => `- ${p.name}${p.phone ? ` (${p.phone})` : ''}`).join('\n') : 'Not specified'}

**6. Making the Environment Safe:**
${plan.safeEnvironment || 'Not specified'}

**7. My Reasons for Living:**
${plan.reasonsForLiving || 'Not specified'}
        `.trim().replace(/\n\n\n/g, '\n\n');

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'My Safety Plan',
                    text: planText,
                });
                const currentEvents = JSON.parse(localStorage.getItem('eventHistory') || '[]') as string[];
                if (!currentEvents.includes('share_safety_plan')) {
                    localStorage.setItem('eventHistory', JSON.stringify([...currentEvents, 'share_safety_plan']));
                    window.dispatchEvent(new Event('app:action'));
                }
            } else {
                await navigator.clipboard.writeText(planText);
                alert('Safety Plan copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing safety plan:', error);
            alert('Could not share or copy the plan.');
        }
    };
    
    const handleTextChange = (e) => {
        const { name, value } = e.target;
        setPlan(p => ({ ...p, [name]: value }));
    };

    const addEmergencyContact = () => {
        if (userProfile && userProfile.emergencyContactName) {
            setPlan(p => ({
                ...p,
                peopleForHelp: [...p.peopleForHelp, { id: Date.now(), name: userProfile.emergencyContactName, phone: userProfile.emergencyContactPhone || '' }]
            }));
        }
    };
    
    const handleImportContacts = async () => {
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        try {
            const contacts = await navigator.contacts.select(props, opts);
            if (contacts.length > 0) {
                const newContacts = contacts
                    .map(contact => ({
                        id: Date.now() + Math.random(),
                        name: contact.name[0],
                        phone: contact.tel[0] || ''
                    }))
                    .filter(newContact =>
                        // Filter out duplicates already in the plan
                        !plan.peopleForHelp.some(existing => existing.name === newContact.name && existing.phone === newContact.phone)
                    );

                if (newContacts.length > 0) {
                     setPlan(p => ({
                        ...p,
                        peopleForHelp: [...p.peopleForHelp, ...newContacts]
                    }));
                }
            }
        } catch (ex) {
            console.error('Error selecting contacts:', ex);
            // The user may have canceled the picker, which is not an error we need to show them.
        }
    };

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 className="app-title">Safety Plan</h1>
                    <InfoTooltip text="This is a proactive tool to help you navigate moments of intense distress or crisis. By identifying your personal warning signs and coping strategies in advance, you create a clear guide to stay safe." />
                </div>
            </header>
            <main>
                <form onSubmit={handleSave} className="plan-form-container">
                    <div className="plan-form-section">
                        <div className="plan-section-header">
                            <h3>1. Warning Signs</h3>
                            <p>What thoughts, images, moods, situations, or behaviors tell you a crisis may be developing?</p>
                        </div>
                        <div className="form-group">
                            <textarea
                                name="warningSigns"
                                value={plan.warningSigns}
                                onChange={handleTextChange}
                                rows={4}
                                placeholder="e.g., Feeling hopeless, isolating myself..."
                            />
                        </div>
                    </div>

                    <DynamicListSection
                        title="2. Internal Coping Strategies"
                        description="Things I can do on my own to distract myself and feel better."
                        items={plan.copingStrategies}
                        setItems={(newItems) => setPlan(p => ({ ...p, copingStrategies: newItems }))}
                        placeholder="e.g., Listen to calming music..."
                    />

                    <DynamicListSection
                        title="3. People & Social Settings for Distraction"
                        description="Places I can go or people I can be with to take my mind off things."
                        items={plan.socialSettings}
                        setItems={(newItems) => setPlan(p => ({ ...p, socialSettings: newItems }))}
                        placeholder="e.g., Go to a coffee shop..."
                    />

                    <DynamicContactListSection
                        title="4. People I Can Ask for Help"
                        description="Friends or family members I can talk to when I need support."
                        contacts={plan.peopleForHelp}
                        setContacts={(newContacts) => setPlan(p => ({ ...p, peopleForHelp: newContacts }))}
                        placeholderName="e.g., Jane Doe"
                        placeholderPhone="e.g., (555) 123-4567"
                    >
                        <div className="contact-actions-container">
                             {userProfile?.emergencyContactName && !plan.peopleForHelp.some(p => p.name === userProfile.emergencyContactName) && (
                                <button type="button" onClick={addEmergencyContact} className="add-contact-btn">
                                     <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                                    Add {userProfile.emergencyContactName} (Emergency Contact)
                                </button>
                            )}
                            {'contacts' in navigator && 'select' in navigator.contacts && (
                                 <button type="button" onClick={handleImportContacts} className="add-contact-btn">
                                     <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM6 18V6h12v12H6zm7-11h-2v2H9v2h2v2h2v-2h2v-2h-2V7zm-2 5c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>
                                    Import from Contacts
                                </button>
                            )}
                        </div>
                    </DynamicContactListSection>

                    <DynamicContactListSection
                        title="5. Professionals or Agencies I Can Contact"
                        description="My therapist, doctor, or crisis lines that I can call for help."
                        contacts={plan.professionals}
                        setContacts={(newContacts) => setPlan(p => ({ ...p, professionals: newContacts }))}
                        placeholderName="e.g., Crisis Hotline"
                        placeholderPhone="e.g., 988"
                    />

                    <div className="plan-form-section">
                        <div className="plan-section-header">
                            <h3>6. Making the Environment Safe</h3>
                            <p>What can I do to make it less likely I will act on my thoughts of self-harm?</p>
                        </div>
                        <div className="form-group">
                            <textarea
                                name="safeEnvironment"
                                value={plan.safeEnvironment}
                                onChange={handleTextChange}
                                rows={4}
                                placeholder="e.g., Remove any means of harm from my home..."
                            />
                        </div>
                    </div>
                    
                    <div className="plan-form-section">
                        <div className="plan-section-header">
                            <h3>7. My Reasons For Living</h3>
                            <p>The most important things to me that are worth living for.</p>
                        </div>
                        <div className="form-group">
                            <textarea
                                name="reasonsForLiving"
                                value={plan.reasonsForLiving}
                                onChange={handleTextChange}
                                rows={4}
                                placeholder="e.g., My family, my pets, future goals..."
                            />
                        </div>
                    </div>

                    <div className="safety-plan-actions">
                         <button type="submit" className="log-button">Save Plan</button>
                         <button type="button" onClick={handleShare} className="log-button secondary">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/></svg>
                            Share My Plan
                         </button>
                         {showConfirmation && <p className="confirmation-message">Plan Saved Successfully!</p>}
                    </div>
                </form>
            </main>
        </div>
    );
};


// --- Relapse Prevention Page Component ---
const RelapsePreventionPage = ({ navigate }) => {
    const [plan, setPlan] = useState({
        triggers: [],
        copingSkills: [],
        supportNetwork: [],
        lifestyleChanges: '',
    });
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const storedPlan = JSON.parse(localStorage.getItem('relapsePreventionPlan') || '{}');
        setPlan({
            triggers: storedPlan.triggers || [],
            copingSkills: storedPlan.copingSkills || [],
            supportNetwork: storedPlan.supportNetwork || [],
            lifestyleChanges: storedPlan.lifestyleChanges || '',
        });
        const storedProfile = JSON.parse(localStorage.getItem('userProfile') || null);
        setUserProfile(storedProfile);
    }, []);

    const handleSave = (e) => {
        e.preventDefault();
        localStorage.setItem('relapsePreventionPlan', JSON.stringify(plan));
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
        window.dispatchEvent(new Event('app:action'));
    };

    const handleShare = async () => {
        const planText = `
My Relapse Prevention Plan (from Your Journey Your Tools):

**1. My Triggers:**
${plan.triggers.length > 0 ? plan.triggers.map(s => `- ${s}`).join('\n') : 'Not specified'}

**2. Healthy Coping Skills:**
${plan.copingSkills.length > 0 ? plan.copingSkills.map(s => `- ${s}`).join('\n') : 'Not specified'}

**3. My Support Network:**
${plan.supportNetwork.length > 0 ? plan.supportNetwork.map(p => `- ${p.name}${p.phone ? ` (${p.phone})` : ''}`).join('\n') : 'Not specified'}

**4. Positive Lifestyle Changes:**
${plan.lifestyleChanges || 'Not specified'}
        `.trim().replace(/\n\n\n/g, '\n\n');

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'My Relapse Prevention Plan',
                    text: planText,
                });
            } else {
                await navigator.clipboard.writeText(planText);
                alert('Relapse Prevention Plan copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing plan:', error);
            alert('Could not share or copy the plan.');
        }
    };

    const handleTextChange = (e) => {
        const { name, value } = e.target;
        setPlan(p => ({ ...p, [name]: value }));
    };

    const addEmergencyContact = () => {
        if (userProfile && userProfile.emergencyContactName) {
            const emergencyContact = {
                id: Date.now(),
                name: userProfile.emergencyContactName,
                phone: userProfile.emergencyContactPhone || ''
            };
            // Avoid adding duplicates
            if (!plan.supportNetwork.some(p => p.name === emergencyContact.name)) {
                setPlan(p => ({
                    ...p,
                    supportNetwork: [...p.supportNetwork, emergencyContact]
                }));
            }
        }
    };

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 className="app-title">Relapse Prevention Plan</h1>
                    <InfoTooltip text="This plan helps you identify personal triggers and high-risk situations for substance use, and prepares you with healthy coping skills and a support network to maintain your recovery." />
                </div>
            </header>
            <main>
                <form onSubmit={handleSave} className="plan-form-container">
                    <DynamicListSection
                        title="1. My Triggers"
                        description="List people, places, feelings, or situations that make you want to use."
                        items={plan.triggers}
                        setItems={(newItems) => setPlan(p => ({ ...p, triggers: newItems }))}
                        placeholder="e.g., Feeling stressed after work..."
                    />

                    <DynamicListSection
                        title="2. Healthy Coping Skills"
                        description="What can you do instead of using when you encounter a trigger?"
                        items={plan.copingSkills}
                        setItems={(newItems) => setPlan(p => ({ ...p, copingSkills: newItems }))}
                        placeholder="e.g., Call a friend, go for a walk..."
                    />

                    <DynamicContactListSection
                        title="3. My Support Network"
                        description="Who can you call for support when you're struggling?"
                        contacts={plan.supportNetwork}
                        setContacts={(newContacts) => setPlan(p => ({ ...p, supportNetwork: newContacts }))}
                        placeholderName="e.g., Sponsor's Name"
                        placeholderPhone="e.g., (555) 555-5555"
                    >
                        {userProfile?.emergencyContactName && !plan.supportNetwork.some(p => p.name === userProfile.emergencyContactName) && (
                            <button type="button" onClick={addEmergencyContact} className="add-contact-btn" style={{marginTop: 0}}>
                                 <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                                Add {userProfile.emergencyContactName} (Emergency Contact)
                            </button>
                        )}
                    </DynamicContactListSection>

                    <div className="plan-form-section">
                        <div className="plan-section-header">
                            <h3>4. Positive Lifestyle Changes</h3>
                            <p>What new routines or activities can support your recovery?</p>
                        </div>
                        <div className="form-group">
                            <textarea
                                name="lifestyleChanges"
                                value={plan.lifestyleChanges}
                                onChange={handleTextChange}
                                rows={4}
                                placeholder="e.g., Attend meetings, exercise 3 times a week, start a new hobby..."
                            />
                        </div>
                    </div>

                    <div className="safety-plan-actions">
                         <button type="submit" className="log-button">Save Plan</button>
                         <button type="button" onClick={handleShare} className="log-button secondary">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/></svg>
                            Share My Plan
                         </button>
                         {showConfirmation && <p className="confirmation-message">Plan Saved Successfully!</p>}
                    </div>
                </form>
            </main>
        </div>
    );
};


// --- Thought Diary Page ---
const ThoughtDiaryPage = ({ navigate }) => {
    const STEPS = [
        { key: 'situation', title: "The Situation", prompt: "Describe the event or situation that triggered the negative thoughts. Be objective and stick to the facts." },
        { key: 'thoughts', title: "Automatic Thoughts", prompt: "What were the immediate thoughts or images that went through your mind? Don't filter, just write them down." },
        { key: 'feelings', title: "Feelings & Emotions", prompt: "What emotions did you feel? List them and rate their intensity (e.g., Sad 80%, Anxious 90%)." },
        { key: 'evidenceFor', title: "Evidence For The Thoughts", prompt: "What facts or evidence support the truthfulness of your automatic thoughts?" },
        { key: 'evidenceAgainst', title: "Evidence Against The Thoughts", prompt: "What facts or evidence contradict your automatic thoughts? Is there another way to see this?" },
        { key: 'alternativeThought', title: "Alternative, Balanced Thought", prompt: "Considering the evidence, what is a more balanced and realistic way of looking at this situation?" },
        { key: 'outcome', title: "Outcome", prompt: "How do you feel now? Re-rate your emotions and note any changes in your perspective." },
    ];

    const [view, setView] = useState<'list' | 'form'>('list');
    const [currentStep, setCurrentStep] = useState(0);
    const [entryData, setEntryData] = useState({
        situation: '',
        thoughts: '',
        feelings: '',
        evidenceFor: '',
        evidenceAgainst: '',
        alternativeThought: '',
        outcome: '',
    });
    const [history, setHistory] = useState<ThoughtDiaryEntry[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('thoughtDiaryHistory') || '[]') as ThoughtDiaryEntry[];
        setHistory(storedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEntryData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const newEntry: ThoughtDiaryEntry = {
            date: new Date().toISOString(),
            data: entryData,
        };
        const updatedHistory = [newEntry, ...history];
        localStorage.setItem('thoughtDiaryHistory', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
        
        setView('list');
        setCurrentStep(0);
        setEntryData({ situation: '', thoughts: '', feelings: '', evidenceFor: '', evidenceAgainst: '', alternativeThought: '', outcome: '' });
        
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
        window.dispatchEvent(new Event('app:action'));
    };

    const progress = (currentStep / STEPS.length) * 100;

    if (view === 'form') {
        const isLastStep = currentStep === STEPS.length;
        const currentStepData = isLastStep ? null : STEPS[currentStep];
        const canGoNext = currentStepData ? entryData[currentStepData.key as keyof typeof entryData].trim() !== '' : true;

        return (
             <div className="page-container" style={{paddingTop: '1rem'}}>
                <header className="page-header-text" style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                    <button onClick={() => setView('list')} className="back-button" aria-label="Cancel and Go Back">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                    <h1 className="app-title">New Thought Diary</h1>
                </header>
                <main>
                    <div className="thought-diary-progress-bar-container">
                        <div className="thought-diary-progress-bar" style={{ width: `${isLastStep ? 100 : progress}%` }}></div>
                    </div>
                    
                    {isLastStep ? (
                        <div className="card no-hover thought-diary-card">
                            <h2 className="thought-diary-step-title">Entry Summary</h2>
                             {STEPS.map(step => (
                                <div key={step.key} className="thought-diary-summary-item">
                                    <h4>{step.title}</h4>
                                    <p>{entryData[step.key as keyof typeof entryData] || 'No response.'}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card no-hover thought-diary-card">
                            <p className="adhd-question-number">Step {currentStep + 1} of {STEPS.length}</p>
                            <h2 className="thought-diary-step-title">{currentStepData?.title}</h2>
                            <p className="tracker-description" style={{textAlign: 'left'}}>{currentStepData?.prompt}</p>
                            <div className="form-group">
                                <textarea
                                    name={currentStepData?.key}
                                    value={entryData[currentStepData?.key as keyof typeof entryData]}
                                    onChange={handleInputChange}
                                    rows={6}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}
                    
                    <div className="thought-diary-navigation">
                        <button
                            className="log-button secondary"
                            onClick={() => setCurrentStep(p => p - 1)}
                            disabled={currentStep === 0}
                        >
                            Previous
                        </button>
                        {isLastStep ? (
                             <button
                                className="log-button"
                                onClick={handleSave}
                            >
                                Save Entry
                            </button>
                        ) : (
                            <button
                                className="log-button"
                                onClick={() => setCurrentStep(p => p + 1)}
                                disabled={!canGoNext}
                            >
                                Next
                            </button>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="page-container" style={{paddingTop: '1rem'}}>
            <header className="page-header-text" style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                     <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 className="app-title">Thought Diary</h1>
                    <InfoTooltip text="Based on Cognitive Behavioral Therapy (CBT), this tool helps you identify, challenge, and reframe negative thought patterns by examining the evidence for and against them." />
                </div>
            </header>
            <main>
                <div className="card no-hover" style={{textAlign: 'left', gap: '1.5rem', marginBottom: '2rem'}}>
                     <div className="form-section-title" style={{color: 'var(--accent-teal)'}}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-11h2v2h-2v-2zm0 4h2v6h-2v-6z"/></svg>
                        <h3>Challenge Your Thoughts</h3>
                    </div>
                    <p className="tracker-description" style={{textAlign: 'left'}}>
                        This exercise, based on Cognitive Behavioral Therapy (CBT), helps you identify, challenge, and reframe unhelpful thought patterns. By examining the evidence, you can develop more balanced perspectives.
                    </p>
                    <button className="log-button" onClick={() => setView('form')}>Start New Entry</button>
                </div>
                {showConfirmation && <p className="confirmation-message">Entry Saved Successfully!</p>}

                <section className="history-section" style={{marginTop: 0}}>
                    <h3 className="history-title">History</h3>
                    {history.length > 0 ? (
                        <ul className="history-list">
                            {history.map(entry => (
                                <li key={entry.date} className="history-item">
                                    <div className="history-details" style={{gap: '0.25rem'}}>
                                        <strong>{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                                        <span style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>{entry.data.situation.substring(0, 50)}...</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-history-message">No entries yet. Start a new entry to see your history here.</p>
                    )}
                </section>
            </main>
        </div>
    );
};


// --- Cravings Page Component ---
const CravingsPage = ({ navigate }) => {
    const [intensity, setIntensity] = useState(5);
    const [entryDateTime, setEntryDateTime] = useState(new Date());
    const [trigger, setTrigger] = useState('');
    const [copingMechanism, setCopingMechanism] = useState('');
    const [history, setHistory] = useState<CravingsHistoryEntry[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('cravingsHistory') || '[]') as CravingsHistoryEntry[];
        setHistory(storedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateStr = e.target.value; // YYYY-MM-DD
        if (!dateStr) return;
        const [year, month, day] = dateStr.split('-').map(Number);
        if (!year || !month || !day) return;
        const newDate = new Date(entryDateTime);
        newDate.setFullYear(year, month - 1, day);
        setEntryDateTime(newDate);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const timeStr = e.target.value; // HH:mm
        if (!timeStr) return;
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return;
        const newDate = new Date(entryDateTime);
        newDate.setHours(hours, minutes);
        setEntryDateTime(newDate);
    };

    const toISODateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const toISOTimeString = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const handleLogEntry = (e: React.FormEvent) => {
        e.preventDefault();
        const newEntry: CravingsHistoryEntry = {
            date: entryDateTime.toISOString(),
            intensity,
            trigger,
            copingMechanism
        };

        const updatedHistory = [newEntry, ...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        localStorage.setItem('cravingsHistory', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);

        // Reset form
        setIntensity(5);
        setEntryDateTime(new Date());
        setTrigger('');
        setCopingMechanism('');

        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
        window.dispatchEvent(new Event('app:action'));
    };

    const getIntensityColor = (value: number) => {
        const hue = (1 - (value - 1) / 9) * 120; // 120 (green) to 0 (red)
        return `hsl(${hue}, 80%, 50%)`;
    };

    return (
        <div className="page-container" style={{paddingTop: '1rem'}}>
            <header className="page-header-text" style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                     <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                </button>
                 <h1 className="app-title">Craving Tracker</h1>
            </header>

            <main>
                <form onSubmit={handleLogEntry} className="card tracker-section">
                    <p className="tracker-description">Log your cravings to understand patterns and manage urges.</p>

                    <div className="form-group">
                        <label>Craving Intensity: <span className="intensity-value-display" style={{color: getIntensityColor(intensity)}}>{intensity}</span> / 10</label>
                        <div className="intensity-slider-container">
                            <span>Mild</span>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={intensity}
                                onChange={(e) => setIntensity(Number(e.target.value))}
                                className="intensity-slider"
                                style={{'--intensity-color': getIntensityColor(intensity)} as React.CSSProperties}
                            />
                             <span>Intense</span>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Date & Time of Craving</label>
                        <div className="date-time-inputs">
                            <input
                                type="date"
                                value={toISODateString(entryDateTime)}
                                onChange={handleDateChange}
                                required
                            />
                            <input
                                type="time"
                                value={toISOTimeString(entryDateTime)}
                                onChange={handleTimeChange}
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="trigger">What triggered this craving? (Optional)</label>
                        <textarea
                            id="trigger"
                            value={trigger}
                            onChange={(e) => setTrigger(e.target.value)}
                            placeholder="e.g., Saw an ad, felt stressed..."
                            rows={3}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="copingMechanism">How did you cope? (Optional)</label>
                        <textarea
                            id="copingMechanism"
                            value={copingMechanism}
                            onChange={(e) => setCopingMechanism(e.target.value)}
                            placeholder="e.g., Went for a walk, called a friend..."
                            rows={3}
                        />
                    </div>

                    <button type="submit" className="log-button" style={{marginTop: '1rem'}}>Log Craving</button>
                    {showConfirmation && <p className="confirmation-message">Craving Logged Successfully!</p>}
                </form>

                <section className="history-section">
                    <hr className="history-divider" />
                    <h3 className="history-title">History</h3>
                    {history.length > 0 ? (
                        <ul className="history-list">
                            {history.slice(0, 10).map(entry => {
                                const entryDate = new Date(entry.date);
                                const formattedDate = entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                const formattedTime = entryDate.toLocaleTimeString('en-US', { timeStyle: 'short' });

                                return (
                                    <li key={entry.date} className="history-item craving-history-item">
                                        <div className="craving-intensity-indicator" style={{backgroundColor: getIntensityColor(entry.intensity)}}>
                                            <span>{entry.intensity}</span>
                                        </div>
                                        <div className="history-details">
                                            <span><strong>{formattedDate}</strong> at {formattedTime}</span>
                                            {entry.trigger && <span className="craving-detail-text"><strong>Trigger:</strong> {entry.trigger}</span>}
                                            {entry.copingMechanism && <span className="craving-detail-text"><strong>Coped by:</strong> {entry.copingMechanism}</span>}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="no-history-message">Your craving history will appear here.</p>
                    )}
                </section>
            </main>
        </div>
    );
};


// --- Breathing Page Component ---
const BreathingPage = ({ navigate }) => {
    const [isBreathing, setIsBreathing] = useState(false);
    const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold-in' | 'exhale' | 'hold-out'>('idle');
    const [count, setCount] = useState(4);
    const [history, setHistory] = useState<{ date: string }[]>([]);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('breathingHistory') || '[]');
        setHistory(storedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);

    useEffect(() => {
        if (!isBreathing) return;

        const phaseDuration = 4;

        const timer = setInterval(() => {
            setCount(prevCount => {
                if (prevCount > 1) {
                    return prevCount - 1;
                } else {
                    setPhase(prevPhase => {
                        switch (prevPhase) {
                            case 'inhale': return 'hold-in';
                            case 'hold-in': return 'exhale';
                            case 'exhale': return 'hold-out';
                            case 'hold-out': return 'inhale';
                            default: return 'inhale';
                        }
                    });
                    return phaseDuration;
                }
            });
        }, 1000);

        // Cleanup function
        return () => clearInterval(timer);
    }, [isBreathing]);

    const handleStart = () => {
        setPhase('inhale');
        setCount(4);
        setIsBreathing(true);
    };

    const handleStop = () => {
        setIsBreathing(false);
        setPhase('idle');
        setCount(4);
        
        const newEntry = { date: new Date().toISOString() };
        const updatedHistory = [newEntry, ...history];
        localStorage.setItem('breathingHistory', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
        window.dispatchEvent(new Event('app:action'));
    };
    
    const phaseInstructions = {
        idle: "Ready to Start?",
        inhale: "Inhale...",
        'hold-in': "Hold",
        exhale: "Exhale...",
        'hold-out': "Hold"
    };
    
    const isSessionActive = isBreathing;

    return (
        <div className="page-container" style={{paddingTop: '1rem'}}>
            <header className="page-header-text" style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                     <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                </button>
                 <h1 className="app-title">Breathing Exercise</h1>
            </header>
            <main>
                <div className="card no-hover breathing-card">
                    <p className="tracker-description">Follow the guide to calm your mind. This is a 4-4-4-4 box breathing exercise.</p>
                    <div className="breathing-anim-container">
                        <div className={`breathing-circle ${isSessionActive ? phase : 'idle'}`}>
                            <div className="breathing-text-content">
                                <p className="breathing-instruction">{phaseInstructions[phase]}</p>
                                {isSessionActive && <p className="breathing-counter">{count}</p>}
                            </div>
                        </div>
                    </div>
                    
                    {isSessionActive ? (
                        <button onClick={handleStop} className="log-button stop-breathing-button">Stop Session</button>
                    ) : (
                        <button onClick={handleStart} className="log-button">Start Breathing</button>
                    )}
                </div>
                
                 <section className="history-section">
                    <hr className="history-divider" />
                    <h3 className="history-title">History</h3>
                    {history.length > 0 ? (
                        <ul className="history-list">
                            {history.slice(0, 5).map((entry, index) => (
                                <li key={index} className="history-item">
                                    <div className="history-details" style={{flexGrow: 1}}>
                                        <span>Completed Session</span>
                                        <span style={{color: 'var(--text-muted)'}}>{new Date(entry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} at {new Date(entry.date).toLocaleTimeString('en-US', { timeStyle: 'short' })}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-history-message">You haven't completed any breathing exercises yet.</p>
                    )}
                </section>
            </main>
        </div>
    );
};
// --- Grounding Page Component ---
const GroundingPage = ({ navigate }) => {
    const STEPS = [
        { number: 5, sense: 'see', instruction: 'Acknowledge 5 things you can see around you.' },
        { number: 4, sense: 'feel', instruction: 'Become aware of 4 things you can feel.' },
        { number: 3, sense: 'hear', instruction: 'Listen for 3 things you can hear.' },
        { number: 2, sense: 'smell', instruction: 'Notice 2 things you can smell.' },
        { number: 1, sense: 'taste', instruction: 'Acknowledge 1 thing you can taste.' },
    ];

    const [view, setView] = useState<'intro' | 'exercise'>('intro');
    const [currentStep, setCurrentStep] = useState(0);
    const [history, setHistory] = useState<{ date: string }[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('groundingHistory') || '[]');
        setHistory(storedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);

    const handleStart = () => {
        setView('exercise');
        setCurrentStep(0);
        setShowConfirmation(false);
    };

    const handleFinish = () => {
        const newEntry = { date: new Date().toISOString() };
        const updatedHistory = [newEntry, ...history];
        localStorage.setItem('groundingHistory', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
        window.dispatchEvent(new Event('app:action'));

        setView('intro');
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 4000);
    };

    const renderContent = () => {
        if (view === 'intro') {
            return (
                <div className="card no-hover" style={{ textAlign: 'left', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="form-section-title" style={{ color: 'var(--accent-teal)' }}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M5 15.5c0 2.54 1.63 4.78 3.93 5.61.4.15.87.15 1.27 0C12.5 20.28 14.13 18.04 14.13 15.5V11H5v4.5zM19 11h-3.13c0-2.54-1.63-4.78-3.93-5.61-.4-.15-.87-.15-1.27 0C8.5 6.22 6.87 8.46 6.87 11H3c0-4.99 4.02-9 9-9s9 4.01 9 9z"/></svg>
                        <h3>Ground Yourself</h3>
                    </div>
                    <p className="tracker-description" style={{ textAlign: 'left' }}>
                        The 5-4-3-2-1 technique is a simple yet powerful grounding exercise to bring you back to the present moment. It helps manage anxiety by directing your focus to your senses.
                    </p>
                    <button className="log-button" onClick={handleStart}>Start Exercise</button>
                    {showConfirmation && <p className="confirmation-message">Well done! You've completed the exercise.</p>}
                </div>
            );
        }

        if (view === 'exercise') {
            const step = STEPS[currentStep];
            return (
                <div className="card no-hover grounding-exercise-card">
                    <div className="grounding-step-content">
                        <div className="grounding-number">{step.number}</div>
                        <p className="grounding-instruction" dangerouslySetInnerHTML={{ __html: step.instruction.replace(String(step.number), `<strong>${step.number}</strong>`).replace(step.sense, `<strong>${step.sense}</strong>`) }} />
                    </div>
                    <div className="grounding-navigation">
                        <button
                            className="log-button secondary"
                            onClick={() => setCurrentStep(p => p - 1)}
                            disabled={currentStep === 0}
                        >
                            Previous
                        </button>
                        {currentStep < STEPS.length - 1 ? (
                            <button
                                className="log-button"
                                onClick={() => setCurrentStep(p => p + 1)}
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                className="log-button"
                                onClick={handleFinish}
                            >
                                Finish Session
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return null;
    };


    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                <h1 className="app-title">5-4-3-2-1 Grounding</h1>
            </header>
            <main>
                {renderContent()}

                <section className="history-section" style={{ marginTop: '0' }}>
                    <hr className="history-divider" />
                    <h3 className="history-title">History</h3>
                    {history.length > 0 ? (
                        <ul className="history-list">
                            {history.slice(0, 5).map((entry, index) => (
                                <li key={index} className="history-item">
                                    <div className="history-details" style={{ flexGrow: 1 }}>
                                        <span>Completed Session</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{new Date(entry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} at {new Date(entry.date).toLocaleTimeString('en-US', { timeStyle: 'short' })}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-history-message">You haven't completed any grounding exercises yet.</p>
                    )}
                </section>
            </main>
        </div>
    );
};
const ValuesExercisePage = ({ navigate }) => {
    const CORE_VALUES = useMemo(() => [
        "Accomplishment", "Accountability", "Adventure", "Altruism", "Authenticity",
        "Autonomy", "Balance", "Belonging", "Calmness", "Challenge", "Collaboration",
        "Commitment", "Community", "Compassion", "Competence", "Contribution", "Courage",
        "Creativity", "Curiosity", "Determination", "Empathy", "Fairness", "Family",
        "Flexibility", "Forgiveness", "Freedom", "Friendship", "Fun", "Generosity",
        "Growth", "Harmony", "Health", "Honesty", "Humor", "Independence", "Integrity",
        "Kindness", "Knowledge", "Leadership", "Learning", "Love", "Loyalty", "Mindfulness",
        "Openness", "Optimism", "Passion", "Peace", "Perseverance", "Respect", "Responsibility", "Security"
    ], []);

    const [view, setView] = useState<'intro' | 'round1' | 'round2' | 'round3' | 'results'>('intro');
    const [deck, setDeck] = useState<string[]>([]);
    const [kept, setKept] = useState<string[]>([]);
    const [discarded, setDiscarded] = useState<string[]>([]);
    const [top10, setTop10] = useState<string[]>([]);
    const [top5, setTop5] = useState<string[]>([]);
    const [finalValues, setFinalValues] = useState<string[]>([]);
    const [history, setHistory] = useState<ValuesHistoryEntry[]>([]);
    const [showDiscarded, setShowDiscarded] = useState(false);
    const [cardState, setCardState] = useState<'in' | 'out-left' | 'out-right'>('in');

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('valuesHistory') || '[]') as ValuesHistoryEntry[];
        setHistory(storedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);

    const shuffleArray = (array: string[]) => {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    };

    const handleStart = () => {
        setDeck(shuffleArray([...CORE_VALUES]));
        setKept([]);
        setDiscarded([]);
        setTop10([]);
        setTop5([]);
        setView('round1');
    };

    const handleDecision = (decision: 'keep' | 'discard') => {
        if (deck.length === 0) return;
        setCardState(decision === 'keep' ? 'out-right' : 'out-left');

        setTimeout(() => {
            const currentCard = deck[0];
            const newDeck = deck.slice(1);

            if (decision === 'keep') {
                setKept(prev => [...prev, currentCard]);
            } else {
                setDiscarded(prev => [...prev, currentCard]);
            }

            if (newDeck.length === 0) {
                setView('round2');
            } else {
                setDeck(newDeck);
                setCardState('in');
            }
        }, 300);
    };

    const handleRestoreValue = (value: string) => {
        setDiscarded(prev => prev.filter(v => v !== value));
        setKept(prev => [...prev, value]);
    };

    const handleSelectTop10 = (value: string) => {
        setTop10(prev => {
            if (prev.includes(value)) {
                return prev.filter(v => v !== value);
            }
            if (prev.length < 10) {
                return [...prev, value];
            }
            return prev;
        });
    };
    
    const handleSelectTop5 = (value: string) => {
        setTop5(prev => {
            if (prev.includes(value)) {
                return prev.filter(v => v !== value);
            }
            if (prev.length < 5) {
                return [...prev, value];
            }
            return prev;
        });
    };

    const handleFinish = () => {
        setFinalValues(top5);
        const newEntry: ValuesHistoryEntry = { date: new Date().toISOString(), top5: top5 };
        const updatedHistory = [newEntry, ...history];
        localStorage.setItem('valuesHistory', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
        window.dispatchEvent(new Event('app:action'));
        setView('results');
    };
    
    const renderIntro = () => (
        <>
            <div className="card no-hover" style={{ textAlign: 'left', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="form-section-title" style={{ color: 'var(--accent-teal)' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2L2 8.5l10 13.5L22 8.5L12 2zm0 2.31l7.5 5.19L12 18.31L4.5 9.5L12 4.31z"/></svg>
                    <h3>Discover Your Core Values</h3>
                </div>
                <p className="tracker-description" style={{ textAlign: 'left' }}>
                    This exercise helps you understand what's most important to you. By identifying your core values, you can make decisions and set goals that align with your authentic self.
                </p>
                <button className="log-button" onClick={handleStart}>Start Exercise</button>
            </div>
            <section className="history-section" style={{ marginTop: '0' }}>
                <h3 className="history-title">History</h3>
                {history.length > 0 ? (
                    <ul className="history-list">
                        {history.slice(0, 5).map(entry => (
                            <li key={entry.date} className="history-item">
                                <div className="history-details">
                                    <strong>{new Date(entry.date).toLocaleDateString()}</strong>
                                    <span>{entry.top5.join(', ')}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <p className="no-history-message">You haven't completed this exercise yet.</p>}
            </section>
        </>
    );

    const renderRound1 = () => (
        <>
            <div className="values-progress-bar-container">
                <div className="values-progress-bar" style={{ width: `${((CORE_VALUES.length - deck.length) / CORE_VALUES.length) * 100}%` }}></div>
            </div>
            <p className="values-progress-text">{CORE_VALUES.length - deck.length + 1} / {CORE_VALUES.length}</p>
            <div className="value-card-container">
                <div className={`card value-card ${cardState}`}>
                    <h3>{deck[0]}</h3>
                </div>
            </div>
            <div className="value-card-actions">
                <button className="value-discard-btn" onClick={() => handleDecision('discard')}>Discard</button>
                <button className="value-keep-btn" onClick={() => handleDecision('keep')}>Keep</button>
            </div>
             <button className="link-button" onClick={() => setShowDiscarded(true)}>
                View Discarded ({discarded.length})
            </button>
        </>
    );
    
    const renderSelectionRound = (title: string, values: string[], selected: string[], onSelect: (v: string) => void, limit: number, onNext: () => void, nextLabel: string) => (
        <div className="card no-hover" style={{gap: '1.5rem', alignItems: 'stretch'}}>
            <h2 className="values-selection-title">{title}</h2>
            <p className="tracker-description" style={{textAlign: 'center'}}>You have selected {selected.length} / {limit}</p>
            <div className="values-selection-grid">
                {values.sort().map(value => (
                    <button key={value} className={`value-chip ${selected.includes(value) ? 'selected' : ''}`} onClick={() => onSelect(value)}>
                        {value}
                    </button>
                ))}
            </div>
             <button className="log-button" disabled={selected.length !== limit} onClick={onNext} style={{marginTop: '1rem'}}>{nextLabel}</button>
        </div>
    );
    
    const renderResults = () => (
        <div className="card no-hover" style={{gap: '1.5rem', alignItems: 'stretch', textAlign: 'center'}}>
            <h2 className="values-selection-title">Your Top 5 Core Values</h2>
            <ul className="values-results-list">
                {finalValues.map(value => <li key={value}>{value}</li>)}
            </ul>
             <p className="tracker-description">These values represent your guiding principles. Reflect on how you can live by them more fully in your daily life.</p>
            <button className="log-button" onClick={() => setView('intro')} style={{marginTop: '1rem'}}>Done</button>
        </div>
    );

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                <h1 className="app-title">Core Values</h1>
            </header>
            <main className="values-exercise-page">
                {view === 'intro' && renderIntro()}
                {view === 'round1' && deck.length > 0 && renderRound1()}
                {view === 'round2' && renderSelectionRound('Select Your Top 10', kept, top10, handleSelectTop10, 10, () => setView('round3'), 'Continue')}
                {view === 'round3' && renderSelectionRound('Select Your Top 5', top10, top5, handleSelectTop5, 5, handleFinish, 'Finish')}
                {view === 'results' && renderResults()}
            </main>
             {showDiscarded && (
                <div className="discarded-modal-overlay" onClick={() => setShowDiscarded(false)}>
                    <div className="card discarded-modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Discarded Values</h2>
                        <div className="values-selection-grid">
                            {discarded.length > 0 ? discarded.sort().map(value => (
                                <button key={value} className="value-chip" onClick={() => handleRestoreValue(value)}>
                                    {value}
                                </button>
                            )) : <p>No discarded values yet.</p>}
                        </div>
                         <button className="log-button" onClick={() => setShowDiscarded(false)} style={{marginTop: '1.5rem'}}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const GoalsPage = ({ navigate }) => {
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [goals, setGoals] = useState<GoalEntry[]>([]);
    const [coreValues, setCoreValues] = useState<string[]>([]);
    const [newGoal, setNewGoal] = useState({
        title: '',
        measurable: '',
        achievable: '',
        relevant: '',
        relevantValues: [] as string[],
        targetDate: '',
    });
    
    useEffect(() => {
        const storedGoals = JSON.parse(localStorage.getItem('goals') || '[]') as GoalEntry[];
        setGoals(storedGoals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        
        const valuesHistory = JSON.parse(localStorage.getItem('valuesHistory') || '[]') as ValuesHistoryEntry[];
        if (valuesHistory.length > 0) {
            setCoreValues(valuesHistory[0].top5);
        }
    }, []);

    const updateGoals = (updatedGoals: GoalEntry[]) => {
        const sortedGoals = updatedGoals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setGoals(sortedGoals);
        localStorage.setItem('goals', JSON.stringify(sortedGoals));
        window.dispatchEvent(new Event('app:action'));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewGoal(prev => ({ ...prev, [name]: value }));
    };

    const handleValueSelect = (value: string) => {
        setNewGoal(prev => {
            const newValues = prev.relevantValues.includes(value)
                ? prev.relevantValues.filter(v => v !== value)
                : [...prev.relevantValues, value];
            return { ...prev, relevantValues: newValues };
        });
    };
    
    const resetCreator = () => {
        setIsCreatorOpen(false);
        setNewGoal({
            title: '',
            measurable: '',
            achievable: '',
            relevant: '',
            relevantValues: [],
            targetDate: '',
        });
    }

    const handleSaveGoal = (e: React.FormEvent) => {
        e.preventDefault();
        const goalToAdd: GoalEntry = {
            ...newGoal,
            id: `goal_${Date.now()}`,
            status: 'active',
            createdAt: new Date().toISOString(),
        };
        updateGoals([...goals, goalToAdd]);
        resetCreator();
    };

    const handleToggleComplete = (goalId: string) => {
        const updatedGoals = goals.map((goal): GoalEntry =>
            goal.id === goalId ? { ...goal, status: goal.status === 'active' ? 'completed' : 'active' } : goal
        );
        updateGoals(updatedGoals);
    };

    const handleDeleteGoal = (e: React.MouseEvent, goalId: string) => {
        e.stopPropagation(); // Prevent navigation/expansion
        if (window.confirm('Are you sure you want to delete this goal?')) {
            updateGoals(goals.filter(goal => goal.id !== goalId));
        }
    };

    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                <h1 className="app-title">My Goals</h1>
            </header>
            <main className="goals-page-main">
                <div className="card no-hover goals-intro-card">
                    <div className="form-section-title">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        <h3>Set S.M.A.R.T. Goals</h3>
                    </div>
                    <p className="tracker-description" style={{ textAlign: 'left' }}>
                        Use the S.M.A.R.T. framework (Specific, Measurable, Achievable, Relevant, Time-bound) to set clear and attainable goals that guide your journey.
                    </p>
                    <button className="log-button" onClick={() => setIsCreatorOpen(true)}>Create New Goal</button>
                </div>

                <section className="goals-list-section">
                    <h3>Active Goals</h3>
                    {activeGoals.length > 0 ? (
                        <ul className="goals-list">
                            {activeGoals.map(goal => (
                                <li key={goal.id} className={`goal-item ${goal.status}`}>
                                    <button className="goal-item-toggle" onClick={() => handleToggleComplete(goal.id)} aria-label="Toggle goal completion">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                    </button>
                                    <div className="goal-item-content">
                                        <p className="goal-item-title">{goal.title}</p>
                                        <p className="goal-item-date">Target: {new Date(goal.targetDate).toLocaleDateString()}</p>
                                    </div>
                                    <button className="goal-item-delete" onClick={(e) => handleDeleteGoal(e, goal.id)} aria-label="Delete goal">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="no-goals-message">No active goals. Ready to set one?</div>
                    )}
                </section>
                
                <section className="goals-list-section">
                    <h3>Completed Goals</h3>
                     {completedGoals.length > 0 ? (
                        <ul className="goals-list">
                            {completedGoals.map(goal => (
                                <li key={goal.id} className={`goal-item ${goal.status}`}>
                                    <button className="goal-item-toggle" onClick={() => handleToggleComplete(goal.id)} aria-label="Toggle goal completion">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                    </button>
                                    <div className="goal-item-content">
                                        <p className="goal-item-title">{goal.title}</p>
                                    </div>
                                     <button className="goal-item-delete" onClick={(e) => handleDeleteGoal(e, goal.id)} aria-label="Delete goal">
                                         <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="no-goals-message">No completed goals yet.</div>
                    )}
                </section>
            </main>
            
            {isCreatorOpen && (
                <div className="goal-creator-modal-overlay">
                    <div className="goal-creator-modal-content">
                        <div className="goal-creator-modal-header">
                            <h2>New S.M.A.R.T. Goal</h2>
                            <button className="close-modal-btn" onClick={resetCreator} aria-label="Close">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                            </button>
                        </div>
                        <form className="goal-creator-form" onSubmit={handleSaveGoal}>
                            <div className="form-group">
                                <label>Specific <span>What, specifically, do you want to achieve?</span></label>
                                <textarea name="title" value={newGoal.title} onChange={handleInputChange} rows={2} required />
                            </div>
                             <div className="form-group">
                                <label>Measurable <span>How will you measure progress?</span></label>
                                <textarea name="measurable" value={newGoal.measurable} onChange={handleInputChange} rows={2} />
                            </div>
                             <div className="form-group">
                                <label>Achievable <span>Is this realistic? What are the steps?</span></label>
                                <textarea name="achievable" value={newGoal.achievable} onChange={handleInputChange} rows={2} />
                            </div>
                             <div className="form-group">
                                <label>Relevant <span>Why is this important to you?</span></label>
                                <textarea name="relevant" value={newGoal.relevant} onChange={handleInputChange} rows={2} />
                                {coreValues.length > 0 ? (
                                    <div className="relevant-values-container">
                                        <h4>Link to your Core Values (optional)</h4>
                                        <div className="relevant-values-grid">
                                            {coreValues.map(value => (
                                                <button
                                                    type="button"
                                                    key={value}
                                                    className={`value-chip ${newGoal.relevantValues.includes(value) ? 'selected' : ''}`}
                                                    onClick={() => handleValueSelect(value)}
                                                >
                                                    {value}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-values-prompt">
                                        <p>Link goals to your core principles for more motivation. You haven't defined your values yet.</p>
                                        <button type="button" className="dashboard-card-cta" onClick={() => navigate('values-exercise')}>
                                            Discover Your Values
                                        </button>
                                    </div>
                                )}
                            </div>
                             <div className="form-group">
                                <label>Time-bound <span>What is your target date?</span></label>
                                <input type="date" name="targetDate" value={newGoal.targetDate} onChange={handleInputChange} required />
                            </div>
                            <div className="goal-creator-actions">
                                <button type="button" className="modal-button cancel" onClick={resetCreator}>Cancel</button>
                                <button type="submit" className="modal-button confirm" style={{backgroundColor: 'var(--accent-teal)', color: 'var(--bg-dark)'}}>Save Goal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- AUDIT Screener Page ---
const AUDIT_QUESTIONS = [
    {
        question: 'How often do you have a drink containing alcohol?',
        answers: [
            { text: 'Never', score: 0 },
            { text: 'Monthly or less', score: 1 },
            { text: '2 to 4 times a month', score: 2 },
            { text: '2 to 3 times a week', score: 3 },
            { text: '4 or more times a week', score: 4 },
        ],
    },
    {
        question: 'How many drinks containing alcohol do you have on a typical day when you are drinking?',
        answers: [
            { text: '1 or 2', score: 0 },
            { text: '3 or 4', score: 1 },
            { text: '5 or 6', score: 2 },
            { text: '7 to 9', score: 3 },
            { text: '10 or more', score: 4 },
        ],
    },
    {
        question: 'How often do you have six or more drinks on one occasion?',
        answers: [
            { text: 'Never', score: 0 },
            { text: 'Less than monthly', score: 1 },
            { text: 'Monthly', score: 2 },
            { text: 'Weekly', score: 3 },
            { text: 'Daily or almost daily', score: 4 },
        ],
    },
    {
        question: 'How often during the last year have you found that you were not able to stop drinking once you had started?',
        answers: [
            { text: 'Never', score: 0 },
            { text: 'Less than monthly', score: 1 },
            { text: 'Monthly', score: 2 },
            { text: 'Weekly', score: 3 },
            { text: 'Daily or almost daily', score: 4 },
        ],
    },
    {
        question: 'How often during the last year have you failed to do what was normally expected from you because of drinking?',
        answers: [
            { text: 'Never', score: 0 },
            { text: 'Less than monthly', score: 1 },
            { text: 'Monthly', score: 2 },
            { text: 'Weekly', score: 3 },
            { text: 'Daily or almost daily', score: 4 },
        ],
    },
    {
        question: 'How often during the last year have you needed a first drink in the morning to get yourself going after a heavy drinking session?',
        answers: [
            { text: 'Never', score: 0 },
            { text: 'Less than monthly', score: 1 },
            { text: 'Monthly', score: 2 },
            { text: 'Weekly', score: 3 },
            { text: 'Daily or almost daily', score: 4 },
        ],
    },
    {
        question: 'How often during the last year have you had a feeling of guilt or remorse after drinking?',
        answers: [
            { text: 'Never', score: 0 },
            { text: 'Less than monthly', score: 1 },
            { text: 'Monthly', score: 2 },
            { text: 'Weekly', score: 3 },
            { text: 'Daily or almost daily', score: 4 },
        ],
    },
    {
        question: 'How often during the last year have you been unable to remember what happened the night before because you had been drinking?',
        answers: [
            { text: 'Never', score: 0 },
            { text: 'Less than monthly', score: 1 },
            { text: 'Monthly', score: 2 },
            { text: 'Weekly', score: 3 },
            { text: 'Daily or almost daily', score: 4 },
        ],
    },
    {
        question: 'Have you or someone else been injured as a result of your drinking?',
        answers: [
            { text: 'No', score: 0 },
            { text: 'Yes, but not in the last year', score: 2 },
            { text: 'Yes, during the last year', score: 4 },
        ],
    },
    {
        question: 'Has a relative or friend or a doctor or another health worker been concerned about your drinking or suggested you cut down?',
        answers: [
            { text: 'No', score: 0 },
            { text: 'Yes, but not in the last year', score: 2 },
            { text: 'Yes, during the last year', score: 4 },
        ],
    },
];

const getAuditResult = (score: number) => {
    if (score <= 7) {
        return {
            zone: 'I',
            level: 'Low Risk',
            recommendation: 'Your responses suggest you are at low risk for problems related to alcohol. It\'s a great idea to continue being mindful of your alcohol consumption.',
        };
    } else if (score <= 15) {
        return {
            zone: 'II',
            level: 'Risky',
            recommendation: 'Your drinking pattern suggests some risk. It may be helpful to think about reducing your alcohol intake. Consider setting limits for yourself and exploring strategies for moderation.',
        };
    } else if (score <= 19) {
        return {
            zone: 'III',
            level: 'Harmful',
            recommendation: 'Your drinking is at a level that could be harmful to your health and well-being. It is strongly advised that you take steps to reduce your drinking. Talking to a healthcare provider could be a beneficial next step.',
        };
    } else {
        return {
            zone: 'IV',
            level: 'High Risk / Possible Dependence',
            recommendation: 'Your score indicates a high level of risk and possible alcohol dependence. It is highly recommended that you seek further evaluation from a healthcare professional or a specialist in addiction.',
        };
    }
};

const AuditPage = ({ navigate }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{[key: number]: number}>({});
    const [history, setHistory] = useState<AuditHistoryEntry[]>([]);
    const [showResults, setShowResults] = useState(false);
    const finalScore = useMemo(() => Object.values(answers).reduce((sum: number, score: number) => sum + score, 0), [answers]);
    
    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('auditHistory') || '[]') as AuditHistoryEntry[];
        setHistory(storedHistory);
    }, []);

    const handleAnswerSelect = (questionIndex, score) => {
        setAnswers(prev => ({ ...prev, [questionIndex]: score }));
    };
    
    const calculateAndShowResults = () => {
        const newHistory = [{ score: finalScore, date: new Date().toISOString() }, ...history];
        localStorage.setItem('auditHistory', JSON.stringify(newHistory));
        setHistory(newHistory);
        setShowResults(true);
        window.dispatchEvent(new Event('app:action'));
    };
    
    const handleRetake = () => {
        setAnswers({});
        setCurrentQuestionIndex(0);
        setShowResults(false);
    };

    if (showResults) {
        const result = getAuditResult(finalScore);
        return (
            <div className="page-container" style={{paddingTop: '1rem'}}>
                 <header className="page-header-text" style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                    <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                    </button>
                    <h1 className="app-title">AUDIT Result</h1>
                </header>
                <main>
                    <div className="card no-hover audit-result-card">
                        <div className={`audit-score-display zone-${result.zone}`}>
                            <span className="audit-score-value">{finalScore}</span>
                            <span className="audit-score-label">Score</span>
                        </div>
                        <h2 className={`audit-level-display zone-${result.zone}`}>Zone {result.zone}: {result.level}</h2>
                        <p className="audit-recommendation">{result.recommendation}</p>
                    </div>
                    
                    <div className="card no-hover disclaimer-card">
                        <h4>Disclaimer</h4>
                        <p>This tool is an educational screener, not a diagnostic test. The results are not a substitute for professional medical advice. Please consult with a healthcare provider to discuss your results.</p>
                    </div>
                    
                    <button onClick={handleRetake} className="log-button" style={{marginTop: '2rem'}}>Retake the Screener</button>
                    
                     <section className="audit-history">
                        <h3 className="history-title">Your Previous Scores</h3>
                        {history.length > 0 ? (
                             <ul>
                                {history.map((entry, index) => (
                                    <li key={index}>
                                        <span><strong>Score: {entry.score}</strong> ({getAuditResult(entry.score).level})</span>
                                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="no-history-message">No previous results found.</p>
                        )}
                    </section>
                </main>
            </div>
        );
    }
    
    const progress = (currentQuestionIndex / AUDIT_QUESTIONS.length) * 100;
    const currentQuestion = AUDIT_QUESTIONS[currentQuestionIndex];
    
    return (
        <div className="page-container" style={{paddingTop: '1rem'}}>
            <header className="page-header-text" style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 className="app-title">AUDIT Screener</h1>
                    <InfoTooltip text="The Alcohol Use Disorders Identification Test (AUDIT) is a 10-question screening tool from the World Health Organization to assess alcohol consumption, drinking behaviors, and alcohol-related problems." />
                </div>
            </header>
            <main>
                 <div className="audit-progress-bar-container">
                    <div className="audit-progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="card no-hover audit-question-card">
                    <p className="audit-question-number">Question {currentQuestionIndex + 1} of {AUDIT_QUESTIONS.length}</p>
                    <h2 className="audit-question-text">{currentQuestion.question}</h2>
                    <div className="audit-answer-options">
                        {currentQuestion.answers.map((answer, index) => (
                            <button
                                key={index}
                                className={`audit-answer-button ${answers[currentQuestionIndex] === answer.score ? 'selected' : ''}`}
                                onClick={() => handleAnswerSelect(currentQuestionIndex, answer.score)}
                            >
                                {answer.text}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="audit-navigation">
                    <button
                        className="log-button secondary"
                        onClick={() => setCurrentQuestionIndex(p => p - 1)}
                        disabled={currentQuestionIndex === 0}
                    >
                        Previous
                    </button>
                    {currentQuestionIndex === AUDIT_QUESTIONS.length - 1 ? (
                         <button
                            className="log-button"
                            onClick={calculateAndShowResults}
                            disabled={answers[currentQuestionIndex] === undefined}
                        >
                            Finish
                        </button>
                    ) : (
                        <button
                            className="log-button"
                            onClick={() => setCurrentQuestionIndex(p => p + 1)}
                            disabled={answers[currentQuestionIndex] === undefined}
                        >
                            Next
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};

// --- ADHD Screener Page ---
const ADHD_QUESTIONS = [
    { question: 'How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?' },
    { question: 'How often do you have difficulty getting things in order when you have to do a task that requires organization?' },
    { question: 'How often do you have problems remembering appointments or obligations?' },
    { question: 'When you have a task that requires a lot of thought, how often do you avoid or delay getting started?' },
    { question: 'How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?' },
    { question: 'How often do you feel overly active and compelled to do things, like you were driven by a motor?' },
];
const ADHD_ANSWERS = [
    { text: 'Never', value: 0 },
    { text: 'Rarely', value: 1 },
    { text: 'Sometimes', value: 2 },
    { text: 'Often', value: 3 },
    { text: 'Very Often', value: 4 },
];

const ADHDPage = ({ navigate }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{[key: number]: number}>({});
    const [history, setHistory] = useState<AdhdHistoryEntry[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [finalScore, setFinalScore] = useState(0);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('adhdHistory') || '[]') as AdhdHistoryEntry[];
        setHistory(storedHistory);
    }, []);

    const handleAnswerSelect = (questionIndex, value) => {
        setAnswers(prev => ({ ...prev, [questionIndex]: value }));
    };

    const calculateAndShowResults = () => {
        let score = 0;
        // For questions 0-2 (1-3), "Sometimes", "Often", or "Very Often" are indicative (value >= 2)
        // For questions 3-5 (4-6), "Often" or "Very Often" are indicative (value >= 3)
        const indicativeThresholds = { 0: 2, 1: 2, 2: 2, 3: 3, 4: 3, 5: 3 };
        
        for (const qIndexStr in answers) {
            const qIndex = parseInt(qIndexStr, 10);
            if (answers[qIndex] >= indicativeThresholds[qIndex]) {
                score++;
            }
        }
        
        const newHistory: AdhdHistoryEntry[] = [{ score, date: new Date().toISOString(), answers }, ...history];
        localStorage.setItem('adhdHistory', JSON.stringify(newHistory));
        setHistory(newHistory);
        setFinalScore(score);
        setShowResults(true);
        window.dispatchEvent(new Event('app:action'));
    };

    const handleRetake = () => {
        setAnswers({});
        setCurrentQuestionIndex(0);
        setShowResults(false);
    };

    if (showResults) {
        const isConsistent = finalScore >= 4;
        return (
            <div className="page-container" style={{ paddingTop: '1rem' }}>
                <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                    </button>
                    <h1 className="app-title">ADHD Screener Result</h1>
                </header>
                <main>
                    <div className="card no-hover adhd-result-card">
                        <h2 className="adhd-result-header">{isConsistent ? "Symptoms May Be Consistent with Adult ADHD" : "Symptoms Not Consistent with Adult ADHD"}</h2>
                        <p className="adhd-result-text">
                            You indicated symptoms in <strong>{finalScore} out of 6</strong> key areas.
                            {isConsistent
                                ? " A score of 4 or more is highly consistent with Adult ADHD, suggesting that further investigation is warranted."
                                : " This result suggests that your symptoms may not be consistent with Adult ADHD. However, this is just a screener."}
                        </p>
                    </div>

                    <div className="card no-hover disclaimer-card">
                        <h4>Disclaimer</h4>
                        <p>This self-report questionnaire is an educational screener, not a diagnostic test. A high score does not confirm a diagnosis, and a low score does not rule it out. Please consult with a qualified healthcare professional to discuss your results and any concerns you may have.</p>
                    </div>

                    <button onClick={handleRetake} className="log-button" style={{ marginTop: '2rem' }}>Retake the Screener</button>

                    <section className="adhd-history">
                        <h3 className="history-title">Your Previous Results</h3>
                        {history.length > 0 ? (
                            <ul>
                                {history.map((entry, index) => (
                                    <li key={index}>
                                        <span><strong>Score: {entry.score}/6</strong> ({entry.score >= 4 ? "May be consistent" : "Not consistent"})</span>
                                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="no-history-message">No previous results found.</p>
                        )}
                    </section>
                </main>
            </div>
        );
    }
    
    const progress = (currentQuestionIndex / ADHD_QUESTIONS.length) * 100;
    const currentQuestion = ADHD_QUESTIONS[currentQuestionIndex];

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 className="app-title">ADHD Screener</h1>
                    <InfoTooltip text="The Adult ADHD Self-Report Scale (ASRS) is a 6-question screening tool used to help identify symptoms consistent with Attention Deficit Hyperactivity Disorder (ADHD) in adults." />
                </div>
            </header>
            <main>
                <div className="adhd-progress-bar-container">
                    <div className="adhd-progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="card no-hover adhd-question-card">
                    <p className="adhd-question-number">Question {currentQuestionIndex + 1} of {ADHD_QUESTIONS.length}</p>
                    <h2 className="adhd-question-text">{currentQuestion.question}</h2>
                    <div className="adhd-answer-options">
                        {ADHD_ANSWERS.map((answer, index) => (
                            <button
                                key={index}
                                className={`adhd-answer-button ${answers[currentQuestionIndex] === answer.value ? 'selected' : ''}`}
                                onClick={() => handleAnswerSelect(currentQuestionIndex, answer.value)}
                            >
                                {answer.text}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="adhd-navigation">
                    <button
                        className="log-button secondary"
                        onClick={() => setCurrentQuestionIndex(p => p - 1)}
                        disabled={currentQuestionIndex === 0}
                    >
                        Previous
                    </button>
                    {currentQuestionIndex === ADHD_QUESTIONS.length - 1 ? (
                        <button
                            className="log-button"
                            onClick={calculateAndShowResults}
                            disabled={answers[currentQuestionIndex] === undefined}
                        >
                            Finish
                        </button>
                    ) : (
                        <button
                            className="log-button"
                            onClick={() => setCurrentQuestionIndex(p => p + 1)}
                            disabled={answers[currentQuestionIndex] === undefined}
                        >
                            Next
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};


const JourneyPage = ({ navigate, unlockedAchievements }) => {
    const totalAchievements = Object.keys(ACHIEVEMENTS_DEFINITIONS).length;
    const unlockedCount = unlockedAchievements.length;
    const progress = totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0;
    
    const [auditHistory, setAuditHistory] = useState<AuditHistoryEntry[]>([]);
    const [adhdHistory, setAdhdHistory] = useState<AdhdHistoryEntry[]>([]);
    const [journalHistory, setJournalHistory] = useState<JournalHistoryEntry[]>([]);
    const [cravingsHistory, setCravingsHistory] = useState<CravingsHistoryEntry[]>([]);
    const [goals, setGoals] = useState<GoalEntry[]>([]);
    const [gratitudeHistory, setGratitudeHistory] = useState<GratitudeEntry[]>([]);
    const [thoughtDiaryHistory, setThoughtDiaryHistory] = useState<ThoughtDiaryEntry[]>([]);
    const [meditationHistory, setMeditationHistory] = useState<MeditationEntry[]>([]);

    useEffect(() => {
        setAuditHistory(JSON.parse(localStorage.getItem('auditHistory') || '[]'));
        setAdhdHistory(JSON.parse(localStorage.getItem('adhdHistory') || '[]'));
        setJournalHistory(JSON.parse(localStorage.getItem('journalHistory') || '[]'));
        setCravingsHistory(JSON.parse(localStorage.getItem('cravingsHistory') || '[]'));
        setGoals(JSON.parse(localStorage.getItem('goals') || '[]'));
        setGratitudeHistory(JSON.parse(localStorage.getItem('gratitudeHistory') || '[]'));
        setThoughtDiaryHistory(JSON.parse(localStorage.getItem('thoughtDiaryHistory') || '[]'));
        setMeditationHistory(JSON.parse(localStorage.getItem('meditationHistory') || '[]'));
    }, []);
    
    return (<div className="page-container">
        <header className="page-header-text">
            <h1 className="app-title">My Journey</h1>
            <p className="app-subtitle">Review your progress and insights.</p>
        </header>
        <main className="journey-dashboard">
            <div className="card" onClick={() => navigate('achievements')} style={{alignItems: 'flex-start', textAlign: 'left', gap: '0.5rem'}}>
                <h3 className="summary-card-title" style={{fontSize: '1.1rem'}}>My Achievements</h3>
                 <div className="achievements-progress-bar-container" style={{marginBottom: '0.5rem'}}>
                        <div className="achievements-progress-bar" style={{ width: `${progress}%` }}></div>
                 </div>
                <p className="card-subtitle">{unlockedCount} / {totalAchievements} Unlocked</p>
            </div>
            
            <div className="card summary-card" style={{alignItems: 'flex-start', textAlign: 'left', gap: '0.5rem'}}>
                <h3 className="summary-card-title" style={{fontSize: '1.1rem'}}>Daily Journal History</h3>
                <div className="journey-card-content">
                    {journalHistory.length > 0 ? (
                        <ul className="journey-history-list">
                            {journalHistory.slice(0, 3).map((entry, index) => (
                                <li key={index} className="journey-history-item">
                                    <span className="journey-history-item-date">{new Date(entry.date).toLocaleDateString()}</span>
                                    <span className="journey-history-item-result">{entry.data.feeling} / {entry.data.substance}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="no-data-placeholder">
                            <p>You haven't made any journal entries yet.</p>
                            <button className="dashboard-card-cta" onClick={() => navigate('journal')}>Make an Entry</button>
                        </div>
                    )}
                </div>
            </div>

             <div className="card summary-card" style={{alignItems: 'flex-start', textAlign: 'left', gap: '0.5rem'}}>
                <h3 className="summary-card-title" style={{fontSize: '1.1rem'}}>Gratitude History</h3>
                <div className="journey-card-content">
                    {gratitudeHistory.length > 0 ? (
                        <ul className="journey-history-list">
                            {gratitudeHistory.slice(0, 3).map((entry, index) => (
                                <li key={index} className="journey-history-item" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                                    <span className="journey-history-item-date" style={{marginBottom: '0.5rem'}}>{new Date(entry.date).toLocaleDateString()}</span>
                                    <span className="journey-history-item-result" style={{textAlign: 'left', fontStyle: 'italic', color: 'var(--text-muted)'}}>{entry.items[0]}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="no-data-placeholder">
                            <p>You haven't logged any gratitude yet.</p>
                            <button className="dashboard-card-cta" onClick={() => navigate('gratitude')}>Log Gratitude</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="card summary-card" style={{alignItems: 'flex-start', textAlign: 'left', gap: '0.5rem'}}>
                <h3 className="summary-card-title" style={{fontSize: '1.1rem'}}>Craving Tracker History</h3>
                <div className="journey-card-content">
                    {cravingsHistory.length > 0 ? (
                        <ul className="journey-history-list">
                            {cravingsHistory.slice(0, 3).map((entry, index) => (
                                <li key={index} className="journey-history-item">
                                    <span className="journey-history-item-date">{new Date(entry.date).toLocaleDateString()}</span>
                                    <span className="journey-history-item-result">Intensity: {entry.intensity}/10</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="no-data-placeholder">
                            <p>You haven't tracked any cravings yet.</p>
                            <button className="dashboard-card-cta" onClick={() => navigate('cravings')}>Track a Craving</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="card summary-card" style={{alignItems: 'flex-start', textAlign: 'left', gap: '0.5rem'}}>
                <h3 className="summary-card-title" style={{fontSize: '1.1rem'}}>Thought Diary History</h3>
                <div className="journey-card-content">
                    {thoughtDiaryHistory.length > 0 ? (
                        <ul className="journey-history-list">
                            {thoughtDiaryHistory.slice(0, 3).map((entry, index) => (
                                <li key={index} className="journey-history-item">
                                    <span className="journey-history-item-date">{new Date(entry.date).toLocaleDateString()}</span>
                                    <span className="journey-history-item-result">{entry.data.situation.substring(0, 20)}...</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="no-data-placeholder">
                            <p>You haven't completed a thought diary yet.</p>
                            <button className="dashboard-card-cta" onClick={() => navigate('thought-diary')}>Start Entry</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="card summary-card" style={{alignItems: 'flex-start', textAlign: 'left', gap: '0.5rem'}}>
                <h3 className="summary-card-title" style={{fontSize: '1.1rem'}}>My Goals History</h3>
                 <div className="journey-card-content">
                    {goals.length > 0 ? (
                        <ul className="journey-history-list">
                             {goals.slice(0, 3).map((goal) => (
                                <li key={goal.id} className="journey-history-item" style={{textTransform: 'capitalize'}}>
                                    <span>{goal.title}</span>
                                    <span>{goal.status}</span>
                                </li>
                             ))}
                        </ul>
                    ) : (
                        <div className="no-data-placeholder">
                            <p>You haven't set any goals yet.</p>
                            <button className="dashboard-card-cta" onClick={() => navigate('goals')}>Set a Goal</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="card summary-card" style={{alignItems: 'flex-start', textAlign: 'left', gap: '0.5rem'}}>
                <h3 className="summary-card-title" style={{fontSize: '1.1rem'}}>Meditation History</h3>
                <div className="journey-card-content">
                    {meditationHistory.length > 0 ? (
                        <ul className="journey-history-list">
                             {meditationHistory.slice(0, 3).map((entry, index) => (
                                <li key={index} className="journey-history-item">
                                    <span className="journey-history-item-date">{new Date(entry.date).toLocaleDateString()}</span>
                                    <span className="journey-history-item-result">{entry.title}</span>
                                </li>
                             ))}
                        </ul>
                    ) : (
                        <div className="no-data-placeholder">
                            <p>You haven't completed a meditation yet.</p>
                            <button className="dashboard-card-cta" onClick={() => navigate('meditation')}>Meditate</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="card summary-card" style={{alignItems: 'flex-start', textAlign: 'left', gap: '0.5rem'}}>
                <h3 className="summary-card-title" style={{fontSize: '1.1rem'}}>AUDIT History</h3>
                <div className="journey-card-content">
                    {auditHistory.length > 0 ? (
                        <ul className="journey-history-list">
                            {auditHistory.slice(0, 3).map((entry, index) => {
                                const result = getAuditResult(entry.score);
                                return (
                                    <li key={index} className="journey-history-item">
                                        <span className="journey-history-item-date">{new Date(entry.date).toLocaleDateString()}</span>
                                        <span className="journey-history-item-result">Score: {entry.score} ({result.level})</span>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="no-data-placeholder">
                            <p>You haven't completed the AUDIT screener yet.</p>
                            <button className="dashboard-card-cta" onClick={() => navigate('audit')}>Take Screener</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="card summary-card" style={{alignItems: 'flex-start', textAlign: 'left', gap: '0.5rem'}}>
                <h3 className="summary-card-title" style={{fontSize: '1.1rem'}}>ADHD Screener History</h3>
                 <div className="journey-card-content">
                    {adhdHistory.length > 0 ? (
                        <ul className="journey-history-list">
                             {adhdHistory.slice(0, 3).map((entry, index) => {
                                const isConsistent = entry.score >= 4;
                                return (
                                    <li key={index} className="journey-history-item">
                                        <span className="journey-history-item-date">{new Date(entry.date).toLocaleDateString()}</span>
                                        <span className="journey-history-item-result">Score: {entry.score}/6 ({isConsistent ? "Consistent" : "Not Consistent"})</span>
                                    </li>
                                );
                             })}
                        </ul>
                    ) : (
                        <div className="no-data-placeholder">
                            <p>You haven't completed the ADHD screener yet.</p>
                            <button className="dashboard-card-cta" onClick={() => navigate('adhd')}>Take Screener</button>
                        </div>
                    )}
                </div>
            </div>

        </main>
    </div>);
}

// --- Bottom Navigation Bar ---
const BottomNavBar = ({ currentPage, navigate, onMenuClick }) => {
    const navItems = [
        { id: 'home', label: 'Home', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg> },
        { id: 'tools', label: 'Tools', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M21.62 10.43c.2-1.6.01-3.61-1.28-5.38-1-1.34-2.43-2.18-4.04-2.4-2.03-.28-4.11.31-5.71 1.5-1.54 1.15-2.58 2.9-2.8 4.88-.17 1.5.18 3.42 1.32 5.21 1.09 1.71 2.58 2.65 4.19 2.87 2.05.28 4.13-.31 5.73-1.51 1.54-1.15 2.58-2.9 2.8-4.88l.07-.17zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg> },
        { id: 'journey', label: 'My Journey', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"/></svg> },
        { id: 'menu', label: 'Menu', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg> },
    ];
    
    return (
        <nav className="bottom-nav-bar">
            {navItems.map(item => (
                <button
                    key={item.id}
                    className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                    onClick={() => {
                        if (item.id === 'menu') {
                            onMenuClick();
                        } else {
                            navigate(item.id);
                        }
                    }}
                    aria-label={item.label}
                >
                    {item.icon}
                    <span className="nav-label">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};


// --- Profile Menu Component ---
const ProfileMenu = ({ isOpen, onClose, navigate, installPromptEvent, onInstallClick }: { isOpen: boolean, onClose: () => void, navigate: (page: string) => void, installPromptEvent: any, onInstallClick: () => void }) => {
    const menuRef = useRef(null);

    const handleItemClick = (page: string) => {
        if (page === 'install') {
            onInstallClick();
        } else if (page.startsWith('http')) {
            window.open(page, '_blank');
            if (page.includes('discord')) {
                const currentEvents = JSON.parse(localStorage.getItem('eventHistory') || '[]') as string[];
                localStorage.setItem('eventHistory', JSON.stringify([...currentEvents, 'discord_visit']));
                window.dispatchEvent(new Event('app:action'));
            }
        } else if (page.startsWith('mailto:')) {
            window.location.href = page;
        } else if (page === 'logout') {
            const pin = localStorage.getItem('userPIN');
            if (pin) {
                window.location.reload();
            }
        } else {
            navigate(page);
        }
        onClose();
    };
    
    const menuItems = useMemo(() => {
        const baseItems = [
            { id: 'profile', label: 'My Profile', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> },
            { type: 'divider' },
            { id: 'discord', label: 'The Discord Community', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.54 5.32c-1.3-.85-2.78-1.37-4.34-1.57-.44.63-.79 1.3-1.07 2-.5-.13-1-.24-1.52-.32.22-.69.5-1.35.8-2.02-1.54-.2-3.03-.73-4.33-1.57C3.53 7.63 2.5 11.9 4.1 16.22c2.1 1.42 4.22 1.63 4.22 1.63l.14-.32c-1.25-.33-2.33-.87-3.2-1.5.2.14.4.28.6.42 3.12 1.95 7.42 1.95 10.54 0 .2-.14.4-.28.6-.42-1.03.73-2.14 1.2-3.34 1.5l.14.32s2.12-.21 4.22-1.63c1.6-4.32.56-8.6-2.9-10.9zM9.1 13.43c-.83 0-1.5-.7-1.5-1.54s.67-1.54 1.5-1.54c.82 0 1.5.7 1.5 1.54s-.68 1.54-1.5 1.54zm5.8 0c-.83 0-1.5-.7-1.5-1.54s.67-1.54 1.5-1.54c.82 0 1.5.7 1.5 1.54s-.68 1.54-1.5 1.54z"/></svg>, navigate: 'https://discord.gg/w7N497SM' },
            { id: 'privacy', label: 'Privacy Policy', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>, navigate: 'privacy' },
            { type: 'divider' },
            { id: 'website', label: 'Website', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 015.08 16zm2.95-8H5.08a7.987 7.987 0 014.3-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>, navigate: 'https://www.yourjourneyyourtools.com' },
            { id: 'contact', label: 'Contact Us', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>, navigate: 'mailto:yourjourneyyourtools@gmail.com' },
            { type: 'divider' },
            { id: 'logout', label: 'Logout', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg> }
        ];

        if (installPromptEvent) {
            return [
                { id: 'install', label: 'Download App', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/></svg> },
                { type: 'divider' },
                ...baseItems
            ];
        }
        return baseItems;
    }, [installPromptEvent]);

    return (
        <>
            <div className={`profile-menu-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
            <aside ref={menuRef} className={`profile-slide-menu ${isOpen ? 'open' : ''}`}>
                <h2 className="profile-menu-title">Menu</h2>
                {menuItems.map((item, index) => {
                    if ('type' in item && item.type === 'divider') {
                        return <div key={`div-${index}`} className="profile-menu-divider" />;
                    } else if ('id' in item) { // Type guard
                        const page = 'navigate' in item && item.navigate ? item.navigate : item.id;
                        return (
                            <button key={item.id} className="profile-menu-item" onClick={() => handleItemClick(page)}>
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        );
                    }
                    return null;
                })}
            </aside>
        </>
    );
};


// --- Main App Component ---
const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentPage, setCurrentPage] = useState('home');
    const [pinnedTools, setPinnedTools] = useState<string[]>([]);
    const [userProfile, setUserProfile] = useState({ username: 'User' });
    const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
    const [toastQueue, setToastQueue] = useState<{ id: string, title: string, icon: string }[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!installPromptEvent) {
            return;
        }
        installPromptEvent.prompt();
        await installPromptEvent.userChoice;
        setInstallPromptEvent(null);
    };

    const checkAchievements = useCallback(() => {
        const data = {
            journalHistory: JSON.parse(localStorage.getItem('journalHistory') || '[]'),
            cravingsHistory: JSON.parse(localStorage.getItem('cravingsHistory') || '[]'),
            breathingHistory: JSON.parse(localStorage.getItem('breathingHistory') || '[]'),
            groundingHistory: JSON.parse(localStorage.getItem('groundingHistory') || '[]'),
            valuesHistory: JSON.parse(localStorage.getItem('valuesHistory') || '[]'),
            safetyPlan: JSON.parse(localStorage.getItem('safetyPlan') || '{}'),
            relapsePreventionPlan: JSON.parse(localStorage.getItem('relapsePreventionPlan') || '{}'),
            goals: JSON.parse(localStorage.getItem('goals') || '[]'),
            loginHistory: JSON.parse(localStorage.getItem('loginHistory') || '[]'),
            userProfile: JSON.parse(localStorage.getItem('userProfile') || '{}'),
            events: JSON.parse(localStorage.getItem('eventHistory') || '[]'),
            auditHistory: JSON.parse(localStorage.getItem('auditHistory') || '[]'),
            adhdHistory: JSON.parse(localStorage.getItem('adhdHistory') || '[]'),
            gratitudeHistory: JSON.parse(localStorage.getItem('gratitudeHistory') || '[]'),
            thoughtDiaryHistory: JSON.parse(localStorage.getItem('thoughtDiaryHistory') || '[]'),
            meditationHistory: JSON.parse(localStorage.getItem('meditationHistory') || '[]'),
            unlockedAchievements: JSON.parse(localStorage.getItem('unlockedAchievements') || '[]')
        };

        const currentUnlocked = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]') as string[];
        const newlyUnlocked = [];

        for (const key in ACHIEVEMENTS_DEFINITIONS) {
            if (!currentUnlocked.includes(key)) {
                if (ACHIEVEMENTS_DEFINITIONS[key as keyof typeof ACHIEVEMENTS_DEFINITIONS].check(data)) {
                    newlyUnlocked.push(key);
                }
            }
        }

        if (newlyUnlocked.length > 0) {
            const updatedUnlocked = [...currentUnlocked, ...newlyUnlocked];
            localStorage.setItem('unlockedAchievements', JSON.stringify(updatedUnlocked));
            setUnlockedAchievements(updatedUnlocked);

            // Add new achievements to toast queue
            const newToasts = newlyUnlocked.map(key => ({
                id: key,
                title: ACHIEVEMENTS_DEFINITIONS[key as keyof typeof ACHIEVEMENTS_DEFINITIONS].title,
                icon: ACHIEVEMENTS_DEFINITIONS[key as keyof typeof ACHIEVEMENTS_DEFINITIONS].icon,
            }));
            setToastQueue(prev => [...prev, ...newToasts]);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('app:action', checkAchievements);
        return () => window.removeEventListener('app:action', checkAchievements);
    }, [checkAchievements]);

    useEffect(() => {
        const storedPin = localStorage.getItem('userPIN');
        if (!storedPin) {
            setIsLoggedIn(false); // Force to login/setup screen
        }

        const storedPins = JSON.parse(localStorage.getItem('pinnedTools') || '["journal", "breathing", "cravings", "goals"]');
        setPinnedTools(storedPins);

        const storedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        if (storedProfile.username) {
            setUserProfile(storedProfile);
        }

        const storedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
        setUnlockedAchievements(storedAchievements);
        checkAchievements();

        // Track logins for achievements
        const loginHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]') as string[];
        const today = new Date().toISOString();
        if (!loginHistory.some(d => new Date(d).toDateString() === new Date(today).toDateString())) {
            loginHistory.push(today);
            localStorage.setItem('loginHistory', JSON.stringify(loginHistory));
        }

    }, [checkAchievements]);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        const storedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        if (storedProfile.username) {
            setUserProfile(storedProfile);
        }
    };

    const navigate = (page: string) => {
        setCurrentPage(page);
        window.scrollTo(0, 0); // Scroll to top on page change
    };

    const togglePin = (toolId: string) => {
        setPinnedTools(prev => {
            const newPinned = prev.includes(toolId)
                ? prev.filter(id => id !== toolId)
                : [...prev, toolId];
            localStorage.setItem('pinnedTools', JSON.stringify(newPinned));
            return newPinned;
        });
    };

    const handleProfileUpdate = (e: CustomEvent) => {
        setUserProfile(e.detail);
    };

    useEffect(() => {
        window.addEventListener('app:profile_updated', handleProfileUpdate as EventListener);
        return () => window.removeEventListener('app:profile_updated', handleProfileUpdate as EventListener);
    }, []);

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage userProfile={userProfile} pinnedTools={pinnedTools} togglePin={togglePin} navigate={navigate} />;
            case 'tools':
                return <ToolsPage navigate={navigate} pinnedTools={pinnedTools} togglePin={togglePin} />;
            case 'journal':
                return <JournalPage navigate={navigate} />;
            case 'audit':
                 return <AuditPage navigate={navigate} />;
            case 'adhd':
                return <ADHDPage navigate={navigate} />;
            case 'profile':
                return <ProfilePage navigate={navigate} />;
            case 'privacy':
                return <PrivacyPage navigate={navigate} />;
            case 'gratitude':
                return <GratitudeLogPage navigate={navigate} />;
            case 'thought-diary':
                return <ThoughtDiaryPage navigate={navigate} />;
            case 'safety-plan':
                return <SafetyPlanPage navigate={navigate} />;
            case 'relapse-prevention':
                return <RelapsePreventionPage navigate={navigate} />;
            case 'cravings':
                return <CravingsPage navigate={navigate} />;
            case 'breathing':
                return <BreathingPage navigate={navigate} />;
            case 'grounding':
                return <GroundingPage navigate={navigate} />;
            case 'values-exercise':
                return <ValuesExercisePage navigate={navigate} />;
            case 'meditation':
                return <GuidedMeditationPage navigate={navigate} />;
            case 'goals':
                return <GoalsPage navigate={navigate} />;
            case 'achievements':
                return <AchievementsPage navigate={navigate} />;
            case 'journey':
                 return <JourneyPage navigate={navigate} unlockedAchievements={unlockedAchievements} />;
            default:
                return <HomePage userProfile={userProfile} pinnedTools={pinnedTools} togglePin={togglePin} navigate={navigate} />;
        }
    };
    
    if (!isLoggedIn) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="app-container">
            {toastQueue.length > 0 && (
                <Toast
                    key={toastQueue[0].id}
                    message={toastQueue[0].title}
                    icon={toastQueue[0].icon}
                    onClose={() => setToastQueue(prev => prev.slice(1))}
                />
            )}
            <ProfileMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                navigate={navigate}
                installPromptEvent={installPromptEvent}
                onInstallClick={handleInstallClick}
            />
            {renderPage()}
            <BottomNavBar currentPage={currentPage} navigate={navigate} onMenuClick={() => setIsMenuOpen(true)} />
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}