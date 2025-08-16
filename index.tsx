/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// TypeScript declaration for Google Analytics gtag function and non-standard browser APIs
declare global {
    interface Window {
        gtag?: (command: string, actionOrId: string, params?: { [key: string]: any }) => void;
    }
    interface Navigator {
        standalone?: boolean;
    }
    interface ServiceWorkerRegistration {
        readonly periodicSync: PeriodicSyncManager;
    }
    interface PeriodicSyncManager {
        register(tag: string, options?: { minInterval: number }): Promise<void>;
        unregister(tag: string): Promise<void>;
        getTags(): Promise<string[]>;
    }
}

// --- Google Analytics Utility ---
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
    if (window.gtag) {
        window.gtag('event', action, {
            'event_category': category,
            'event_label': label,
            'value': value,
        });
    }
};

// --- Login Page Component ---
const LoginPage = ({ onLoginSuccess }) => {
    const [pin, setPin] = useState('');
    const [username, setUsername] = useState('');
    const [firstPinAttempt, setFirstPinAttempt] = useState('');
    const [error, setError] = useState('');
    const [setupStage, setSetupStage] = useState('login'); // 'login', 'createPin', 'confirmPin', 'createUsername'
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmDeleteText, setConfirmDeleteText] = useState('');
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    useEffect(() => {
        const storedPin = localStorage.getItem('userPIN');
        if (!storedPin) {
            setSetupStage('createPin');
        }
    }, []);

    const handlePinChange = (value) => {
        if (pin.length < 4) {
            setPin(pin + value);
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError('');
    };

    const handleUsernameSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) {
            localStorage.setItem('userPIN', firstPinAttempt);
            const userProfile = {
                username: username.trim(),
                gender: '',
                dob: ''
            };
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            localStorage.removeItem('username'); // Clean up old key
            onLoginSuccess();
        } else {
            setError('Username cannot be empty.');
        }
    };

    const handlePinSubmit = (e) => {
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
        localStorage.removeItem('userPIN');
        localStorage.removeItem('username');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('journalHistory');
        localStorage.removeItem('coreValues');
        localStorage.removeItem('groundingHistory');
        localStorage.removeItem('goals');
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
                            <path d="M45,95 C40,75 60,65 50,45 C30,30 40,10 50,0 C60,10 70,30 50,45 C60,65 40,75 55,95 Z" fill="currentColor"/>
                        </svg>
                        <h1 className="logo-text">YOUR JOURNEY,<br />YOUR TOOLS</h1>
                    </div>
                    <form className="card login-card" onSubmit={handleUsernameSubmit}>
                        <h2>Create a Username</h2>
                        <p className="app-subtitle" style={{marginBottom: '1.5rem', marginTop: '-0.5rem', width: '100%'}}>This will be used to greet you.</p>
                        <div className="form-group" style={{textAlign: 'left', width: '100%', marginBottom: 'rem'}}>
                            <label htmlFor="username-input" style={{marginBottom: '0.5rem'}}>Username</label>
                            <input
                                id="username-input"
                                type="text"
                                placeholder="Enter your name"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setError('');
                                }}
                                autoFocus
                            />
                        </div>
                        {error && <p className="pin-error" style={{marginBottom: '1rem'}}>{error}</p>}
                        <button type="submit" className="log-button" style={{width: '100%', marginTop: '0.5rem'}} disabled={!username.trim()}>
                            Save & Enter
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const getTitle = () => {
        switch(setupStage) {
            case 'login': return "Enter Your PIN";
            case 'createPin': return "Create a 4-Digit PIN";
            case 'confirmPin': return "Confirm Your New PIN";
            default: return "Welcome";
        }
    };

    const title = getTitle();
    const buttonText = (setupStage === 'login' || setupStage === 'confirmPin') ? "Unlock" : "Create PIN";

    return (
        <div className="page-container">
            <div className="login-container">
                <div className="app-logo-container">
                    <svg className="logo-graphic" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M45,95 C40,75 60,65 50,45 C30,30 40,10 50,0 C60,10 70,30 50,45 C60,65 40,75 55,95 Z" fill="currentColor"/>
                    </svg>
                    <h1 className="logo-text">YOUR JOURNEY,<br />YOUR TOOLS</h1>
                </div>
                <div className="card login-card">
                    <h2>{title}</h2>
                    <div className="pin-input-container">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`}></div>
                        ))}
                    </div>
                    {error && <p className="pin-error">{error}</p>}
                    <div className="pin-keypad">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button key={num} onClick={() => handlePinChange(num.toString())}>{num}</button>
                        ))}
                        <button onClick={handleDelete}>Del</button>
                        <button onClick={() => handlePinChange('0')}>0</button>
                        <button onClick={handlePinSubmit} className="confirm-button" disabled={pin.length !== 4}>{buttonText}</button>
                    </div>
                     {setupStage === 'login' && (
                        <button onClick={handleForgotPin} className="forgot-pin-button">
                            Forgot PIN?
                        </button>
                    )}
                </div>
            </div>

            {showConfirmModal && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-content card">
                        <h3>Are you sure?</h3>
                        <p>This will permanently delete your stored PIN and all journal history. This action cannot be undone.</p>
                        
                        <div className="form-group" style={{textAlign: 'left', width: '100%', margin: '1rem 0'}}>
                            <label htmlFor="confirm-delete-input" style={{color: 'var(--error-color)'}}>To confirm, type "DELETE" below:</label>
                            <input
                                id="confirm-delete-input"
                                type="text"
                                value={confirmDeleteText}
                                onChange={(e) => setConfirmDeleteText(e.target.value)}
                                autoComplete="off"
                                autoFocus
                            />
                        </div>

                        <div className="confirm-modal-actions">
                            <button onClick={() => setShowConfirmModal(false)} className="modal-button cancel">Cancel</button>
                            <button 
                                onClick={handleConfirmDelete} 
                                className="modal-button confirm"
                                disabled={confirmDeleteText !== 'DELETE'}
                            >
                                Confirm Deletion
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {showPrivacyModal && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-content card" style={{textAlign: 'left', alignItems: 'flex-start'}}>
                        <h3 style={{color: 'var(--accent-teal)', alignSelf: 'center'}}>Data Privacy & Storage</h3>
                         <p style={{ lineHeight: 1.7 }}>
                           Your data, including journal entries and goals, is saved directly in your browser's local storage. This means your information is private to you and is not sent to any server.
                         </p>
                         <p style={{ lineHeight: 1.7, fontWeight: 600, color: 'var(--orange-accent)' }}>
                           To ensure your data persists, it is highly recommended to use the same browser and device for this application. Clearing your browser's cache or data may permanently delete all your saved information.
                         </p>
                         <div className="confirm-modal-actions" style={{justifyContent: 'center', marginTop: '1rem'}}>
                             <button onClick={handlePrivacyAccept} className="modal-button" style={{backgroundColor: 'var(--accent-teal)', color: 'var(--bg-dark)'}}>Okay</button>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const substanceList = [
    "Select Substance", "Alcohol", "Cannabis", "Cocaine", "MDMA (Ecstasy)", "Heroin", "GBH (Fanta)",
    "Methamphetamine (Ice)", "Inhalants", "Ketamine", "LSD (Acid)", "Other"
];

const substanceUnits: { [key: string]: string[] } = {
    'Alcohol': ['Standard Drink(s)', 'Shot(s)', 'Glass(es)', 'Bottle(s)', 'Can(s)'],
    'Cannabis': ['Gram(s)', 'Joint(s)', 'Cone(s)', 'Pipe(s)'],
    'Cocaine': ['Gram(s)', 'Line(s)', 'Point(s)'],
    'MDMA (Ecstasy)': ['Pill(s)', 'Cap(s)', 'Point(s)'],
    'Heroin': ['Point(s)', 'Gram(s)', 'Shot(s)'],
    'GBH (Fanta)': ['ml', 'Dose(s)'],
    'Methamphetamine (Ice)': ['Point(s)', 'Gram(s)'],
    'Inhalants': ['Can(s)', 'Nang(s)'],
    'Ketamine': ['Bump(s)', 'Line(s)', 'Gram(s)'],
    'LSD (Acid)': ['Tab(s)', 'Drop(s)'],
    'Other': ['Unit(s)', 'mg', 'ml', 'Pill(s)']
};

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const quotes = [
    { quote: "The best way to predict the future is to create it.", author: "Abraham Lincoln" },
    { quote: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
    { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { quote: "Your limitation is only your imagination.", author: "Unknown" },
    { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { quote: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
];

type FeelingNode = {
    color?: string;
    children?: { [key: string]: FeelingNode };
};

const feelingsWheelData: { [key: string]: FeelingNode } = {
    Happy: {
        color: 'hsl(45, 86%, 53%)',
        children: {
            Playful: { children: { Aroused: {}, Cheeky: {} } },
            Content: { children: { Free: {}, Joyful: {} } },
            Interested: { children: { Curious: {}, Inquisitive: {} } },
            Proud: { children: { Successful: {}, Confident: {} } },
            Accepted: { children: { Respected: {}, Valued: {} } },
            Powerful: { children: { Courageous: {}, Creative: {} } },
            Peaceful: { children: { Loving: {}, Thankful: {} } },
            Trusting: { children: { Sensitive: {}, Intimate: {} } },
            Optimistic: { children: { Hopeful: {}, Inspired: {} } }
        }
    },
    Sad: {
        color: 'hsl(210, 29%, 40%)',
        children: {
            Lonely: { children: { Isolated: {}, Abandoned: {} } },
            Vulnerable: { children: { Victimized: {}, Fragile: {} } },
            Despair: { children: { Grief: {}, Powerless: {} } },
            Guilty: { children: { Ashamed: {}, Remorseful: {} } },
            Depressed: { children: { Empty: {}, Inferior: {} } }
        }
    },
    Disgusted: {
        color: 'hsl(9, 58%, 39%)',
        children: {
            Disapproving: { children: { Judgmental: {}, Dismissive: {} } },
            Disappointed: { children: { Appalled: {}, Revolted: {} } },
            Awful: { children: { Nauseated: {}, Detestable: {} } },
            Repelled: { children: { Horrified: {}, Hesitant: {} } }
        }
    },
    Angry: {
        color: 'hsl(4, 72%, 51%)',
        children: {
            'Let Down': { children: { Betrayed: {}, Resentful: {} } },
            Humiliated: { children: { Disrespected: {}, Ridiculed: {} } },
            Bitter: { children: { Indignant: {}, Violated: {} } },
            Mad: { children: { Furious: {}, Jealous: {} } },
            Aggressive: { children: { Provoked: {}, Hostile: {} } },
            Frustrated: { children: { Infuriated: {}, Annoyed: {} } },
            Distant: { children: { Withdrawn: {}, Numb: {} } },
            Critical: { children: { Skeptical: {}, Dismissive: {} } }
        }
    },
    Fearful: {
        color: 'hsl(328, 59%, 56%)',
        children: {
            Scared: { children: { Helpless: {}, Frightened: {} } },
            Anxious: { children: { Overwhelmed: {}, Worried: {} } },
            Insecure: { children: { Inadequate: {}, Inferior: {} } },
            Weak: { children: { Worthless: {}, Insignificant: {} } },
            Rejected: { children: { Excluded: {}, Persecuted: {} } },
            Threatened: { children: { Nervous: {}, Exposed: {} } }
        }
    },
    Bad: {
        color: 'hsl(285, 27%, 37%)',
        children: {
            Tired: { children: { Sleepy: {}, Unfocused: {} } },
            Stressed: { children: { 'Out of Control': {}, Overwhelmed: {} } },
            Busy: { children: { Rushed: {}, Pressured: {} } },
            Bored: { children: { Indifferent: {}, Apathetic: {} } }
        }
    },
    Surprised: {
        color: 'hsl(168, 76%, 42%)',
        children: {
            Startled: { children: { Shocked: {}, Dismayed: {} } },
            Confused: { children: { Disillusioned: {}, Perplexed: {} } },
            Amazed: { children: { Astonished: {}, Awe: {} } },
            Excited: { children: { Eager: {}, Energetic: {} } }
        }
    }
};

const FeelingsWheel = ({ onFeelingSelect, onClose, confirmText = "Confirm Feeling" }) => {
    const [path, setPath] = useState<string[]>([]);
    const [currentData, setCurrentData] = useState<{ [key: string]: FeelingNode }>(feelingsWheelData);
    const [revealed, setRevealed] = useState(false);
    const [definitionModal, setDefinitionModal] = useState<{ feeling: string | null }>({ feeling: null });

    useEffect(() => {
        let newData: { [key: string]: FeelingNode } | undefined = feelingsWheelData;
        for (const key of path) {
            newData = newData?.[key]?.children;
        }
        setCurrentData(newData || {});
        
        setRevealed(false);
        const timer = setTimeout(() => setRevealed(true), 100);
        return () => clearTimeout(timer);
    }, [path]);


    const handleFeelingClick = (feeling: string) => {
        setDefinitionModal({ feeling });
    };

    const handleDrillDown = (feeling: string) => {
        if (currentData[feeling]?.children && Object.keys(currentData[feeling].children).length > 0) {
            setPath([...path, feeling]);
        }
        setDefinitionModal({ feeling: null });
    };

    const handleConfirmSelection = (feeling: string) => {
        onFeelingSelect(feeling);
        setDefinitionModal({ feeling: null });
    };

    const closeModal = () => {
        setDefinitionModal({ feeling: null });
    };

    const handleBack = () => {
        setPath(path.slice(0, -1));
    };
    
    const items = Object.keys(currentData);
    const angleStep = 360 / items.length;

    return (
        <div className="feelings-wheel-overlay" onClick={onClose}>
            <div className="feelings-wheel-container" onClick={e => e.stopPropagation()}>
                <div className="wheel-header">
                    {path.length > 0 && <button className="wheel-nav-button" onClick={handleBack}>Back</button>}
                    <h2 className="wheel-title">How are you feeling?</h2>
                    <button className="wheel-nav-button close" onClick={onClose}>Close</button>
                </div>

                <div className={`wheel-display ${path.length === 0 ? 'first-level' : ''}`}>
                    {path.length > 0 && (
                        <div className="wheel-center">
                            <span className="wheel-center-text">{path[path.length - 1]}</span>
                        </div>
                    )}
                    <div className="wheel-segments">
                        {items.map((feeling, index) => {
                            const angle = index * angleStep;
                            const nodeForColor = path.length > 0 ? feelingsWheelData[path[0]] : feelingsWheelData[feeling];
                            const parentColor = nodeForColor?.color || 'hsl(0, 0%, 50%)';
                            
                            return (
                                <button 
                                    key={feeling} 
                                    className={`wheel-segment ${revealed ? 'revealed' : ''}`}
                                    style={{
                                        '--angle': `${angle}deg`,
                                        '--bg-color': parentColor,
                                        '--delay': `${index * 50}ms`
                                    } as React.CSSProperties}
                                    onClick={() => handleFeelingClick(feeling)}
                                >
                                    {feeling}
                                </button>
                            );
                        })}
                    </div>
                </div>

                 {definitionModal.feeling && (
                    <div className="definition-modal-overlay" onClick={closeModal}>
                        <div className="definition-modal-content card" onClick={e => e.stopPropagation()}>
                            <h3>{definitionModal.feeling}</h3>
                            <div className="definition-text">
                                <p>You can explore this feeling further or select it for your journal.</p>
                            </div>
                            <div className="definition-modal-actions">
                                {currentData[definitionModal.feeling]?.children && Object.keys(currentData[definitionModal.feeling].children).length > 0 && (
                                    <button className="modal-button explore" onClick={() => handleDrillDown(definitionModal.feeling)}>
                                        Explore Further
                                    </button>
                                )}
                                {confirmText !== "Done Exploring" && (
                                    <button className="modal-button confirm" onClick={() => handleConfirmSelection(definitionModal.feeling)}>
                                        Select This Feeling
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Tracker Page Component ---
const TrackerPage = ({ onBack }) => {
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [time, setTime] = useState('');
  const [selectedSubstance, setSelectedSubstance] = useState("Select Substance");
  const [otherSubstance, setOtherSubstance] = useState("");
  const [location, setLocation] = useState("");
  const [amountValue, setAmountValue] = useState("");
  const [amountUnit, setAmountUnit] = useState("Select Substance First");
  const [substanceHistory, setSubstanceHistory] = useState(() => {
    try {
        const savedHistory = localStorage.getItem('journalHistory');
        return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
        console.error("Could not parse journal history from localStorage", error);
        return [];
    }
  });
  const [confirmationMessage, setConfirmationMessage] = useState('');
  
  // States for feeling autocomplete
  const [feelingInput, setFeelingInput] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // States for journal reminders
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('19:00');

  const allFeelings: string[] = useMemo(() => {
      const feelings = new Set<string>();
      const recurse = (node: { [key: string]: FeelingNode }) => {
          if (!node) return;
          Object.keys(node).forEach(key => {
              feelings.add(key);
              if (node[key].children) {
                  recurse(node[key].children);
              }
          });
      };
      recurse(feelingsWheelData);
      return Array.from(feelings).sort();
  }, []);
  
  useEffect(() => {
    try {
        localStorage.setItem('journalHistory', JSON.stringify(substanceHistory));
    } catch (error) {
        console.error("Could not save journal history to localStorage", error);
    }
  }, [substanceHistory]);

  useEffect(() => {
    try {
        const savedSettings = localStorage.getItem('journalReminderSettings');
        if (savedSettings) {
            const { enabled, time } = JSON.parse(savedSettings);
            setReminderEnabled(enabled);
            setReminderTime(time);
        }
    } catch (e) {
        console.error("Could not load journal reminder settings", e);
    }
  }, []);
  
  // When a feeling is selected (from wheel or suggestion), update the input text
  useEffect(() => {
      if (selectedFeeling) {
          setFeelingInput(selectedFeeling);
      }
  }, [selectedFeeling]);
  
  // When substance changes, update the unit dropdown
  useEffect(() => {
      const units = substanceUnits[selectedSubstance];
      if (units && units.length > 0) {
          setAmountUnit(units[0]); // Default to the first unit
      } else {
          setAmountUnit('Select Substance First'); // A generic fallback
      }
  }, [selectedSubstance]);

  const handleReminderToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    if (isChecked) {
        if (Notification.permission === 'denied') {
            alert("You've previously denied notification permissions. Please enable them in your browser settings to use this feature.");
            return;
        }
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert("Permission was not granted. Reminders cannot be set.");
                return;
            }
        }
    }
    setReminderEnabled(isChecked);
    try {
        localStorage.setItem('journalReminderSettings', JSON.stringify({ enabled: isChecked, time: reminderTime }));
    } catch (err) {
        console.error("Could not save journal reminder settings", err);
    }
  };

  const handleReminderTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = e.target.value;
      setReminderTime(newTime);
      if (reminderEnabled) {
          try {
              localStorage.setItem('journalReminderSettings', JSON.stringify({ enabled: reminderEnabled, time: newTime }));
          } catch (err) {
              console.error("Could not save journal reminder settings", err);
          }
      }
  };

  const handleFeelingSelect = (feeling: string) => {
      setSelectedFeeling(feeling);
      setIsWheelOpen(false);
  };
  
  const handleFeelingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFeelingInput(value);

      // If user is typing, the selection is no longer valid until they pick a new one
      if (selectedFeeling) {
          setSelectedFeeling(null);
      }

      if (value.length > 0) {
          const filteredSuggestions = allFeelings.filter(
              feeling => feeling.toLowerCase().startsWith(value.toLowerCase())
          );
          setSuggestions(filteredSuggestions.slice(0, 5)); // Show top 5
      } else {
          setSuggestions([]);
      }
  };

  const handleSuggestionClick = (feeling: string) => {
      setSelectedFeeling(feeling);
      setFeelingInput(feeling);
      setSuggestions([]);
  };

  const handleInputBlur = () => {
      // Add a short delay so that suggestion clicks can register
      setTimeout(() => {
          setSuggestions([]);
          // If the input doesn't match the selected feeling, reset it to the last valid selection or clear it
          if (feelingInput !== selectedFeeling) {
              setFeelingInput(selectedFeeling || '');
          }
      }, 150);
  };
  
  const formatTime12Hour = (time24: string) => {
      if (!time24) return '';
      const [hours, minutes] = time24.split(':');
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12; // Convert 0 to 12
      return ` at ${h12}:${minutes} ${ampm}`;
  };

  const handleLogEntry = () => {
    const substanceToLog = selectedSubstance === 'Other' ? otherSubstance : selectedSubstance;
    
    const today = new Date();
    const todayIndex = today.getDay();
    const selectedDayIndex = daysOfWeek.indexOf(selectedDay);
    
    let dayOffset = selectedDayIndex - todayIndex;
    if (dayOffset > 0) {
      dayOffset -= 7;
    }
    
    const entryDate = new Date();
    entryDate.setDate(entryDate.getDate() + dayOffset);

    // Set the time correctly from the time input
    if (time) { // time is "HH:mm"
        const [hours, minutes] = time.split(':');
        entryDate.setHours(parseInt(hours, 10));
        entryDate.setMinutes(parseInt(minutes, 10));
        entryDate.setSeconds(0);
        entryDate.setMilliseconds(0);
    } else {
        // If no time is provided, use the current time of logging
        const now = new Date();
        entryDate.setHours(now.getHours());
        entryDate.setMinutes(now.getMinutes());
        entryDate.setSeconds(now.getSeconds());
    }
    
    const formattedDate = entryDate.toLocaleDateString('en-AU');

    const newLog = {
      id: Date.now(),
      entryTimestamp: entryDate.getTime(),
      feeling: selectedFeeling,
      day: selectedDay,
      date: formattedDate,
      time: time,
      substance: substanceToLog,
      amountValue: parseFloat(amountValue) || 0,
      amountUnit: amountUnit,
      location: location.trim(),
    };

    setSubstanceHistory([newLog, ...substanceHistory]);

    trackEvent('log_journal_entry', 'Tracker', substanceToLog, 1);

    setConfirmationMessage('Entry saved successfully!');
    setTimeout(() => {
      setConfirmationMessage('');
    }, 3000);

    setSelectedFeeling(null);
    setFeelingInput('');
    setSelectedDay(null);
    setTime('');
    setSelectedSubstance("Select Substance");
    setOtherSubstance("");
    setAmountValue("");
    setLocation("");
  };

  const isLogEntryDisabled = 
    !selectedFeeling || 
    !selectedDay || 
    selectedSubstance === "Select Substance" || 
    !amountValue.trim() || 
    (selectedSubstance === 'Other' && !otherSubstance.trim());

  return (
    <div className="page-container">
       {isWheelOpen && (
        <FeelingsWheel 
            onFeelingSelect={handleFeelingSelect}
            onClose={() => setIsWheelOpen(false)}
        />
       )}
      <div className="content-with-side-button">
        <div className="side-button-wrapper">
            <button onClick={onBack} className="home-button" aria-label="Go back">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>
               <span>Back</span>
            </button>
        </div>
        <main className="tracker-content">
            <div className="tracker-section card">
            <h2 className="tracker-title">Daily Journal</h2>
            <p className="tracker-description">Log your mood and substance use to gain insight.</p>
            
            <div className="form-group feeling-input-container">
                <label>How are you feeling?</label>
                <input
                    type="text"
                    placeholder="Type to search for a feeling..."
                    value={feelingInput}
                    onChange={handleFeelingInputChange}
                    onBlur={handleInputBlur}
                    autoComplete="off"
                    className={selectedFeeling ? 'selected' : ''}
                />
                {suggestions.length > 0 && (
                    <ul className="feeling-suggestions-list">
                        {suggestions.map(suggestion => (
                            <li key={suggestion} onMouseDown={() => handleSuggestionClick(suggestion)}>
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                )}
                <div className="feeling-wheel-prompt">
                    <button onClick={() => setIsWheelOpen(true)} className="link-button">
                        Click here for the Feelings Wheel
                    </button>
                </div>
            </div>
            
            <div className="form-group">
                <label>Day of the Week</label>
                <div className="day-selector-container">
                {daysOfWeek.map(day => (
                    <button key={day} className={`day-button ${selectedDay === day ? 'selected' : ''}`} onClick={() => setSelectedDay(day)}>
                    {day}
                    </button>
                ))}
                </div>
            </div>
            <div className="form-group">
                <label htmlFor="time-input">Time of Use (Optional)</label>
                <input
                    id="time-input"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    style={{colorScheme: 'dark'}}
                />
            </div>
            <div className="form-group">
                <label htmlFor="substance-select">Substance</label>
                <select
                    id="substance-select"
                    value={selectedSubstance}
                    onChange={(e) => setSelectedSubstance(e.target.value)}
                >
                    {substanceList.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
            </div>
            {selectedSubstance === 'Other' && (
                <div className="form-group">
                    <label htmlFor="other-substance-input">Please specify</label>
                    <input
                        id="other-substance-input"
                        type="text"
                        placeholder="e.g., Prescription med"
                        value={otherSubstance}
                        onChange={(e) => setOtherSubstance(e.target.value)}
                    />
                </div>
            )}
            <div className="form-group">
                <label htmlFor="location-input">Place or People (Optional)</label>
                <input 
                id="location-input" 
                type="text" 
                placeholder="e.g., At home, with friends"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                />
            </div>
            <div className="form-group">
                <label htmlFor="amount-value-input">Amount / Quantity</label>
                <div className="amount-inputs">
                    <input
                        id="amount-value-input"
                        type="number"
                        placeholder="e.g., 1"
                        value={amountValue}
                        onChange={(e) => setAmountValue(e.target.value)}
                        min="0"
                    />
                    <select
                        id="amount-unit-select"
                        value={amountUnit}
                        onChange={(e) => setAmountUnit(e.target.value)}
                        disabled={selectedSubstance === "Select Substance" || !substanceUnits[selectedSubstance]}
                    >
                        {(substanceUnits[selectedSubstance] || ['Select Substance First']).map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                        ))}
                    </select>
                </div>
            </div>
            <button className="log-button" onClick={handleLogEntry} disabled={isLogEntryDisabled}>
                Log Entry
            </button>
            {confirmationMessage && (
                <div className="confirmation-message">{confirmationMessage}</div>
            )}

            <div className="form-section card reminder-section" style={{marginTop: '2rem'}}>
                <h3 className="form-section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <span>Daily Journal Reminder</span>
                </h3>
                <div className="reminder-toggle">
                    <label htmlFor="journal-reminder-enabled">Set a daily reminder to log your entry?</label>
                    <input id="journal-reminder-enabled" type="checkbox" checked={reminderEnabled} onChange={handleReminderToggle} />
                </div>
                {reminderEnabled && (
                    <div className="reminder-time-input">
                        <label htmlFor="journal-reminder-time">Reminder time:</label>
                        <input id="journal-reminder-time" type="time" value={reminderTime} onChange={handleReminderTimeChange} style={{colorScheme: 'dark'}} />
                    </div>
                )}
            </div>

            <hr className="history-divider" />
            <div className="history-section">
                <h3 className="history-title">History</h3>
                {substanceHistory.length > 0 ? (
                <ul className="history-list">
                    {substanceHistory.map(log => {
                        const displayAmount = log.amountValue !== undefined 
                            ? `${log.amountValue} ${log.amountUnit || ''}` 
                            : log.amount;
                        return (
                            <li key={log.id} className="history-item">
                                <div className="history-feeling">
                                    {log.feeling}
                                </div>
                                <div className="history-details">
                                    <strong>{log.day} ({log.date}){formatTime12Hour(log.time)}: {displayAmount.trim()} of {log.substance}</strong>
                                    {log.location && <span className="location-text">{log.location}</span>}
                                </div>
                            </li>
                        )
                    })}
                </ul>
                ) : (
                <p className="no-history-message">No logs yet. Your journal will appear here.</p>
                )}
            </div>
            </div>
        </main>
      </div>
    </div>
  );
};

// --- AUDIT Test Component ---
const auditQuestions = [
    {
        question: "How often do you have a drink containing alcohol?",
        options: [
            { text: "Never", score: 0 }, { text: "Monthly or less", score: 1 }, { text: "2-4 times a month", score: 2 },
            { text: "2-3 times a week", score: 3 }, { text: "4 or more times a week", score: 4 }
        ]
    },
    {
        question: "How many standard drinks containing alcohol do you have on a typical day when you are drinking?",
        options: [
            { text: "1 or 2", score: 0 }, { text: "3 or 4", score: 1 }, { text: "5 or 6", score: 2 },
            { text: "7 to 9", score: 3 }, { text: "10 or more", score: 4 }
        ]
    },
    {
        question: "How often do you have six or more standard drinks on one occasion?",
        options: [
            { text: "Never", score: 0 }, { text: "Less than monthly", score: 1 }, { text: "Monthly", score: 2 },
            { text: "Weekly", score: 3 }, { text: "Daily or almost daily", score: 4 }
        ]
    },
    {
        question: "How often during the last year have you found that you were not able to stop drinking once you had started?",
        options: [
            { text: "Never", score: 0 }, { text: "Less than monthly", score: 1 }, { text: "Monthly", score: 2 },
            { text: "Weekly", score: 3 }, { text: "Daily or almost daily", score: 4 }
        ]
    },
    {
        question: "How often during the last year have you failed to do what was normally expected of you because of drinking?",
        options: [
            { text: "Never", score: 0 }, { text: "Less than monthly", score: 1 }, { text: "Monthly", score: 2 },
            { text: "Weekly", score: 3 }, { text: "Daily or almost daily", score: 4 }
        ]
    },
    {
        question: "How often during the last year have you needed a first drink in the morning to get yourself going after a heavy drinking session?",
        options: [
            { text: "Never", score: 0 }, { text: "Less than monthly", score: 1 }, { text: "Monthly", score: 2 },
            { text: "Weekly", score: 3 }, { text: "Daily or almost daily", score: 4 }
        ]
    },
    {
        question: "How often during the last year have you had a feeling of guilt or remorse after drinking?",
        options: [
            { text: "Never", score: 0 }, { text: "Less than monthly", score: 1 }, { text: "Monthly", score: 2 },
            { text: "Weekly", score: 3 }, { text: "Daily or almost daily", score: 4 }
        ]
    },
    {
        question: "How often during the last year have you been unable to remember what happened the night before because you had been drinking?",
        options: [
            { text: "Never", score: 0 }, { text: "Less than monthly", score: 1 }, { text: "Monthly", score: 2 },
            { text: "Weekly", score: 3 }, { text: "Daily or almost daily", score: 4 }
        ]
    },
    {
        question: "Have you or someone else been injured as a result of your drinking?",
        options: [
            { text: "No", score: 0 }, { text: "Yes, but not in the last year", score: 2 }, { text: "Yes, during the last year", score: 4 }
        ]
    },
    {
        question: "Has a relative, friend, doctor, or other health worker been concerned about your drinking or suggested you cut down?",
        options: [
            { text: "No", score: 0 }, { text: "Yes, but not in the last year", score: 2 }, { text: "Yes, during the last year", score: 4 }
        ]
    }
];

const getAuditInterpretation = (score) => {
    if (score <= 7) return { zone: 'I', level: 'Low Risk', recommendation: 'Your responses suggest that your drinking pattern represents a low level of risk for developing alcohol-related problems.' };
    if (score <= 15) return { zone: 'II', level: 'Increasing Risk', recommendation: 'Your drinking pattern suggests a risk of health problems. It may be beneficial to explore strategies for reducing your alcohol intake.' };
    if (score <= 19) return { zone: 'III', level: 'Higher Risk', recommendation: 'Your drinking pattern places you at a higher risk of experiencing alcohol-related harm. Cutting down is strongly advised to reduce this risk.' };
    return { zone: 'IV', level: 'Possible Dependence', recommendation: 'Your score indicates you are at high risk and may be experiencing alcohol dependence. It is highly recommended that you speak with a healthcare professional to discuss your drinking.' };
};

const AuditTestPage = ({ onBack }) => {
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [results, setResults] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('auditHistory');
            setHistory(savedHistory ? JSON.parse(savedHistory) : []);
        } catch (e) {
            console.error("Could not load AUDIT history", e);
        }
    }, []);

    const handleAnswer = (score) => {
        setAnswers(prev => ({ ...prev, [currentQ]: score }));
    };

    const handleNext = () => {
        if (currentQ < auditQuestions.length - 1) {
            setCurrentQ(currentQ + 1);
        }
    };

    const handleBack = () => {
        if (currentQ > 0) {
            setCurrentQ(currentQ - 1);
        }
    };

    const handleShowResults = () => {
        const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);
        const interpretation = getAuditInterpretation(totalScore);
        const resultData = { score: totalScore, interpretation, date: new Date().toISOString() };
        setResults(resultData);

        const newHistory = [resultData, ...history];
        setHistory(newHistory);
        try {
            localStorage.setItem('auditHistory', JSON.stringify(newHistory));
            trackEvent('complete_exercise', 'AUDIT Test', 'Score', totalScore);
        } catch(e) {
            console.error("Could not save AUDIT history", e);
        }
    };
    
    if (results) {
        return (
            <div className="page-container">
                <div className="content-with-side-button">
                    <div className="side-button-wrapper"></div>
                    <main>
                        <div className="page-header-text">
                            <h1 className="app-title">Your AUDIT Result</h1>
                        </div>
                        <div className="audit-result-card card">
                            <div className="audit-score-display">
                                <span className="audit-score-value">{results.score}</span>
                                <span className="audit-score-label">Total Score</span>
                            </div>
                            <h3 className={`audit-level-display zone-${results.interpretation.zone}`}>{results.interpretation.level}</h3>
                            <p className="audit-recommendation">{results.interpretation.recommendation}</p>
                        </div>

                        <div className="disclaimer-card card">
                            <h4>Important Disclaimer</h4>
                            <p>The AUDIT is a screening tool to identify potential alcohol problems. It is not a diagnostic tool. This result does not constitute a medical diagnosis. Please consult with a doctor or qualified health professional to get a full assessment and discuss your results.</p>
                        </div>
                        
                        {history.length > 1 && (
                            <div className="audit-history card">
                                <h3>Previous Results</h3>
                                <ul>
                                    {history.slice(1).map((item, index) => (
                                        <li key={index}>
                                            <span>{new Date(item.date).toLocaleDateString()}</span>
                                            <strong>Score: {item.score} ({item.interpretation.level})</strong>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button onClick={onBack} className="exercise-nav-button" style={{marginTop: '2rem'}}>
                            Done
                        </button>
                    </main>
                </div>
            </div>
        );
    }

    const progress = ((currentQ + 1) / auditQuestions.length) * 100;
    const isAnswerSelected = answers[currentQ] !== undefined;

    return (
        <div className="page-container">
            <div className="content-with-side-button">
                <div className="side-button-wrapper">
                    <button onClick={onBack} className="home-button" aria-label="Go back">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>
                        <span>Back</span>
                    </button>
                </div>
                <main className="audit-test-container">
                    <div className="page-header-text">
                        <h1 className="app-title">AUDIT Questionnaire</h1>
                        <p className="app-subtitle">Alcohol Use Disorders Identification Test</p>
                    </div>
                    
                    <div className="audit-progress-bar-container">
                        <div className="audit-progress-bar" style={{ width: `${progress}%` }}></div>
                    </div>

                    <div className="audit-question-card card">
                        <p className="audit-question-number">Question {currentQ + 1} of {auditQuestions.length}</p>
                        <h2 className="audit-question-text">{auditQuestions[currentQ].question}</h2>
                        <div className="audit-answer-options">
                            {auditQuestions[currentQ].options.map((opt) => (
                                <button
                                    key={opt.text}
                                    className={`audit-answer-button ${answers[currentQ] === opt.score ? 'selected' : ''}`}
                                    onClick={() => handleAnswer(opt.score)}
                                >
                                    {opt.text}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="audit-navigation">
                        <button onClick={handleBack} disabled={currentQ === 0} className="audit-nav-button audit-nav-secondary">Previous</button>
                        {currentQ < auditQuestions.length - 1 ? (
                            <button onClick={handleNext} disabled={!isAnswerSelected} className="audit-nav-button">Next</button>
                        ) : (
                            <button onClick={handleShowResults} disabled={!isAnswerSelected} className="audit-nav-button">See Results</button>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

// --- Know Yourself Page Component ---

const valuesData = [
  { title: 'Achievement', description: 'To accomplish something important and successfully.' },
  { title: 'Adventure', description: 'To have new and exciting experiences.' },
  { title: 'Autonomy', description: 'To be independent and have control over your own life.' },
  { title: 'Challenges', description: 'To take on difficult tasks and situations.' },
  { title: 'Change', description: 'To experience variety and new things.' },
  { title: 'Community', description: 'To be part of a group and feel a sense of belonging.' },
  { title: 'Competence', description: 'To be skilled and capable in your actions.' },
  { title: 'Competition', description: 'To engage in contests and win.' },
  { title: 'Cooperation', description: 'To work together with others for a common purpose.' },
  { title: 'Creativity', description: 'To create new things or ideas.' },
  { title: 'Decisiveness', description: 'To make decisions quickly and confidently.' },
  { title: 'Diversity', description: 'To have a variety of people and cultures around you.' },
  { title: 'Ecology / Environment', description: 'To live in harmony with and protect natural resources.' },
  { title: 'Education', description: 'To learn and acquire knowledge.' },
  { title: 'Ethics', description: 'To live in a way that is morally right.' },
  { title: 'Excellence', description: 'To be the best in what you do.' },
  { title: 'Excitement', description: 'To experience a state of enthusiasm and eagerness.' },
  { title: 'Fairness', description: 'To treat people equally and justly.' },
  { title: 'Faith', description: 'To have belief and trust, especially in a higher power.' },
  { title: 'Fame', description: 'To be known and recognized by many people.' },
  { title: 'Family', description: 'To have a happy, loving family.' },
  { title: 'Flexibility', description: 'To adapt to changes and new circumstances.' },
  { title: 'Freedom', description: 'To have the ability to act, speak, or think without restraint.' },
  { title: 'Friendship', description: 'To have close, supportive friends.' },
  { title: 'Happiness', description: 'To feel content and joyful.' },
  { title: 'Health', description: 'To be physically and mentally well.' },
  { title: 'Helping Others', description: 'To assist and support other people.' },
  { title: 'Honesty', description: 'To be truthful and sincere.' },
  { title: 'Independence', description: 'To be self-reliant and free from the control of others.' },
  { title: 'Integrity', description: 'To adhere to moral and ethical principles.' },
  { title: 'Leadership', description: 'To guide or direct a group.' },
  { title: 'Loyalty', description: 'To be faithful to your commitments or to others.' },
  { title: 'Meaningful Work', description: 'To have a job that feels significant and purposeful.' },
  { title: 'Money', description: 'To have financial resources.' },
  { title: 'Order', description: 'To have a life that is well-organized and predictable.' },
  { title: 'Philanthropy', description: 'To promote the welfare of others, especially by donating money.' },
  { title: 'Play', description: 'To have fun and recreation.' },
  { title: 'Pleasure', description: 'To experience enjoyment and satisfaction.' },
  { title: 'Power', description: 'To have control or influence over others.' },
  { title: 'Privacy', description: 'To have time and space for yourself.' },
  { title: 'Recognition', description: 'To get appreciation and credit for your achievements.' },
  { title: 'Relationships', description: 'To have deep and meaningful connections with others.' },
  { title: 'Religion', description: 'To practice a specific faith or belief system.' },
  { title: 'Safety', description: 'To be protected from harm or danger.' },
  { title: 'Security', description: 'To feel safe and have a stable life.' },
  { title: 'Service', description: 'To help or do work for others.' },
  { title: 'Spirituality', description: 'To have a sense of connection to something bigger than yourself.' },
  { title: 'Stability', description: 'To have consistency and predictability in your life.' },
  { title: 'Status', description: 'To have a high social or professional standing.' },
  { title: 'Wealth', description: 'To have a great deal of money, possessions, or resources.' },
  { title: 'Work', description: 'To have a job or career.' },
];

const valuesDataShort = [
    { title: 'Achievement', description: 'To accomplish something important and successfully.' },
    { title: 'Autonomy', description: 'To be independent and have control over your own life.' },
    { title: 'Challenges', description: 'To take on difficult tasks and situations.' },
    { title: 'Community', description: 'To be part of a group and feel a sense of belonging.' },
    { title: 'Cooperation', description: 'To work together with others for a common purpose.' },
    { title: 'Creativity', description: 'To create new things or ideas.' },
    { title: 'Decisiveness', description: 'To make decisions quickly and confidently.' },
    { title: 'Education', description: 'To learn and acquire knowledge.' },
    { title: 'Ethics', description: 'To live in a way that is morally right.' },
    { title: 'Excellence', description: 'To be the best in what you do.' },
    { title: 'Fairness', description: 'To treat people equally and justly.' },
    { title: 'Family', description: 'To have a happy, loving family.' },
    { title: 'Freedom', description: 'To have the ability to act, speak, or think without restraint.' },
    { title: 'Friendship', description: 'To have close, supportive friends.' },
    { title: 'Happiness', description: 'To feel content and joyful.' },
    { title: 'Health', description: 'To be physically and mentally well.' },
    { title: 'Helping Others', description: 'To assist and support other people.' },
    { title: 'Honesty', description: 'To be truthful and sincere.' },
    { title: 'Integrity', description: 'To adhere to moral and ethical principles.' },
    { title: 'Meaningful Work', description: 'To have a job that feels significant and purposeful.' },
    { title: 'Play', description: 'To have fun and recreation.' },
    { title: 'Relationships', description: 'To have deep and meaningful connections with others.' },
    { title: 'Safety', description: 'To be protected from harm or danger.' },
    { title: 'Spirituality', description: 'To have a sense of connection to something bigger than yourself.' }
];

const shuffle = (array) => {
  let currentIndex = array.length,  randomIndex;
  const newArray = [...array];
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
  }
  return newArray;
};

const KnowYourselfPage = ({ onBack, initialStep = 'intro' }) => {
  const [exerciseStep, setExerciseStep] = useState(initialStep); // 'intro', 'deck-selection', 'sort-all', 'sort-top-10', 'sort-top-5', 'results', 'audit-test'
  const [deck, setDeck] = useState([]);
  const [keepPile, setKeepPile] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animation, setAnimation] = useState('');
  const [activeTab, setActiveTab] = useState('keep');
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const startExercise = (deckData) => {
    if (!localStorage.getItem('valuesTutorialShown')) {
        setShowTutorial(true);
    }
    setDeck(shuffle(deckData));
    setKeepPile([]);
    setDiscardPile([]);
    setCurrentIndex(0);
    setExerciseStep('sort-all');
    setActiveTab('keep');
  }

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('valuesTutorialShown', 'true');
  };

  const handleSort = (pile) => {
    if (currentIndex >= deck.length) return;

    const card = deck[currentIndex];
    const newAnimation = pile === 'keep' ? 'slide-out-right' : 'slide-out-left';
    setAnimation(newAnimation);

    setTimeout(() => {
        if (pile === 'keep') {
            setKeepPile(prev => [...prev, card]);
        } else {
            setDiscardPile(prev => [...prev, card]);
        }
        setCurrentIndex(prev => prev + 1);
        setAnimation(''); // Reset animation
    }, 300); // Duration should match CSS animation
  };
  
  const handleRestoreDiscardedCard = (cardToRestore) => {
    setDiscardPile(prev => prev.filter(c => c.title !== cardToRestore.title));
    setDeck(prev => [...prev, cardToRestore]);
  };

  const handleUndoKeep = (cardToUndo) => {
    setKeepPile(prev => prev.filter(c => c.title !== cardToUndo.title));
    setDeck(prev => [...prev, cardToUndo]);
  };
  
  const nextStep = () => {
      if (exerciseStep === 'sort-all') {
          setDeck(shuffle(keepPile));
          setExerciseStep('sort-top-10');
      } else if (exerciseStep === 'sort-top-10') {
          setDeck(shuffle(keepPile));
          setExerciseStep('sort-top-5');
      } else if (exerciseStep === 'sort-top-5') {
          try {
            localStorage.setItem('coreValues', JSON.stringify(keepPile));
            trackEvent('complete_exercise', 'Values', 'Values Exercise', keepPile.length);
          } catch(e) {
            console.error("Could not save core values to localStorage", e)
          }
          setExerciseStep('results');
          return; // No need to reset state for results
      }
      // Reset for next round
      setKeepPile([]);
      setDiscardPile([]);
      setCurrentIndex(0);
      setActiveTab('keep');
  };
  
  const getStepInfo = () => {
      switch(exerciseStep) {
          case 'sort-all':
              return { title: 'Values Exercise', instruction: "Sort the cards into two piles: one for values that fit you well, and one for values that don't.", limit: Infinity, nextButtonText: "Next" };
          case 'sort-top-10':
              return { title: 'Select Your Top 10', instruction: "From your 'keep' pile, choose the 10 values that are most important to you.", limit: 10, nextButtonText: "Next" };
          case 'sort-top-5':
              return { title: 'Find Your Core 5', instruction: 'From your top 10, choose the 5 core values that are most essential to you.', limit: 5, nextButtonText: "See Results" };
          default:
              return {};
      }
  }
  
  const { title, instruction, limit, nextButtonText } = getStepInfo();

  const isKeepLimitReached = keepPile.length >= limit;
  const isDeckEmpty = currentIndex >= deck.length;
  const isRoundComplete = isDeckEmpty || (isKeepLimitReached && exerciseStep !== 'sort-all');
  
  const showNextButton = (exerciseStep === 'sort-all' && isDeckEmpty) || (exerciseStep !== 'sort-all' && (isKeepLimitReached || (isDeckEmpty && keepPile.length > 0)));

  if (exerciseStep === 'audit-test') {
      return <AuditTestPage onBack={() => setExerciseStep('intro')} />;
  }

  if (exerciseStep === 'intro') {
    return (
      <div className="page-container">
        {isWheelOpen && (
            <FeelingsWheel 
                onFeelingSelect={() => setIsWheelOpen(false)}
                onClose={() => setIsWheelOpen(false)}
                confirmText="Done Exploring"
            />
        )}
        <div className="content-with-side-button">
          <div className="side-button-wrapper">
            <button onClick={onBack} className="home-button" aria-label="Go back to home">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>Home</span>
            </button>
          </div>
          <main>
             <div className="page-header-text">
                <h1 className="app-title">Know Yourself</h1>
                <p className="app-subtitle">Discover what's important to you.</p>
             </div>
             <div className="card-grid">
                  <button className="card" aria-label="Values" onClick={() => setExerciseStep('deck-selection')}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                      <h2 className="card-title">Values Exercise</h2>
                      <p className="card-description">Identify your core personal values.</p>
                  </button>
                  <button className="card" aria-label="Explore Your Feelings" onClick={() => setIsWheelOpen(true)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-icon"><circle cx="12" cy="12" r="10"></circle><path d="M8 15h8"></path><line x1="9" y1="10" x2="9.01" y2="10"></line><line x1="15" y1="10" x2="15.01" y2="10"></line></svg>
                      <h2 className="card-title">Feelings Explorer</h2>
                      <p className="card-description">Explore a wide range of emotions.</p>
                  </button>
                  <button className="card" aria-label="AUDIT Test" onClick={() => setExerciseStep('audit-test')}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-icon"><path d="M14.5 2H9.5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                      <h2 className="card-title">AUDIT Test</h2>
                      <p className="card-description">Assess your alcohol consumption patterns.</p>
                  </button>
             </div>
          </main>
        </div>
      </div>
    );
  }

  if (exerciseStep === 'deck-selection') {
    return (
      <div className="page-container">
        <div className="content-with-side-button">
            <div className="side-button-wrapper">
                <button onClick={initialStep === 'deck-selection' ? onBack : () => setExerciseStep('intro')} className="home-button" aria-label="Go back">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>
                   <span>Back</span>
                </button>
            </div>
            <main>
                <div className="page-header-text">
                    <h1 className="app-title">Choose Your Deck</h1>
                    <p className="app-subtitle">Select the set of values you'd like to work with.</p>
                </div>
                <div className="card-grid" style={{maxWidth: '800px'}}>
                    <button className="card" onClick={() => startExercise(valuesData)}>
                        <h2 className="card-title">Standard Deck</h2>
                        <p className="card-description">A comprehensive list of 51 common values for a broad exploration.</p>
                    </button>
                    <button className="card" onClick={() => startExercise(valuesDataShort)}>
                        <h2 className="card-title">Focused Deck</h2>
                        <p className="card-description">A curated list of 24 core values for a quicker reflection.</p>
                    </button>
                </div>
            </main>
        </div>
      </div>
    );
  }
  
  if (exerciseStep === 'results') {
    return (
        <div className="page-container">
            <div className="content-with-side-button">
                 <div className="side-button-wrapper"></div>
                 <main>
                    <div className="page-header-text">
                        <h1 className="app-title">Your {keepPile.length} Core Values</h1>
                        <p className="app-subtitle">These are the values you identified as most essential to you.</p>
                    </div>
                    <div className="values-results-grid">
                        {keepPile.map(card => (
                            <div key={card.title} className="value-card-result">
                                <h3>{card.title}</h3>
                                <p>{card.description}</p>
                            </div>
                        ))}
                    </div>
                    <div className="results-summary card">
                        <p>Understanding your core values is the first step in setting meaningful goals. Use these values as a guide to create a life that feels authentic and fulfilling.</p>
                    </div>
                    <button onClick={onBack} className="exercise-nav-button" style={{marginTop: '2rem'}}>
                        Done
                    </button>
                 </main>
            </div>
        </div>
    );
  }

  const currentCard = deck[currentIndex];

  return (
    <div className="page-container">
        {showTutorial && (
            <div className="values-tutorial-overlay" onClick={handleCloseTutorial}>
                <div className="tutorial-content" onClick={e => e.stopPropagation()}>
                    <div className="tutorial-annotation tutorial-restore">
                        <p>Changed your mind? Click the <span className="plus-icon-imitation">+</span> icon on a sorted card to move it back to the deck.</p>
                    </div>
                    <div className="tutorial-annotation tutorial-discard">
                        <p>Click or tap the <strong>left side</strong> of the card to discard it.</p>
                    </div>
                    <div className="tutorial-annotation tutorial-keep">
                        <p>Click or tap the <strong>right side</strong> of the card to keep it.</p>
                    </div>
                    <button onClick={handleCloseTutorial} className="tutorial-close-button">
                        Got It!
                    </button>
                </div>
            </div>
        )}
        <div className="content-with-side-button">
            <div className="side-button-wrapper">
                 <button onClick={onBack} className="home-button" aria-label="Go back to home">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                   <span>Home</span>
                 </button>
            </div>
            <main className="values-exercise-container">
                <div className="page-header-text">
                  <h1 className="app-title orange-underline">{title}</h1>
                  <p className="app-subtitle">{instruction}</p>
                </div>

                <div className="values-piles-tabs">
                    <div className="values-tab-buttons">
                        <button className={`tab-button ${activeTab === 'discard' ? 'active' : ''}`} onClick={() => setActiveTab('discard')}>
                            Discard ({discardPile.length})
                        </button>
                        <button className={`tab-button ${activeTab === 'keep' ? 'active' : ''}`} onClick={() => setActiveTab('keep')}>
                            Keep ({keepPile.length})
                        </button>
                    </div>
                    <div className="values-tab-content">
                        {activeTab === 'keep' && (
                            <>
                                {keepPile.length === 0 && <p className="empty-pile-message">Cards you keep will appear here.</p>}
                                <div className="pile-grid">
                                    {keepPile.map(card => (
                                        <div key={card.title} className="pile-card keep">
                                            <span>{card.title}</span>
                                            <button onClick={() => handleUndoKeep(card)} className="restore-button" aria-label={`Move ${card.title} back to deck`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {activeTab === 'discard' && (
                             <>
                                {discardPile.length === 0 && <p className="empty-pile-message">Cards you discard will appear here.</p>}
                                <div className="pile-grid">
                                    {discardPile.map(card => (
                                        <div key={card.title} className="pile-card discard">
                                            <span>{card.title}</span>
                                            <button onClick={() => handleRestoreDiscardedCard(card)} className="restore-button" aria-label={`Restore ${card.title}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="values-card-stack">
                  {isRoundComplete ? (
                    <div className="value-card placeholder-card">
                        <h3>{isKeepLimitReached ? 'Limit Reached!' : 'Round Complete!'}</h3>
                        <p>{keepPile.length} value{keepPile.length !== 1 && 's'} kept.</p>
                        {showNextButton && <p>Press Next to continue.</p>}
                    </div>
                  ) : (
                    <div key={currentIndex} className={`value-card ${animation}`}>
                        <div className="card-content">
                            <h2>{currentCard.title}</h2>
                            <p>{currentCard.description}</p>
                        </div>
                        <div className="card-sort-overlay">
                            <div className="card-sort-area left" onClick={() => handleSort('discard')}></div>
                            <div className={`card-sort-area right ${isKeepLimitReached ? 'disabled' : ''}`} onClick={() => !isKeepLimitReached && handleSort('keep')}></div>
                        </div>
                    </div>
                  )}
                </div>
                
                <div className="values-controls">
                    <span className="card-counter">{isRoundComplete ? `Done` : `${currentIndex + 1} / ${deck.length}`}</span>
                </div>

                {showNextButton && (
                  <button onClick={nextStep} className="exercise-nav-button">
                    {nextButtonText}
                  </button>
                )}
            </main>
        </div>
    </div>
  );
};


// --- Media Page Component ---
const MediaPage = ({ onBack }) => {
  const mediaCards = [
    { 
      title: 'Videos', 
      link: 'https://www.youtube.com/playlist?list=PL1MHtsikpzrnje9hJbwVRhYry28G4jQz2',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="card-icon"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg> 
    },
    { 
      title: 'Podcast', 
      subtitle: 'powered by notebook lm',
      link: 'https://www.youtube.com/playlist?list=PL1MHtsikpzrlXgHVnVD2txdA2weD0xDFX',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="card-icon"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
    },
  ];

  return (
    <div className="page-container">
      <div className="content-with-side-button">
        <div className="side-button-wrapper">
          <button onClick={onBack} className="home-button" aria-label="Go back to home">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span>Home</span>
          </button>
        </div>
        <main>
          <div className="page-header-text">
            <h1 className="app-title">Media Resources</h1>
            <p className="app-subtitle">Videos and podcasts to support your journey.</p>
          </div>
          <div className="card-grid">
            {mediaCards.map((card) => (
              <a
                key={card.title}
                href={card.link}
                target="_blank"
                rel="noopener noreferrer"
                className="card"
                aria-label={card.title}
              >
                {card.icon}
                <h2 className="card-title">{card.title}</h2>
                {card.subtitle && <p className="card-subtitle">{card.subtitle}</p>}
              </a>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

// --- 5-4-3-2-1 Grounding Exercise Page Component ---
const FiveFourThreeTwoOnePage = ({ onBack, onHome }) => {
  const steps = [
    "Name 5 things you can see.",
    "Name 4 things you can feel.",
    "Name 3 things you can hear.",
    "Name 2 things you can smell.",
    "Name 1 thing you can taste.",
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const [randomQuote, setRandomQuote] = useState(null);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      // Last step, show quote
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setRandomQuote(quotes[randomIndex]);
      setStepIndex(stepIndex + 1);

      trackEvent('complete_exercise', 'Grounding', '5-4-3-2-1 Method');

      // --- Log completion event ---
      try {
        const history = JSON.parse(localStorage.getItem('groundingHistory') || '[]');
        history.unshift({ technique: 'The 5-4-3-2-1 Method', date: new Date().toISOString() });
        localStorage.setItem('groundingHistory', JSON.stringify(history));
      } catch (error) {
        console.error("Could not save grounding history:", error);
      }
    }
  };
  
  const isFinished = stepIndex >= steps.length;

  return (
    <div className="page-container">
        <div className="content-with-side-button">
            <div className="side-button-wrapper">
              <button onClick={onHome} className="home-button" aria-label="Go back to home">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                 <span>Home</span>
              </button>
            </div>
            <main className="exercise-page-container">
              <div className="page-header-text">
                <h1 className="app-title">The 5-4-3-2-1 Method</h1>
              </div>
              <div className="exercise-card">
                  {!isFinished ? (
                      <p className="exercise-instruction">{steps[stepIndex]}</p>
                  ) : (
                      <div className="exercise-quote">
                          <p>"{randomQuote?.quote}"</p>
                          <span>- {randomQuote?.author}</span>
                      </div>
                  )}
              </div>
              <button onClick={isFinished ? onBack : handleNext} className="exercise-nav-button">
                  {isFinished ? 'Finish' : 'Next'}
              </button>
            </main>
        </div>
    </div>
  );
};


// --- Breathing Exercise Page Component ---
const BreathingExercisePage = ({ onBack, onHome }) => {
  const breathOptions = [5, 10, 15];
  const [selectedBreaths, setSelectedBreaths] = useState(5);
  const [isActive, setIsActive] = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completionQuote, setCompletionQuote] = useState(null);
  const [breathPhase, setBreathPhase] = useState(''); // 'Inhale' or 'Exhale'

  useEffect(() => {
    let cycleTimer;
    let phaseTimer;

    if (isActive) {
      const runCycle = (count) => {
        if (count >= selectedBreaths) {
          setIsActive(false);
          setIsAnimating(false);
          const randomIndex = Math.floor(Math.random() * quotes.length);
          setCompletionQuote(quotes[randomIndex]);
          setBreathPhase('');
          trackEvent('complete_exercise', 'Grounding', 'Breathing', selectedBreaths);
           // --- Log completion event ---
          try {
            const history = JSON.parse(localStorage.getItem('groundingHistory') || '[]');
            history.unshift({ technique: 'Breathing', date: new Date().toISOString() });
            localStorage.setItem('groundingHistory', JSON.stringify(history));
          } catch (error) {
              console.error("Could not save grounding history:", error);
          }
          return;
        }

        setBreathCount(count + 1);
        setIsAnimating(true);
        setBreathPhase('Inhale');

        phaseTimer = setTimeout(() => {
          setBreathPhase('Exhale');
        }, 4000); // Inhale duration is 4s

        cycleTimer = setTimeout(() => {
          runCycle(count + 1);
        }, 10000); // Total cycle is 10s
      };
      runCycle(0);
    }

    return () => {
      clearTimeout(cycleTimer);
      clearTimeout(phaseTimer);
    };
  }, [isActive, selectedBreaths]);

  const handleStartStop = () => {
    if (isActive) { // If currently running, stop it
      setIsActive(false);
      setBreathCount(0);
      setIsAnimating(false);
      setCompletionQuote(null);
      setBreathPhase('');
    } else { // If stopped, start it
      setCompletionQuote(null); // Reset quote before starting
      setBreathCount(0);
      setIsActive(true);
    }
  };

  const handleSelectBreaths = (num) => {
    if (!isActive) { // only allow change if not active
      setSelectedBreaths(num);
      setCompletionQuote(null); // Reset if selection changes
    }
  }

  const isFinished = completionQuote !== null;

  return (
    <div className="page-container">
       <div className="content-with-side-button">
            <div className="side-button-wrapper">
              <button onClick={onHome} className="home-button" aria-label="Go back to home">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                 <span>Home</span>
              </button>
            </div>
            <main className="exercise-page-container">
              <div className="page-header-text">
                <h1 className="app-title">Breathing Exercise</h1>
              </div>
              <div className="breath-choice-container">
                {breathOptions.map(num => (
                    <button 
                        key={num} 
                        className={`breath-choice-button ${selectedBreaths === num ? 'selected' : ''}`}
                        onClick={() => handleSelectBreaths(num)}
                        disabled={isActive}
                    >
                        {num} Breaths
                    </button>
                ))}
              </div>

              <div className={`breathing-circle-container ${isAnimating ? 'animating' : ''}`}>
                 <div className="breathing-circle">
                     {isFinished ? (
                         <div className="exercise-quote breathing-quote">
                             <p>"{completionQuote.quote}"</p>
                             <span>- {completionQuote.author}</span>
                         </div>
                     ) : isActive ? (
                         <>
                            <div className="breathing-phase">{breathPhase}</div>
                            <div className="breathing-count-display">{breathCount}</div>
                         </>
                     ) : (
                         <div className="breathing-text">Ready to begin?</div>
                     )}
                 </div>
              </div>

              <button onClick={isFinished ? onBack : handleStartStop} className="exercise-nav-button">
                  {isFinished ? 'Finish' : (isActive ? 'Stop' : 'Start')}
              </button>
            </main>
        </div>
    </div>
  );
};


// --- Guided Audio Grounding Exercise Page Component ---
const GuidedAudioPage = ({ onBack, onHome }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);
    const progressBarRef = useRef(null);

    const handlePlayPause = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        setDuration(audioRef.current.duration);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setIsFinished(true);
        trackEvent('complete_exercise', 'Grounding', 'Guided Audio');
        try {
            const history = JSON.parse(localStorage.getItem('groundingHistory') || '[]');
            history.unshift({ technique: 'Guided Audio', date: new Date().toISOString() });
            localStorage.setItem('groundingHistory', JSON.stringify(history));
        } catch (error) {
            console.error("Could not save grounding history:", error);
        }
    };
    
    const handleProgressScrub = (e) => {
        const progressBar = progressBarRef.current;
        const rect = progressBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const newTime = (x / progressBar.offsetWidth) * duration;
        if (!isNaN(newTime)) {
          audioRef.current.currentTime = newTime;
          setCurrentTime(newTime);
        }
    };

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="page-container">
            <audio
                ref={audioRef}
                src="https://www.uclahealth.org/marc/mpeg/01_Breathing_Meditation.mp3"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />
            <div className="content-with-side-button">
                <div className="side-button-wrapper">
                    <button onClick={onHome} className="home-button" aria-label="Go back to home">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        <span>Home</span>
                    </button>
                </div>
                <main className="exercise-page-container">
                    <div className="page-header-text">
                        <h1 className="app-title">Guided Grounding</h1>
                        <p className="app-subtitle">Close your eyes, relax, and follow the voice.</p>
                    </div>
                    <div className="audio-player-container">
                        <div className="audio-visual-placeholder">
                           <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 18a4.6 4.4 0 0 1 0-9h0a5 5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7Z"/><path d="M12 12v3"/></svg>
                        </div>
                        
                        <div className="audio-progress-bar-container" ref={progressBarRef} onClick={handleProgressScrub}>
                            <div className="audio-progress-bar-filled" style={{ width: `${progressPercentage}%` }}></div>
                        </div>

                        <div className="audio-time-display">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>

                        <div className="audio-controls">
                            <button className={`play-pause-button ${isPlaying ? 'playing' : ''}`} onClick={handlePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
                                <svg className="play-icon" xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"></path></svg>
                                <svg className="pause-icon" xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
                            </button>
                        </div>
                         {isFinished && <p className="completion-text">Exercise complete. Well done.</p>}
                    </div>
                    <button onClick={isFinished ? onBack : onHome} className="exercise-nav-button">
                        {isFinished ? 'Finish' : 'Stop & Go Home'}
                    </button>
                </main>
            </div>
        </div>
    );
};

// --- Known Bugs Page Component ---
const KnownBugsPage = ({ onBack }) => {
  const bugs = [
    { 
      title: "Sobriety Clock Inaccuracy",
      description: "The sobriety clock may briefly show an incorrect time when the app is first opened before correcting itself. This is due to initialization timing."
    },
    {
      title: "Feelings Wheel Animation Lag",
      description: "On some older devices or browsers, the animation for the feelings wheel may appear slow or choppy, especially on the first load."
    },
    {
      title: "Goal Progress Not Refreshing Instantly",
      description: "After updating a goal's progress, the 'Your Journey' summary page may not reflect the new average progress until the app is re-opened."
    },
    {
      title: "Offline Data Sync",
      description: "When using the app offline for an extended period, new data might not sync correctly with the cache immediately upon reconnecting."
    }
  ];

  return (
    <div className="page-container">
      <div className="content-with-side-button">
        <div className="side-button-wrapper">
          <button onClick={onBack} className="home-button" aria-label="Go back to home">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
             <span>Home</span>
          </button>
        </div>
        <main>
          <div className="page-header-text">
            <h1 className="app-title">Known Bugs</h1>
            <p className="app-subtitle">A list of issues we're aware of and working on.</p>
          </div>
          <div className="card bug-list-container">
            <ul className="bug-list">
              {bugs.map((bug, index) => (
                <li key={index} className="bug-item">
                  <h3 className="bug-title">{bug.title}</h3>
                  <p className="bug-description">{bug.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- Data Privacy Page Component ---
const DataPrivacyPage = ({ onBack }) => {
  return (
    <div className="page-container">
      <div className="content-with-side-button">
        <div className="side-button-wrapper">
          <button onClick={onBack} className="home-button" aria-label="Go back to home">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
             <span>Home</span>
          </button>
        </div>
        <main>
          <div className="page-header-text">
            <h1 className="app-title">Data Privacy & Storage</h1>
          </div>
          <div className="card" style={{ textAlign: 'left', alignItems: 'flex-start', gap: '1.5rem' }}>
            <p style={{ lineHeight: 1.7 }}>
              Your data, including journal entries and goals, is saved directly in your browser's local storage. This means your information is private to you and is not sent to any server.
            </p>
            <p style={{ lineHeight: 1.7, fontWeight: 600, color: 'var(--orange-accent)' }}>
              To ensure your data persists, it is highly recommended to use the same browser and device for this application. Clearing your browser's cache or data may permanently delete all your saved information.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- Profile Page Component ---
const ProfilePage = ({ onBack }) => {
    const [profile, setProfile] = useState({ username: '', gender: '', dob: '' });
    const [savedMessage, setSavedMessage] = useState('');

    useEffect(() => {
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
            try {
                const parsedProfile = JSON.parse(storedProfile);
                setProfile({
                    username: parsedProfile.username || '',
                    gender: parsedProfile.gender || '',
                    dob: parsedProfile.dob || ''
                });
            } catch (e) {
                console.error("Failed to parse user profile", e);
            }
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        try {
            // Ensure username isn't saved as empty
            if (!profile.username || profile.username.trim() === '') {
                 setSavedMessage('Username cannot be empty.');
                 setTimeout(() => setSavedMessage(''), 3000);
                 return;
            }
            localStorage.setItem('userProfile', JSON.stringify(profile));
            setSavedMessage('Profile updated successfully!');
            setTimeout(() => setSavedMessage(''), 3000);
            
            // Force a re-render of the app to reflect username change, or use a more complex state management
            // For now, simple reload on back might be easiest if name changes
        } catch (error) {
            console.error("Failed to save profile", error);
            setSavedMessage('Error saving profile.');
            setTimeout(() => setSavedMessage(''), 3000);
        }
    };

    return (
        <div className="page-container">
            <div className="content-with-side-button">
                <div className="side-button-wrapper">
                    <button onClick={onBack} className="home-button" aria-label="Go back to home">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        <span>Home</span>
                    </button>
                </div>
                <main>
                    <div className="page-header-text">
                        <h1 className="app-title">Edit Profile</h1>
                        <p className="app-subtitle">Update your personal information.</p>
                    </div>
                    <form className="profile-form card" onSubmit={handleSave}>
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={profile.username}
                                onChange={handleChange}
                                placeholder="Enter your username"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="gender">Gender</label>
                            <select id="gender" name="gender" value={profile.gender} onChange={handleChange}>
                                <option value="">Select...</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="non-binary">Non-binary</option>
                                <option value="other">Other</option>
                                <option value="prefer-not-to-say">Prefer not to say</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="dob">Date of Birth</label>
                            <input
                                id="dob"
                                name="dob"
                                type="date"
                                value={profile.dob}
                                onChange={handleChange}
                                style={{colorScheme: 'dark'}}
                            />
                        </div>
                        <button type="submit" className="log-button">Save Changes</button>
                        {savedMessage && <div className="confirmation-message" style={{opacity: 1, animation: 'none'}}>{savedMessage}</div>}
                    </form>
                </main>
            </div>
        </div>
    );
};


// --- Grounding Page Component ---
const GroundingPage = ({ onBack, onNavigate }) => {
  const groundingCards = [
    { 
      title: 'The 5-4-3-2-1 Method', 
      enabled: true,
      page: 'five-four-three-two-one',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="card-icon"><path d="M7 20h10" /><path d="M10 20v-6l-2-2a3 3 0 0 1-2-2.8V8.2a3 3 0 0 1 2-2.8l2-1.2a3 3 0 0 1 3.2 0l2 1.2a3 3 0 0 1 2 2.8v1a3 3 0 0 1-2 2.8l-2 2v6" /></svg>
    },
    { 
      title: 'Breathing', 
      enabled: true, 
      page: 'breathing-exercise',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="card-icon"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>
    },
    {
      title: 'Guided Audio',
      enabled: true,
      page: 'guided-audio',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="card-icon"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
    }
  ];

  return (
    <div className="page-container">
      <div className="content-with-side-button">
        <div className="side-button-wrapper">
            <button onClick={onBack} className="home-button" aria-label="Go back to home">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
               <span>Home</span>
            </button>
        </div>
        <main>
           <div className="page-header-text">
              <h1 className="app-title">Grounding Techniques</h1>
              <p className="app-subtitle">Tools to help you anchor in the present moment.</p>
           </div>
           <div className="card-grid">
            {groundingCards.map((card) => (
                <button
                key={card.title}
                className={`card ${!card.enabled ? 'disabled' : ''}`}
                disabled={!card.enabled}
                onClick={() => card.enabled && onNavigate(card.page)}
                aria-label={card.title}
                >
                {card.icon}
                <h2 className="card-title">{card.title}</h2>
                </button>
            ))}
           </div>
        </main>
      </div>
    </div>
  );
};

// --- AI Summary Modal Component ---
const AISummaryModal = ({ onClose }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const generateSummary = async () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                const journalHistoryRaw = localStorage.getItem('journalHistory');
                const journalHistory = journalHistoryRaw ? JSON.parse(journalHistoryRaw) : [];
                
                const userProfileRaw = localStorage.getItem('userProfile');
                const username = userProfileRaw ? JSON.parse(userProfileRaw).username : 'there';

                if (journalHistory.length < 3) {
                    setError("You need at least 3 journal entries to generate a summary.");
                    setIsLoading(false);
                    return;
                }

                // Take the last 30 entries for brevity
                const recentEntries = journalHistory.slice(0, 30);
                
                const formattedEntries = recentEntries.map(entry => {
                    const displayAmount = entry.amountValue !== undefined 
                        ? `${entry.amountValue} ${entry.amountUnit || ''}` 
                        : entry.amount;
                    return `Feeling: ${entry.feeling}, Day: ${entry.day}, Substance: ${entry.substance}, Amount: ${displayAmount.trim()}, Location: ${entry.location || 'N/A'}`;
                }).join('\n');

                const prompt = `You are a compassionate and insightful journal assistant. Your goal is to help me understand myself better by analyzing my recent journal entries. Do not provide medical advice. My name is ${username}.

Here are my recent journal entries:
${formattedEntries}

Based on these entries, please provide a brief, insightful summary in 2-3 short paragraphs. Look for patterns related to my feelings, substance use, and locations. Highlight any potential connections you notice in a supportive and gentle tone. Use markdown for formatting, like bolding key insights.`;
                
                trackEvent('generate_ai_summary', 'AI Features', 'Journal Summary');
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });

                setSummary(response.text);

            } catch (err) {
                console.error("Error generating summary:", err);
                setError("Sorry, an error occurred while generating your summary. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        generateSummary();
    }, []);

    const renderFormattedSummary = (text) => {
        // Simple markdown parser for bold (**text**)
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .split('\n').map((paragraph, index) => (
                paragraph.trim() ? <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} /> : null
            ));
    };

    return (
        <div className="confirm-modal-overlay" onClick={onClose}>
            <div className="confirm-modal-content card summary-modal-content" onClick={e => e.stopPropagation()}>
                <h3>Your AI-Powered Summary</h3>
                {isLoading && (
                    <div className="summary-loading">
                        <div className="spinner"></div>
                        <p>Analyzing your journal entries...</p>
                    </div>
                )}
                {error && <p className="pin-error" style={{height: 'auto'}}>{error}</p>}
                {!isLoading && !error && (
                    <div className="summary-text">
                        {renderFormattedSummary(summary)}
                    </div>
                )}
                <div className="confirm-modal-actions" style={{justifyContent: 'center'}}>
                    <button onClick={onClose} className="modal-button" style={{backgroundColor: 'var(--orange-accent)', color: 'var(--bg-dark)', flex: 'none', minWidth: '120px'}}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Your Journey Page Component ---
const JourneyPage = ({ onBack, onNavigate }) => {
    const [coreValues, setCoreValues] = useState([]);
    const [trackerStats, setTrackerStats] = useState(null);
    const [groundingStats, setGroundingStats] = useState(null);
    const [goalStats, setGoalStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

    useEffect(() => {
        // Load Core Values
        try {
            const savedValues = localStorage.getItem('coreValues');
            if (savedValues) {
                setCoreValues(JSON.parse(savedValues));
            }
        } catch (error) {
            console.error("Could not parse core values from localStorage", error);
        }

        // Process Tracker Data
        try {
            const savedHistory = localStorage.getItem('journalHistory');
            const history = savedHistory ? JSON.parse(savedHistory) : [];
            
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

            const last7DaysEntries = history.filter(entry => {
                const entryDate = new Date(entry.entryTimestamp || entry.id);
                return entryDate >= sevenDaysAgo;
            });
            
            const hasNewDataFormat = last7DaysEntries.some(e => e.amountValue !== undefined);

            if (last7DaysEntries.length > 0) {
                if (hasNewDataFormat) {
                    const substanceCounts = last7DaysEntries.reduce((acc, entry) => {
                        acc[entry.substance] = (acc[entry.substance] || 0) + 1;
                        return acc;
                    }, {});
                    const mostFrequentSubstance = Object.keys(substanceCounts).reduce((a, b) => substanceCounts[a] > substanceCounts[b] ? a : b);

                    const last7MostFrequent = last7DaysEntries.filter(e => e.substance === mostFrequentSubstance);
                    
                    let mostCommonUnit = 'units';
                    const unitCounts = last7MostFrequent.filter(e => e.amountUnit).reduce((acc, entry) => {
                        const unit = entry.amountUnit.trim();
                        if (unit) acc[unit] = (acc[unit] || 0) + 1;
                        return acc;
                    }, {});

                    if (Object.keys(unitCounts).length > 0) {
                        mostCommonUnit = Object.keys(unitCounts).reduce((a, b) => unitCounts[a] > unitCounts[b] ? a : b);
                    }
                    
                    const totalAmountLast7Days = last7MostFrequent.reduce((sum, entry) => sum + (entry.amountValue || 0), 0);
                    const avgDailyAmountLast7Days = totalAmountLast7Days / 7;

                    const prev7DaysEntries = history.filter(entry => {
                        const entryDate = new Date(entry.entryTimestamp || entry.id);
                        return entryDate < sevenDaysAgo && entryDate >= fourteenDaysAgo && entry.substance === mostFrequentSubstance;
                    });

                    const totalAmountPrev7Days = prev7DaysEntries.reduce((sum, entry) => sum + (entry.amountValue || 0), 0);
                    const avgDailyAmountPrev7Days = totalAmountPrev7Days / 7;

                    let change = null;
                    if (avgDailyAmountPrev7Days > 0) {
                        change = ((avgDailyAmountLast7Days - avgDailyAmountPrev7Days) / avgDailyAmountPrev7Days) * 100;
                    }

                    setTrackerStats({
                        mostFrequentSubstance,
                        mostCommonUnit,
                        totalAmountLast7Days,
                        avgDailyAmountLast7Days,
                        change,
                    });
                }
            }
        } catch (error) {
            console.error("Could not process tracker data", error);
        }

        // Process Grounding Data
        try {
            const savedHistory = localStorage.getItem('groundingHistory');
            const history = savedHistory ? JSON.parse(savedHistory) : [];
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const last7DaysCount = history.filter(item => new Date(item.date) >= sevenDaysAgo).length;

            if (history.length > 0) {
                setGroundingStats({
                    totalCount: history.length,
                    last7DaysCount: last7DaysCount,
                    lastUsed: new Date(history[0].date).toLocaleDateString(),
                });
            }
        } catch (error) {
            console.error("Could not process grounding data", error);
        }
        
        // Process Goal Data
        try {
            const savedGoals = localStorage.getItem('goals');
            const goals = savedGoals ? JSON.parse(savedGoals) : [];
            const activeGoals = goals.filter(g => !g.completed);

            if (activeGoals.length > 0) {
                const totalProgress = activeGoals.reduce((sum, goal) => {
                    const progress = (goal.currentValue / goal.targetValue) * 100;
                    return sum + Math.min(progress, 100); // Cap progress at 100%
                }, 0);
                const averageProgress = totalProgress / activeGoals.length;
                setGoalStats({
                    activeGoalsCount: activeGoals.length,
                    averageProgress: Math.round(averageProgress),
                });
            }
        } catch (error) {
            console.error("Could not process goal data", error);
        }

        setIsLoading(false);
    }, []);

    if (isLoading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }
    
    return (
        <div className="page-container">
            <div className="content-with-side-button">
                <div className="side-button-wrapper">
                    <button onClick={onBack} className="home-button" aria-label="Go back to home">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                       <span>Home</span>
                    </button>
                </div>
                <main className="journey-content">
                    <div className="page-header-text">
                        <h1 className="app-title">Your Journey</h1>
                        <p className="app-subtitle">An overview of your progress and insights.</p>
                    </div>

                    <div className="card-grid journey-grid">
                        <SobrietyClock size="small" onNavigate={onNavigate} />
                        <div className="card summary-card">
                            <h2 className="summary-card-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                <span>Core Values</span>
                            </h2>
                            {coreValues.length > 0 ? (
                                <div className="values-summary-grid">
                                    {coreValues.map(value => <span key={value.title} className="value-chip">{value.title}</span>)}
                                </div>
                            ) : (
                                <div className="no-data-placeholder">
                                    <p>You haven't identified your core values yet. Discovering them can provide a compass for your journey.</p>
                                    <button onClick={() => onNavigate('know-yourself', { initialStep: 'deck-selection' })} className="exercise-nav-button">
                                        Find Your Values
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="card summary-card">
                            <h2 className="summary-card-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                                <span>Tracker Insights</span>
                            </h2>
                            <p className="summary-card-subtitle">Last 7 Days vs. Previous 7 Days</p>
                            {trackerStats ? (
                                <div className="stats-container">
                                    <div className="stat-item">
                                        <span className="stat-label">Most Frequent</span>
                                        <span className="stat-value">{trackerStats.mostFrequentSubstance}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Total Amount</span>
                                        <span className="stat-value">{trackerStats.totalAmountLast7Days.toFixed(1)} {trackerStats.mostCommonUnit}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Daily Average</span>
                                        <span className="stat-value">{trackerStats.avgDailyAmountLast7Days.toFixed(1)} {trackerStats.mostCommonUnit}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Change</span>
                                        <span className={`stat-value ${trackerStats.change > 0 ? 'negative' : 'positive'}`}>
                                            {trackerStats.change !== null ? `${trackerStats.change > 0 ? '+' : ''}${trackerStats.change.toFixed(0)}%` : 'N/A'}
                                        </span>
                                    </div>
                                    <button className="ai-cta" onClick={() => setIsSummaryModalOpen(true)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                                        <span>Generate AI Summary</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="no-data-placeholder">
                                    <p>Not enough data for insights. Log your feelings and use for at least a week to see patterns.</p>
                                    <button onClick={() => onNavigate('tracker')} className="exercise-nav-button">
                                        Go to Tracker
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="card summary-card">
                            <h2 className="summary-card-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-2.1 2.1-2.1 5.6 0 7.7 2.1 2.1 5.6 2.1 7.7 0l1.4-1.4c.5-.5.5-1.2 0-1.7l-5.3-5.3c-.5-.5-1.2-.5-1.7 0l-2.1 2.1z"/><path d="m19.5 2.5 2-2"/><path d="m16.5 5.5 2-2"/><path d="m13.5 8.5 2-2"/><path d="M19 10c-2.8 2.8-5.6 4.2-8.4 4.2-2.8 0-5.6-1.4-8.4-4.2"/></svg>
                                <span>Grounding Exercises</span>
                            </h2>
                            {groundingStats ? (
                                <div className="stats-container">
                                    <div className="stat-item">
                                        <span className="stat-label">Total Completed</span>
                                        <span className="stat-value">{groundingStats.totalCount}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Last 7 Days</span>
                                        <span className="stat-value">{groundingStats.last7DaysCount}</span>
                                    </div>
                                     <div className="stat-item">
                                        <span className="stat-label">Last Used</span>
                                        <span className="stat-value">{groundingStats.lastUsed}</span>
                                    </div>
                                </div>
                            ) : (
                               <div className="no-data-placeholder">
                                    <p>Grounding exercises help in moments of stress. Try one to start building your history.</p>
                                    <button onClick={() => onNavigate('grounding')} className="exercise-nav-button">
                                        Explore Techniques
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="card summary-card">
                             <h2 className="summary-card-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                                <span>Goals</span>
                            </h2>
                             {goalStats ? (
                                <div className="stats-container">
                                    <div className="stat-item">
                                        <span className="stat-label">Active Goals</span>
                                        <span className="stat-value">{goalStats.activeGoalsCount}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Average Progress</span>
                                        <span className="stat-value">{goalStats.averageProgress}%</span>
                                    </div>
                                    <button onClick={() => onNavigate('goals')} className="summary-card-cta" style={{width: '100%', textAlign: 'center', marginTop: '1rem'}}>
                                        View & Update Goals
                                    </button>
                                </div>
                            ) : (
                               <div className="no-data-placeholder">
                                    <p>Setting goals aligned with your values can be a powerful driver for change.</p>
                                    <button onClick={() => onNavigate('goals')} className="exercise-nav-button">
                                        Set a New Goal
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
             {isSummaryModalOpen && <AISummaryModal onClose={() => setIsSummaryModalOpen(false)} />}
        </div>
    );
};

// --- Goals Page Component ---
const GoalsPage = ({ onBack }) => {
    const [goals, setGoals] = useState([]);
    const [view, setView] = useState('dashboard'); // 'dashboard', 'create'
    const [activeTab, setActiveTab] = useState('active'); // 'active', 'completed'
    const [logProgressGoal, setLogProgressGoal] = useState(null);
    const [logValue, setLogValue] = useState('');

    useEffect(() => {
        try {
            const savedGoals = localStorage.getItem('goals');
            setGoals(savedGoals ? JSON.parse(savedGoals) : []);
        } catch (e) { console.error("Could not load goals", e); }
    }, []);

    const saveGoals = (newGoals) => {
        setGoals(newGoals);
        try {
            localStorage.setItem('goals', JSON.stringify(newGoals));
        } catch (e) { console.error("Could not save goals", e); }
    };

    const handleCreateGoal = (goalData) => {
        const newGoal = {
            id: Date.now(),
            ...goalData,
            createdAt: new Date().toISOString(),
            currentValue: 0,
            completed: false,
            completedAt: null,
        };
        saveGoals([newGoal, ...goals]);
        setView('dashboard');
        trackEvent('create_goal', 'Goals', goalData.title);
    };
    
    const handleLogProgress = () => {
        const updatedGoals = goals.map(g => {
            if (g.id === logProgressGoal.id) {
                const newValue = g.currentValue + parseFloat(logValue);
                return { ...g, currentValue: Math.min(newValue, g.targetValue) };
            }
            return g;
        });
        saveGoals(updatedGoals);
        setLogProgressGoal(null);
        setLogValue('');
        trackEvent('log_progress', 'Goals', logProgressGoal.title, parseFloat(logValue));
    };

    const handleCompleteGoal = (goalId) => {
        const updatedGoals = goals.map(g => {
            if (g.id === goalId) {
                return { ...g, completed: true, completedAt: new Date().toISOString(), currentValue: g.targetValue };
            }
            return g;
        });
        saveGoals(updatedGoals);
        trackEvent('complete_goal', 'Goals', goals.find(g => g.id === goalId).title);
    };

    const CreateGoalForm = () => {
        const [title, setTitle] = useState('');
        const [targetValue, setTargetValue] = useState('');
        const [unit, setUnit] = useState('');
        const [deadline, setDeadline] = useState('');
        const [reminderEnabled, setReminderEnabled] = useState(false);
        const [reminderTime, setReminderTime] = useState('19:00');

        const isFormValid = title.trim() && targetValue.trim() && unit.trim();

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!isFormValid) return;
            handleCreateGoal({ title, targetValue: parseFloat(targetValue), unit, deadline, reminder: { enabled: reminderEnabled, time: reminderTime } });
        };

        return (
            <form className="create-goal-form" onSubmit={handleSubmit}>
                <div className="card form-section">
                    <h3 className="form-section-title">
                        <span>1</span> What is your goal?
                    </h3>
                    <p className="form-section-description">Make it specific. Instead of "exercise more," try "run 10km a week."</p>
                    <div className="form-group">
                        <label htmlFor="goal-title">Goal Title</label>
                        <input id="goal-title" type="text" placeholder="e.g., Run 10km per week" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
                    </div>
                </div>

                <div className="card form-section">
                    <h3 className="form-section-title">
                        <span>2</span> How will you measure it?
                    </h3>
                    <p className="form-section-description">This should be a number. If your goal is to run 10km, the target is 10 and the unit is "km".</p>
                    <div className="measurable-inputs">
                        <div className="form-group">
                            <label htmlFor="goal-target">Target</label>
                            <input id="goal-target" type="number" placeholder="e.g., 10" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="goal-unit">Unit</label>
                            <input id="goal-unit" type="text" placeholder="e.g., km" value={unit} onChange={e => setUnit(e.target.value)} />
                        </div>
                    </div>
                </div>
                
                 <div className="card form-section">
                    <h3 className="form-section-title">
                        <span>3</span> What is the deadline?
                    </h3>
                     <p className="form-section-description">Setting a target date helps create urgency. This is optional but recommended.</p>
                     <div className="form-group">
                        <label htmlFor="goal-deadline">Target Date (Optional)</label>
                        <input id="goal-deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{colorScheme: 'dark'}}/>
                    </div>
                </div>

                <div className="card form-section reminder-section">
                    <h3 className="form-section-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        <span>Set a Reminder</span>
                    </h3>
                    <div className="reminder-toggle">
                        <label htmlFor="goal-reminder-enabled">Remind me to log my progress</label>
                        <input id="goal-reminder-enabled" type="checkbox" checked={reminderEnabled} onChange={e => setReminderEnabled(e.target.checked)} />
                    </div>
                    {reminderEnabled && (
                        <div className="reminder-time-input">
                            <label htmlFor="goal-reminder-time">Reminder time:</label>
                            <input id="goal-reminder-time" type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} style={{colorScheme: 'dark'}} />
                        </div>
                    )}
                </div>

                <button type="submit" className="log-button" disabled={!isFormValid}>Create Goal</button>
            </form>
        );
    };

    const activeGoals = goals.filter(g => !g.completed);
    const completedGoals = goals.filter(g => g.completed);
    const goalsToShow = activeTab === 'active' ? activeGoals : completedGoals;

    return (
        <div className="page-container">
            {logProgressGoal && (
                 <div className="confirm-modal-overlay" onClick={() => setLogProgressGoal(null)}>
                    <div className="confirm-modal-content card" onClick={e => e.stopPropagation()}>
                        <h3>Log Progress</h3>
                        <p className="log-progress-goal-title">{logProgressGoal.title}</p>
                        
                        <div className="log-progress-form">
                            <label htmlFor="log-value">How many {logProgressGoal.unit} did you complete?</label>
                            <input
                                id="log-value"
                                type="number"
                                value={logValue}
                                onChange={(e) => setLogValue(e.target.value)}
                                autoFocus
                            />
                        </div>
                        
                        <div className="confirm-modal-actions" style={{marginTop: '1.5rem'}}>
                            <button onClick={() => setLogProgressGoal(null)} className="modal-button cancel">Cancel</button>
                            <button onClick={handleLogProgress} className="modal-button confirm" style={{backgroundColor: 'var(--accent-teal)'}} disabled={!logValue || parseFloat(logValue) <= 0}>
                                Save Progress
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="content-with-side-button">
                <div className="side-button-wrapper">
                    <button onClick={view === 'create' ? () => setView('dashboard') : onBack} className="home-button" aria-label="Go back">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>
                         <span>{view === 'create' ? 'Back to Goals' : 'Back'}</span>
                    </button>
                </div>
                <main className="goals-dashboard">
                    <div className="page-header-text">
                        <h1 className="app-title">{view === 'create' ? 'Create a New Goal' : 'Your Goals'}</h1>
                        <p className="app-subtitle">{view === 'create' ? 'Follow the steps to set a SMART goal.' : 'Track your progress and celebrate your achievements.'}</p>
                    </div>

                    {view === 'dashboard' && (
                        <>
                            <button className="create-goal-button" onClick={() => setView('create')}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                <span>Set a New Goal</span>
                            </button>

                            <div className="goals-tabs">
                                <button className={`goals-tab-button ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
                                    Active ({activeGoals.length})
                                </button>
                                <button className={`goals-tab-button ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
                                    Completed ({completedGoals.length})
                                </button>
                            </div>

                            {goalsToShow.length > 0 ? (
                                <div className="goals-grid">
                                    {goalsToShow.map(goal => {
                                        const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
                                        return (
                                            <div key={goal.id} className={`card goal-card ${goal.completed ? 'completed' : ''}`}>
                                                <h3 className="goal-title">{goal.title}</h3>
                                                <div className="goal-progress-bar-container">
                                                    <div className="goal-progress-bar" style={{ width: `${progress}%` }}></div>
                                                </div>
                                                <div className="goal-metrics">
                                                    <span className="progress-text">{progress.toFixed(0)}% Complete</span>
                                                    <span className="progress-numbers">{goal.currentValue.toFixed(1)} / {goal.targetValue.toFixed(1)} {goal.unit}</span>
                                                </div>
                                                {(goal.deadline || (goal.reminder && goal.reminder.enabled)) && (
                                                    <div className="goal-meta">
                                                        <span>{goal.deadline ? `Due: ${new Date(goal.deadline).toLocaleDateString()}` : ''}</span>
                                                        {goal.reminder && goal.reminder.enabled && (
                                                            <span className="goal-reminder-info">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                                                {goal.reminder.time}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {!goal.completed ? (
                                                    <div className="goal-actions">
                                                        <button className="goal-action-button log" onClick={() => setLogProgressGoal(goal)}>Log Progress</button>
                                                        <button className="goal-action-button complete" onClick={() => handleCompleteGoal(goal.id)}>Mark Complete</button>
                                                    </div>
                                                ) : (
                                                    <div className="goal-completed-badge">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                        <span>Completed on {new Date(goal.completedAt).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="no-data-placeholder" style={{padding: '3rem 1rem'}}>
                                    <p>No {activeTab} goals yet. Let's set one up!</p>
                                </div>
                            )}
                        </>
                    )}
                    
                    {view === 'create' && <CreateGoalForm />}

                </main>
            </div>
        </div>
    );
};

// --- Sobriety Clock Component ---
const SobrietyClock = ({ size = 'large', onNavigate }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const [displayUnit, setDisplayUnit] = useState('Seconds');
    const [startTime, setStartTime] = useState(null);

    useEffect(() => {
        let isMounted = true;
        
        const setupClock = () => {
            const storedHistory = localStorage.getItem('journalHistory');
            const history = storedHistory ? JSON.parse(storedHistory) : [];
            const lastEntryTime = history.length > 0 && history[0].entryTimestamp ? history[0].entryTimestamp : null;
            
            if (isMounted) {
                setStartTime(lastEntryTime);
            }

            if (lastEntryTime) {
                const interval = setInterval(() => {
                    if (!isMounted) return;

                    const now = Date.now();
                    const diff = now - lastEntryTime;
                    
                    if (diff < 0) {
                        setDisplayValue(0);
                        setDisplayUnit('Seconds');
                        return;
                    }

                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    
                    if (days > 0) {
                        setDisplayValue(days);
                        setDisplayUnit(days === 1 ? 'Day' : 'Days');
                    } else if (hours > 0) {
                        setDisplayValue(hours);
                        setDisplayUnit(hours === 1 ? 'Hour' : 'Hours');
                    } else if (minutes > 0) {
                        setDisplayValue(minutes);
                        setDisplayUnit(minutes === 1 ? 'Minute' : 'Minutes');
                    } else {
                        setDisplayValue(seconds);
                        setDisplayUnit(seconds === 1 ? 'Second' : 'Seconds');
                    }
                }, 1000);

                return () => {
                    isMounted = false;
                    clearInterval(interval);
                };
            }
        };

        const cleanup = setupClock();

        return () => { 
            isMounted = false;
            if (cleanup) cleanup();
        };
    }, []);

    if (!startTime) {
        return (
            <div className="card sobriety-clock-card-placeholder">
                <h2 className="card-title">Sobriety Clock</h2>
                <p className="card-description">Make your first journal entry to start the clock.</p>
            </div>
        );
    }
    
    return (
        <div className="card sobriety-clock-card no-hover">
             <h2 className="sobriety-clock-title">You have been sober for</h2>
             <div className="sobriety-time-box">
                <span className="sobriety-time-value">{displayValue}</span>
                <span className="sobriety-time-unit">{displayUnit}</span>
             </div>
        </div>
    );
};


// --- Profile Menu Component ---
const ProfileMenu = ({ isOpen, onClose, onNavigate }) => {
    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out?")) {
            window.location.reload();
        }
    };

    return (
        <>
            <div className={`profile-menu-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
            <div className={`profile-slide-menu ${isOpen ? 'open' : ''}`}>
                <h2 className="profile-menu-title">Menu</h2>
                <div className="profile-menu-divider"></div>

                <button className="profile-menu-item" onClick={() => { onNavigate('profile'); onClose(); }}>
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span>Profile</span>
                </button>
                <button className="profile-menu-item" onClick={() => { onNavigate('data-privacy'); onClose(); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <span>Data & Privacy</span>
                </button>
                <button className="profile-menu-item" onClick={handleLogout}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    <span>Logout</span>
                </button>
                
                <div className="profile-menu-divider"></div>

                <h3 className="profile-menu-subtitle">SUPPORT</h3>
                <a href="mailto:yourjourneyyourtools@gmail.com" className="profile-menu-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    <span>Email Us</span>
                </a>
                <a href="https://discord.gg/ESyruxKb" target="_blank" rel="noopener noreferrer" className="profile-menu-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span>Join our Discord</span>
                </a>
                <button className="profile-menu-item" onClick={() => { onNavigate('known-bugs'); onClose(); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H9.5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/><path d="m12 6-1 2-2 1 2 1 1 2 1-2 2-1-2-1z"/></svg>
                    <span>Known Bugs</span>
                </button>
            </div>
        </>
    );
};


// --- PWA Install Banner Component ---
const InstallBanner = () => {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showBanner, setShowBanner] = useState(true);

    useEffect(() => {
        // Check if the app is running in standalone mode (added to home screen)
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            setIsStandalone(true);
        }
        // Check if the user is on an iOS device
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    }, []);

    const handleDismiss = () => {
        setShowBanner(false);
        try {
            sessionStorage.setItem('installBannerDismissed', 'true');
        } catch(e) { console.error("Could not set session storage for banner", e); }
    };

    const isDismissed = sessionStorage.getItem('installBannerDismissed') === 'true';

    // Don't show the banner if:
    // - it's already installed (standalone)
    // - it's not an iOS device (Android/Desktop have their own install prompts)
    // - the user has dismissed it in the current session
    // - the user has closed it
    if (isStandalone || !isIOS || isDismissed || !showBanner) {
        return null;
    }

    return (
        <div className="install-banner">
            <p>For the best experience, add this app to your Home Screen. Tap the Share icon, then 'Add to Home Screen'.</p>
            <button onClick={handleDismiss} className="install-button" style={{background: 'transparent', color: 'var(--bg-dark)', padding: 0}}>Dismiss</button>
        </div>
    );
};

// --- Tracker Hub Page Component ---
const TrackerHubPage = ({ onBack, onNavigate }) => {
  const cards = [
    {
      title: 'Daily Journal',
      page: 'tracker',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="card-icon"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
      description: 'Log your mood and substance use to gain insight.'
    },
    {
      title: 'Goals',
      page: 'goals',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="card-icon"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>,
      description: 'Set and track SMART goals to shape your journey.'
    }
  ];

  return (
    <div className="page-container">
      <div className="content-with-side-button">
        <div className="side-button-wrapper">
          <button onClick={onBack} className="home-button" aria-label="Go back to home">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span>Home</span>
          </button>
        </div>
        <main>
          <div className="page-header-text">
            <h1 className="app-title">Track Your Progress</h1>
            <p className="app-subtitle">Select a tool to log your activities and goals.</p>
          </div>

          <SobrietyClock size="large" onNavigate={onNavigate} />

          <div className="card-grid home-grid" style={{maxWidth: '800px', marginTop: '2rem'}}>
            {cards.map((card) => (
              <button
                key={card.title}
                className="card"
                onClick={() => onNavigate(card.page)}
                aria-label={card.title}
              >
                {card.icon}
                <h2 className="card-title">{card.title}</h2>
                <p className="card-description">{card.description}</p>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};


// --- Home Page Component ---
const HomePage = ({ onNavigate, username }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const homeCards = [
        { title: 'Your Journey', page: 'journey', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-icon"><path d="M5 21C10 15 16 10 21 3c-1 5-4 9-9 13s-7 5-7 5z"></path></svg>, size: 'large' },
        { title: 'Tracker', page: 'tracker-hub', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="card-icon"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> },
        { title: 'Know Yourself', page: 'know-yourself', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="card-icon"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> },
        { title: 'Grounding', page: 'grounding', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="card-icon"><path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path><path d="M12 13v8"></path><path d="M9 21h6"></path></svg> },
        { title: 'Media', page: 'media', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="card-icon"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg> },
    ];

    return (
        <div className="page-container">
            <InstallBanner />
            <ProfileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onNavigate={onNavigate} />

            <header className="app-header">
                <div className="header-content">
                    <h1 className="welcome-message">Welcome, {username}!</h1>
                    <p className="app-subtitle">Your Journey, Your Tools.</p>
                </div>
                 <button className="hamburger-menu" onClick={() => setIsMenuOpen(true)} aria-label="Open menu">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
            </header>

            <main>
                <div className="card-grid home-grid">
                    {homeCards.map((card) => (
                        <button
                            key={card.page}
                            className={`card ${card.size === 'large' ? 'journey-card' : 'small-card'}`}
                            onClick={() => onNavigate(card.page)}
                            aria-label={card.title}
                        >
                            {card.icon}
                            <h2 className="card-title">{card.title}</h2>
                        </button>
                    ))}
                </div>
            </main>

            <footer className="app-footer">
                <a href="https://www.yourjourneyyourtools.com" target="_blank" rel="noopener noreferrer">
                    www.yourjourneyyourtools.com
                </a>
            </footer>
        </div>
    );
};


// --- Main App Component ---
const App = () => {
    const [page, setPage] = useState('home');
    const [pageParams, setPageParams] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('There');
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        // Load username
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
            try {
                setUsername(JSON.parse(storedProfile).username || 'There');
            } catch(e) { console.error("Could not parse user profile on load", e)}
        }
        
        // Handle online/offline status
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isLoggedIn]); // Re-check username when logged in
    
     useEffect(() => {
        // Service Worker for Reminders and Offline Capability
        if ('serviceWorker' in navigator && 'PeriodicSyncManager' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                    return registration.periodicSync.register('daily-reminder', {
                        minInterval: 24 * 60 * 60 * 1000,
                    });
                })
                .catch(error => console.log('Service Worker registration or periodic sync failed:', error));
        } else if ('serviceWorker' in navigator) {
             navigator.serviceWorker.register('/service-worker.js')
                .then(registration => console.log('Service Worker registered with scope:', registration.scope))
                .catch(error => console.log('Service Worker registration failed:', error));
        }
    }, []);

    const handleNavigation = (targetPage: string, params: any = null) => {
        setPage(targetPage);
        setPageParams(params);
        window.scrollTo(0, 0); // Scroll to top on page change
        trackEvent('navigate', 'Navigation', targetPage);
    };

    if (!isLoggedIn) {
        return <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />;
    }

    const renderPage = () => {
        switch (page) {
            case 'tracker-hub':
                return <TrackerHubPage onBack={() => handleNavigation('home')} onNavigate={handleNavigation} />;
            case 'tracker':
                return <TrackerPage onBack={() => handleNavigation('tracker-hub')} />;
            case 'know-yourself':
                return <KnowYourselfPage onBack={() => handleNavigation('home')} initialStep={pageParams?.initialStep || 'intro'} />;
            case 'media':
                return <MediaPage onBack={() => handleNavigation('home')} />;
            case 'grounding':
                return <GroundingPage onBack={() => handleNavigation('home')} onNavigate={handleNavigation} />;
            case 'five-four-three-two-one':
                return <FiveFourThreeTwoOnePage onBack={() => handleNavigation('grounding')} onHome={() => handleNavigation('home')} />;
            case 'breathing-exercise':
                return <BreathingExercisePage onBack={() => handleNavigation('grounding')} onHome={() => handleNavigation('home')} />;
            case 'guided-audio':
                return <GuidedAudioPage onBack={() => handleNavigation('grounding')} onHome={() => handleNavigation('home')}/>;
            case 'journey':
                 return <JourneyPage onBack={() => handleNavigation('home')} onNavigate={handleNavigation} />;
            case 'goals':
                return <GoalsPage onBack={() => handleNavigation('tracker-hub')} />;
            case 'known-bugs':
                return <KnownBugsPage onBack={() => handleNavigation('home')} />;
            case 'data-privacy':
                return <DataPrivacyPage onBack={() => handleNavigation('home')} />;
            case 'profile':
                return <ProfilePage onBack={() => handleNavigation('home')} />;
            default:
                return <HomePage onNavigate={handleNavigation} username={username} />;
        }
    };

    return (
        <div className="app-container">
            {isOffline && (
                <div className="offline-indicator">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 16.5a13.2 13.2 0 0 1 13 0"/><path d="M2.5 13.5a17.4 17.4 0 0 1 19 0"/><path d="M8.5 19.5a8.7 8.7 0 0 1 7 0"/><path d="M12 22.5a2.6 2.6 0 0 1 0-5 2.6 2.6 0 0 1 0 5z"/><path d="M2 8l9.3-6.5a1 1 0 0 1 1.4 0L22 8"/><path d="M17 8v1.3"/><path d="M20 11v1.3"/><path d="M7 8v1.3"/><path d="M4 11v1.3"/></svg>
                    <span>You are currently offline. Some features may be limited.</span>
                </div>
            )}
            {renderPage()}
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}