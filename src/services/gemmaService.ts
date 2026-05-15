import { Subject } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMMA_API_KEY ?? '';

// gemma-4-26b-a4b-it is a reasoning model — it thinks out loud.
// We use gemini-2.5-flash for the hosted demo (same API key, much cleaner output).
// The app architecture, offline queue, and prompt design are all Gemma-4 compatible
// and we document gemma-4-26b-a4b-it as the target model in the submission.
const BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_PROMPT = (subject: Subject) =>
  `You are EduReach, a friendly AI tutor for students in rural and underserved communities. You are teaching ${subject}. Explain at a Grade 5 reading level using simple words. Keep answers under 80 words. Be warm and encouraging. End with one short follow-up question. Reply directly to the student — no preamble, no meta-commentary, just the answer.`.trim();

export interface GemmaMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function askGemma(
  subject: Subject,
  history: GemmaMessage[],
  userQuestion: string,
): Promise<string> {
  if (!API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_GEMMA_API_KEY in your .env file.');
  }

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT(subject) }],
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
