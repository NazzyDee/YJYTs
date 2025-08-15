/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// TypeScript declaration for Google Analytics gtag function
declare global {
    interface Window {
        gtag?: (command: string, actionOrId: string, params?: { [key: string]: any }) => void;
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
                    setSetupStage('createUsername');
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
            <button onClick={onBack} className="home-button" aria-label="Go back to home">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
               <span>Home</span>
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
                    <button onClick={onClose} className="modal-button" style={{backgroundColor: 'var(--accent-teal)', color: 'var(--bg-dark)', flex: 'none', minWidth: '120px'}}>
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

                    const last7FilteredByUnit = last7MostFrequent.filter(e => e.amountUnit && e.amountUnit.trim() === mostCommonUnit);
                    
                    const prev7DaysEntries = history.filter(entry => {
                        const entryDate = new Date(entry.entryTimestamp || entry.id);
                        return entryDate < sevenDaysAgo && entryDate >= fourteenDaysAgo;
                    });
                    const prev7FilteredBySubstanceAndUnit = prev7DaysEntries.filter(e => e.substance === mostFrequentSubstance && e.amountUnit && e.amountUnit.trim() === mostCommonUnit);

                    const totalAmountLast7 = last7FilteredByUnit.reduce((sum, entry) => sum + (Number(entry.amountValue) || 0), 0);
                    const totalAmountPrev7 = prev7FilteredBySubstanceAndUnit.reduce((sum, entry) => sum + (Number(entry.amountValue) || 0), 0);

                    let trend = null;
                    if (totalAmountPrev7 > 0) {
                        const change = ((totalAmountLast7 - totalAmountPrev7) / totalAmountPrev7) * 100;
                        trend = Math.round(change);
                    }

                    setTrackerStats({
                        totalEntries: last7DaysEntries.length,
                        mostFrequentSubstance: mostFrequentSubstance,
                        totalAmount: totalAmountLast7.toLocaleString(undefined, {maximumFractionDigits: 2}),
                        mostCommonUnit: mostCommonUnit,
                        trend: trend,
                        isNewFormat: true,
                    });

                } else { // Fallback for old data format
                    const prev7DaysEntries = history.filter(entry => {
                        const entryDate = new Date(entry.id);
                        return entryDate < sevenDaysAgo && entryDate >= fourteenDaysAgo;
                    });

                    let trend = null;
                    if (prev7DaysEntries.length > 0) {
                        const change = ((last7DaysEntries.length - prev7DaysEntries.length) / prev7DaysEntries.length) * 100;
                        trend = Math.round(change);
                    }

                    const substanceCounts = last7DaysEntries.reduce((acc, entry) => {
                        acc[entry.substance] = (acc[entry.substance] || 0) + 1;
                        return acc;
                    }, {});
                    const mostFrequentSubstance = Object.keys(substanceCounts).reduce((a, b) => substanceCounts[a] > substanceCounts[b] ? a : b);
                    
                    setTrackerStats({
                        totalEntries: last7DaysEntries.length,
                        mostFrequent: mostFrequentSubstance,
                        trend: trend,
                        isNewFormat: false,
                    });
                }
            } else {
                setTrackerStats({ totalEntries: 0 });
            }
        } catch (error) {
            console.error("Could not process tracker history", error);
            setTrackerStats(null);
        }

        // Process Grounding Data
        try {
            const savedGroundingHistory = localStorage.getItem('groundingHistory');
            const groundingHistory = savedGroundingHistory ? JSON.parse(savedGroundingHistory) : [];
            
            let mostFrequentTechnique = 'N/A';
            if (groundingHistory.length > 0) {
                const techniqueCounts = groundingHistory.reduce((acc, entry) => {
                    acc[entry.technique] = (acc[entry.technique] || 0) + 1;
                    return acc;
                }, {});
                mostFrequentTechnique = Object.keys(techniqueCounts).reduce((a, b) => techniqueCounts[a] > techniqueCounts[b] ? a : b);
            }

            setGroundingStats({
                totalSessions: groundingHistory.length,
                mostUsed: mostFrequentTechnique,
                lastUsed: groundingHistory.length > 0 ? new Date(groundingHistory[0].date).toLocaleDateString() : 'N/A'
            });
        } catch (error) {
            console.error("Could not process grounding history", error);
        }

        // Process Goals Data
        try {
            const savedGoals = localStorage.getItem('goals');
            const goals = savedGoals ? JSON.parse(savedGoals) : [];
            const activeGoals = goals.filter(g => g.status === 'in-progress');
            const completedGoals = goals.filter(g => g.status === 'completed');

            let avgProgress = 0;
            if (activeGoals.length > 0) {
                const totalProgress = activeGoals.reduce((sum, goal) => {
                    const progress = (goal.currentProgress / goal.measurableTarget) * 100;
                    return sum + progress;
                }, 0);
                avgProgress = Math.round(totalProgress / activeGoals.length);
            }
            
            setGoalStats({
                active: activeGoals.length,
                completed: completedGoals.length,
                avgProgress: activeGoals.length > 0 ? avgProgress : null
            });

        } catch (error) {
            console.error("Could not process goals history", error);
        }

        setIsLoading(false);
    }, []);

    // Helper to render trend
    const renderTrend = (trend) => {
        if (trend === null) return <span className="stat-value muted">Not enough data</span>;
        const trendClass = trend >= 0 ? 'positive' : 'negative';
        const trendIcon = trend >= 0 ? '▲' : '▼';
        return <span className={`stat-value ${trendClass}`}>{trendIcon} {Math.abs(trend)}%</span>;
    };

    if (isLoading) {
        return <div className="page-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}><div className="spinner"></div></div>;
    }

    return (
        <div className="page-container">
            {isSummaryModalOpen && <AISummaryModal onClose={() => setIsSummaryModalOpen(false)} />}
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
                        <p className="app-subtitle">A summary of your progress and insights.</p>
                    </div>

                    <div className="journey-grid">
                        {/* Core Values Card */}
                        <div className="summary-card card">
                            <h2 className="summary-card-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                <span>My Core Values</span>
                            </h2>
                            {coreValues.length > 0 ? (
                                <>
                                    <div className="values-summary-grid">
                                        {coreValues.map(value => <div key={value.title} className="value-chip">{value.title}</div>)}
                                    </div>
                                    <button onClick={() => onNavigate('values-exercise')} className="summary-card-cta">Explore My Values</button>
                                </>
                            ) : (
                                <div className="no-data-placeholder">
                                    <p>Discover your core values to see them here.</p>
                                    <button onClick={() => onNavigate('values-exercise')} className="exercise-nav-button">Start Values Exercise</button>
                                </div>
                            )}
                        </div>
                        
                        {/* Goal Progress Card */}
                        <div className="summary-card card">
                             <h2 className="summary-card-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                                <span>Goal Progress</span>
                            </h2>
                            {goalStats && (goalStats.active > 0 || goalStats.completed > 0) ? (
                                <>
                                    <div className="stats-container">
                                        <div className="stat-item">
                                            <span className="stat-label">Active Goals</span>
                                            <span className="stat-value">{goalStats.active}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Completed Goals</span>
                                            <span className="stat-value">{goalStats.completed}</span>
                                        </div>
                                        {goalStats.avgProgress !== null && (
                                            <div className="stat-item">
                                                <span className="stat-label">Average Progress</span>
                                                <span className="stat-value">{goalStats.avgProgress}%</span>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => onNavigate('goals')} className="summary-card-cta">Manage My Goals</button>
                                </>
                            ) : (
                                <div className="no-data-placeholder">
                                    <p>Set a new goal to track your progress here.</p>
                                    <button onClick={() => onNavigate('goals')} className="exercise-nav-button">Set a Goal</button>
                                </div>
                            )}
                        </div>

                        {/* Tracker Summary Card */}
                        <div className="summary-card card">
                            <h2 className="summary-card-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                                <span>Tracker Activity</span>
                            </h2>
                            <p className="summary-card-subtitle">Last 7 Days</p>
                            {trackerStats && trackerStats.totalEntries > 0 ? (
                                <>
                                    <div className="stats-container">
                                        {trackerStats.isNewFormat ? (
                                            <>
                                                <div className="stat-item">
                                                    <span className="stat-label">Log Entries</span>
                                                    <span className="stat-value">{trackerStats.totalEntries}</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-label">Total Use ({trackerStats.mostFrequentSubstance})</span>
                                                    <span className="stat-value">{trackerStats.totalAmount} {trackerStats.mostCommonUnit}</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-label">Amount Trend vs. Prior 7 Days</span>
                                                    {renderTrend(trackerStats.trend)}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="stat-item">
                                                    <span className="stat-label">Total Entries</span>
                                                    <span className="stat-value">{trackerStats.totalEntries}</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-label">Most Tracked</span>
                                                    <span className="stat-value">{trackerStats.mostFrequent}</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-label">Trend vs. Prior 7 Days</span>
                                                    {renderTrend(trackerStats.trend)}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <button onClick={() => onNavigate('daily-journal')} className="summary-card-cta">View All Tracker History</button>
                                    <button onClick={() => setIsSummaryModalOpen(true)} className="summary-card-cta ai-cta">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.6l1.2 3.6H17l-3 2.2l1.2 3.6l-3-2.2l-3 2.2l1.2-3.6l-3-2.2h3.8zM6 16.4l1.2 3.6H11l-3 2.2l1.2 3.6l-3-2.2l-3 2.2l1.2-3.6l-3-2.2h3.8zm12 0l1.2 3.6H23l-3 2.2l1.2 3.6l-3-2.2l-3 2.2l1.2-3.6l-3-2.2h3.8z"/></svg>
                                        <span>Get AI Summary</span>
                                    </button>
                                </>
                            ) : (
                                <div className="no-data-placeholder">
                                    <p>Log your activities to see a summary here.</p>
                                    <button onClick={() => onNavigate('daily-journal')} className="exercise-nav-button">Go to Tracker</button>
                                </div>
                            )}
                        </div>

                        {/* Grounding Tools Card */}
                        <div className="summary-card card">
                             <h2 className="summary-card-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.94 13.06A8.998 8.998 0 0 0 13.06 5.06 9 9 0 0 0 5.06 13.06C5.53 16.32 7.51 19 12 19a9.002 9.002 0 0 0 8.94-5.94z"></path><path d="M12 21a9 9 0 0 0 9-9h-9v9z"></path></svg>
                                <span>Grounding Tools</span>
                            </h2>
                             <p className="summary-card-subtitle">Your Go-To Techniques</p>
                            {groundingStats && groundingStats.totalSessions > 0 ? (
                                <>
                                    <div className="stats-container">
                                        <div className="stat-item">
                                            <span className="stat-label">Total Sessions</span>
                                            <span className="stat-value">{groundingStats.totalSessions}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Most Used</span>
                                            <span className="stat-value">{groundingStats.mostUsed}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Last Used</span>
                                            <span className="stat-value">{groundingStats.lastUsed}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => onNavigate('grounding')} className="summary-card-cta">Explore Grounding Techniques</button>
                                </>
                            ) : (
                                <div className="no-data-placeholder">
                                    <p>Use grounding tools to see your usage stats.</p>
                                    <button onClick={() => onNavigate('grounding')} className="exercise-nav-button">Find a Tool</button>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};


// --- Goals Feature: Create Goal Page ---
const CreateGoalPage = ({ onBack, onNavigate }) => {
    const [specific, setSpecific] = useState('');
    const [measurableTarget, setMeasurableTarget] = useState('');
    const [measurableUnit, setMeasurableUnit] = useState('');
    const [achievable, setAchievable] = useState('');
    const [relevant, setRelevant] = useState('');
    const [timeBound, setTimeBound] = useState('');
    const [coreValues, setCoreValues] = useState([]);
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState('09:00');

    useEffect(() => {
        try {
            const savedValues = localStorage.getItem('coreValues');
            if (savedValues) {
                setCoreValues(JSON.parse(savedValues));
            }
        } catch (e) {
            console.error("Could not load core values", e);
        }
    }, []);

    const handleReminderToggle = async (e) => {
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
                    return; // Don't enable if permission is not granted
                }
            }
        }
        setReminderEnabled(isChecked);
    };

    const handleSave = () => {
        if (!specific || !measurableTarget || !measurableUnit || !timeBound) {
            alert('Please fill out Specific, Measurable, and Time-bound fields.');
            return;
        }

        const newGoal = {
            id: Date.now(),
            specific: specific.trim(),
            measurableTarget: parseInt(measurableTarget, 10),
            measurableUnit: measurableUnit.trim(),
            currentProgress: 0,
            achievable: achievable.trim(),
            relevant: relevant.trim(),
            timeBound,
            status: 'in-progress',
            reminderEnabled,
            reminderTime,
        };

        try {
            const existingGoals = JSON.parse(localStorage.getItem('goals') || '[]');
            localStorage.setItem('goals', JSON.stringify([newGoal, ...existingGoals]));
            trackEvent('create_goal', 'Goals', newGoal.specific);
            onNavigate('goals');
        } catch (e) {
            console.error("Could not save goal", e);
        }
    };
    
    const isSaveDisabled = !specific || !measurableTarget || !measurableUnit || !timeBound;

    return (
        <div className="page-container">
            <div className="content-with-side-button">
                <div className="side-button-wrapper">
                    <button onClick={onBack} className="home-button" aria-label="Go back to goals dashboard">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>
                        <span>Back</span>
                    </button>
                </div>
                <main>
                    <div className="page-header-text">
                        <h1 className="app-title">Create a New Goal</h1>
                        <p className="app-subtitle">Define your goal using the SMART framework.</p>
                    </div>

                    <div className="create-goal-form">
                        <div className="form-section card">
                            <h3 className="form-section-title"><span>S</span>pecific</h3>
                            <p className="form-section-description">What is your goal? Be as clear and specific as possible.</p>
                            <input type="text" placeholder="e.g., Exercise 3 times a week" value={specific} onChange={e => setSpecific(e.target.value)} />
                        </div>

                        <div className="form-section card">
                            <h3 className="form-section-title"><span>M</span>easurable</h3>
                            <p className="form-section-description">How will you measure your progress? Define a target and a unit.</p>
                            <div className="measurable-inputs">
                                <input type="number" placeholder="e.g., 12" value={measurableTarget} onChange={e => setMeasurableTarget(e.target.value)} />
                                <input type="text" placeholder="e.g., workouts" value={measurableUnit} onChange={e => setMeasurableUnit(e.target.value)} />
                            </div>
                        </div>

                        <div className="form-section card">
                            <h3 className="form-section-title"><span>A</span>chievable</h3>
                            <p className="form-section-description">Is this goal realistic for you right now? (Optional)</p>
                            <textarea placeholder="e.g., I have free time in the evenings and can start with walking." value={achievable} onChange={e => setAchievable(e.target.value)}></textarea>
                        </div>
                        
                        <div className="form-section card">
                            <h3 className="form-section-title"><span>R</span>elevant</h3>
                            <p className="form-section-description">Why is this goal important to you? How does it align with your values? (Optional)</p>
                            {coreValues.length > 0 && (
                                <div className="values-suggestion-container">
                                    <p>Your core values:</p>
                                    <div className="values-summary-grid">
                                        {coreValues.map(v => <div key={v.title} className="value-chip">{v.title}</div>)}
                                    </div>
                                </div>
                            )}
                            <textarea placeholder="e.g., This aligns with my value of Health and will improve my mood." value={relevant} onChange={e => setRelevant(e.target.value)}></textarea>
                        </div>

                        <div className="form-section card">
                            <h3 className="form-section-title"><span>T</span>ime-bound</h3>
                            <p className="form-section-description">When will you achieve this goal by?</p>
                            <input type="date" value={timeBound} onChange={e => setTimeBound(e.target.value)} />
                        </div>
                        
                        <div className="form-section card reminder-section">
                            <h3 className="form-section-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                <span>Notifications</span>
                            </h3>
                            <div className="reminder-toggle">
                                <label htmlFor="reminder-enabled">Set daily reminder for this goal?</label>
                                <input id="reminder-enabled" type="checkbox" checked={reminderEnabled} onChange={handleReminderToggle} />
                            </div>
                            {reminderEnabled && (
                                <div className="reminder-time-input">
                                    <label htmlFor="reminder-time">Reminder time:</label>
                                    <input id="reminder-time" type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} style={{colorScheme: 'dark'}} />
                                </div>
                            )}
                        </div>

                        <button onClick={handleSave} className="exercise-nav-button" disabled={isSaveDisabled}>
                            Save Goal
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

// --- Goals Feature: Main Dashboard Page ---
const GoalsPage = ({ onBack, onNavigate }) => {
    const [goals, setGoals] = useState([]);
    const [activeTab, setActiveTab] = useState('in-progress'); // 'in-progress' or 'completed'
    const [logModalState, setLogModalState] = useState({ isOpen: false, goal: null });

    const loadGoals = () => {
        try {
            const savedGoals = localStorage.getItem('goals');
            setGoals(savedGoals ? JSON.parse(savedGoals) : []);
        } catch (e) {
            console.error("Could not load goals", e);
            setGoals([]);
        }
    };
    
    useEffect(loadGoals, []);
    
    const updateGoals = (updatedGoals) => {
        setGoals(updatedGoals);
        localStorage.setItem('goals', JSON.stringify(updatedGoals));
    };

    const handleLogProgress = (goalId, amount) => {
        const updatedGoals = goals.map(goal => {
            if (goal.id === goalId) {
                const newProgress = Math.min(goal.measurableTarget, goal.currentProgress + amount);
                return { ...goal, currentProgress: newProgress };
            }
            return goal;
        });
        updateGoals(updatedGoals);
        setLogModalState({ isOpen: false, goal: null });
    };

    const handleMarkComplete = (goalId) => {
        const updatedGoals = goals.map(goal => {
            if (goal.id === goalId) {
                trackEvent('complete_goal', 'Goals', goal.specific);
                return { ...goal, status: 'completed', currentProgress: goal.measurableTarget };
            }
            return goal;
        });
        updateGoals(updatedGoals);
    };

    const GoalCard = ({ goal }) => {
        const progressPercentage = Math.round((goal.currentProgress / goal.measurableTarget) * 100);
        const isCompleted = goal.status === 'completed';
        const dueDate = new Date(goal.timeBound);
        // Add one day to dueDate because new Date('YYYY-MM-DD') creates a date at midnight UTC, which can appear as the previous day in some timezones.
        dueDate.setDate(dueDate.getDate() + 1);

        return (
            <div className={`goal-card card ${isCompleted ? 'completed' : ''}`}>
                <h3 className="goal-title">{goal.specific}</h3>
                
                <div className="goal-progress-bar-container">
                    <div className="goal-progress-bar" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                
                <div className="goal-metrics">
                    <span className="progress-text">{progressPercentage}%</span>
                    <span className="progress-numbers">{goal.currentProgress} / {goal.measurableTarget} {goal.measurableUnit}</span>
                </div>

                <div className="goal-meta">
                  <p className="goal-due-date">Due: {dueDate.toLocaleDateString()}</p>
                  {goal.reminderEnabled && !isCompleted && (
                    <div className="goal-reminder-info">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        <span>{goal.reminderTime}</span>
                    </div>
                  )}
                </div>

                {!isCompleted && (
                    <div className="goal-actions">
                        <button className="goal-action-button log" onClick={() => setLogModalState({ isOpen: true, goal: goal })}>Log Progress</button>
                        <button className="goal-action-button complete" onClick={() => handleMarkComplete(goal.id)}>Mark Complete</button>
                    </div>
                )}
                 {isCompleted && (
                    <div className="goal-completed-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Completed!</span>
                    </div>
                )}
            </div>
        );
    };
    
    const LogProgressModal = () => {
        const [amount, setAmount] = useState(1);
        if (!logModalState.isOpen) return null;

        const handleSubmit = (e) => {
            e.preventDefault();
            handleLogProgress(logModalState.goal.id, Number(amount));
        }

        return (
            <div className="confirm-modal-overlay">
                <div className="confirm-modal-content card" onClick={e => e.stopPropagation()}>
                    <h3>Log Progress for:</h3>
                    <p className="log-progress-goal-title">{logModalState.goal.specific}</p>
                    <form onSubmit={handleSubmit} className="log-progress-form">
                        <label htmlFor="progress-amount">Amount to add:</label>
                        <input
                            id="progress-amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            min="1"
                            step="1"
                            autoFocus
                        />
                        <div className="confirm-modal-actions">
                            <button type="button" onClick={() => setLogModalState({isOpen: false, goal: null})} className="modal-button cancel">Cancel</button>
                            <button type="submit" className="modal-button confirm">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    const filteredGoals = goals.filter(g => g.status === activeTab);

    return (
        <div className="page-container">
            {logModalState.isOpen && <LogProgressModal />}
            <div className="content-with-side-button">
                <div className="side-button-wrapper">
                    <button onClick={onBack} className="home-button" aria-label="Go back to home">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        <span>Home</span>
                    </button>
                </div>
                <main className="goals-dashboard">
                    <div className="page-header-text">
                        <h1 className="app-title">My Goals</h1>
                        <p className="app-subtitle">Track and manage your personal objectives.</p>
                    </div>
                    
                    <button onClick={() => onNavigate('create-goal')} className="create-goal-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        <span>Create New Goal</span>
                    </button>

                    <div className="goals-tabs">
                        <button className={`goals-tab-button ${activeTab === 'in-progress' ? 'active' : ''}`} onClick={() => setActiveTab('in-progress')}>
                            In Progress ({goals.filter(g => g.status === 'in-progress').length})
                        </button>
                        <button className={`goals-tab-button ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
                            Completed ({goals.filter(g => g.status === 'completed').length})
                        </button>
                    </div>
                    
                    <div className="goals-grid">
                        {filteredGoals.length > 0 ? (
                            filteredGoals.map(goal => <GoalCard key={goal.id} goal={goal} />)
                        ) : (
                            <div className="no-data-placeholder">
                                <p>You have no {activeTab === 'in-progress' ? 'active' : 'completed'} goals yet.</p>
                                {activeTab === 'in-progress' && <button onClick={() => onNavigate('create-goal')} className="exercise-nav-button">Set Your First Goal</button>}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

// --- Sobriety Counter Component ---
const SobrietyCounter = () => {
    const [timeSober, setTimeSober] = useState(null);
    const [lastEntry, setLastEntry] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('journalHistory');
            const history = savedHistory ? JSON.parse(savedHistory) : [];
            if (history.length > 0) {
                // Sort by entryTimestamp (or fallback to id for older data) to find the most recent event
                const latest = history.sort((a, b) => (b.entryTimestamp || b.id) - (a.entryTimestamp || a.id))[0];
                setLastEntry(latest);
            }
        } catch (error) {
            console.error("Could not parse journal history for sobriety clock", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!lastEntry) return;

        const calculateTime = () => {
            const now = new Date();
            const lastUseDate = new Date(lastEntry.entryTimestamp || lastEntry.id);
            if(lastEntry.time) {
                const [h, m] = lastEntry.time.split(':');
                lastUseDate.setHours(h, m, 0, 0);
            }
            
            if (lastUseDate > now) {
                setTimeSober(null);
                return;
            }

            let diff = now.getTime() - lastUseDate.getTime();
            let tempDate = new Date(lastUseDate);
            let months = 0;
            while(true) {
                let nextMonthDate = new Date(tempDate);
                nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
                if (nextMonthDate > now) break;
                tempDate = nextMonthDate;
                months++;
            }
            
            let remainingDiff = now.getTime() - tempDate.getTime();
            const daysAfterMonths = Math.floor(remainingDiff / (1000 * 60 * 60 * 24));
            const weeks = Math.floor(daysAfterMonths / 7);
            const days = daysAfterMonths % 7;

            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);

            setTimeSober({ months, weeks, days, hours, minutes });
        };

        calculateTime(); // Initial calculation
        const interval = setInterval(calculateTime, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [lastEntry]);

    if (isLoading) {
        return null; // Don't show anything while loading
    }

    if (!lastEntry) {
        return (
            <div className="card sobriety-counter-card">
                 <h2 className="summary-card-title" style={{justifyContent: 'center'}}>Sobriety Clock</h2>
                 <div className="no-data-placeholder" style={{padding: '1rem', background: 'transparent', border: 'none'}}>
                    <p>Make your first journal entry to start the clock.</p>
                </div>
            </div>
        );
    }
    
    if (!timeSober) {
        return null; // Return null if date is in the future or not calculated yet
    }
    
    const parts = [
        { label: 'Months', value: timeSober.months },
        { label: 'Weeks', value: timeSober.weeks },
        { label: 'Days', value: timeSober.days },
        { label: 'Hours', value: timeSober.hours },
        { label: 'Minutes', value: timeSober.minutes },
    ];
    
    const displayParts = parts.filter(p => p.value > 0);

    return (
        <div className="card sobriety-counter-card">
            <h2 className="summary-card-title" style={{justifyContent: 'center'}}>
                You have been sober for
            </h2>
            <div className="sobriety-time-display">
                {displayParts.length > 0 ? (
                    displayParts.map(part => (
                        <div className="time-part" key={part.label}>
                            <span>{String(part.value).padStart(2, '0')}</span>
                            <label>{part.label}</label>
                        </div>
                    ))
                ) : (
                     <div className="time-part">
                        <span>--</span>
                        <label>Just Started</label>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Tracker Hub Page Component ---
const TrackerHubPage = ({ onBack, onNavigate }) => {
  const hubCards = [
    { 
      title: 'Daily Journal', 
      page: 'daily-journal',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-icon"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
      description: 'Log your mood and substance use to gain insight.'
    },
    { 
      title: 'Goals',
      page: 'goals',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-icon"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>,
      description: 'Set and track SMART goals to shape your journey.'
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
              <h1 className="app-title">Track Your Progress</h1>
              <p className="app-subtitle">Select a tool to log your activities and goals.</p>
           </div>
           <div className="card-grid">
            <SobrietyCounter />
            {hubCards.map((card) => (
                <button
                key={card.title}
                className="card"
                onClick={() => onNavigate(card.page)}
                aria-label={card.title}
                >
                {card.icon}
                <h2 className="card-title">{card.title}</h2>
                {card.description && <p className="card-description">{card.description}</p>}
                </button>
            ))}
           </div>
        </main>
      </div>
    </div>
  );
};

// --- Install Banner Component ---
const InstallBanner = ({ onInstallClick }) => {
    return (
        <div className="install-banner" role="region" aria-label="Install App Banner">
            <p>Install this app to get the full experience, including offline access and helpful notifications.</p>
            <button onClick={onInstallClick} className="install-button">Install Now</button>
        </div>
    );
};


// --- Home Page Component ---
const HomePage = ({ onNavigate, onLogout, onShowDisclaimer, installPromptEvent, onInstallClick }) => {
  const [username, setUsername] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // New logic to handle userProfile object and migrate old data
    const storedProfileRaw = localStorage.getItem('userProfile');
    if (storedProfileRaw) {
      try {
        const storedProfile = JSON.parse(storedProfileRaw);
        if (storedProfile.username) {
          setUsername(storedProfile.username);
        }
      } catch (e) {
        console.error("Failed to parse user profile, falling back.", e);
        // Fallback for corrupted data
        const oldUsername = localStorage.getItem('username');
        if (oldUsername) setUsername(oldUsername);
      }
    } else {
      // Migration for users who only have the old 'username' key
      const oldUsername = localStorage.getItem('username');
      if (oldUsername) {
        setUsername(oldUsername);
        const newProfile = { username: oldUsername, gender: '', dob: '' };
        localStorage.setItem('userProfile', JSON.stringify(newProfile));
      }
    }
  }, []);

  const cards = [
    { title: 'Your Journey', page: 'journey', enabled: true, icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-icon"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg> },
    { title: 'Tracker', page: 'tracker', enabled: true, icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-icon"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> },
    { title: 'Know Yourself', page: 'know-yourself', enabled: true, icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-icon"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> },
    { title: 'Grounding', page: 'grounding', enabled: true, icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-icon"><path d="M7 20h10" /><path d="M10 20v-6l-2-2a3 3 0 0 1-2-2.8V8.2a3 3 0 0 1 2-2.8l2-1.2a3 3 0 0 1 3.2 0l2 1.2a3 3 0 0 1 2 2.8v1a3 3 0 0 1-2 2.8l-2 2v6" /></svg> },
    { title: 'Media', page: 'media', enabled: true, icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-icon"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg> },
  ];

  return (
    <div className="page-container">
      <div className={`profile-menu-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
      <div className={`profile-slide-menu ${isMenuOpen ? 'open' : ''}`}>
          <h2 className="profile-menu-title">Menu</h2>
          <button className="profile-menu-item" onClick={() => { onNavigate('profile'); setIsMenuOpen(false); }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>Profile</span>
          </button>
           {installPromptEvent && (
              <button className="profile-menu-item" onClick={() => { onInstallClick(); setIsMenuOpen(false); }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>Install App</span>
              </button>
          )}
          <button className="profile-menu-item" onClick={() => { onShowDisclaimer(); setIsMenuOpen(false); }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span>Data & Privacy</span>
          </button>
          <button className="profile-menu-item" onClick={() => { onLogout(); setIsMenuOpen(false); }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Logout</span>
          </button>
          <div className="profile-menu-divider"></div>
          <h3 className="profile-menu-subtitle">Support</h3>
          <a href="mailto:yourjourneyyourtools@gmail.com" className="profile-menu-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <span>Email Us</span>
          </a>
          <a href="https://discord.gg/Td5RcUev" target="_blank" rel="noopener noreferrer" className="profile-menu-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              <span>Join our Discord</span>
          </a>
          <button className="profile-menu-item" onClick={() => { onNavigate('known-bugs'); setIsMenuOpen(false); }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/><path d="m18 16 4-4"/><path d="m18 12 4 4"/><path d="M12 12h.01"/><path d="M8 12h.01"/><path d="M16 12h.01"/></svg>
            <span>Known Bugs</span>
          </button>
      </div>

      {installPromptEvent && <InstallBanner onInstallClick={onInstallClick} />}
      
      <header className="app-header">
        <div className="header-content">
            {username && <h2 className="welcome-message">Welcome, {username}!</h2>}
            <div className="app-logo-container" style={{ marginBottom: '0', marginTop: username ? '1rem' : '0' }}>
               <svg className="logo-graphic" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M45,95 C40,75 60,65 50,45 C30,30 40,10 50,0 C60,10 70,30 50,45 C60,65 40,75 55,95 Z" fill="currentColor"/>
               </svg>
              <h1 className="logo-text">YOUR JOURNEY,<br />YOUR TOOLS</h1>
            </div>
        </div>
        <button className="hamburger-menu" onClick={() => setIsMenuOpen(true)} aria-label="Open profile menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </header>
      <main>
        <div className="card-grid home-grid">
          {cards.map((card) => (
            <button
              key={card.title}
              className={`card ${card.page === 'journey' ? 'journey-card' : 'small-card'} ${!card.enabled ? 'disabled' : ''}`.trim()}
              disabled={!card.enabled}
              onClick={() => {
                  if (card.enabled) {
                      onNavigate(card.page);
                  }
              }}
              aria-label={card.title}
            >
              {card.icon}
              <h2 className="card-title">{card.title}</h2>
            </button>
          ))}
        </div>
      </main>
      <footer className="app-footer">
        <a href="https://www.yourjourneyyourtools.com" target="_blank" rel="noopener noreferrer">www.yourjourneyyourtools.com</a>
      </footer>
    </div>
  );
};

// --- Disclaimer Modal Component ---
const DisclaimerModal = ({ onClose }) => {
    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-content card" style={{maxWidth: '500px'}}>
                <h3>Data Privacy & Storage</h3>
                <p style={{textAlign: 'left', color: 'var(--text-light)'}}>
                    Your data, including journal entries and goals, is saved directly in your browser's local storage.
                    This means your information is private to you and is not sent to any server.
                    <br/><br/>
                    To ensure your data persists, it is highly recommended to use the same browser and device for this application.
                    Clearing your browser's data may permanently delete all your saved information.
                </p>
                <div className="confirm-modal-actions" style={{justifyContent: 'center'}}>
                    <button onClick={onClose} className="modal-button" style={{backgroundColor: 'var(--accent-teal)', color: 'var(--bg-dark)', flex: 'none'}}>
                        Okay
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Offline Indicator Component ---
const OfflineIndicator = () => {
    return (
        <div className="offline-indicator" role="status" aria-live="polite">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.94"></path>
                <path d="M5 12.94A10.94 10.94 0 0 1 7.28 11.06"></path>
                <path d="M10.94 21.06A10.94 10.94 0 0 1 5 12.94"></path>
                <path d="M19 12.94a10.94 10.94 0 0 1-5.94 8.12"></path>
                <path d="M14.83 15.17A4 4 0 0 1 9.17 9.17"></path>
                <line x1="12" y1="2" x2="12.01" y2="2"></line>
            </svg>
            <span>You are currently offline. Functionality may be limited.</span>
        </div>
    );
};

// Main Application Component that handles page routing
const MainApp = ({ onLogout, installPromptEvent, onInstallClick }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const scheduledNotificationsRef = useRef(new Set());


  useEffect(() => {
    const disclaimerSeen = localStorage.getItem('disclaimerSeen');
    if (!disclaimerSeen) {
      setShowDisclaimer(true);
    }
  }, []);

  useEffect(() => {
    // Track page views for Google Analytics.
    if (window.gtag) {
      window.gtag('config', 'G-6Z8H8CSDV1', {
        page_path: `/${currentPage}`,
        page_title: currentPage,
      });
    }

    // Schedule notifications on app load/navigation
    if ('Notification' in window && 'serviceWorker' in navigator && Notification.permission === 'granted') {
        const scheduledItems = scheduledNotificationsRef.current;
        navigator.serviceWorker.ready.then(registration => {
            const now = new Date();

            // --- Schedule Goal Reminders ---
            try {
                const goals = JSON.parse(localStorage.getItem('goals') || '[]');
                const activeGoalsWithReminders = goals.filter(g => g.status === 'in-progress' && g.reminderEnabled);

                activeGoalsWithReminders.forEach(goal => {
                    if (scheduledItems.has(goal.id)) return; // Already scheduled in this session

                    const [hours, minutes] = goal.reminderTime.split(':');
                    const reminderDate = new Date();
                    reminderDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

                    if (reminderDate > now) {
                        const timeout = reminderDate.getTime() - now.getTime();
                        setTimeout(() => {
                            registration.showNotification('Goal Reminder', {
                                body: `Time to work on your goal: "${goal.specific}"`,
                                icon: 'assets/icon-192x192.png',
                                tag: `goal-${goal.id}-${new Date().toLocaleDateString()}` // Unique tag per day
                            });
                        }, timeout);
                        scheduledItems.add(goal.id);
                    }
                });
            } catch (e) {
                console.error("Failed to schedule goal notifications:", e);
            }

            // --- Schedule Journal Reminder ---
            try {
                const journalSettingsRaw = localStorage.getItem('journalReminderSettings');
                if (journalSettingsRaw && !scheduledItems.has('journal-reminder')) {
                    const settings = JSON.parse(journalSettingsRaw);
                    if (settings.enabled) {
                         const [hours, minutes] = settings.time.split(':');
                         const reminderDate = new Date();
                         reminderDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

                         if (reminderDate > now) {
                             const timeout = reminderDate.getTime() - now.getTime();
                             setTimeout(() => {
                                 registration.showNotification('Daily Journal Reminder', {
                                     body: `It's time for your daily journal entry!`,
                                     icon: 'assets/icon-192x192.png',
                                     tag: `journal-reminder-${new Date().toLocaleDateString()}` // Unique tag per day
                                 });
                             }, timeout);
                             scheduledItems.add('journal-reminder');
                         }
                    }
                }
            } catch(e) {
                console.error("Failed to schedule journal notification:", e);
            }
        });
    }
  }, [currentPage]);

  const handleNavigate = (page) => {
    window.scrollTo(0, 0); // Scroll to top on page change
    setCurrentPage(page);
  };

  const handleLogout = () => {
    // Note: We don't remove the PIN, just log the user out.
    // Full data deletion is handled in the forgot pin flow.
    setCurrentPage('home'); // Reset to home before logging out
    onLogout();
  };

  const handleCloseDisclaimer = () => {
      localStorage.setItem('disclaimerSeen', 'true');
      setShowDisclaimer(false);
  };
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} onLogout={handleLogout} onShowDisclaimer={() => setShowDisclaimer(true)} installPromptEvent={installPromptEvent} onInstallClick={onInstallClick} />;
      case 'journey':
        return <JourneyPage onBack={() => handleNavigate('home')} onNavigate={handleNavigate} />;
      case 'tracker':
        return <TrackerHubPage onBack={() => handleNavigate('home')} onNavigate={handleNavigate} />;
      case 'daily-journal':
        return <TrackerPage onBack={() => handleNavigate('tracker')} />;
      case 'goals':
        return <GoalsPage onBack={() => handleNavigate('tracker')} onNavigate={handleNavigate} />;
      case 'create-goal':
        return <CreateGoalPage onBack={() => handleNavigate('goals')} onNavigate={handleNavigate} />;
      case 'know-yourself':
        return <KnowYourselfPage onBack={() => handleNavigate('home')} />;
      case 'values-exercise':
        return <KnowYourselfPage onBack={() => handleNavigate('journey')} initialStep="deck-selection" />;
      case 'grounding':
        return <GroundingPage onBack={() => handleNavigate('home')} onNavigate={handleNavigate} />;
      case 'five-four-three-two-one':
        return <FiveFourThreeTwoOnePage onBack={() => handleNavigate('grounding')} onHome={() => handleNavigate('home')} />;
      case 'breathing-exercise':
        return <BreathingExercisePage onBack={() => handleNavigate('grounding')} onHome={() => handleNavigate('home')} />;
       case 'guided-audio':
        return <GuidedAudioPage onBack={() => handleNavigate('grounding')} onHome={() => handleNavigate('home')} />;
      case 'media':
        return <MediaPage onBack={() => handleNavigate('home')} />;
      case 'profile':
        return <ProfilePage onBack={() => handleNavigate('home')} />;
      case 'known-bugs':
        return <KnownBugsPage onBack={() => handleNavigate('home')} />;
      default:
        return <HomePage onNavigate={handleNavigate} onLogout={handleLogout} onShowDisclaimer={() => setShowDisclaimer(true)} installPromptEvent={installPromptEvent} onInstallClick={onInstallClick} />;
    }
  };

  return (
    <div className="app-container">
      {!isOnline && <OfflineIndicator />}
      {showDisclaimer && <DisclaimerModal onClose={handleCloseDisclaimer} />}
      {renderPage()}
    </div>
  );
};


const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);

  useEffect(() => {
    // Check if there's a PIN to decide if we should show login
    const storedPin = localStorage.getItem('userPIN');
    if (storedPin) {
      // If PIN exists, user needs to log in. Don't auto-login.
      setIsLoggedIn(false); 
    } else {
      // No PIN means it's a first-time setup. The login page will handle this.
      setIsLoggedIn(false);
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault(); // Prevent the default browser prompt
      setInstallPromptEvent(event);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };

  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };
  
  const handleLogout = () => {
      setIsLoggedIn(false);
  }

  const handleInstallClick = () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      installPromptEvent.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
           trackEvent('install_pwa', 'PWA', 'accepted');
        } else {
          console.log('User dismissed the install prompt');
           trackEvent('install_pwa', 'PWA', 'dismissed');
        }
        setInstallPromptEvent(null); // The prompt can only be used once
      });
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <MainApp onLogout={handleLogout} installPromptEvent={installPromptEvent} onInstallClick={handleInstallClick} />;
};


const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);