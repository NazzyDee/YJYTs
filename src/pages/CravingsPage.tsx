/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CravingsHistoryEntry } from '../types';

// --- Cravings Page Component ---
export const CravingsPage = ({ navigate }: { navigate: (page: string) => void }) => {
    const [intensity, setIntensity] = useState(5);
    const [entryDateTime, setEntryDateTime] = useState(new Date());
    const [trigger, setTrigger] = useState('');
    const [copingMechanism, setCopingMechanism] = useState('');
    const [history, setHistory] = useState<CravingsHistoryEntry[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('cravingsHistory') || '[]') as CravingsHistoryEntry[];
        setHistory(storedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateStr = e.target.value; // YYYY-MM-DD
        if (!dateStr) return;
        const [year, month, day] = dateStr.split('-').map(Number);
        if (!year || !month || !day) return;
        const newDate = new Date(entryDateTime);
        newDate.setFullYear(year, month - 1, day);
        setEntryDateTime(newDate);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const timeStr = e.target.value; // HH:mm
        if (!timeStr) return;
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return;
        const newDate = new Date(entryDateTime);
        newDate.setHours(hours, minutes);
        setEntryDateTime(newDate);
    };

    const toISODateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const toISOTimeString = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const handleLogEntry = (e: React.FormEvent) => {
        e.preventDefault();
        const newEntry: CravingsHistoryEntry = {
            date: entryDateTime.toISOString(),
            intensity,
            trigger,
            copingMechanism
        };

        const updatedHistory = [newEntry, ...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        localStorage.setItem('cravingsHistory', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);

        // Reset form
        setIntensity(5);
        setEntryDateTime(new Date());
        setTrigger('');
        setCopingMechanism('');

        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
        window.dispatchEvent(new Event('app:action'));
    };

    const getIntensityColor = (value: number) => {
        const hue = (1 - (value - 1) / 9) * 120; // 120 (green) to 0 (red)
        return `hsl(${hue}, 80%, 50%)`;
    };

    return (
        <div className="page-container" style={{paddingTop: '1rem'}}>
            <header className="page-header-text" style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                     <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                </button>
                 <h1 className="app-title">Craving Tracker</h1>
            </header>

            <main>
                <form onSubmit={handleLogEntry} className="card tracker-section">
                    <p className="tracker-description">Log your cravings to understand patterns and manage urges.</p>

                    <div className="form-group">
                        <label>Craving Intensity: <span className="intensity-value-display" style={{color: getIntensityColor(intensity)}}>{intensity}</span> / 10</label>
                        <div className="intensity-slider-container">
                            <span>Mild</span>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={intensity}
                                onChange={(e) => setIntensity(Number(e.target.value))}
                                className="intensity-slider"
                                style={{'--intensity-color': getIntensityColor(intensity)} as React.CSSProperties}
                            />
                             <span>Intense</span>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Date & Time of Craving</label>
                        <div className="date-time-inputs">
                            <input
                                type="date"
                                value={toISODateString(entryDateTime)}
                                onChange={handleDateChange}
                                required
                            />
                            <input
                                type="time"
                                value={toISOTimeString(entryDateTime)}
                                onChange={handleTimeChange}
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="trigger">What triggered this craving? (Optional)</label>
                        <textarea
                            id="trigger"
                            value={trigger}
                            onChange={(e) => setTrigger(e.target.value)}
                            placeholder="e.g., Saw an ad, felt stressed..."
                            rows={3}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="copingMechanism">How did you cope? (Optional)</label>
                        <textarea
                            id="copingMechanism"
                            value={copingMechanism}
                            onChange={(e) => setCopingMechanism(e.target.value)}
                            placeholder="e.g., Went for a walk, called a friend..."
                            rows={3}
                        />
                    </div>

                    <button type="submit" className="log-button" style={{marginTop: '1rem'}}>Log Craving</button>
                    {showConfirmation && <p className="confirmation-message">Craving Logged Successfully!</p>}
                </form>

                <section className="history-section">
                    <hr className="history-divider" />
                    <h3 className="history-title">History</h3>
                    {history.length > 0 ? (
                        <ul className="history-list">
                            {history.slice(0, 10).map(entry => {
                                const entryDate = new Date(entry.date);
                                const formattedDate = entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                const formattedTime = entryDate.toLocaleTimeString('en-US', { timeStyle: 'short' });

                                return (
                                    <li key={entry.date} className="history-item craving-history-item">
                                        <div className="craving-intensity-indicator" style={{backgroundColor: getIntensityColor(entry.intensity)}}>
                                            <span>{entry.intensity}</span>
                                        </div>
                                        <div className="history-details">
                                            <span><strong>{formattedDate}</strong> at {formattedTime}</span>
                                            {entry.trigger && <span className="craving-detail-text"><strong>Trigger:</strong> {entry.trigger}</span>}
                                            {entry.copingMechanism && <span className="craving-detail-text"><strong>Coped by:</strong> {entry.copingMechanism}</span>}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="no-history-message">Your craving history will appear here.</p>
                    )}
                </section>
            </main>
        </div>
    );
};
