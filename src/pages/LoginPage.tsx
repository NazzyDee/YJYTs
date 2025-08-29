/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { trackEvent } from '../utils/analytics';

// --- Login Page Component ---
export const LoginPage = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
    const [pin, setPin] = useState('');
    const [username, setUsername] = useState('');
    const [firstPinAttempt, setFirstPinAttempt] = useState('');
    const [error, setError] = useState('');
    const [setupStage, setSetupStage] = useState('login'); // 'login', 'createPin', 'confirmPin', 'createUsername'
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmDeleteText, setConfirmDeleteText] = useState('');
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [flashingDotIndex, setFlashingDotIndex] = useState<number | null>(null);
    const [flickeringButton, setFlickeringButton] = useState<string | null>(null);

    useEffect(() => {
        const storedPin = localStorage.getItem('userPIN');
        if (!storedPin) {
            setSetupStage('createPin');
        }
    }, []);

    const handlePinChange = (value: string) => {
        if (pin.length < 4) {
            const currentIndex = pin.length;
            setFlashingDotIndex(currentIndex);
            setFlickeringButton(value);
            setPin(pin + value);

            setTimeout(() => {
                setFlashingDotIndex(null);
            }, 300); // Match CSS animation duration
            setTimeout(() => {
                setFlickeringButton(null);
            }, 300);
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError('');
    };

    const handleUsernameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            localStorage.setItem('userPIN', firstPinAttempt);
            const userProfile = {
                username: username.trim(),
                gender: '',
                dob: '',
                emergencyContactName: '',
                emergencyContactPhone: ''
            };
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            localStorage.removeItem('username'); // Clean up old key
            onLoginSuccess();
        } else {
            setError('Username cannot be empty.');
        }
    };

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        switch(setupStage) {
            case 'login': {
                const storedPin = localStorage.getItem('userPIN');
                if (pin === storedPin) {
                    trackEvent('login', 'Authentication', 'login_success');
                    onLoginSuccess();
                } else {
                    setError('Incorrect PIN. Please try again.');
                    setPin('');
                }
                break;
            }
            case 'createPin': {
                setFirstPinAttempt(pin);
                setPin('');
                setError('');
                setSetupStage('confirmPin');
                break;
            }
            case 'confirmPin': {
                if (pin === firstPinAttempt) {
                    setPin('');
                    setError('');
                    setShowPrivacyModal(true); // Show privacy modal before username creation
                } else {
                    setError('PINs do not match. Please start over.');
                    setPin('');
                    setFirstPinAttempt('');
                    setSetupStage('createPin');
                }
                break;
            }
        }
    };
    
    const handleForgotPin = () => {
        setShowConfirmModal(true);
        setConfirmDeleteText(''); // Reset on open
    };

    const handleConfirmDelete = () => {
        localStorage.clear(); // Clear all data
        setShowConfirmModal(false);
        window.location.reload(); // Reload the app to reset its state
    };
    
    const handlePrivacyAccept = () => {
        setShowPrivacyModal(false);
        setSetupStage('createUsername');
    };

    if (setupStage === 'createUsername') {
        return (
            <div className="page-container">
                <div className="login-container">
                    <div className="app-logo-container">
                        <svg className="logo-graphic" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8"/>
                            <path d="M50 50 L 78 22 L 65 65 Z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeWidth="4" />
                            <path d="M50 50 L 22 78 L 35 35 Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="4" />
                        </svg>
                        <h1 className="logo-text">Your Journey<br/>Your Tools</h1>
                    </div>
                    <div className="card login-card">
                        <h2>Create Your Profile</h2>
                        <form onSubmit={handleUsernameSubmit}>
                            <div className="form-group">
                                <label htmlFor="username">What should we call you?</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your name or nickname"
                                    autoFocus
                                />
                            </div>
                            {error && <p className="pin-error">{error}</p>}
                            <button type="submit" className="log-button" style={{marginTop: '1.5rem'}}>Get Started</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
    
    const getPinTitle = () => {
        switch(setupStage) {
            case 'login': return 'Enter Your PIN';
            case 'createPin': return 'Create a 4-Digit PIN';
            case 'confirmPin': return 'Confirm Your PIN';
            default: return '';
        }
    };

    return (
        <div className="page-container">
            <div className="login-container">
                <div className="app-logo-container">
                    <svg className="logo-graphic" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8"/>
                        <path d="M50 50 L 78 22 L 65 65 Z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeWidth="4" />
                        <path d="M50 50 L 22 78 L 35 35 Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="4" />
                    </svg>
                    <h1 className="logo-text">Your Journey<br/>Your Tools</h1>
                </div>

                <div className="card login-card">
                    <h2>{getPinTitle()}</h2>
                    <div className="pin-input-container">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''} ${flashingDotIndex === i ? 'flashing' : ''}`}></div>
                        ))}
                    </div>
                    <div className="pin-error">{error}</div>
                    <form onSubmit={handlePinSubmit}>
                        <div className="pin-keypad">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button type="button" key={num} onClick={() => handlePinChange(num.toString())} className={flickeringButton === num.toString() ? 'flickering' : ''}>{num}</button>
                            ))}
                            <button type="button" onClick={handleDelete} aria-label="Delete">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 11H6.83l3.58-3.59L9 6l-6 6 6 6 1.41-1.41L6.83 13H21v-2Z" fill="currentColor"/></svg>
                            </button>
                            <button type="button" onClick={() => handlePinChange('0')} className={flickeringButton === '0' ? 'flickering' : ''}>0</button>
                            <button type="submit" className="confirm-button" disabled={pin.length < 4} aria-label="Confirm PIN">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z" fill="currentColor"/></svg>
                            </button>
                        </div>
                    </form>
                    {setupStage === 'login' && <button className="forgot-pin-button" onClick={handleForgotPin}>Forgot PIN?</button>}
                </div>
            </div>

            {showConfirmModal && (
                <div className="confirm-modal-overlay">
                    <div className="card confirm-modal-content">
                        <h3>Reset Your Account?</h3>
                        <p>Forgetting your PIN requires resetting the app. This will permanently delete all your data, including your PIN, profile, and all journal entries. This action cannot be undone.</p>
                        <p style={{ marginTop: '1rem' }}>Please type "<strong>delete</strong>" to confirm.</p>
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <input
                                type="text"
                                value={confirmDeleteText}
                                onChange={(e) => setConfirmDeleteText(e.target.value)}
                                placeholder='Type to confirm...'
                                autoFocus
                            />
                        </div>
                        <div className="confirm-modal-actions">
                            <button className="modal-button cancel" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                            <button className="modal-button confirm" onClick={handleConfirmDelete} disabled={confirmDeleteText !== 'delete'}>Reset and Delete</button>
                        </div>
                    </div>
                </div>
            )}
             {showPrivacyModal && (
                <div className="confirm-modal-overlay">
                    <div className="card confirm-modal-content">
                        <h3>Your Privacy Matters</h3>
                        <p style={{textAlign: 'left'}}>
                            <strong>Your Journey, Your Tools</strong> is a privacy-focused application. All the data you enter, including your PIN, journal entries, goals, and personal information, is stored <strong>exclusively on your device</strong>.
                            <br/><br/>
                            We do not have a server, and we do not collect, view, or share any of your personal data. This means your information remains private to you.
                             <br/><br/>
                            The only exception is the optional, anonymous usage data we collect via Google Analytics to help us understand which features are most used and improve the app.
                        </p>
                        <div className="confirm-modal-actions" style={{justifyContent: 'center'}}>
                            <button className="modal-button confirm" style={{backgroundColor: 'var(--accent-teal)', color: 'var(--bg-dark)'}} onClick={handlePrivacyAccept}>I Understand</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
