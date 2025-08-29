/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoalEntry, ValuesHistoryEntry } from '../types';

export const GoalsPage = ({ navigate }: { navigate: (page: string) => void }) => {
    const [view, setView] = useState<'list' | 'creator'>('list');
    const [goals, setGoals] = useState<GoalEntry[]>([]);
    const [coreValues, setCoreValues] = useState<string[]>([]);
    const [reviewingGoal, setReviewingGoal] = useState<GoalEntry | null>(null);
    const [reflectionText, setReflectionText] = useState('');
    const [newTargetDate, setNewTargetDate] = useState('');
    const [newGoal, setNewGoal] = useState({
        title: '',
        measurableUnit: '',
        measurableTarget: '',
        achievable: '',
        relevant: '',
        relevantValues: [] as string[],
        targetDate: '',
    });
    
    useEffect(() => {
        const storedGoals = JSON.parse(localStorage.getItem('goals') || '[]') as any[];
        // Migration for old goal structure
        const migratedGoals: GoalEntry[] = storedGoals.map(goal => {
            if (typeof goal.measurable === 'string') {
                return {
                    ...goal,
                    measurableUnit: goal.measurable,
                    measurableTarget: 1, // Default old goals to a target of 1
                    measurableProgress: goal.status === 'completed' ? 1 : 0,
                    measurable: undefined, // remove old key
                };
            }
            return goal;
        });

        const sortedGoals = migratedGoals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setGoals(sortedGoals);
        if (JSON.stringify(migratedGoals) !== JSON.stringify(storedGoals)) {
            localStorage.setItem('goals', JSON.stringify(migratedGoals));
        }

        const valuesHistory = JSON.parse(localStorage.getItem('valuesHistory') || '[]') as ValuesHistoryEntry[];
        if (valuesHistory.length > 0) {
            setCoreValues(valuesHistory[0].top5);
        }
    }, []);

    const updateGoals = (updatedGoals: GoalEntry[]) => {
        const sortedGoals = updatedGoals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setGoals(sortedGoals);
        localStorage.setItem('goals', JSON.stringify(sortedGoals));
        window.dispatchEvent(new Event('app:action'));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewGoal(prev => ({ ...prev, [name]: value }));
    };

    const handleValueSelect = (value: string) => {
        setNewGoal(prev => {
            const newValues = prev.relevantValues.includes(value)
                ? prev.relevantValues.filter(v => v !== value)
                : [...prev.relevantValues, value];
            return { ...prev, relevantValues: newValues };
        });
    };
    
    const resetCreator = () => {
        setView('list');
        setNewGoal({
            title: '',
            measurableUnit: '',
            measurableTarget: '',
            achievable: '',
            relevant: '',
            relevantValues: [],
            targetDate: '',
        });
    }

    const handleSaveGoal = (e: React.FormEvent) => {
        e.preventDefault();
        const goalToAdd: GoalEntry = {
            title: newGoal.title,
            measurableUnit: newGoal.measurableUnit,
            measurableTarget: parseInt(newGoal.measurableTarget, 10) || 1,
            measurableProgress: 0,
            achievable: newGoal.achievable,
            relevant: newGoal.relevant,
            relevantValues: newGoal.relevantValues,
            targetDate: newGoal.targetDate,
            id: `goal_${Date.now()}`,
            status: 'active',
            createdAt: new Date().toISOString(),
        };
        updateGoals([...goals, goalToAdd]);
        resetCreator();
    };
    
    const handleProgressChange = (e: React.MouseEvent, goalId: string) => {
        e.stopPropagation();
        const updatedGoals = goals.map(goal => {
            if (goal.id === goalId) {
                const newProgress = goal.measurableProgress + 1;
                const isCompleted = newProgress >= goal.measurableTarget;
                return {
                    ...goal,
                    measurableProgress: isCompleted ? goal.measurableTarget : newProgress,
                    status: isCompleted ? 'completed' : 'active',
                } as GoalEntry;
            }
            return goal;
        });
        updateGoals(updatedGoals);
    };

    const handleDeleteGoal = (e: React.MouseEvent, goalId: string) => {
        e.stopPropagation(); // Prevent navigation/expansion
        if (window.confirm('Are you sure you want to delete this goal?')) {
            updateGoals(goals.filter(goal => goal.id !== goalId));
        }
    };

    const handleOpenReviewModal = (goal: GoalEntry) => {
        setReviewingGoal(goal);
        setReflectionText(goal.reflection || '');
        const today = new Date();
        today.setDate(today.getDate() + 7);
        setNewTargetDate(today.toISOString().split('T')[0]);
    };

    const handleCompleteFromReview = () => {
        if (!reviewingGoal) return;
        const updatedGoals = goals.map(g => g.id === reviewingGoal.id ? { ...g, status: 'completed' as 'completed', measurableProgress: g.measurableTarget } : g);
        updateGoals(updatedGoals);
        setReviewingGoal(null);
    };

    const handleSaveReflection = () => {
        if (!reviewingGoal) return;
        const updatedGoals = goals.map(g => g.id === reviewingGoal.id ? { ...g, reflection: reflectionText } : g);
        updateGoals(updatedGoals);
        setReviewingGoal(null);
    };

    const handleUpdateTargetDate = () => {
        if (!reviewingGoal || !newTargetDate) return;
        const updatedGoals = goals.map(g => g.id === reviewingGoal.id ? { ...g, targetDate: newTargetDate, reflection: '' } : g);
        updateGoals(updatedGoals);
        setReviewingGoal(null);
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeGoals = goals.filter(g => g.status === 'active' && new Date(g.targetDate) >= today);
    const completedGoals = goals.filter(g => g.status === 'completed');
    const notAchievedGoals = goals.filter(g => g.status === 'active' && new Date(g.targetDate) < today);
    
    const isSaveDisabled = !newGoal.title || !newGoal.measurableUnit || !newGoal.measurableTarget || !newGoal.achievable || !newGoal.relevant || !newGoal.targetDate;

    if (view === 'creator') {
        return (
            <div className="page-container" style={{ paddingTop: '1rem' }}>
                <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <button onClick={resetCreator} className="back-button" aria-label="Cancel new goal">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                    </button>
                    <h1 className="app-title">New S.M.A.R.T. Goal</h1>
                </header>
                <main>
                    <form onSubmit={handleSaveGoal} className="card no-hover" style={{alignItems: 'stretch'}}>
                        <div className="form-group">
                            <label htmlFor="title"><strong>S</strong>pecific: What is your goal?<span>Be as clear and specific as possible.</span></label>
                            <textarea id="title" name="title" value={newGoal.title} onChange={handleInputChange} rows={2} required />
                        </div>
                         <div className="form-group">
                            <label><strong>M</strong>easurable: How will you track progress?<span>What numbers or milestones will show you're on track?</span></label>
                            <div className="amount-inputs">
                                <input
                                    type="number"
                                    id="measurableTarget"
                                    name="measurableTarget"
                                    value={newGoal.measurableTarget}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 5"
                                    min="1"
                                    required
                                />
                                <input
                                    type="text"
                                    id="measurableUnit"
                                    name="measurableUnit"
                                    value={newGoal.measurableUnit}
                                    onChange={handleInputChange}
                                    placeholder="e.g., workouts per week"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="achievable"><strong>A</strong>chievable: Is this goal realistic for you right now?<span>Consider your resources, time, and current situation.</span></label>
                            <textarea id="achievable" name="achievable" value={newGoal.achievable} onChange={handleInputChange} rows={2} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="relevant"><strong>R</strong>elevant: Why is this goal important to you?<span>How does it align with your overall objectives or values?</span></label>
                            <textarea id="relevant" name="relevant" value={newGoal.relevant} onChange={handleInputChange} rows={2} required />
                        </div>
                        {coreValues.length > 0 && (
                            <div className="relevant-values-container">
                                <label>Link to your Core Values (optional)</label>
                                <div className="values-selection-grid">
                                    {coreValues.map(value => (
                                        <button type="button" key={value} className={`value-chip ${newGoal.relevantValues.includes(value) ? 'selected' : ''}`} onClick={() => handleValueSelect(value)}>
                                            {value}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {coreValues.length === 0 && (
                            <div className="no-values-prompt">
                                <p>Complete the Core Values exercise to link your goals to what matters most to you!</p>
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor="targetDate"><strong>T</strong>ime-bound: What is your target date?<span>Set a deadline to create urgency and focus.</span></label>
                            <input type="date" id="targetDate" name="targetDate" value={newGoal.targetDate} onChange={handleInputChange} required />
                        </div>
                        <div className="goal-creator-actions">
                            <button type="button" className="log-button secondary" onClick={resetCreator}>Cancel</button>
                            <button type="submit" className="log-button" disabled={isSaveDisabled}>Save Goal</button>
                        </div>
                    </form>
                </main>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                <h1 className="app-title">My Goals</h1>
            </header>
            <main className="goals-page-main">
                <div className="card no-hover goals-intro-card">
                    <div className="form-section-title">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        <h3>Set S.M.A.R.T. Goals</h3>
                    </div>
                    <p className="tracker-description" style={{ textAlign: 'left' }}>
                        Use the S.M.A.R.T. framework (Specific, Measurable, Achievable, Relevant, Time-bound) to set clear and attainable goals that guide your journey.
                    </p>
                    <button className="log-button" onClick={() => setView('creator')}>Create New Goal</button>
                </div>

                <section className="goals-list-section">
                    <h3>Active Goals</h3>
                    {activeGoals.length > 0 ? (
                        <ul className="goals-list">
                            {activeGoals.map(goal => (
                                <li key={goal.id} className={`goal-item ${goal.status}`}>
                                    <div className="goal-item-main">
                                        <button className="goal-progress-button" onClick={(e) => handleProgressChange(e, goal.id)} aria-label="Increment goal progress">
                                            +
                                        </button>
                                        <div className="goal-item-content">
                                            <p className="goal-item-title">{goal.title}</p>
                                            <p className="goal-progress-text">
                                                {goal.measurableProgress} / {goal.measurableTarget} {goal.measurableUnit}
                                            </p>
                                            <div className="goal-progress-bar-container">
                                                <div
                                                    className="goal-progress-bar"
                                                    style={{ width: `${(goal.measurableProgress / goal.measurableTarget) * 100}%` }}
                                                ></div>
                                            </div>
                                            <p className="goal-item-date">Target: {new Date(goal.targetDate).toLocaleDateString()}</p>
                                        </div>
                                        <button className="goal-item-delete" onClick={(e) => handleDeleteGoal(e, goal.id)} aria-label="Delete goal">
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="no-goals-message">You have no active goals. Time to set one!</p>}
                </section>

                <section className="goals-list-section">
                    <h3>Not Achieved</h3>
                    {notAchievedGoals.length > 0 ? (
                        <ul className="goals-list">
                            {notAchievedGoals.map(goal => (
                                <li key={goal.id} className="goal-item not-achieved" onClick={() => handleOpenReviewModal(goal)}>
                                    <div className="goal-item-main">
                                        <div className="goal-item-content">
                                            <p className="goal-item-title">{goal.title}</p>
                                            <p className="goal-item-date">Target Date: {new Date(goal.targetDate).toLocaleDateString()}</p>
                                        </div>
                                        <button className="goal-item-delete" onClick={(e) => handleDeleteGoal(e, goal.id)} aria-label="Delete goal">
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                        </button>
                                    </div>
                                    {goal.reflection && (
                                        <div className="goal-reflection-summary">
                                            <p><strong>Your Reflection:</strong> {goal.reflection}</p>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : <p className="no-goals-message">No goals to review.</p>}
                </section>

                <section className="goals-list-section">
                    <h3>Completed Goals</h3>
                    {completedGoals.length > 0 ? (
                         <ul className="goals-list">
                            {completedGoals.map(goal => (
                                <li key={goal.id} className={`goal-item ${goal.status}`}>
                                    <div className="goal-item-main">
                                        <div className="goal-item-toggle">
                                             <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                                        </div>
                                        <div className="goal-item-content">
                                            <p className="goal-item-title">{goal.title}</p>
                                            <p className="goal-item-date">Completed!</p>
                                        </div>
                                        <button className="goal-item-delete" onClick={(e) => handleDeleteGoal(e, goal.id)} aria-label="Delete goal">
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="no-goals-message">No completed goals yet.</p>}
                </section>
            </main>
            
            {reviewingGoal && (
                <div className="confirm-modal-overlay" onClick={() => setReviewingGoal(null)}>
                    <div className="card confirm-modal-content" style={{alignItems: 'stretch', textAlign: 'left'}} onClick={e => e.stopPropagation()}>
                        <h3>Review Goal: {reviewingGoal.title}</h3>
                        <p style={{color: 'var(--text-muted)'}}>This is a learning opportunity. Why wasn't this goal completed? What were the barriers?</p>
                        
                        <div className="form-group">
                            <label htmlFor="reflection">My Reflection</label>
                            <textarea
                                id="reflection"
                                value={reflectionText}
                                onChange={(e) => setReflectionText(e.target.value)}
                                rows={4}
                                placeholder="e.g., I was too ambitious, an unexpected event occurred..."
                            />
                        </div>
                        <button className="log-button secondary" onClick={handleSaveReflection} disabled={!reflectionText}>Save Reflection</button>

                        <hr className="history-divider" />
                        
                        <p style={{color: 'var(--text-muted)'}}>Alternatively, you can update the goal status:</p>
                        
                        <div className="form-group" style={{marginTop: '1.5rem'}}>
                            <label htmlFor="newTargetDate">Try again with a new target date:</label>
                            <input
                                id="newTargetDate"
                                type="date"
                                value={newTargetDate}
                                onChange={(e) => setNewTargetDate(e.target.value)}
                            />
                        </div>
                        <button className="log-button secondary" onClick={handleUpdateTargetDate}>Set New Date</button>

                        <button className="log-button" onClick={handleCompleteFromReview} style={{marginTop: '1rem', backgroundColor: 'var(--positive-color)'}}>I Actually Completed This</button>

                    </div>
                </div>
            )}
        </div>
    );
};