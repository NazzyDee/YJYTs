/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
