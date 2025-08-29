/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DynamicListSection, DynamicContactListSection } from '../components/DynamicList';
import { InfoTooltip } from '../components/InfoTooltip';

// --- Relapse Prevention Page Component ---
export const RelapsePreventionPage = ({ navigate }: { navigate: (page: string) => void }) => {
    const [plan, setPlan] = useState<{
        triggers: string[],
        copingSkills: string[],
        supportNetwork: any[],
        lifestyleChanges: string
    }>({
        triggers: [],
        copingSkills: [],
        supportNetwork: [],
        lifestyleChanges: '',
    });
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [userProfile, setUserProfile] = useState<{ emergencyContactName?: string, emergencyContactPhone?: string } | null>(null);

    useEffect(() => {
        const storedPlan = JSON.parse(localStorage.getItem('relapsePreventionPlan') || '{}');
        setPlan({
            triggers: storedPlan.triggers || [],
            copingSkills: storedPlan.copingSkills || [],
            supportNetwork: storedPlan.supportNetwork || [],
            lifestyleChanges: storedPlan.lifestyleChanges || '',
        });
        const storedProfile = JSON.parse(localStorage.getItem('userProfile') || 'null');
        setUserProfile(storedProfile);
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('relapsePreventionPlan', JSON.stringify(plan));
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
        window.dispatchEvent(new Event('app:action'));
    };

    const handleShare = async () => {
        const planText = `
My Relapse Prevention Plan (from Your Journey Your Tools):

**1. My Triggers:**
${plan.triggers.length > 0 ? plan.triggers.map(s => `- ${s}`).join('\n') : 'Not specified'}

**2. Healthy Coping Skills:**
${plan.copingSkills.length > 0 ? plan.copingSkills.map(s => `- ${s}`).join('\n') : 'Not specified'}

**3. My Support Network:**
${plan.supportNetwork.length > 0 ? plan.supportNetwork.map(p => `- ${p.name}${p.phone ? ` (${p.phone})` : ''}`).join('\n') : 'Not specified'}

**4. Positive Lifestyle Changes:**
${plan.lifestyleChanges || 'Not specified'}
        `.trim().replace(/\n\n\n/g, '\n\n');

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'My Relapse Prevention Plan',
                    text: planText,
                });
                const currentEvents = JSON.parse(localStorage.getItem('eventHistory') || '[]') as string[];
                if (!currentEvents.includes('share_relapse_plan')) {
                    localStorage.setItem('eventHistory', JSON.stringify([...currentEvents, 'share_relapse_plan']));
                    window.dispatchEvent(new Event('app:action'));
                }
            } else {
                await navigator.clipboard.writeText(planText);
                alert('Relapse Prevention Plan copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing plan:', error);
            alert('Could not share or copy the plan.');
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPlan(p => ({ ...p, [name]: value }));
    };

    const addEmergencyContact = () => {
        if (userProfile && userProfile.emergencyContactName) {
            const emergencyContact = {
                id: Date.now(),
                name: userProfile.emergencyContactName,
                phone: userProfile.emergencyContactPhone || ''
            };
            // Avoid adding duplicates
            if (!plan.supportNetwork.some(p => p.name === emergencyContact.name)) {
                setPlan(p => ({
                    ...p,
                    supportNetwork: [...p.supportNetwork, emergencyContact]
                }));
            }
        }
    };

    return (
        <div className="page-container" style={{ paddingTop: '1rem' }}>
            <header className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate('tools')} className="back-button" aria-label="Go Back to Tools">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 className="app-title">Relapse Prevention Plan</h1>
                    <InfoTooltip text="This plan helps you identify personal triggers and high-risk situations for substance use, and prepares you with healthy coping skills and a support network to maintain your recovery." />
                </div>
            </header>
            <main>
                <form onSubmit={handleSave} className="plan-form-container">
                    <DynamicListSection
                        title="1. My Triggers"
                        description="List people, places, feelings, or situations that make you want to use."
                        items={plan.triggers}
                        setItems={(newItems) => setPlan(p => ({ ...p, triggers: newItems }))}
                        placeholder="e.g., Feeling stressed after work..."
                    />

                    <DynamicListSection
                        title="2. Healthy Coping Skills"
                        description="What can you do instead of using when you encounter a trigger?"
                        items={plan.copingSkills}
                        setItems={(newItems) => setPlan(p => ({ ...p, copingSkills: newItems }))}
                        placeholder="e.g., Call a friend, go for a walk..."
                    />

                    <DynamicContactListSection
                        title="3. My Support Network"
                        description="Who can you call for support when you're struggling?"
                        contacts={plan.supportNetwork}
                        setContacts={(newContacts) => setPlan(p => ({ ...p, supportNetwork: newContacts }))}
                        placeholderName="e.g., Sponsor's Name"
                        placeholderPhone="e.g., (555) 555-5555"
                    >
                        {userProfile?.emergencyContactName && !plan.supportNetwork.some(p => p.name === userProfile.emergencyContactName) && (
                            <button type="button" onClick={addEmergencyContact} className="log-button secondary" style={{marginTop: 0}}>
                                 <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                                Add {userProfile.emergencyContactName} (Emergency Contact)
                            </button>
                        )}
                    </DynamicContactListSection>

                    <div className="plan-form-section">
                        <div className="plan-section-header">
                            <h3>4. Positive Lifestyle Changes</h3>
                            <p>What new routines or activities can support your recovery?</p>
                        </div>
                        <div className="form-group">
                            <textarea
                                name="lifestyleChanges"
                                value={plan.lifestyleChanges}
                                onChange={handleTextChange}
                                rows={4}
                                placeholder="e.g., Attend meetings, exercise 3 times a week, start a new hobby..."
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