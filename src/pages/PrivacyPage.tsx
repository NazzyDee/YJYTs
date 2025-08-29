/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// --- Privacy Policy Page Component ---
export const PrivacyPage = ({ navigate }: { navigate: (page: string) => void }) => {
    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('home')} className="back-button" aria-label="Go Back to Home">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                <h1 className="app-title">Privacy Policy</h1>
            </header>
            <main>
                <div className="card no-hover" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                    <p style={{ lineHeight: 1.7, color: 'var(--text-muted)' }}>
                        <strong>Your Journey, Your Tools</strong> is a privacy-focused application. All the data you enter, including your PIN, journal entries, goals, and personal information, is stored <strong>exclusively on your device</strong>.
                        <br /><br />
                        We do not have a server, and we do not collect, view, or share any of your personal data. This means your information remains private to you.
                        <br /><br />
                        The only exception is the optional, anonymous usage data we collect via Google Analytics to help us understand which features are most used and improve the app.
                    </p>
                </div>
            </main>
        </div>
    );
};
