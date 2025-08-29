/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';

// --- Journal Page Component ---
export const JournalPage = ({ navigate }: { navigate: (page: string) => void }) => {
    const moodGroups = {
        Happy: ["Joyful", "Content", "Pleased", "Excited", "Proud", "Optimistic"],
        Sad: ["Lonely", "Heartbroken", "Gloomy", "Disappointed", "Hopeless", "Grieving"],
        Angry: ["Frustrated", "Annoyed", "Resentful", "Irritated", "Furious", "Jealous"],
        Anxious: ["Worried", "Overwhelmed", "Stressed", "Nervous", "Scared", "Insecure"],
        Surprised: ["Shocked", "Confused", "Amazed", "Startled", "Awed"],
        Calm: ["Peaceful", "Relaxed", "Relieved", "Serene", "Tranquil", "Grateful"]
    };

    const moodMetadata = {
        Happy: { color: '#27ae60', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM8.5 11.5c.83 0 1.5-.67 1.5-1.5S9.33 8.5 8.5 8.5 7 9.17 7 10s.67 1.5 1.5 1.5zm7 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg> },
        Sad: { color: '#3498db', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM8.5 11.5c.83 0 1.5-.67 1.5-1.5S9.33 8.5 8.5 8.5 7 9.17 7 10s.67 1.5 1.5 1.5zm7 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM12 14c-2.33 0-4.31 1.46-5.11 3.5h10.22c-.8-2.04-2.78-3.5-5.11-3.5z"/></svg> },
        Angry: { color: '#e74c3c', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM8.27 12.12c.34-.01.67.12.91.36.24.24.37.57.36.91-.01.34-.14.66-.37.9-.23.24-.56.37-.9.36-.34.01-.67-.12-.91-.36s-.37-.57-.36-.91c.01-.34.14-.66.37.9.24-.23.56-.36.9-.36zm7.46 0c.34-.01.67.12.91.36.24.24.37.57.36.91-.01.34-.14.66-.37.9-.23.24-.56.37-.9.36-.34.01-.67-.12-.91-.36s-.37-.57-.36-.91c.01-.34.14-.66.37.9.24-.23.56-.36.9-.36zM12 14c-1.68 0-3.18.8-4.1 2.01.21.05.42.08.64.08h6.92c.22 0 .43-.03.64-.08C15.18 14.8 13.68 14 12 14zm-3.5-5.04l-1.06-1.06c-.2-.2-.2-.51 0-.71s.51-.2.71 0l1.06 1.06c.2.2.2.51 0 .71-.2.2-.51.2-.71 0zm7 0l1.06-1.06c.2-.2.51-.2.71 0s.2.51 0 .71l-1.06 1.06c-.2.2-.51.2-.71 0-.2-.2-.2-.51 0-.71z"/></svg> },
        Anxious: { color: '#f39c12', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM9.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-5.09-4.24l-1.41-1.41c-.2-.2-.2-.51 0-.71s.51-.2.71 0l1.41 1.41c.2.2.2.51 0 .71-.2.2-.51.2-.71 0zm8.6.01l1.41-1.41c.2-.2.51-.2.71 0s.2.51 0 .71l-1.41 1.41c-.2.2-.51.2-.71 0-.2-.2-.2-.51 0-.71zM8 16h8v-1.5c0-.83-.67-1.5-1.5-1.5h-5C8.67 13 8 13.67 8 14.5V16z"/></svg> },
        Surprised: { color: '#9b59b6', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM9.5 10c.83 0 1.5-.67 1.5-1.5S10.33 7 9.5 7 8 7.67 8 8.5 8.67 10 9.5 10zm5 0c.83 0 1.5-.67 1.5-1.5S15.33 7 14.5 7s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-2.5 2c-1.93 0-3.5 1.57-3.5 3.5S10.07 19 12 19s3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 14 12 14s1.5.67 1.5 1.5S12.83 17 12 17z"/></svg> },
        Calm: { color: '#1abc9c', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM8 12.5h8v-1H8v1zm1.5-3C10.33 9.5 11 8.83 11 8s-.67-1.5-1.5-1.5S8 7.17 8 8s.67 1.5 1.5 1.5zm5 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5 1.5z"/></svg> }
    };

    const allSearchableMoods = useMemo(() => {
        const headings = Object.keys(moodGroups);
        const feelings = Object.values(moodGroups).flat();
        return [...new Set([...headings, ...feelings])];
    }, []);

    const substanceUnits = {
        'Alcohol': ['Standard Drink(s)', 'Shot(s)', 'Glass(es) of Wine', 'Can(s) of Beer'],
        'Cannabis': ['Gram(s)', 'Joint(s)', 'Edible(s)'],
        'Cocaine': ['Line(s)', 'Gram(s)', 'Dose(s)'],
        'MDMA (Ecstasy)': ['Pill(s)', 'Dose(s)', 'Gram(s)'],
        'Heroin': ['Dose(s)', 'Point(s)', 'Gram(s)', 'Bag(s)'],
        'Methamphetamine (Ice)': ['Point(s)', 'Gram(s)', 'Dose(s)'],
        'Inhalants': ['Dose(s)', 'Can(s)'],
        'Ketamine': ['Dose(s)', 'Gram(s)', 'Line(s)'],
        'LSD (Acid)': ['Tab(s)', 'Dose(s)'],
        'Other': ['Dose(s)', 'Pill(s)', 'Gram(s)']
    };
     const substanceOrder = [
        'Alcohol',
        'Cannabis',
        'Cocaine',
        'MDMA (Ecstasy)',
        'Heroin',
        'Methamphetamine (Ice)',
        'Inhalants',
        'Ketamine',
        'LSD (Acid)',
        'Other'
    ];

    const [feeling, setFeeling] = useState('');
    const [feelingSearch, setFeelingSearch] = useState('');
    const [feelingSuggestions, setFeelingSuggestions] = useState<string[]>([]);
    const [entryDateTime, setEntryDateTime] = useState(new Date());
    const [substance, setSubstance] = useState('');
    const [place, setPlace] = useState('');
    const [amount, setAmount] = useState('');
    const [unit, setUnit] = useState('');
    const [cost, setCost] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showMoodSelector, setShowMoodSelector] = useState(false);
    const [selectedMoodGroup, setSelectedMoodGroup] = useState<keyof typeof moodGroups | null>(null);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('journalHistory') || '[]');
        setHistory(storedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);
    
    const handleFeelingSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFeelingSearch(value);
        if (value) {
            setFeelingSuggestions(allSearchableMoods.filter(f => f.toLowerCase().startsWith(value.toLowerCase())));
        } else {
            setFeelingSuggestions([]);
        }
    };

    const selectFeeling = (selectedFeeling: string) => {
        setFeeling(selectedFeeling);
        setFeelingSearch(selectedFeeling);
        setFeelingSuggestions([]);
    };
    
    const handleCloseMoodSelector = () => {
        setShowMoodSelector(false);
        setSelectedMoodGroup(null); // Reset view on close
    };

    const handleMoodSelect = (mood: string) => {
        selectFeeling(mood);
        handleCloseMoodSelector();
    };

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
        const newEntry = {
            date: entryDateTime.toISOString(),
            data: {
                feeling,
                substance,
                place,
                amount,
                unit,
                cost
            }
        };

        const updatedHistory = [newEntry, ...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        localStorage.setItem('journalHistory', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
        
        // Reset form
        setFeeling('');
        setFeelingSearch('');
        setSubstance('');
        setPlace('');
        setAmount('');
        setUnit('');
        setCost('');
        setEntryDateTime(new Date());

        // Show confirmation
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
        window.dispatchEvent(new Event('app:action'));
    };

    const isLogButtonDisabled = !feeling || !substance || !amount || !unit;

    return (
        <div className="page-container" style={{paddingTop: '1rem'}}>
            <header className="page-header-text" style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                     <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                </button>
                 <h1 className="app-title">Daily Journal</h1>
            </header>

            <main>
                <form onSubmit={handleLogEntry} className="card tracker-section">
                    <p className="tracker-description">Log your mood and substance use to gain insight.</p>

                    <div className="form-group">
                        <label>How are you feeling?</label>
                        <div className="feeling-input-container">
                            <input
                                type="text"
                                value={feelingSearch}
                                onChange={handleFeelingSearchChange}
                                onBlur={() => setTimeout(() => setFeelingSuggestions([]), 150)}
                                onFocus={handleFeelingSearchChange}
                                placeholder="Type to search for a feeling..."
                                required
                            />
                            {feelingSuggestions.length > 0 && (
                                <ul className="feeling-suggestions-list">
                                    {feelingSuggestions.map(f => <li key={f} onMouseDown={() => selectFeeling(f)}>{f}</li>)}
                                </ul>
                            )}
                        </div>
                        <div className="feeling-wheel-prompt">
                           <button type="button" className="link-button" onClick={() => setShowMoodSelector(true)}>Click here to select your mood</button>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Date & Time of Use</label>
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
                        <label>Substance</label>
                        <select value={substance} onChange={(e) => { setSubstance(e.target.value); setUnit(''); }} required>
                            <option value="" disabled>Select Substance</option>
                            {substanceOrder.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Place or People (Optional)</label>
                        <input type="text" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="e.g., At home, with friends" />
                    </div>

                    <div className="form-group">
                        <label>Amount / Quantity</label>
                        <div className="amount-inputs">
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 1" required />
                            <select value={unit} onChange={(e) => setUnit(e.target.value)} disabled={!substance} required>
                                <option value="" disabled>{substance ? 'Select Unit' : 'Select Substance First'}</option>
                                {substance && substanceUnits[substance as keyof typeof substanceUnits] && substanceUnits[substance as keyof typeof substanceUnits].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Cost (Optional)</label>
                        <div className="cost-input-container">
                            <span>$</span>
                            <input
                                type="number"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                placeholder="e.g., 20.50"
                                step="0.01"
                                min="0"
                            />
                        </div>
                    </div>

                    <button type="submit" className="log-button" disabled={isLogButtonDisabled} style={{marginTop: '1rem'}}>Log Entry</button>
                    {showConfirmation && <p className="confirmation-message">Entry Logged Successfully!</p>}
                </form>

                <section className="history-section">
                    <hr className="history-divider" />
                    <h3 className="history-title">History</h3>
                    {history.length > 0 ? (
                        <ul className="history-list">
                            {history.slice(0, 5).map(entry => {
                                const entryDate = new Date(entry.date);
                                const formattedDate = entryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }); // e.g., "24 July"
                                const formattedTime = entryDate.toLocaleTimeString('en-US', { timeStyle: 'short' }); // e.g., "3:30 PM"

                                return (
                                    <li key={entry.date} className="history-item">
                                        <div className="history-feeling">{entry.data.feeling}</div>
                                        <div className="history-details">
                                            <span><strong>{entry.data.substance}</strong> - {entry.data.amount} {entry.data.unit}</span>
                                            <span>{formattedDate} at {formattedTime}</span>
                                            {entry.data.place && <span className="location-text">Place/People: {entry.data.place}</span>}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="no-history-message">No entries yet. Your history will appear here.</p>
                    )}
                </section>
            </main>
            {showMoodSelector && (
                 <div className="mood-selector-overlay" onClick={handleCloseMoodSelector}>
                    <div className="card mood-selector-content" onClick={(e) => e.stopPropagation()}>
                        {selectedMoodGroup ? (
                            <div className="mood-details-view">
                                <header className="mood-details-header">
                                     <button onClick={() => setSelectedMoodGroup(null)} className="back-button" aria-label="Back to mood groups">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                                    </button>
                                    <button className="mood-header-selectable" onClick={() => handleMoodSelect(selectedMoodGroup)}>
                                        <div className="mood-card-icon" style={{ '--mood-color': moodMetadata[selectedMoodGroup].color } as React.CSSProperties}>
                                            {moodMetadata[selectedMoodGroup].icon}
                                        </div>
                                        <h3>{selectedMoodGroup}</h3>
                                    </button>
                                </header>
                                <div className="mood-chip-container">
                                    {moodGroups[selectedMoodGroup].map(mood => (
                                        <button key={mood} className="mood-chip" onClick={() => handleMoodSelect(mood)}>
                                            {mood}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="app-title">How are you feeling?</h2>
                                <p>Select a general mood group to see more specific feelings.</p>
                                <div className="mood-grid">
                                    {Object.keys(moodGroups).map((group) => (
                                        <button key={group} className="mood-category-card" style={{ '--mood-color': moodMetadata[group as keyof typeof moodMetadata].color } as React.CSSProperties} onClick={() => setSelectedMoodGroup(group as keyof typeof moodGroups)}>
                                            <div className="mood-card-icon">{moodMetadata[group as keyof typeof moodMetadata].icon}</div>
                                            <h4 className="mood-card-title">{group}</h4>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
