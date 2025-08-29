/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// --- Bottom Navigation Bar ---
export const BottomNavBar = ({ currentPage, navigate, onMenuClick }: { currentPage: string, navigate: (page: string) => void, onMenuClick: () => void }) => {
    const navItems = [
        { id: 'home', label: 'Home', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg> },
        { id: 'tools', label: 'Tools', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg> },
        { id: 'journey', label: 'My Journey', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"/></svg> },
        { id: 'menu', label: 'Menu', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg> },
    ];
    
    return (
        <nav className="bottom-nav-bar">
            {navItems.map(item => (
                <button
                    key={item.id}
                    className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                    onClick={() => {
                        if (item.id === 'menu') {
                            onMenuClick();
                        } else {
                            navigate(item.id);
                        }
                    }}
                    aria-label={item.label}
                >
                    {item.icon}
                    <span className="nav-label">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};