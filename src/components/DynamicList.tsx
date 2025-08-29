/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

// --- Helper component for dynamic string list in Safety Plan ---
export const DynamicListSection = ({ title, description, items, setItems, placeholder }: { title: string, description: string, items: string[], setItems: (items: string[]) => void, placeholder: string }) => {
    const [newItem, setNewItem] = useState('');

    const handleAddItem = () => {
        if (newItem.trim()) {
            setItems([...items, newItem.trim()]);
            setNewItem('');
        }
    };

    const handleRemoveItem = (indexToRemove: number) => {
        setItems(items.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="plan-form-section">
            <div className="plan-section-header">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
            {items.length > 0 && (
                <div className="list-item-container">
                    {items.map((item, index) => (
                        <div key={index} className="list-item">
                            <span className="list-item-text">{item}</span>
                            <button type="button" onClick={() => handleRemoveItem(index)} className="remove-list-item-btn" aria-label={`Remove ${item}`}>
                                 <svg viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="form-group" style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center', marginTop: items.length > 0 ? '1rem' : '0' }}>
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder={placeholder}
                    style={{flexGrow: 1}}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); }}}
                />
                <button type="button" onClick={handleAddItem} className="log-button secondary" style={{width: 'auto', flexShrink: 0}}>
                    Add
                </button>
            </div>
        </div>
    );
};

// --- Helper component for dynamic contact list in Safety Plan ---
export const DynamicContactListSection = ({ title, description, contacts, setContacts, placeholderName, placeholderPhone, children }: { title: string, description: string, contacts: any[], setContacts: (newContacts: any[]) => void, placeholderName: string, placeholderPhone: string, children?: React.ReactNode }) => {
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');

    const handleAddContact = () => {
        if (newName.trim()) {
            setContacts([...contacts, { id: Date.now(), name: newName.trim(), phone: newPhone.trim() }]);
            setNewName('');
            setNewPhone('');
        }
    };

    const handleRemoveContact = (idToRemove: number) => {
        setContacts(contacts.filter(c => c.id !== idToRemove));
    };

    return (
        <div className="plan-form-section">
            <div className="plan-section-header">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
            {children}
            {contacts.length > 0 && (
                <div className="contact-list">
                    {contacts.map((contact) => (
                        <div key={contact.id} className="contact-item" style={{flexDirection: 'column', alignItems: 'stretch', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', gap: '0.75rem'}}>
                           <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                             <strong style={{color: 'var(--text-light)'}}>{contact.name}</strong>
                             <button type="button" onClick={() => handleRemoveContact(contact.id)} className="remove-contact-btn" aria-label={`Remove ${contact.name}`}>
                                <svg viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                             </button>
                           </div>
                           <p style={{color: 'var(--text-muted)'}}>{contact.phone || 'No phone number'}</p>
                        </div>
                    ))}
                </div>
            )}
             <div className="form-group" style={{marginTop: '1rem'}}>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={placeholderName} />
                <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder={placeholderPhone} />
             </div>
             <button type="button" onClick={handleAddContact} className="log-button secondary" style={{alignSelf: 'flex-end', width: 'auto'}}>
                 <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                 Add Contact
             </button>
        </div>
    );
};
