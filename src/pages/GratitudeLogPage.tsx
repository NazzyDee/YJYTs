/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GratitudeEntry } from '../types';

// --- Gratitude Log Page Component ---
export const GratitudeLogPage = ({ navigate }: { navigate: (page: string) => void }) => {
    const [items, setItems] = useState(['', '', '']);
    const [history, setHistory] = useState<GratitudeEntry[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('gratitudeHistory') || '[]') as GratitudeEntry[];
        setHistory(storedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);

    const handleItemChange = (index: number, value: string) => {
        const newItems = [...items];
        newItems[index] = value;
        setItems(newItems);
    };

    const handleLogEntry = (e: React.FormEvent) => {
        e.preventDefault();
        const newEntry = {
            date: new Date().toISOString(),
            items: items.filter(item => item.trim() !== '')
        };

        if (newEntry.items.length < 3) return; // Ensure all three are filled

        const updatedHistory = [newEntry, ...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        localStorage.setItem('gratitudeHistory', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);

        setItems(['', '', '']);
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
        window.dispatchEvent(new Event('app:action'));
    };
    
    const isLogButtonDisabled = items.some(item => item.trim() === '');

    return (
        <div className="page-container" style={{paddingTop: '1rem'}}>
            <header className="page-header-text" style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                     <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                </button>
                 <h1 className="app-title">Gratitude Log</h1>
            </header>

            <main>
                <form onSubmit={handleLogEntry} className="card tracker-section">
                    <p className="tracker-description">Take a moment to list three things you are grateful for today.</p>
                    
                    {items.map((item, index) => (
                         <div className="form-group" key={index}>
                            <label htmlFor={`gratitude-item-${index + 1}`}>Thing #{index + 1}</label>
                            <textarea
                                id={`gratitude-item-${index + 1}`}
                                value={item}
                                onChange={(e) => handleItemChange(index, e.target.value)}
                                placeholder="What went well today? What are you thankful for?"
                                rows={3}
                                required
                            />
                        </div>
                    ))}
                    
                    <button type="submit" className="log-button" disabled={isLogButtonDisabled} style={{marginTop: '1rem'}}>Log Gratitude</button>
                    {showConfirmation && <p className="confirmation-message">Gratitude logged successfully!</p>}
                </form>

                <section className="history-section">
                    <hr className="history-divider" />
                    <h3 className="history-title">History</h3>
                    {history.length > 0 ? (
                        <ul className="history-list">
                            {history.slice(0, 10).map(entry => (
                                <li key={entry.date} className="history-item gratitude-history-item">
                                    <div className="gratitude-history-item-date">
                                        {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                    <ul className="gratitude-history-item-list">
                                        {entry.items.map((gratitudeItem, idx) => (
                                            <li key={idx}>{gratitudeItem}</li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-history-message">Your gratitude history will appear here.</p>
                    )}
                </section>
            </main>
        </div>
    );
};
