/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// --- Reusable Info Tooltip Component ---
export const InfoTooltip = ({ text }: { text: string }) => {
    return (
        <div className="info-tooltip-container">
            <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            <span className="tooltip-text">{text}</span>
        </div>
    );
};
