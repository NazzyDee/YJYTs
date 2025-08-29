/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ADHD_QUESTIONS, ADHD_ANSWERS } from '../data/adhd';
import { AdhdHistoryEntry } from '../types';

const getAdhdResult = (answers: { [key: number]: number }) => {
    // A positive screen is when 4 or more answers are "Often" or "Very Often" (value 3 or 4)
    const score = Object.values(answers).reduce((sum, value) => sum + (value >= 3 ? 1 : 0), 0);
    if (score >= 4) {
        return {
            level: 'Symptoms may be consistent with Adult ADHD',
            recommendation: 'Your responses suggest that your symptoms may be consistent with Adult ADHD. It may be beneficial to share these results with a healthcare provider for a comprehensive evaluation.',
        };
    } else {
        return {
            level: 'Symptoms not consistent with Adult ADHD',
            recommendation: 'Your responses do not suggest symptoms consistent with Adult ADHD based on this screener. If you still have concerns, consider speaking with a healthcare professional.',
        };
    }
};

export const ADHDPage = ({ navigate }: { navigate: (page: string) => void }) => {
    const [view, setView] = useState<'intro' | 'quiz' | 'results'>('intro');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [history, setHistory] = useState<AdhdHistoryEntry[]>([]);
    const [finalResult, setFinalResult] = useState<{ level: string, recommendation: string } | null>(null);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('adhdHistory') || '[]') as AdhdHistoryEntry[];
        setHistory(storedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);

    const handleAnswer = (value: number) => {
        const newAnswers = { ...answers, [currentQuestion]: value };
        setAnswers(newAnswers);

        setTimeout(() => {
            if (currentQuestion < ADHD_QUESTIONS.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
            } else {
                const result = getAdhdResult(newAnswers);
                setFinalResult(result);

                const score = Object.values(newAnswers).reduce((sum, value) => sum + (value >= 3 ? 1 : 0), 0);
                const newEntry: AdhdHistoryEntry = {
                    score,
                    date: new Date().toISOString(),
                    answers: newAnswers
                };
                const updatedHistory = [newEntry, ...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                localStorage.setItem('adhdHistory', JSON.stringify(updatedHistory));
                setHistory(updatedHistory);
                window.dispatchEvent(new Event('app:action'));

                setView('results');
            }
        }, 300);
    };

    const startQuiz = () => {
        setAnswers({});
        setCurrentQuestion(0);
        setFinalResult(null);
        setView('quiz');
    };

    const renderIntro = () => (
        <>
            <div className="card no-hover" style={{ textAlign: 'left', gap: '1.5rem', marginBottom: '2rem' }}>
                <p className="tracker-description" style={{ textAlign: 'left' }}>
                    The Adult ADHD Self-Report Scale (ASRS-v1.1) Screener is a tool to help you recognize the signs and symptoms of adult ADHD.
                </p>
                <button className="log-button" onClick={startQuiz}>Begin Screener</button>
            </div>
             <section className="adhd-history">
                <h3 className="history-title">History</h3>
                {history.length > 0 ? (
                    <ul>
                        {history.map((entry, index) => (
                             <li key={index}>
                                <span>{new Date(entry.date).toLocaleDateString()}</span>
                                <span>Positive Answers: {entry.score}/6</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                     <p className="no-history-message">You have no previous ADHD results.</p>
                )}
            </section>
        </>
    );

    const renderQuiz = () => {
        const question = ADHD_QUESTIONS[currentQuestion];
        const progress = ((currentQuestion) / ADHD_QUESTIONS.length) * 100;
        return (
            <>
                <div className="adhd-progress-bar-container">
                    <div className="adhd-progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="card no-hover adhd-question-card">
                    <p className="adhd-question-number">Question {currentQuestion + 1} of {ADHD_QUESTIONS.length}</p>
                    <p className="adhd-question-text">{question.question}</p>
                    <div className="adhd-answer-options">
                        {ADHD_ANSWERS.map((answer, index) => (
                            <button
                                key={index}
                                className={`adhd-answer-button ${answers[currentQuestion] === answer.value ? 'selected' : ''}`}
                                onClick={() => handleAnswer(answer.value)}
                            >
                                {answer.text}
                            </button>
                        ))}
                    </div>
                </div>
            </>
        );
    };

    const renderResults = () => (
        <>
            <div className="card no-hover adhd-result-card">
                <h2 className="adhd-result-header">{finalResult?.level}</h2>
                <p className="adhd-result-text">{finalResult?.recommendation}</p>
                <button className="log-button" onClick={() => setView('intro')} style={{marginTop: '1rem'}}>Done</button>
            </div>
            <div className="card disclaimer-card no-hover" style={{marginTop: '1.5rem'}}>
                <h4>Disclaimer</h4>
                <p>This tool is for informational purposes only and is not a substitute for a professional medical diagnosis. Please consult a healthcare provider for advice about your health.</p>
            </div>
        </>
    );

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                <h1 className="app-title">ADHD Screener</h1>
            </header>
            <main>
                {view === 'intro' && renderIntro()}
                {view === 'quiz' && renderQuiz()}
                {view === 'results' && renderResults()}
            </main>
        </div>
    );
};
