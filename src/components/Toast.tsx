/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';

// --- Toast Notification Component ---
export const Toast = ({ message, icon, onClose }: { message: string, icon: string, onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="toast-notification">
            <div className="toast-icon">{icon}</div>
            <div className="toast-content">
                <p className="toast-title">Achievement Unlocked!</p>
                <p className="toast-message">{message}</p>
            </div>
        </div>
    );
};
