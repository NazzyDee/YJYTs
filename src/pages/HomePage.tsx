import React, { useState, useEffect } from 'react';
import { ALL_TOOLS } from '../data/tools';
import { JournalHistoryEntry } from '../types';
import { ToolCard } from '../components/ToolCard';

// --- HomePage Component ---
export const HomePage = ({ userProfile, pinnedTools, togglePin, navigate }) => {
    const [lastUseDate, setLastUseDate] = useState<Date | null>(null);
    const [soberTime, setSoberTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const loadLastUseDate = () => {
            const journalHistory: JournalHistoryEntry[] = JSON.parse(localStorage.getItem('journalHistory') || '[]');
            if (journalHistory.length > 0) {
                const sortedHistory = [...journalHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setLastUseDate(new Date(sortedHistory[0].date));
            } else {
                setLastUseDate(null);
            }
        };

        loadLastUseDate();
        
        window.addEventListener('app:action', loadLastUseDate);
        
        return () => {
            window.removeEventListener('app:action', loadLastUseDate);
        };
    }, []);

    useEffect(() => {
        if (!lastUseDate) {
            setSoberTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            return;
        }

        const intervalId = setInterval(() => {
            const now = new Date().getTime();
            const lastUseTime = lastUseDate.getTime();
            const diff = now - lastUseTime;

            if (diff < 0) return;

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setSoberTime({ days, hours, minutes, seconds });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [lastUseDate]);

    return (
        <div className="page-container">
            <header className="app-header">
                <div className="header-content">
                    <h1 className="welcome-message">Hello, {userProfile.username}</h1>
                    <p className="app-subtitle">Welcome back to your journey.</p>
                </div>
            </header>
            <main>
                <section>
                    <h2 className="section-title">My Progress</h2>
                    <div className="card no-hover sober-clock-card">
                        <h3 className="card-title" style={{marginBottom: 0}}>Time Sober</h3>
                        {lastUseDate ? (
                            <div className="sober-clock-container">
                                <div className="time-segment">
                                    <span className="time-value">{soberTime.days}</span>
                                    <span className="time-label">Days</span>
                                </div>
                                <div className="time-segment">
                                    <span className="time-value">{String(soberTime.hours).padStart(2, '0')}</span>
                                    <span className="time-label">Hours</span>
                                </div>
                                <div className="time-segment">
                                    <span className="time-value">{String(soberTime.minutes).padStart(2, '0')}</span>
                                    <span className="time-label">Minutes</span>
                                </div>
                                <div className="time-segment">
                                    <span className="time-value">{String(soberTime.seconds).padStart(2, '0')}</span>
                                    <span className="time-label">Seconds</span>
                                </div>
                            </div>
                        ) : (
                            <div className="sober-clock-prompt">
                                <p>Log your last use in the Daily Journal to start the clock.</p>
                                <button className="dashboard-card-cta" style={{marginTop: '1rem'}} onClick={() => navigate('journal')}>
                                    Go to Journal
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="section-title">My Pinned Tools</h2>
                    {pinnedTools.length > 0 ? (
                        <div className="card-grid home-grid">
                            {ALL_TOOLS.filter(tool => pinnedTools.includes(tool.id)).map(tool => (
                                <ToolCard key={tool.id} tool={tool} navigate={navigate} isPinned={true} togglePin={togglePin} />
                            ))}
                        </div>
                    ) : (
                        <div className="card no-hover empty-home-prompt">
                           <p>Your dashboard is empty. Go to the <strong>Tools</strong> tab to pin your favorite features for quick access here!</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};
