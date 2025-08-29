/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

// --- Grounding Page Component ---
export const GroundingPage = ({ navigate }: { navigate: (page: string) => void }) => {
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
        setHistory(storedHistory.sort((a: {date: string}, b: {date: string}) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
