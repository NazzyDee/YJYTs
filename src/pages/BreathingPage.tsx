/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

// --- Breathing Page Component ---
export const BreathingPage = ({ navigate }: { navigate: (page: string) => void }) => {
    const [isBreathing, setIsBreathing] = useState(false);
    const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold-in' | 'exhale' | 'hold-out'>('idle');
    const [count, setCount] = useState(4);
    const [history, setHistory] = useState<{ date: string }[]>([]);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('breathingHistory') || '[]');
        setHistory(storedHistory.sort((a: {date: string}, b: {date: string}) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
