/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CognitiveDistortion {
    id: string;
    name: string;
    description: string;
    example: string;
    positiveExample: string;
}

export const COGNITIVE_DISTORTIONS_DATA: CognitiveDistortion[] = [
    {
        id: 'all_or_nothing',
        name: 'All-or-Nothing Thinking',
        description: 'Viewing situations in black-and-white categories, with no middle ground. If something falls short of perfect, you see it as a total failure.',
        example: '"I got a B on the test, so I\'m a complete failure at this subject."',
        positiveExample: '"A B isn\'t perfect, but it\'s still a good grade. I understand most of the material, and I can review the parts I struggled with."'
    },
    {
        id: 'overgeneralization',
        name: 'Overgeneralization',
        description: 'Seeing a single negative event as a never-ending pattern of defeat. You might use words like "always" or "never".',
        example: '"I forgot to send that email. I always mess things up."',
        positiveExample: '"I made a mistake by forgetting the email, but it doesn\'t mean I always mess up. I do many things right."'
    },
    {
        id: 'mental_filter',
        name: 'Mental Filter',
        description: 'Picking out a single negative detail and dwelling on it exclusively, so that your vision of all reality becomes darkened.',
        example: 'You receive many compliments on a presentation, but one colleague offers a minor suggestion for improvement, and you can only focus on that one critique.',
        positiveExample: '"The feedback was helpful, and it\'s great that overall the presentation was so well-received by my colleagues."'
    },
    {
        id: 'disqualifying_positive',
        name: 'Disqualifying the Positive',
        description: 'Rejecting positive experiences by insisting they "don\'t count" for some reason. This allows you to maintain a negative belief that is contradicted by everyday experiences.',
        example: '"I only did well on that project because I got lucky."',
        positiveExample: '"I worked hard on that project and my effort paid off. I deserve to feel proud of this success."'
    },
    {
        id: 'jumping_to_conclusions',
        name: 'Jumping to Conclusions',
        description: 'Making a negative interpretation even though there are no definite facts that convincingly support your conclusion. This includes Mind Reading (assuming what others are thinking) and Fortune Telling (predicting a negative outcome).',
        example: 'Mind Reading: "My friend didn\'t text back, they must be mad at me." Fortune Telling: "I\'m going to fail this job interview, I just know it."',
        positiveExample: 'Mind Reading: "My friend might be busy. I can\'t know what they\'re thinking." Fortune Telling: "I\'m nervous about the interview, but I\'ve prepared well and I will do my best."'
    },
    {
        id: 'magnification_minimization',
        name: 'Magnification & Minimization',
        description: 'Exaggerating the importance of negative things (like your mistakes) or minimizing the importance of positive things (like your own desirable qualities). This is also called the "binocular trick".',
        example: 'Magnification: "I made a small typo in the report, everyone will think I\'m incompetent." Minimization: "Yes, I got a promotion, but it wasn\'t a big deal."',
        positiveExample: 'Magnification: "It\'s a small typo that I can correct. It doesn\'t reflect my overall competence." Minimization: "This promotion is a significant achievement that reflects my hard work and skills."'
    },
    {
        id: 'emotional_reasoning',
        name: 'Emotional Reasoning',
        description: 'Assuming that your negative emotions necessarily reflect the way things really are. "I feel it, therefore it must be true."',
        example: '"I feel so anxious, something terrible must be about to happen."',
        positiveExample: '"I feel anxious, but feelings aren\'t facts. This anxiety is a sensation, and it will pass. There is no evidence that something bad will happen."'
    },
    {
        id: 'should_statements',
        name: '"Should" Statements',
        description: 'Motivating yourself with "shoulds" and "shouldn\'ts," as if you had to be whipped and punished before you could be expected to do anything. The emotional consequence is guilt.',
        example: '"I should exercise every day. If I don\'t, I\'m lazy."',
        positiveExample: '"I would like to exercise regularly because it\'s good for me. Missing a day doesn\'t make me lazy; it just means I\'m human."'
    },
    {
        id: 'labeling',
        name: 'Labeling and Mislabeling',
        description: 'An extreme form of overgeneralization. Instead of describing your error, you attach a negative label to yourself or others.',
        example: 'Instead of "I made a mistake," you tell yourself, "I\'m a loser."',
        positiveExample: '"I made a mistake, which is a specific action. It doesn\'t define who I am as a person. I can learn from it."'
    },
    {
        id: 'personalization',
        name: 'Personalization',
        description: 'Seeing yourself as the cause of some negative external event which, in fact, you were not primarily responsible for.',
        example: '"My child got a bad grade, it must be because I\'m a bad parent."',
        positiveExample: '"My child\'s grades are their responsibility. While I can offer support, many factors influence their performance that are outside of my control."'
    }
];