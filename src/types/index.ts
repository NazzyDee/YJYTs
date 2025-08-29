/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// TypeScript declaration for Google Analytics gtag function and non-standard browser APIs
declare global {
    interface Window {
        gtag?: (command: string, actionOrId: string, params?: { [key: string]: any }) => void;
    }
    interface Navigator {
        standalone?: boolean;
        contacts?: {
            select: (props: string[], opts: { multiple: boolean }) => Promise<any[]>;
        };
    }
}

// --- Type Definitions for History ---
export interface AuditHistoryEntry {
    score: number;
    date: string;
}

export interface AdhdHistoryEntry {
    score: number;
    date: string;
    answers: { [key: number]: number };
}

export interface JournalHistoryEntry {
    date: string;
    data: {
        feeling: string;
        substance: string;
        place?: string;
        amount: string;
        unit: string;
        cost?: string;
    };
}

export interface CravingsHistoryEntry {
    date: string;
    intensity: number;
    trigger?: string;
    copingMechanism?: string;
}

export interface GoalEntry {
    id: string;
    title: string; // Specific
    measurableUnit: string; // e.g. 'workouts', 'pages'
    measurableTarget: number;
    measurableProgress: number;
    achievable: string;
    relevant: string;
    relevantValues?: string[]; // Optional linked values
    targetDate: string; // Time-bound
    status: 'active' | 'completed';
    createdAt: string;
    reflection?: string;
}

export interface GratitudeEntry {
    date: string;
    items: string[];
}

export interface ThoughtDiaryEntry {
    date: string;
    data: {
        situation: string;
        thoughts: string;
        feelings: string;
        evidenceFor: string;
        evidenceAgainst: string;
        alternativeThought: string;
        outcome: string;
    };
}

export interface MeditationEntry {
    date: string;
    title: string;
    duration: number; // in seconds
}

export interface ValuesHistoryEntry {
    date: string;
    top5: string[];
}

export interface OppositeActionHistoryEntry {
    date: string;
    emotion: string;
    actionUrge: string;
    oppositeAction: string;
    commitment: string;
}

export interface ProblemSolvingHistoryEntry {
    id: string;
    date: string;
    problemDefinition: string;
    solutions: {
        text: string;
        pros: string;
        cons: string;
    }[];
    chosenSolution: string;
    actionPlan: string;
    status: 'in-progress' | 'completed';
}
