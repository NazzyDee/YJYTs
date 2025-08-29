/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const AUDIT_QUESTIONS = [
    {
        question: 'How often do you have a drink containing alcohol?',
        answers: [
            { text: 'Never', score: 0 },
            { text: 'Monthly or less', score: 1 },
            { text: '2 to 4 times a month', score: 2 },
            { text: '2 to 3 times a week', score: 3 },
            { text: '4 or more times a week', score: 4 },
        ],
    },
    {
        question: 'How many drinks containing alcohol do you have on a typical day when you are drinking?',
        answers: [
            { text: '1 or 2', score: 0 },
            { text: '3 or 4', score: 1 },
            { text: '5 or 6', score: 2 },
            { text: '7 to 9', score: 3 },
            { text: '10 or more', score: 4 },
        ],
    },
    {
        question: 'How often do you have six or more drinks on one occasion?',
        answers: [
            { text: 'Never', score: 0 },
            { text: 'Less than monthly', score: 1 },
            { text: 'Monthly', score: 2 },
            { text: 'Weekly', score: 3 },
            { text: 'Daily or almost daily', score: 4 },
        ],
    },
    {
        question: 'How often during the last year have you found that you were not able to stop drinking once you had started?',
        answers: [
            { text: 'Never', score: 0 },
            { text: 'Less than monthly', score: 1 },
            { text: 'Monthly', score: 2 },
            { text: 'Weekly', score: 3 },
            { text: 'Daily or almost daily', score: 4 },
        ],
    },
    {
        question: 'How often during the last year have you failed to do what was normally expected from you because of drinking?',
        answers: [
            { text: 'Never', score: 0 },
            { text: 'Less than monthly', score: 1 },
            { text: 'Monthly', score: 2 },
            { text: 'Weekly', score: 3 },
            { text: 'Daily or almost daily', score: 4 },
        ],
    },
    {
        question: 'How often during the last year have you needed a first drink in the morning to get yourself going after a heavy drinking session?',
        answers: [
            { text: 'Never', score: 0 },
            { text: 'Less than monthly', score: 1 },
            { text: 'Monthly', score: 2 },
            { text: 'Weekly', score: 3 },
            { text: 'Daily or almost daily', score: 4 },
        ],
    },
    {
        question: 'How often during the last year have you had a feeling of guilt or remorse after drinking?',
        answers: [
            { text: 'Never', score: 0 },
            { text: 'Less than monthly', score: 1 },
            { text: 'Monthly', score: 2 },
            { text: 'Weekly', score: 3 },
            { text: 'Daily or almost daily', score: 4 },
        ],
    },
    {
        question: 'How often during the last year have you been unable to remember what happened the night before because you had been drinking?',
        answers: [
            { text: 'Never', score: 0 },
            { text: 'Less than monthly', score: 1 },
            { text: 'Monthly', score: 2 },
            { text: 'Weekly', score: 3 },
            { text: 'Daily or almost daily', score: 4 },
        ],
    },
    {
        question: 'Have you or someone else been injured as a result of your drinking?',
        answers: [
            { text: 'No', score: 0 },
            { text: 'Yes, but not in the last year', score: 2 },
            { text: 'Yes, during the last year', score: 4 },
        ],
    },
    {
        question: 'Has a relative or friend or a doctor or another health worker been concerned about your drinking or suggested you cut down?',
        answers: [
            { text: 'No', score: 0 },
            { text: 'Yes, but not in the last year', score: 2 },
            { text: 'Yes, during the last year', score: 4 },
        ],
    },
];

export const getAuditResult = (score: number) => {
    if (score <= 7) {
        return {
            zone: 'I',
            level: 'Low Risk',
            recommendation: 'Your responses suggest you are at low risk for problems related to alcohol. It\'s a great idea to continue being mindful of your alcohol consumption.',
        };
    } else if (score <= 15) {
        return {
            zone: 'II',
            level: 'Risky',
            recommendation: 'Your drinking pattern suggests some risk. It may be helpful to think about reducing your alcohol intake. Consider setting limits for yourself and exploring strategies for moderation.',
        };
    } else if (score <= 19) {
        return {
            zone: 'III',
            level: 'Harmful',
            recommendation: 'Your drinking is at a level that could be harmful to your health and well-being. It is strongly advised that you take steps to reduce your drinking. Talking to a healthcare provider could be a beneficial next step.',
        };
    } else {
        return {
            zone: 'IV',
            level: 'High Risk / Possible Dependence',
            recommendation: 'Your score indicates a high level of risk and possible alcohol dependence. It is highly recommended that you seek further evaluation from a healthcare professional or a specialist in addiction.',
        };
    }
};
