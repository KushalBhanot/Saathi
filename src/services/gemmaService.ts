import { Grade, Subject } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMMA_API_KEY ?? '';
const BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const GRADE_INSTRUCTIONS: Record<number, string> = {
  1: 'Explain like talking to a 6-year-old. Use very short sentences and only the simplest words. One idea at a time.',
  2: 'Explain like talking to a 7-year-old. Very simple words, short sentences, fun examples from daily life.',
  3: 'Explain at a Grade 3 level. Simple words, short sentences, relatable examples.',
  4: 'Explain at a Grade 4 level. Simple language with a few subject-specific words, always explained.',
  5: 'Explain at a Grade 5 level. Clear language, can introduce basic terminology with explanation.',
  6: 'Explain at a Grade 6 level. Use some subject terminology, always define new words.',
  7: 'Explain at a Grade 7 level. Use proper subject terminology. Assume basic prior knowledge.',
  8: 'Explain at a Grade 8 level. Use correct terminology. Can reference related concepts briefly.',
  9: 'Explain at a Grade 9 level. Use standard academic language. Can include formulas or technical detail.',
  10: 'Explain at a Grade 10 level. Use full academic language. Include relevant formulas or theory where appropriate.',
};

const MATH_PLAIN_TEXT_RULE =
  'IMPORTANT: Write all math in plain text only. Never use LaTeX or dollar sign notation. ' +
  'Good examples: "x = (-b plus-or-minus sqrt(b squared minus 4ac)) divided by 2a", ' +
  '"a squared plus b squared equals c squared", "E = mc squared". ' +
  'Bad examples: "$x = \\frac{-b}{2a}$", "\\sqrt{}", "$ax^2$". Plain text only.';

export const SYSTEM_PROMPT = (subject: Subject, grade: Grade): string =>
  [
    'You are EduReach, a friendly AI tutor for students in rural and underserved communities.',
    'You are teaching ' + subject + ' to a Grade ' + grade + ' student.',
    GRADE_INSTRUCTIONS[grade],
    'Keep answers under 100 words.',
    'Be warm and encouraging.',
    'End with one short follow-up question.',
    'Reply directly to the student with no preamble or meta-commentary.',
    MATH_PLAIN_TEXT_RULE,
  ].join(' ');

export interface GemmaMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function askGemma(
  subject: Subject,
  grade: Grade,
  history: GemmaMessage[],
  userQuestion: string,
): Promise<string> {
  if (!API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_GEMMA_API_KEY in your .env file.');
  }

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT(subject, grade) }],
    },
    contents: [...history, { role: 'user', parts: [{ text: userQuestion }] }],
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.4,
    },
  };

  const res = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemma API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!text) throw new Error('Empty response from Gemma.');
  return text.trim();
}
