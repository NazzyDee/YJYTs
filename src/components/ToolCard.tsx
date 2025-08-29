import React from 'react';

// --- ToolCard Component (reusable) ---
export const ToolCard = ({ tool, navigate, isPinned, togglePin }) => {
    const handleClick = () => {
        if (tool.external) {
            window.open(tool.navigate, '_blank');
        } else {
            navigate(tool.navigate);
        }
    };

    return (
        <div className="card" onClick={handleClick}>
             <button
                className={`card-pin-button ${isPinned ? 'pinned' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    togglePin(tool.id);
                }}
                aria-label={isPinned ? `Unpin ${tool.title}` : `Pin ${tool.title}`}
            >
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1.03 1.03.01.01c.38.38 1.02.38 1.41 0l.01-.01L13 21v-7h6v-2c-1.66 0-3-1.34-3-3z"/>
                </svg>
            </button>
            {tool.icon}
            <h3 className="card-title">{tool.title}</h3>
            <p className="card-subtitle">{tool.subtitle}</p>
        </div>
    );
};
