/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ValuesHistoryEntry } from '../types';

export const ValuesExercisePage = ({ navigate }: { navigate: (page: string) => void }) => {
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
