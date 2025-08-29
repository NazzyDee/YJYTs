/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Achievement Definitions ---
export const ACHIEVEMENTS_DEFINITIONS = {
    // Journaling
    'journal_1': { title: 'First Entry', description: 'Log your first journal entry.', icon: '✍️', check: ({ journalHistory }: { journalHistory: any[] }) => journalHistory.length >= 1 },
    'journal_5': { title: 'Journal Novice', description: 'Log 5 journal entries.', icon: '📓', check: ({ journalHistory }: { journalHistory: any[] }) => journalHistory.length >= 5 },
    'journal_25': { title: 'Journal Adept', description: 'Log 25 journal entries.', icon: '📚', check: ({ journalHistory }: { journalHistory: any[] }) => journalHistory.length >= 25 },
    'journal_100': { title: 'Journal Master', description: 'Log 100 journal entries.', icon: '📜', check: ({ journalHistory }: { journalHistory: any[] }) => journalHistory.length >= 100 },
    'journal_7_days': { title: 'Consistent Logger', description: 'Log an entry for 7 consecutive days.', icon: '🗓️', check: ({ journalHistory }: { journalHistory: { date: string }[] }) => {
        if (journalHistory.length < 7) return false;
        const dates = [...new Set(journalHistory.map((e: {date: string}) => new Date(e.date).toDateString()))].map(d => new Date(d).getTime());
        if (dates.length < 7) return false;
        dates.sort((a, b) => b - a);
        for (let i = 0; i < 6; i++) {
            const diff = dates[i] - dates[i + 1];
            if (diff > 24 * 60 * 60 * 1000 * 1.5) return false; // Allow 1.5 days for flexibility
        }
        return true;
    }},
    'journal_moods': { title: 'Full Spectrum', description: 'Log an entry for each of the 6 main mood groups.', icon: '🎨', check: ({ journalHistory }: { journalHistory: { data: { feeling: string } }[] }) => {
        const moodGroups = new Set();
        const moodMap = { "Happy": ["Joyful", "Content", "Pleased", "Excited", "Proud", "Optimistic"], "Sad": ["Lonely", "Heartbroken", "Gloomy", "Disappointed", "Hopeless", "Grieving"], "Angry": ["Frustrated", "Annoyed", "Resentful", "Irritated", "Furious", "Jealous"], "Anxious": ["Worried", "Overwhelmed", "Stressed", "Nervous", "Scared", "Insecure"], "Surprised": ["Shocked", "Confused", "Amazed", "Startled", "Awed"], "Calm": ["Peaceful", "Relaxed", "Relieved", "Serene", "Tranquil", "Grateful"] };
        const reverseMoodMap: { [key: string]: string } = {};
        for (const group in moodMap) {
            moodMap[group as keyof typeof moodMap].forEach(feeling => reverseMoodMap[feeling] = group);
            reverseMoodMap[group] = group;
        }
        journalHistory.forEach(entry => {
            const group = reverseMoodMap[entry.data.feeling];
            if (group) moodGroups.add(group);
        });
        return moodGroups.size >= 6;
    }},
    // Cravings
    'craving_1': { title: 'First Craving Logged', description: 'Log your first craving.', icon: '📈', check: ({ cravingsHistory }: { cravingsHistory: any[] }) => cravingsHistory.length >= 1 },
    'craving_10': { title: 'Craving Analyst', description: 'Log 10 cravings.', icon: '📊', check: ({ cravingsHistory }: { cravingsHistory: any[] }) => cravingsHistory.length >= 10 },
    'craving_25': { title: 'Pattern Seeker', description: 'Log 25 cravings to better understand your triggers.', icon: '🧠', check: ({ cravingsHistory }: { cravingsHistory: any[] }) => cravingsHistory.length >= 25 },
    'craving_coping_variety': { title: 'Resourceful', description: 'Use 5 different coping mechanisms for cravings.', icon: '🧰', check: ({ cravingsHistory }: { cravingsHistory: { copingMechanism?: string }[] }) => new Set(cravingsHistory.map(c => c.copingMechanism?.trim().toLowerCase()).filter(Boolean)).size >= 5 },
    // Tool Usage
    'tool_first_use': { title: 'First Step', description: 'Use any tool for the first time.', icon: '🛠️', check: (data: any) => Object.keys(data).some(key => key.endsWith('History') && data[key].length > 0) || ['safetyPlan', 'relapsePreventionPlan'].some(key => Object.keys(data[key]).length > 0) || data.goals.length > 0 },
    'tool_breathing_1': { title: 'Deep Breather', description: 'Complete a breathing exercise.', icon: '😮‍💨', check: ({ breathingHistory }: { breathingHistory: any[] }) => breathingHistory.length >= 1 },
    'tool_breathing_10': { title: 'Zen Master', description: 'Complete 10 breathing exercises.', icon: '🧘', check: ({ breathingHistory }: { breathingHistory: any[] }) => breathingHistory.length >= 10 },
    'tool_grounding_1': { title: 'Grounded', description: 'Complete the 5-4-3-2-1 exercise.', icon: '👣', check: ({ groundingHistory }: { groundingHistory: any[] }) => groundingHistory.length >= 1 },
    'tool_grounding_10': { title: 'Centered', description: 'Complete 10 grounding exercises.', icon: '🌳', check: ({ groundingHistory }: { groundingHistory: any[] }) => groundingHistory.length >= 10 },
    'tool_values_1': { title: 'Self-Aware', description: 'Complete the Core Values exercise.', icon: '🧭', check: ({ valuesHistory }: { valuesHistory: any[] }) => valuesHistory.length >= 1 },
    'tool_values_2': { title: 'Re-evaluation', description: 'Complete the Core Values exercise more than once.', icon: '🗺️', check: ({ valuesHistory }: { valuesHistory: any[] }) => valuesHistory.length >= 2 },
    'tool_safety_plan': { title: 'Planner', description: 'Start your Safety Plan.', icon: '🛡️', check: ({ safetyPlan }: { safetyPlan: object }) => Object.keys(safetyPlan).length > 0 },
    'tool_safety_plan_full': { title: 'Well Prepared', description: 'Fill out every section of the Safety Plan.', icon: '🏰', check: ({ safetyPlan }: { safetyPlan: { [key: string]: any } }) => Object.values(safetyPlan).filter(v => (Array.isArray(v) ? v.length > 0 : !!v)).length >= 7 },
    'tool_relapse_plan_start': { title: 'Prevention Planner', description: 'Start your Relapse Prevention Plan.', icon: '🛤️', check: ({ relapsePreventionPlan }: { relapsePreventionPlan: object }) => Object.keys(relapsePreventionPlan).length > 0 },
    'tool_relapse_plan_full': { title: 'Forward Thinker', description: 'Fill out every section of the Relapse Prevention Plan.', icon: '🗺️', check: ({ relapsePreventionPlan }: { relapsePreventionPlan: { [key: string]: any } }) => Object.values(relapsePreventionPlan).filter(v => (Array.isArray(v) ? v.length > 0 : !!v)).length >= 4 },
    'tool_goal_setter': { title: 'Goal Setter', description: 'Create your first S.M.A.R.T. goal.', icon: '🎯', check: ({ goals }: { goals: any[] }) => goals.length >= 1 },
    'tool_audit_1': { title: 'Self-Reflection', description: 'Complete the AUDIT screener for the first time.', icon: '🔍', check: ({ auditHistory }: { auditHistory: any[] }) => auditHistory.length >= 1 },
    'tool_audit_2': { title: 'Check-in', description: 'Complete the AUDIT screener more than once.', icon: '🔄', check: ({ auditHistory }: { auditHistory: any[] }) => auditHistory.length >= 2 },
    'tool_adhd_1': { title: 'Insight Seeker', description: 'Complete the ADHD screener for the first time.', icon: '💡', check: ({ adhdHistory }: { adhdHistory: any[] }) => adhdHistory.length >= 1 },
    'tool_adhd_2': { title: 'Self-Awareness Check', description: 'Complete the ADHD screener more than once.', icon: '🤔', check: ({ adhdHistory }: { adhdHistory: any[] }) => adhdHistory.length >= 2 },
    'tool_gratitude_1': { title: 'Grateful Heart', description: 'Log your first gratitude entry.', icon: '💖', check: ({ gratitudeHistory }: { gratitudeHistory: any[] }) => gratitudeHistory.length >= 1 },
    'tool_gratitude_10': { title: 'Attitude of Gratitude', description: 'Log 10 gratitude entries.', icon: '✨', check: ({ gratitudeHistory }: { gratitudeHistory: any[] }) => gratitudeHistory.length >= 10 },
    'tool_thought_diary_1': { title: 'Mindful Observer', description: 'Complete your first Thought Diary entry.', icon: '🧐', check: ({ thoughtDiaryHistory }: { thoughtDiaryHistory: any[] }) => thoughtDiaryHistory.length >= 1 },
    'tool_thought_diary_5': { title: 'Cognitive Reframer', description: 'Complete 5 Thought Diary entries.', icon: '🔄', check: ({ thoughtDiaryHistory }: { thoughtDiaryHistory: any[] }) => thoughtDiaryHistory.length >= 5 },
    'tool_meditation_1': { title: 'Inner Peace', description: 'Complete your first Guided Meditation.', icon: '🧘‍♀️', check: ({ meditationHistory }: { meditationHistory: any[] }) => meditationHistory.length >= 1 },
    'tool_meditation_5': { title: 'Meditation Regular', description: 'Complete 5 Guided Meditations.', icon: '🕉️', check: ({ meditationHistory }: { meditationHistory: any[] }) => meditationHistory.length >= 5 },
    'tool_cog_distortions': { title: 'Mind Gymnastics', description: 'Visit the Cognitive Distortions learning tool.', icon: '🤸', check: ({ events }: { events: string[] }) => events.includes('visited_cognitive_distortions') },
    'tool_opposite_action_1': { title: 'Emotional Jujitsu', description: 'Complete an Opposite Action exercise.', icon: '🥋', check: ({ oppositeActionHistory }: { oppositeActionHistory: any[] }) => oppositeActionHistory.length >= 1 },
    'tool_problem_solving_1': { title: 'Problem Solver', description: 'Create your first Problem-Solving plan.', icon: '🧩', check: ({ problemSolvingHistory }: { problemSolvingHistory: any[] }) => problemSolvingHistory.length >= 1 },
    // Goals
    'goal_complete_1': { title: 'Goal Achiever', description: 'Complete your first goal.', icon: '✔️', check: ({ goals }: { goals: { status: string }[] }) => goals.some(g => g.status === 'completed') },
    'goal_complete_5': { title: 'High Achiever', description: 'Complete 5 goals.', icon: '🌟', check: ({ goals }: { goals: { status: string }[] }) => goals.filter(g => g.status === 'completed').length >= 5 },
    'goal_complete_10': { title: 'Unstoppable', description: 'Complete 10 goals.', icon: '🚀', check: ({ goals }: { goals: { status: string }[] }) => goals.filter(g => g.status === 'completed').length >= 10 },
    'goal_value_aligned': { title: 'Value-Aligned', description: 'Create a goal linked to one of your core values.', icon: '🔗', check: ({ goals }: { goals: { relevantValues?: string[] }[] }) => goals.some(g => g.relevantValues && g.relevantValues.length > 0) },
    'goal_long_term': { title: 'Visionary', description: 'Set a goal with a target date more than 3 months away.', icon: '🔭', check: ({ goals }: { goals: { targetDate: string }[] }) => goals.some(g => (new Date(g.targetDate).getTime() - new Date().getTime()) > 90 * 24 * 60 * 60 * 1000) },
    'goal_reflection': { title: 'Growth Mindset', description: 'Reflect on a goal that was not achieved on time.', icon: '🌱', check: ({ goals }: { goals: { reflection?: string }[] }) => goals.some(g => g.reflection && g.reflection.trim().length > 0) },
    // Financial
    'financial_100': { title: 'Money Saver', description: 'Save $100 by tracking substance costs.', icon: '💰', check: ({ journalHistory }: { journalHistory: { data: { cost?: string } }[] }) => journalHistory.reduce((sum, e) => sum + (parseFloat(e.data.cost || '0') || 0), 0) >= 100 },
    'financial_500': { title: 'Smart Spender', description: 'Save $500 by tracking substance costs.', icon: '💵', check: ({ journalHistory }: { journalHistory: { data: { cost?: string } }[] }) => journalHistory.reduce((sum, e) => sum + (parseFloat(e.data.cost || '0') || 0), 0) >= 500 },
    'financial_1000': { title: 'Financially Savvy', description: 'Save $1000 by tracking substance costs.', icon: '🏦', check: ({ journalHistory }: { journalHistory: { data: { cost?: string } }[] }) => journalHistory.reduce((sum, e) => sum + (parseFloat(e.data.cost || '0') || 0), 0) >= 1000 },
    // Engagement
    'engagement_3_days': { title: 'Welcome Back', description: 'Open the app on 3 different days.', icon: '👋', check: ({ loginHistory }: { loginHistory: string[] }) => new Set(loginHistory.map(d => new Date(d).toDateString())).size >= 3 },
    'engagement_7_days': { title: 'Regular User', description: 'Open the app on 7 different days.', icon: '🤗', check: ({ loginHistory }: { loginHistory: string[] }) => new Set(loginHistory.map(d => new Date(d).toDateString())).size >= 7 },
    'engagement_30_days': { title: 'Committed', description: 'Open the app on 30 different days.', icon: '💖', check: ({ loginHistory }: { loginHistory: string[] }) => new Set(loginHistory.map(d => new Date(d).toDateString())).size >= 30 },
    'engagement_night_owl': { title: 'Night Owl', description: 'Log an entry between 10 PM and 4 AM.', icon: '🦉', check: ({ journalHistory }: { journalHistory: { date: string }[] }) => journalHistory.some(e => { const h = new Date(e.date).getHours(); return h >= 22 || h < 4; }) },
    'engagement_early_bird': { title: 'Early Bird', description: 'Log an entry between 4 AM and 8 AM.', icon: '🐦', check: ({ journalHistory }: { journalHistory: { date: string }[] }) => journalHistory.some(e => { const h = new Date(e.date).getHours(); return h >= 4 && h < 8; }) },
    'engagement_3_tools': { title: 'Explorer', description: 'Use 3 different tools.', icon: '🗺️', check: (data: any) => ['groundingHistory', 'breathingHistory', 'valuesHistory', 'safetyPlan', 'goals', 'auditHistory', 'adhdHistory', 'gratitudeHistory', 'thoughtDiaryHistory', 'meditationHistory', 'relapsePreventionPlan', 'oppositeActionHistory', 'problemSolvingHistory'].filter(k => data[k] && (Array.isArray(data[k]) ? data[k].length > 0 : Object.keys(data[k]).length > 0)).length >= 3 },
    'engagement_all_tools': { title: 'Toolkit Master', description: 'Use all available tools at least once.', icon: '🧰', check: (data: any) => ['groundingHistory', 'breathingHistory', 'valuesHistory', 'safetyPlan', 'goals', 'auditHistory', 'adhdHistory', 'gratitudeHistory', 'thoughtDiaryHistory', 'meditationHistory', 'relapsePreventionPlan', 'oppositeActionHistory', 'problemSolvingHistory'].every(k => data[k] && (Array.isArray(data[k]) ? data[k].length > 0 : Object.keys(data[k]).length > 0)) },
    'engagement_profile_full': { title: 'Profile Complete', description: 'Fill out all fields in your profile.', icon: '🆔', check: ({ userProfile }: { userProfile: object }) => userProfile && Object.values(userProfile).every(v => v !== '') },
    'engagement_1_month_user': { title: 'One Month In', description: 'Use the app for a month since your first entry.', icon: '🌱', check: ({ journalHistory }: { journalHistory: { date: string }[] }) => journalHistory.length > 0 && (new Date().getTime() - new Date(journalHistory[journalHistory.length - 1].date).getTime()) >= 30 * 86400000 },
    'engagement_25_unlocked': { title: 'Quarter Century', description: 'Unlock 25 achievements.', icon: '🌟', check: ({ unlockedAchievements }: { unlockedAchievements: any[] }) => unlockedAchievements.length >= 25 },
    'engagement_40_unlocked': { title: 'Almost There', description: 'Unlock 40 achievements.', icon: '🌠', check: ({ unlockedAchievements }: { unlockedAchievements: any[] }) => unlockedAchievements.length >= 40 },
    'engagement_share_plan': { title: 'Helping Hand', description: 'Share your safety plan with a contact.', icon: '💌', check: ({ events }: { events: string[] }) => events.includes('share_safety_plan') },
    'engagement_share_relapse_plan': { title: 'Support Network', description: 'Share your relapse prevention plan with a contact.', icon: '🤝', check: ({ events }: { events: string[] }) => events.includes('share_relapse_plan') },
    'engagement_weekend': { title: 'Weekend Warrior', description: 'Log an entry on a Saturday and a Sunday.', icon: '😎', check: ({ journalHistory }: { journalHistory: { date: string }[] }) => { const days = new Set(journalHistory.map(e => new Date(e.date).getDay())); return days.has(6) && days.has(0); }},
    'engagement_full_house': { title: 'Full House', description: 'Have at least one entry in Journal, Cravings, and Goals.', icon: '🏡', check: ({ journalHistory, cravingsHistory, goals }: { journalHistory: any[], cravingsHistory: any[], goals: any[] }) => journalHistory.length > 0 && cravingsHistory.length > 0 && goals.length > 0 }
};