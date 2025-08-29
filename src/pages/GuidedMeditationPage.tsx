/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MeditationEntry } from '../types';
import { MEDITATION_TRACKS } from '../data/meditations';

// --- Guided Meditation Page ---
export const GuidedMeditationPage = ({ navigate }: { navigate: (page: string) => void }) => {
    const [selectedTrack, setSelectedTrack] = useState<(typeof MEDITATION_TRACKS)[number] | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [history, setHistory] = useState<MeditationEntry[]>([]);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('meditationHistory') || '[]') as MeditationEntry[];
        setHistory(storedHistory);
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setCurrentTime(audio.currentTime);

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
        };
    }, [selectedTrack]);

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };
    
    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            const newTime = Number(e.target.value);
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleSessionEnd = () => {
        if (!selectedTrack) return;
        setIsPlaying(false);
        const newEntry: MeditationEntry = {
            date: new Date().toISOString(),
            title: selectedTrack.title,
            duration: selectedTrack.duration,
        };

        const updatedHistory = [newEntry, ...history];
        localStorage.setItem('meditationHistory', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
        window.dispatchEvent(new Event('app:action'));
    };
    
    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    if (selectedTrack && selectedTrack.url) {
        return (
            <div className="page-container" style={{ paddingTop: '1rem' }}>
                <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <button onClick={() => setSelectedTrack(null)} className="back-button" aria-label="Back to Meditation List">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                    </button>
                    <h1 className="app-title">Now Playing</h1>
                </header>
                <main>
                    <div className="card meditation-player-card">
                        <div className="meditation-player-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM15.5 12c0-1.93-1.57-3.5-3.5-3.5S8.5 10.07 8.5 12H7c0-2.76 2.24-5 5-5s5 2.24 5 5h-1.5z"/></svg>
                        </div>
                        <h2 className="meditation-player-title">{selectedTrack.title}</h2>
                        <p className="meditation-player-subtitle">{selectedTrack.subtitle}</p>

                        <div className="meditation-player-controls">
                            <input
                                type="range"
                                className="meditation-progress-bar"
                                value={currentTime}
                                max={duration || 1}
                                onChange={handleProgressChange}
                            />
                            <div className="meditation-time-display">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                            <button className={`meditation-play-button ${isPlaying ? 'playing' : ''}`} onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
                                {isPlaying ? (
                                    <svg className="pause-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                ) : (
                                    <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                )}
                            </button>
                        </div>
                        <audio ref={audioRef} src={selectedTrack.url} onEnded={handleSessionEnd}></audio>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                </button>
                <h1 className="app-title">Guided Meditation</h1>
            </header>
            <main>
                <div className="meditation-list">
                    {MEDITATION_TRACKS.map(track => (
                        <button key={track.id} className="card meditation-item" onClick={() => setSelectedTrack(track)} disabled={!track.url}>
                            <div className="meditation-item-info">
                                <h3 className="meditation-item-title">{track.title}</h3>
                                <p className="meditation-item-subtitle">{track.subtitle}</p>
                            </div>
                            <span className="meditation-item-duration">{formatTime(track.duration)}</span>
                        </button>
                    ))}
                </div>
                <section className="history-section">
                    <hr className="history-divider" />
                    <h3 className="history-title">History</h3>
                    {history.length > 0 ? (
                        <ul className="history-list">
                             {history.slice(0, 5).map((entry, index) => (
                                <li key={index} className="history-item">
                                    <div className="history-details" style={{flexGrow: 1}}>
                                        <span><strong>{entry.title}</strong></span>
                                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                                    </div>
                                    <span>{formatTime(entry.duration)}</span>
                                </li>
                             ))}
                        </ul>
                    ) : (
                        <p className="no-history-message">You haven't completed any meditations yet.</p>
                    )}
                </section>
            </main>
        </div>
    );
};
