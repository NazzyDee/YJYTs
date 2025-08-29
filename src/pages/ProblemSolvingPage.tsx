/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ProblemSolvingHistoryEntry } from '../types';
import { InfoTooltip } from '../components/InfoTooltip';

export const ProblemSolvingPage = ({ navigate }: { navigate: (page: string) => void }) => {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [currentStep, setCurrentStep] = useState(0);
    const [history, setHistory] = useState<ProblemSolvingHistoryEntry[]>([]);
    const [plan, setPlan] = useState<Omit<ProblemSolvingHistoryEntry, 'id' | 'date' | 'status'>>({
        problemDefinition: '',
        solutions: [{ text: '', pros: '', cons: '' }, { text: '', pros: '', cons: '' }],
        chosenSolution: '',
        actionPlan: ''
    });
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('problemSolvingHistory') || '[]') as ProblemSolvingHistoryEntry[];
        setHistory(storedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);

    const startNewPlan = () => {
        setPlan({
            problemDefinition: '',
            solutions: [{ text: '', pros: '', cons: '' }],
            chosenSolution: '',
            actionPlan: ''
        });
        setCurrentStep(0);
        setView('form');
    };
    
    const handleSolutionTextChange = (index: number, value: string) => {
        const newSolutions = [...plan.solutions];
        newSolutions[index].text = value;
        setPlan(p => ({ ...p, solutions: newSolutions }));
    };
    
    const addSolution = () => {
        setPlan(p => ({ ...p, solutions: [...p.solutions, { text: '', pros: '', cons: '' }] }));
    };

    const removeSolution = (index: number) => {
        const newSolutions = plan.solutions.filter((_, i) => i !== index);
        setPlan(p => ({ ...p, solutions: newSolutions }));
    };
    
    const handleProsConsChange = (index: number, type: 'pros' | 'cons', value: string) => {
        const newSolutions = [...plan.solutions];
        newSolutions[index][type] = value;
        setPlan(p => ({...p, solutions: newSolutions}));
    }

    const handleSave = () => {
        const newEntry: ProblemSolvingHistoryEntry = {
            ...plan,
            id: `ps_${Date.now()}`,
            date: new Date().toISOString(),
            status: 'completed',
        };

        const updatedHistory = [newEntry, ...history];
        localStorage.setItem('problemSolvingHistory', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
        window.dispatchEvent(new Event('app:action'));

        setView('list');
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
    };

    const STEPS = [
        "Define Problem",
        "Brainstorm Solutions",
        "Analyze Solutions",
        "Choose Solution",
        "Create Action Plan",
        "Review & Save"
    ];

    const renderForm = () => {
        const progress = (currentStep / (STEPS.length -1)) * 100;

        return (
            <>
                <div className="wizard-progress-bar-container">
                    <div className="wizard-progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="card no-hover wizard-step-card">
                    <p className="adhd-question-number">Step {currentStep + 1} of {STEPS.length}</p>
                    <h2 className="wizard-step-title">{STEPS[currentStep]}</h2>

                    {currentStep === 0 && (
                        <>
                            <p className="wizard-step-prompt">What is the problem you're facing? Be as specific and objective as possible.</p>
                            <div className="form-group">
                                <textarea value={plan.problemDefinition} onChange={(e) => setPlan(p => ({ ...p, problemDefinition: e.target.value }))} rows={5} autoFocus />
                            </div>
                        </>
                    )}
                    {currentStep === 1 && (
                        <>
                           <p className="wizard-step-prompt">List all potential solutions, no matter how small or silly they seem. Don't judge them yet.</p>
                           <div className="list-item-container">
                               {plan.solutions.map((sol, index) => (
                                   <div key={index} className="list-item">
                                       <input type="text" value={sol.text} onChange={(e) => handleSolutionTextChange(index, e.target.value)} placeholder={`Solution #${index + 1}`} style={{background: 'transparent', border: 'none', color: 'var(--text-light)', flexGrow: 1}}/>
                                       <button type="button" onClick={() => removeSolution(index)} className="remove-list-item-btn">
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                                       </button>
                                   </div>
                               ))}
                           </div>
                           <button type="button" onClick={addSolution} className="log-button secondary" style={{alignSelf: 'flex-start', width: 'auto', marginTop: '1rem'}}>Add Solution</button>
                        </>
                    )}
                    {currentStep === 2 && (
                        <>
                            <p className="wizard-step-prompt">Now, consider the pros and cons for each potential solution.</p>
                            {plan.solutions.filter(s => s.text.trim()).map((sol, index) => (
                                <div key={index} className="problem-solution-item">
                                    <h4>{sol.text}</h4>
                                    <div className="form-group">
                                        <label>Pros</label>
                                        <textarea value={sol.pros} onChange={(e) => handleProsConsChange(index, 'pros', e.target.value)} rows={3} placeholder="Advantages of this solution..."/>
                                    </div>
                                    <div className="form-group">
                                        <label>Cons</label>
                                        <textarea value={sol.cons} onChange={(e) => handleProsConsChange(index, 'cons', e.target.value)} rows={3} placeholder="Disadvantages of this solution..."/>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                     {currentStep === 3 && (
                        <>
                            <p className="wizard-step-prompt">Based on your analysis, which solution seems best to try first?</p>
                            <div className="wizard-radio-group">
                                {plan.solutions.filter(s => s.text.trim()).map((sol, index) => (
                                    <button key={index} className={`wizard-radio-button ${plan.chosenSolution === sol.text ? 'selected' : ''}`} onClick={() => setPlan(p => ({...p, chosenSolution: sol.text}))}>
                                        {sol.text}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                    {currentStep === 4 && (
                         <>
                            <p className="wizard-step-prompt">What are the specific steps to implement your chosen solution? Be concrete.</p>
                            <div className="form-group">
                                <textarea value={plan.actionPlan} onChange={(e) => setPlan(p => ({ ...p, actionPlan: e.target.value }))} rows={5} placeholder="1. First step...&#10;2. Second step...&#10;3. Third step..." autoFocus />
                            </div>
                        </>
                    )}
                    {currentStep === 5 && (
                        <>
                             <div className="thought-diary-summary-item">
                                <h4>Problem</h4>
                                <p>{plan.problemDefinition}</p>
                            </div>
                            <div className="thought-diary-summary-item">
                                <h4>Chosen Solution</h4>
                                <p>{plan.chosenSolution}</p>
                            </div>
                            <div className="thought-diary-summary-item">
                                <h4>Action Plan</h4>
                                <p>{plan.actionPlan}</p>
                            </div>
                        </>
                    )}
                </div>

                <div className="thought-diary-navigation">
                    <button className="log-button secondary" onClick={() => setCurrentStep(p => p - 1)} disabled={currentStep === 0}>Previous</button>
                    {currentStep < STEPS.length - 1 ? (
                        <button className="log-button" onClick={() => setCurrentStep(p => p + 1)}>Next</button>
                    ) : (
                        <button className="log-button" onClick={handleSave}>Save Plan</button>
                    )}
                </div>
            </>
        )
    };

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => view === 'form' ? setView('list') : navigate('tools')} className="back-button" aria-label="Go Back">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 className="app-title">Problem-Solving</h1>
                    <InfoTooltip text="A structured CBT technique to break down overwhelming problems into manageable steps, from brainstorming solutions to creating a concrete action plan." />
                </div>
            </header>
            <main>
                {view === 'list' ? (
                     <>
                        <div className="card no-hover" style={{ textAlign: 'left', gap: '1.5rem', marginBottom: '2rem' }}>
                            <p className="tracker-description" style={{ textAlign: 'left' }}>
                                Feeling stuck? This structured exercise helps you tackle problems by defining them clearly, brainstorming solutions, and creating a concrete action plan.
                            </p>
                            <button className="log-button" onClick={startNewPlan}>Solve a New Problem</button>
                            {showConfirmation && <p className="confirmation-message">Problem-solving plan saved!</p>}
                        </div>

                        <section className="history-section" style={{marginTop: 0}}>
                            <h3 className="history-title">History</h3>
                            {history.length > 0 ? (
                                <ul className="history-list">
                                    {history.map(entry => (
                                        <li key={entry.id} className="history-item">
                                            <div className="history-details" style={{alignItems: 'flex-start', textAlign: 'left', flexGrow: 1}}>
                                                <strong>{entry.problemDefinition.substring(0, 50)}{entry.problemDefinition.length > 50 ? '...' : ''}</strong>
                                                <span style={{color: 'var(--text-muted)'}}>{new Date(entry.date).toLocaleDateString()}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="no-history-message">You have no saved plans yet.</p>
                            )}
                        </section>
                    </>
                ) : renderForm()}
            </main>
        </div>
    );
};
