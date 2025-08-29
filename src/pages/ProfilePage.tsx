/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

// --- Profile Page Component ---
export const ProfilePage = ({ navigate }: { navigate: (page: string) => void }) => {
    const [profile, setProfile] = useState({
        username: '',
        gender: '',
        dob: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactEmail: ''
    });
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const storedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        setProfile(p => ({ ...p, ...storedProfile }));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('userProfile', JSON.stringify(profile));
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
        window.dispatchEvent(new Event('app:action'));
        window.dispatchEvent(new CustomEvent('app:profile_updated', { detail: profile }));
    };

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('home')} className="back-button" aria-label="Go Back to Home">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                <h1 className="app-title">My Profile</h1>
            </header>
            <main>
                <form onSubmit={handleSave} className="card profile-form">
                    <p className="tracker-description">This information is stored only on your device and is never shared.</p>
                    
                    <div className="form-group">
                        <label htmlFor="username">Name / Nickname</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={profile.username}
                            onChange={handleChange}
                            placeholder="How should we call you?"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="dob">Date of Birth</label>
                        <input
                            id="dob"
                            name="dob"
                            type="date"
                            value={profile.dob}
                            onChange={handleChange}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="gender">Gender</label>
                        <select id="gender" name="gender" value={profile.gender} onChange={handleChange}>
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                    </div>

                    <h3 className="profile-section-title">Emergency Contact</h3>
                    <p className="tracker-description" style={{textAlign: 'left', marginTop: '-1rem'}}>This person can be contacted in case of an emergency. You can also share your Safety Plan with them.</p>

                    <div className="form-group">
                        <label htmlFor="emergencyContactName">Contact Name</label>
                        <input
                            id="emergencyContactName"
                            name="emergencyContactName"
                            type="text"
                            value={profile.emergencyContactName}
                            onChange={handleChange}
                            placeholder="e.g., Jane Doe"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="emergencyContactPhone">Contact Phone</label>
                        <input
                            id="emergencyContactPhone"
                            name="emergencyContactPhone"
                            type="tel"
                            value={profile.emergencyContactPhone}
                            onChange={handleChange}
                            placeholder="e.g., (555) 123-4567"
                        />
                    </div>
                    
                     <div className="form-group">
                        <label htmlFor="emergencyContactEmail">Contact Email</label>
                        <input
                            id="emergencyContactEmail"
                            name="emergencyContactEmail"
                            type="email"
                            value={profile.emergencyContactEmail}
                            onChange={handleChange}
                            placeholder="e.g., jane.doe@example.com"
                        />
                    </div>

                    <button type="submit" className="log-button" style={{ marginTop: '1rem' }}>Save Profile</button>
                    {showConfirmation && <p className="confirmation-message">Profile saved successfully!</p>}
                </form>
            </main>
        </div>
    );
};
