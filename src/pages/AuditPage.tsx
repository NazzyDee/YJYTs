/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AUDIT_QUESTIONS, getAuditResult } from '../data/audit';
import { AuditHistoryEntry } from '../types';

export const AuditPage = ({ navigate }: { navigate: (page: string) => void }) => {
    const [view, setView] = useState<'intro' | 'quiz' | 'results'>('intro');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [history, setHistory] = useState<AuditHistoryEntry[]>([]);
    const [finalScore, setFinalScore] = useState(0);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('auditHistory') || '[]') as AuditHistoryEntry[];
        setHistory(storedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);

    const handleAnswer = (score: number) => {
        const newAnswers = { ...answers, [currentQuestion]: score };
        setAnswers(newAnswers);

        setTimeout(() => {
            if (currentQuestion < AUDIT_QUESTIONS.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
            } else {
                const totalScore = Object.values(newAnswers).reduce((sum, s) => sum + s, 0);
                setFinalScore(totalScore);
                
                const newEntry: AuditHistoryEntry = {
                    score: totalScore,
                    date: new Date().toISOString()
                };
                const updatedHistory = [newEntry, ...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                localStorage.setItem('auditHistory', JSON.stringify(updatedHistory));
                setHistory(updatedHistory);
                window.dispatchEvent(new Event('app:action'));

                setView('results');
            }
        }, 300);
    };
    
    const startQuiz = () => {
        setAnswers({});
        setCurrentQuestion(0);
        setFinalScore(0);
        setView('quiz');
    };

    const renderIntro = () => (
        <>
            <div className="card no-hover" style={{ textAlign: 'left', gap: '1.5rem', marginBottom: '2rem' }}>
                <p className="tracker-description" style={{ textAlign: 'left' }}>
                    The Alcohol Use Disorders Identification Test (AUDIT) is a 10-question screening tool to identify hazardous and harmful alcohol consumption.
                </p>
                <button className="log-button" onClick={startQuiz}>Begin Screener</button>
            </div>
            <section className="audit-history">
                <h3 className="history-title">History</h3>
                {history.length > 0 ? (
                    <ul>
                        {history.map((entry, index) => (
                            <li key={index}>
                                <span>{new Date(entry.date).toLocaleDateString()}</span>
                                <span>Score: {entry.score}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-history-message">You have no previous AUDIT results.</p>
                )}
            </section>
        </>
    );
    
    const renderQuiz = () => {
        const question = AUDIT_QUESTIONS[currentQuestion];
        const progress = ((currentQuestion) / AUDIT_QUESTIONS.length) * 100;
        return (
            <>
                <div className="audit-progress-bar-container">
                    <div className="audit-progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="card no-hover audit-question-card">
                    <p className="audit-question-number">Question {currentQuestion + 1} of {AUDIT_QUESTIONS.length}</p>
                    <p className="audit-question-text">{question.question}</p>
                    <div className="audit-answer-options">
                        {question.answers.map((answer, index) => (
                            <button
                                key={index}
                                className={`audit-answer-button ${answers[currentQuestion] === answer.score ? 'selected' : ''}`}
                                onClick={() => handleAnswer(answer.score)}
                            >
                                {answer.text}
                            </button>
                        ))}
                    </div>
                </div>
            </>
        );
    };

    const renderResults = () => {
        const result = getAuditResult(finalScore);
        return (
            <>
                <div className="card no-hover audit-result-card">
                    <div className={`audit-score-display zone-${result.zone}`}>
                        <span className="audit-score-value">{finalScore}</span>
                        <span className="audit-score-label">Score</span>
                    </div>
                    <h2 className="audit-level-display">{result.level} (Zone {result.zone})</h2>
                    <p className="audit-recommendation">{result.recommendation}</p>
                    <button className="log-button" onClick={() => setView('intro')} style={{marginTop: '1rem'}}>Done</button>
                </div>
                <div className="card disclaimer-card no-hover" style={{marginTop: '1.5rem'}}>
                    <h4>Disclaimer</h4>
                    <p>This tool is for informational purposes only and is not a substitute for a professional medical diagnosis. Please consult a healthcare provider for advice about your health.</p>
                </div>
            </>
        );
    };

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                <h1 className="app-title">AUDIT Screener</h1>
            </header>
            <main>
                {view === 'intro' && renderIntro()}
                {view === 'quiz' && renderQuiz()}
                {view === 'results' && renderResults()}
            </main>
        </div>
    );
};
