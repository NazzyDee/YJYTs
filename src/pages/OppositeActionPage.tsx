/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OppositeActionHistoryEntry } from '../types';
import { InfoTooltip } from '../components/InfoTooltip';

const EMOTION_DATA: Record<string, { urge: string; opposite: string }> = {
    'Fear / Anxiety': {
        urge: 'Avoid, run away, hide, or freeze. Procrastinate on things that make you anxious.',
        opposite: 'Approach, engage, do what you\'re afraid of (safely). Stay in the situation until the fear subsides.'
    },
    'Anger / Frustration': {
        urge: 'Attack, yell, be aggressive, make threats, or clench fists.',
        opposite: 'Gently avoid the person you are angry with, be kind, do something nice. Imagine understanding and empathy for the other person.'
    },
    'Sadness / Grief': {
        urge: 'Withdraw, isolate, stay in bed, be inactive, or dwell on what is lost.',
        opposite: 'Get active, engage with others, do something that gives you a sense of mastery or pleasure. Do things you would do if you felt better.'
    },
    'Shame / Guilt': {
        urge: 'Hide, avoid people you feel you\'ve wronged, disappear, or be self-deprecating.',
        opposite: 'Apologize if appropriate. Talk about what happened with people who won\'t judge you. Let others see your face; don\'t hide.'
    }
};

export const OppositeActionPage = ({ navigate }: { navigate: (page: string) => void }) => {
    const [view, setView] = useState<'intro' | 'form'>('intro');
    const [currentStep, setCurrentStep] = useState(0);
    const [history, setHistory] = useState<OppositeActionHistoryEntry[]>([]);
    const [formData, setFormData] = useState({
        emotion: '',
        isJustified: null as boolean | null,
        commitment: '',
    });
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('oppositeActionHistory') || '[]') as OppositeActionHistoryEntry[];
        setHistory(storedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);
    
    const startExercise = () => {
        setFormData({ emotion: '', isJustified: null, commitment: '' });
        setCurrentStep(0);
        setView('form');
    };

    const handleSave = () => {
        const emotionData = EMOTION_DATA[formData.emotion];
        const newEntry: OppositeActionHistoryEntry = {
            date: new Date().toISOString(),
            emotion: formData.emotion,
            actionUrge: emotionData.urge,
            oppositeAction: emotionData.opposite,
            commitment: formData.commitment
        };
        
        const updatedHistory = [newEntry, ...history];
        localStorage.setItem('oppositeActionHistory', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
        window.dispatchEvent(new Event('app:action'));

        setView('intro');
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
    };
    
    const STEPS = [
        {
            title: "Identify the Emotion",
            prompt: "What primary emotion are you feeling right now? This skill works best when the emotion (or its intensity) doesn't fit the facts of the situation.",
            isValid: () => formData.emotion !== '',
        },
        {
            title: "Check the Facts",
            prompt: "Is this emotion and its intensity justified by the current situation?",
            isValid: () => formData.isJustified !== null,
        },
        {
            title: "Identify the Action Urge",
            prompt: "This emotion is urging you to act in a certain way. Recognizing this urge is the first step to changing it.",
            isValid: () => true,
        },
        {
            title: "Brainstorm the Opposite Action",
            prompt: "Acting opposite to the urge can change the emotion. What is the opposite of what you feel like doing?",
            isValid: () => true,
        },
        {
            title: "Commit to One Small Step",
            prompt: "What is one small, manageable step you can take right now to act opposite to your emotion? Be specific.",
            isValid: () => formData.commitment.trim() !== '',
        },
    ];

    const renderForm = () => {
        const step = STEPS[currentStep];
        const progress = (currentStep / STEPS.length) * 100;

        return (
            <>
                <div className="wizard-progress-bar-container">
                    <div className="wizard-progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="card no-hover wizard-step-card">
                    <p className="adhd-question-number">Step {currentStep + 1} of {STEPS.length}</p>
                    <h2 className="wizard-step-title">{step.title}</h2>
                    <p className="wizard-step-prompt">{step.prompt}</p>

                    {currentStep === 0 && (
                        <div className="form-group">
                            <select value={formData.emotion} onChange={(e) => setFormData(p => ({...p, emotion: e.target.value}))}>
                                <option value="" disabled>Select an emotion...</option>
                                {Object.keys(EMOTION_DATA).map(emotion => <option key={emotion} value={emotion}>{emotion}</option>)}
                            </select>
                        </div>
                    )}
                    {currentStep === 1 && (
                        <div className="wizard-radio-group">
                             <button className={`wizard-radio-button ${formData.isJustified === false ? 'selected' : ''}`} onClick={() => setFormData(p => ({ ...p, isJustified: false }))}>No, it's not justified</button>
                            <button className={`wizard-radio-button ${formData.isJustified === true ? 'selected' : ''}`} onClick={() => setFormData(p => ({ ...p, isJustified: true }))}>Yes, it's justified</button>
                           
                            {formData.isJustified === true && (
                                <div className="action-urge-display" style={{marginTop: '1rem'}}>
                                    <h4>That's Okay!</h4>
                                    <p>If the emotion fits the facts, it's a natural response. Opposite Action may not be the right skill. Consider using a distress tolerance skill like <strong>Grounding</strong> or reviewing your <strong>Safety Plan</strong>.</p>
                                </div>
                            )}
                        </div>
                    )}
                    {currentStep === 2 && (
                        <div className="action-urge-display">
                            <h4>Action Urge</h4>
                            <p>{EMOTION_DATA[formData.emotion].urge}</p>
                        </div>
                    )}
                     {currentStep === 3 && (
                        <div className="opposite-action-display">
                            <h4>Opposite Action</h4>
                            <p>{EMOTION_DATA[formData.emotion].opposite}</p>
                        </div>
                    )}
                     {currentStep === 4 && (
                        <div className="form-group">
                            <textarea
                                value={formData.commitment}
                                onChange={(e) => setFormData(p => ({...p, commitment: e.target.value}))}
                                rows={4}
                                placeholder="e.g., I will text one friend and ask how they are."
                                autoFocus
                            />
                        </div>
                    )}
                </div>
                <div className="thought-diary-navigation">
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
                            disabled={!step.isValid() || formData.isJustified === true}
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            className="log-button"
                            onClick={handleSave}
                            disabled={!step.isValid()}
                        >
                            Finish Exercise
                        </button>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => view === 'form' ? setView('intro') : navigate('tools')} className="back-button" aria-label="Go Back">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 className="app-title">Opposite Action</h1>
                    <InfoTooltip text="A DBT skill to change unwanted emotions by acting opposite to their action urges, especially when the emotion doesn't fit the facts of the situation." />
                </div>
            </header>
            <main>
                {view === 'intro' ? (
                     <>
                        <div className="card no-hover" style={{ textAlign: 'left', gap: '1.5rem', marginBottom: '2rem' }}>
                            <p className="tracker-description" style={{ textAlign: 'left' }}>
                                When you experience a powerful, unjustified emotion, your action urge can lead you to do things that make the situation worse. By choosing to do the opposite, you can change the emotion itself.
                            </p>
                            <button className="log-button" onClick={startExercise}>Start Exercise</button>
                            {showConfirmation && <p className="confirmation-message">Great job completing the exercise!</p>}
                        </div>

                        <section className="history-section" style={{marginTop: 0}}>
                            <h3 className="history-title">History</h3>
                            {history.length > 0 ? (
                                <ul className="history-list">
                                    {history.slice(0, 5).map(entry => (
                                        <li key={entry.date} className="history-item">
                                            <div className="history-details" style={{alignItems: 'flex-start', textAlign: 'left', flexGrow: 1}}>
                                                <strong>{entry.emotion}</strong>
                                                <span style={{color: 'var(--text-muted)'}}>{new Date(entry.date).toLocaleDateString()}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="no-history-message">You haven't completed this exercise yet.</p>
                            )}
                        </section>
                    </>
                ) : renderForm() }
            </main>
        </div>
    );
};
