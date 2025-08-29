/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useState } from 'react';

// --- Profile Menu Component ---
export const ProfileMenu = ({ isOpen, onClose, navigate, installPromptEvent, onInstallClick }: { isOpen: boolean, onClose: () => void, navigate: (page: string) => void, installPromptEvent: any, onInstallClick: () => void }) => {
    const menuRef = useRef(null);
    const [showInstallHelp, setShowInstallHelp] = useState(false);

    const isStandalone = useMemo(() => window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone, []);
    const isIOS = useMemo(() => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream, []);

    const handleItemClick = (page: string) => {
        // Close menu first, then perform action.
        // This provides a better UX as the menu disappears before the next action starts.
        onClose();

        if (page === 'install') {
            // If the native prompt is available, use it.
            if (installPromptEvent) {
                onInstallClick();
            } else {
                // Otherwise, show our manual instructions.
                setShowInstallHelp(true);
            }
        } else if (page.startsWith('http')) {
            window.open(page, '_blank');
        } else if (page.startsWith('mailto:')) {
            window.location.href = page;
        } else if (page === 'logout') {
            const pin = localStorage.getItem('userPIN');
            if (pin) {
                window.location.reload();
            }
        } else {
            navigate(page);
        }
    };
    
    const menuItems = useMemo(() => {
        const allItems = [
            // --- Group 1: Account & App ---
            { id: 'profile', label: 'My Profile', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> },
            !isStandalone ? { id: 'install', label: 'Download App', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/></svg> } : null,
            { type: 'divider' },

            // --- Group 2: Community & Resources ---
            { id: 'website', label: 'Website', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 015.08 16zm2.95-8H5.08a7.987 7.987 0 014.3-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>, navigate: 'https://www.yourjourneyyourtools.com' },
            { id: 'discord', label: 'Join our Discord', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.078.037c-.21.375-.443.804-.656 1.245a18.575 18.575 0 00-5.32 0c-.214-.44-.447-.87-.657-1.245a.074.074 0 00-.078-.037 19.736 19.736 0 00-4.885 1.515.069.069 0 00-.05.065c-.03.18-.055.367-.075.562.015.02.03.04.044.058a18.17 18.17 0 005.14 1.81c.065.02.13.02.194 0a18.17 18.17 0 005.14-1.81.06.06 0 00.044-.058c-.02-.195-.045-.382-.075-.562a.07.07 0 00-.05-.065zM12 17.5c-1.933 0-3.5-1.79-3.5-4s1.567-4 3.5-4 3.5 1.79 3.5 4-1.567 4-3.5 4zm3.5-4c0 1.93-1.57 3.5-3.5 3.5s-3.5-1.57-3.5-3.5 1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5z"/></svg>, navigate: 'https://discord.gg/5nnxSw9Z' },
            { id: 'podcast', label: 'Podcast', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>, navigate: 'https://www.youtube.com/playlist?list=PL1MHtsikpzrlXgHVnVD2txdA2weD0xDFX' },
            { id: 'videos', label: 'Video Series', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 16.5v-9l6 4.5-6 4.5zM20 4.47c-.16-.54-.62-1-1.18-1.15C17.51 3 12 3 12 3s-5.51 0-6.82.32C4.62 3.47 4.16 3.93 4 4.47c-.32 1.33-.32 4.04-.32 4.04v.98s0 2.71.32 4.04c.16.54.62 1 1.18 1.15C6.49 19 12 19 12 19s5.51 0 6.82-.32c.56-.15 1.02-.61 1.18-1.15.32-1.33.32-4.04.32-4.04v-.98s0-2.71-.32-4.04z"/></svg>, navigate: 'https://www.youtube.com/playlist?list=PL1MHtsikpzrnje9hJbwVRhYry28G4jQz2' },
            { type: 'divider' },

            // --- Group 3: Support & Legal ---
            { id: 'contact', label: 'Contact Us', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>, navigate: 'mailto:yourjourneyyourtools@gmail.com' },
            { id: 'privacy', label: 'Privacy Policy', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>, navigate: 'privacy' },
            { type: 'divider' },
            
            // --- Group 4: Session ---
            { id: 'logout', label: 'Logout', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg> }
        ];

        return allItems.filter(Boolean); // Filter out null if app is standalone
    }, [isStandalone]);

    return (
        <>
            <div className={`profile-menu-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
            <aside ref={menuRef} className={`profile-slide-menu ${isOpen ? 'open' : ''}`}>
                <h2 className="profile-menu-title">Menu</h2>
                {menuItems.map((item, index) => {
                    if ('type' in item && item.type === 'divider') {
                        // Don't render divider if the next item is also a divider (can happen if conditional item is null)
                        const nextItem = menuItems[index + 1];
                        if (!nextItem || ('type' in nextItem && nextItem.type === 'divider')) {
                            return null;
                        }
                        return <div key={`div-${index}`} className="profile-menu-divider" />;
                    } else if ('id' in item) { // Type guard
                        const page = 'navigate' in item && item.navigate ? item.navigate : item.id;
                        return (
                            <button key={item.id} className="profile-menu-item" onClick={() => handleItemClick(page)}>
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        );
                    }
                    return null;
                })}
            </aside>
            {showInstallHelp && (
                <div className="confirm-modal-overlay" onClick={() => setShowInstallHelp(false)}>
                    <div className="card confirm-modal-content install-help-modal" onClick={e => e.stopPropagation()}>
                        <h3>Add to Home Screen</h3>
                        {isIOS ? (
                            <div className="install-help-content">
                                <p>To add this app to your Home Screen, tap the <strong>Share</strong> icon and then select <strong>'Add to Home Screen'</strong>.</p>
                                <div className="install-icons">
                                    <div className="install-icon-item">
                                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M13 5.41V17a1 1 0 0 1-2 0V5.41l-3.3 3.3a1 1 0 0 1-1.4-1.42l5-5a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1-1.4 1.42L13 5.4zM4 14a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2H5a1 1 0 0 1-1-1zm14 0a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2h-2a1 1 0 0 1-1-1zM4 19a1 1 0 0 1 1-1h14a1 1 0 0 1 0 2H5a1 1 0 0 1-1-1z"></path></svg>
                                        <span>1. Tap Share</span>
                                    </div>
                                    <div className="install-icon-item">
                                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 0 1 1-1z"></path></svg>
                                        <span>2. Tap Add to Homescreen</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="install-help-content">
                                <p>To install this app on your device, tap the <strong>Menu</strong> button (usually three dots) in your browser and select <strong>'Install app'</strong> or <strong>'Add to Home Screen'</strong>.</p>
                                <div className="install-icons">
                                    <div className="install-icon-item">
                                         <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                                        <span>1. Tap Menu</span>
                                    </div>
                                    <div className="install-icon-item">
                                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"></path></svg>
                                        <span>2. Tap Add to Homescreen</span>
                                    </div>
                                </div>
                            </div>
                        )}
                         <button className="modal-button" style={{marginTop: '2rem', backgroundColor: 'var(--accent-teal)', color: 'var(--bg-dark)', width: '100%'}} onClick={() => setShowInstallHelp(false)}>Close</button>
                    </div>
                </div>
            )}
        </>
    );
};