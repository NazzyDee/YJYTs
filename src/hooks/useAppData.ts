/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { ACHIEVEMENTS_DEFINITIONS } from '../data/achievements';

export const useAppData = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentPage, setCurrentPage] = useState('home');
    const [pinnedTools, setPinnedTools] = useState<string[]>([]);
    const [userProfile, setUserProfile] = useState({ username: 'User' });
    const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
    const [toastQueue, setToastQueue] = useState<{ id: string, title: string, icon: string }[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

    // --- PWA Install Logic ---
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!installPromptEvent) return;
        installPromptEvent.prompt();
        await installPromptEvent.userChoice;
        setInstallPromptEvent(null);
    };

    // --- Achievements Logic ---
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
            oppositeActionHistory: JSON.parse(localStorage.getItem('oppositeActionHistory') || '[]'),
            problemSolvingHistory: JSON.parse(localStorage.getItem('problemSolvingHistory') || '[]'),
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


    // --- Initial Data Loading ---
    useEffect(() => {
        // We don't automatically log in, LoginPage handles the PIN.
        // This effect loads all other user data from localStorage.
        const storedPins = JSON.parse(localStorage.getItem('pinnedTools') || '["journal", "breathing", "cravings", "goals"]');
        setPinnedTools(storedPins);

        const storedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        if (storedProfile.username) {
            setUserProfile(storedProfile);
        }

        const storedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
        setUnlockedAchievements(storedAchievements);
        checkAchievements();
    }, [checkAchievements]);

    // --- Profile Update Logic ---
    useEffect(() => {
        const handleProfileUpdate = (e: CustomEvent) => {
            setUserProfile(e.detail);
        };
        window.addEventListener('app:profile_updated', handleProfileUpdate as EventListener);
        return () => window.removeEventListener('app:profile_updated', handleProfileUpdate as EventListener);
    }, []);

    // --- Handlers ---
    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        const storedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        if (storedProfile.username) {
            setUserProfile(storedProfile);
        }
        
        // Track logins for achievements
        const loginHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]') as string[];
        const today = new Date().toISOString();
        if (!loginHistory.some(d => new Date(d).toDateString() === new Date(today).toDateString())) {
            loginHistory.push(today);
            localStorage.setItem('loginHistory', JSON.stringify(loginHistory));
            // Trigger achievement check after updating login history
            window.dispatchEvent(new Event('app:action'));
        }
    };

    const navigate = (page: string) => {
        setCurrentPage(page);
        window.scrollTo(0, 0);
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
    
    const closeToast = () => {
        setToastQueue(prev => prev.slice(1));
    };

    return {
        isLoggedIn,
        handleLoginSuccess,
        currentPage,
        navigate,
        pinnedTools,
        togglePin,
        userProfile,
        unlockedAchievements,
        toastQueue,
        closeToast,
        isMenuOpen,
        setIsMenuOpen,
        installPromptEvent,
        handleInstallClick,
    };
};