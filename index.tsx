/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

// Custom Hook
import { useAppData } from './src/hooks/useAppData';

// Pages
import { HomePage } from './src/pages/HomePage';
import { ToolsPage } from './src/pages/ToolsPage';
import { JournalPage } from './src/pages/JournalPage';
import { AuditPage } from './src/pages/AuditPage';
import { ADHDPage } from './src/pages/ADHDPage';
import { ProfilePage } from './src/pages/ProfilePage';
import { PrivacyPage } from './src/pages/PrivacyPage';
import { GratitudeLogPage } from './src/pages/GratitudeLogPage';
import { ThoughtDiaryPage } from './src/pages/ThoughtDiaryPage';
import { SafetyPlanPage } from './src/pages/SafetyPlanPage';
import { RelapsePreventionPage } from './src/pages/RelapsePreventionPage';
import { CravingsPage } from './src/pages/CravingsPage';
import { BreathingPage } from './src/pages/BreathingPage';
import { GroundingPage } from './src/pages/GroundingPage';
import { ValuesExercisePage } from './src/pages/ValuesExercisePage';
import { GuidedMeditationPage } from './src/pages/GuidedMeditationPage';
import { GoalsPage } from './src/pages/GoalsPage';
import { AchievementsPage } from './src/pages/AchievementsPage';
import { JourneyPage } from './src/pages/JourneyPage';
import { LoginPage } from './src/pages/LoginPage';
import { CognitiveDistortionsPage } from './src/pages/CognitiveDistortionsPage';
import { OppositeActionPage } from './src/pages/OppositeActionPage';
import { ProblemSolvingPage } from './src/pages/ProblemSolvingPage';

// Components
import { Toast } from './src/components/Toast';
import { ProfileMenu } from './src/components/ProfileMenu';
import { BottomNavBar } from './src/components/BottomNavBar';

// Types - imported for side effects (global declarations)
import './src/types/index';

// --- Main App Component ---
const App = () => {
    const {
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
        handleInstallClick
    } = useAppData();

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
            case 'cognitive-distortions':
                return <CognitiveDistortionsPage navigate={navigate} />;
            case 'opposite-action':
                return <OppositeActionPage navigate={navigate} />;
            case 'problem-solving':
                return <ProblemSolvingPage navigate={navigate} />;
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
                    onClose={closeToast}
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