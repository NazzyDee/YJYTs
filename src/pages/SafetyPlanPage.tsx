/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DynamicListSection, DynamicContactListSection } from '../components/DynamicList';
import { InfoTooltip } from '../components/InfoTooltip';

// --- Safety Plan Page Component ---
export const SafetyPlanPage = ({ navigate }: { navigate: (page: string) => void }) => {
    const [plan, setPlan] = useState({
        warningSigns: '',
        copingStrategies: [],
        socialSettings: [],
        peopleForHelp: [],
        professionals: [],
        safeEnvironment: '',
        reasonsForLiving: '',
    });
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [userProfile, setUserProfile] = useState<{ emergencyContactName?: string, emergencyContactPhone?: string } | null>(null);

    useEffect(() => {
        const storedPlan = JSON.parse(localStorage.getItem('safetyPlan') || '{}');
        // Ensure all keys are present with correct types
        setPlan(p => ({
            warningSigns: storedPlan.warningSigns || '',
            copingStrategies: storedPlan.copingStrategies || [],
            socialSettings: storedPlan.socialSettings || [],
            peopleForHelp: storedPlan.peopleForHelp || [],
            professionals: storedPlan.professionals || [],
            safeEnvironment: storedPlan.safeEnvironment || '',
            reasonsForLiving: storedPlan.reasonsForLiving || '',
        }));

        const storedProfile = JSON.parse(localStorage.getItem('userProfile') || 'null');
        setUserProfile(storedProfile);
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('safetyPlan', JSON.stringify(plan));
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
        window.dispatchEvent(new Event('app:action'));
    };

    const handleShare = async () => {
        const planText = `
My Safety Plan (from Your Journey Your Tools):

**1. Warning Signs (thoughts, images, mood, situation, behavior):**
${plan.warningSigns || 'Not specified'}

**2. Internal Coping Strategies (things I can do to take my mind off problems without contacting anyone else):**
${plan.copingStrategies.length > 0 ? plan.copingStrategies.map(s => `- ${s}`).join('\n') : 'Not specified'}

**3. People and Social Settings That Provide Distraction:**
${plan.socialSettings.length > 0 ? plan.socialSettings.map(s => `- ${s}`).join('\n') : 'Not specified'}

**4. People Whom I Can Ask for Help:**
${plan.peopleForHelp.length > 0 ? plan.peopleForHelp.map((p: any) => `- ${p.name}${p.phone ? ` (${p.phone})` : ''}`).join('\n') : 'Not specified'}

**5. Professionals or Agencies I Can Contact During a Crisis:**
${plan.professionals.length > 0 ? plan.professionals.map((p: any) => `- ${p.name}${p.phone ? ` (${p.phone})` : ''}`).join('\n') : 'Not specified'}

**6. Making the Environment Safe:**
${plan.safeEnvironment || 'Not specified'}

**7. My Reasons for Living:**
${plan.reasonsForLiving || 'Not specified'}
        `.trim().replace(/\n\n\n/g, '\n\n');

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'My Safety Plan',
                    text: planText,
                });
                const currentEvents = JSON.parse(localStorage.getItem('eventHistory') || '[]') as string[];
                if (!currentEvents.includes('share_safety_plan')) {
                    localStorage.setItem('eventHistory', JSON.stringify([...currentEvents, 'share_safety_plan']));
                    window.dispatchEvent(new Event('app:action'));
                }
            } else {
                await navigator.clipboard.writeText(planText);
                alert('Safety Plan copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing safety plan:', error);
            alert('Could not share or copy the plan.');
        }
    };
    
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPlan(p => ({ ...p, [name]: value }));
    };

    const addEmergencyContact = () => {
        if (userProfile && userProfile.emergencyContactName) {
            setPlan(p => ({
                ...p,
                peopleForHelp: [...p.peopleForHelp, { id: Date.now(), name: userProfile.emergencyContactName, phone: userProfile.emergencyContactPhone || '' }]
            }));
        }
    };
    
    const handleImportContacts = async () => {
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        try {
            if (!navigator.contacts) {
                alert('Contact Picker API is not supported on this browser.');
                return;
            }
            const contacts = await navigator.contacts.select(props, opts);
            if (contacts.length > 0) {
                const newContacts = contacts
                    .map(contact => ({
                        id: Date.now() + Math.random(),
                        name: contact.name[0],
                        phone: contact.tel[0] || ''
                    }))
                    .filter(newContact =>
                        // Filter out duplicates already in the plan
                        !plan.peopleForHelp.some((existing: any) => existing.name === newContact.name && existing.phone === newContact.phone)
                    );

                if (newContacts.length > 0) {
                     setPlan(p => ({
                        ...p,
                        peopleForHelp: [...p.peopleForHelp, ...newContacts]
                    }));
                }
            }
        } catch (ex) {
            console.error('Error selecting contacts:', ex);
            // The user may have canceled the picker, which is not an error we need to show them.
        }
    };

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 className="app-title">Safety Plan</h1>
                    <InfoTooltip text="This is a proactive tool to help you navigate moments of intense distress or crisis. By identifying your personal warning signs and coping strategies in advance, you create a clear guide to stay safe." />
                </div>
            </header>
            <main>
                <form onSubmit={handleSave} className="plan-form-container">
                    <div className="plan-form-section">
                        <div className="plan-section-header">
                            <h3>1. Warning Signs</h3>
                            <p>What thoughts, images, moods, situations, or behaviors tell you a crisis may be developing?</p>
                        </div>
                        <div className="form-group">
                            <textarea
                                name="warningSigns"
                                value={plan.warningSigns}
                                onChange={handleTextChange}
                                rows={4}
                                placeholder="e.g., Feeling hopeless, isolating myself..."
                            />
                        </div>
                    </div>

                    <DynamicListSection
                        title="2. Internal Coping Strategies"
                        description="Things I can do on my own to distract myself and feel better."
                        items={plan.copingStrategies}
                        setItems={(newItems) => setPlan(p => ({ ...p, copingStrategies: newItems }))}
                        placeholder="e.g., Listen to calming music..."
                    />

                    <DynamicListSection
                        title="3. People & Social Settings for Distraction"
                        description="Places I can go or people I can be with to take my mind off things."
                        items={plan.socialSettings}
                        setItems={(newItems) => setPlan(p => ({ ...p, socialSettings: newItems }))}
                        placeholder="e.g., Go to a coffee shop..."
                    />

                    <DynamicContactListSection
                        title="4. People I Can Ask for Help"
                        description="Friends or family members I can talk to when I need support."
                        contacts={plan.peopleForHelp}
                        setContacts={(newContacts) => setPlan(p => ({ ...p, peopleForHelp: newContacts }))}
                        placeholderName="e.g., Jane Doe"
                        placeholderPhone="e.g., (555) 123-4567"
                    >
                        <div className="contact-actions-container">
                             {userProfile?.emergencyContactName && !plan.peopleForHelp.some((p: any) => p.name === userProfile.emergencyContactName) && (
                                <button type="button" onClick={addEmergencyContact} className="log-button secondary">
                                     <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                                    Add {userProfile.emergencyContactName} (Emergency Contact)
                                </button>
                            )}
                            {'contacts' in navigator && 'select' in navigator.contacts && (
                                 <button type="button" onClick={handleImportContacts} className="log-button secondary">
                                     <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2zM6 18V6h12v12H6zm7-11h-2v2H9v2h2v2h2v-2h2v-2h-2V7zm-2 5c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>
                                    Import from Contacts
                                </button>
                            )}
                        </div>
                    </DynamicContactListSection>

                    <DynamicContactListSection
                        title="5. Professionals or Agencies I Can Contact"
                        description="My therapist, doctor, or crisis lines that I can call for help."
                        contacts={plan.professionals}
                        setContacts={(newContacts) => setPlan(p => ({ ...p, professionals: newContacts }))}
                        placeholderName="e.g., Crisis Hotline"
                        placeholderPhone="e.g., 988"
                    />

                    <div className="plan-form-section">
                        <div className="plan-section-header">
                            <h3>6. Making the Environment Safe</h3>
                            <p>What can I do to make it less likely I will act on my thoughts of self-harm?</p>
                        </div>
                        <div className="form-group">
                            <textarea
                                name="safeEnvironment"
                                value={plan.safeEnvironment}
                                onChange={handleTextChange}
                                rows={4}
                                placeholder="e.g., Remove any means of harm from my home..."
                            />
                        </div>
                    </div>
                    
                    <div className="plan-form-section">
                        <div className="plan-section-header">
                            <h3>7. My Reasons For Living</h3>
                            <p>The most important things to me that are worth living for.</p>
                        </div>
                        <div className="form-group">
                            <textarea
                                name="reasonsForLiving"
                                value={plan.reasonsForLiving}
                                onChange={handleTextChange}
                                rows={4}
                                placeholder="e.g., My family, my pets, future goals..."
                            />
                        </div>
                    </div>

                    <div className="safety-plan-actions">
                         <button type="submit" className="log-button">Save Plan</button>
                         <button type="button" onClick={handleShare} className="log-button secondary">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/></svg>
                            Share My Plan
                         </button>
                         {showConfirmation && <p className="confirmation-message">Plan Saved Successfully!</p>}
                    </div>
                </form>
            </main>
        </div>
    );
};
