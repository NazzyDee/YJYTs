/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { COGNITIVE_DISTORTIONS_DATA } from '../data/cognitiveDistortions';
import { InfoTooltip } from '../components/InfoTooltip';

export const CognitiveDistortionsPage = ({ navigate }: { navigate: (page: string) => void }) => {
    const [openId, setOpenId] = useState<string | null>(null);

    useEffect(() => {
        const events = JSON.parse(localStorage.getItem('eventHistory') || '[]');
        if (!events.includes('visited_cognitive_distortions')) {
            const updatedEvents = [...events, 'visited_cognitive_distortions'];
            localStorage.setItem('eventHistory', JSON.stringify(updatedEvents));
            window.dispatchEvent(new Event('app:action'));
        }
    }, []);

    const toggleItem = (id: string) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 className="app-title">Cognitive Distortions</h1>
                    <InfoTooltip text="Cognitive distortions are irrational or exaggerated thought patterns that can cause us to perceive reality inaccurately. Learning to identify them is the first step toward challenging and reframing them." />
                </div>
            </header>
            <main>
                <div className="card no-hover" style={{ textAlign: 'left', alignItems: 'stretch' }}>
                    <p className="tracker-description" style={{ textAlign: 'left', margin: 0 }}>
                        Below are common unhelpful thinking styles. Click on each one to learn more about it. Recognizing these patterns in your own thoughts is a key skill in Cognitive Behavioral Therapy (CBT).
                    </p>
                </div>
                
                <div className="distortion-accordion">
                    {COGNITIVE_DISTORTIONS_DATA.map(distortion => (
                        <div key={distortion.id} className={`distortion-item ${openId === distortion.id ? 'open' : ''}`}>
                            <button
                                className="distortion-header"
                                onClick={() => toggleItem(distortion.id)}
                                aria-expanded={openId === distortion.id}
                                aria-controls={`content-${distortion.id}`}
                            >
                                <span>{distortion.name}</span>
                                <svg className="distortion-chevron" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
                            </button>
                            <div
                                id={`content-${distortion.id}`}
                                className="distortion-content"
                                hidden={openId !== distortion.id}
                            >
                                <p className="distortion-description">{distortion.description}</p>
                                <p className="distortion-example"><strong>Example:</strong> <em>{distortion.example}</em></p>
                                <p className="distortion-example">
                                    <strong style={{ color: 'var(--positive-color)' }}>Balanced Thought:</strong> <em>{distortion.positiveExample}</em>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};