import { z } from 'zod';

export const QuizSchema = z.object({
    title: z.string(),
    questions: z.array(
        z.object({
            question: z.string(),
            options: z.array(z.string()),
            correctAnswer: z.number(),
            explanation: z.string().optional()
        })
    ).length(5) // Enforce 5 questions
});

export type Quiz = z.infer<typeof QuizSchema>;