/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThoughtDiaryEntry } from '../types';
import { InfoTooltip } from '../components/InfoTooltip';

// --- Thought Diary Page ---
export const ThoughtDiaryPage = ({ navigate }: { navigate: (page: string) => void }) => {
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
