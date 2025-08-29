/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ALL_TOOLS } from '../data/tools';
import { ToolCard } from '../components/ToolCard';

// --- ToolsPage Component ---
export const ToolsPage = ({ navigate, pinnedTools, togglePin }: { navigate: (page: string) => void, pinnedTools: string[], togglePin: (id: string) => void }) => {
    const categories: { [key: string]: typeof ALL_TOOLS } = ALL_TOOLS.reduce((acc, tool) => {
        (acc[tool.category] = acc[tool.category] || []).push(tool);
        return acc;
    }, {} as { [key: string]: typeof ALL_TOOLS });

    const categoryOrder = ['Trackers', 'Exercises', 'Growth'];

    return (
        <div className="page-container">
            <header className="page-header-text">
                <h1 className="app-title">Tools</h1>
                <p className="app-subtitle">Explore all available resources.</p>
            </header>
            <main>
                {categoryOrder.map(category => (
                    <section key={category}>
                        <h2 className="section-title">{category}</h2>
                        <div className="card-grid home-grid">
                            {categories[category].map(tool => (
                                <ToolCard
                                    key={tool.id}
                                    tool={tool}
                                    navigate={navigate}
                                    isPinned={pinnedTools.includes(tool.id)}
                                    togglePin={togglePin}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </main>
        </div>
    );
};
