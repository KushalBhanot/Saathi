import { Grade, Language, QuizQuestion, Subject } from '../types';
import { buildSystemPrompt, GemmaMessage } from './gemmaService';

const API_KEY = process.env.EXPO_PUBLIC_GEMMA_API_KEY ?? '';
const BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Generate 3 multiple-choice quiz questions based on the last AI explanation.
 * Uses Gemini 2.5 Flash (Fast model) always — quizzes don't need deep reasoning,
 * they need reliable JSON output.
 */
export async function generateQuiz(
  subject: Subject,
  grade: Grade,
  language: Language,
  lastExplanation: string,
): Promise<QuizQuestion[]> {
  if (!API_KEY) throw new Error('Missing EXPO_PUBLIC_GEMMA_API_KEY');

  const prompt = [
    'Based on this explanation for a Grade ' +
      grade +
      ' ' +
      subject +
      ' student:',
    '---',
    lastExplanation,
    '---',
    'Generate exactly 3 multiple-choice questions to test understanding.',
    'Each question must have exactly 4 options (A, B, C, D) and one correct answer.',
    'Keep questions appropriate for Grade ' +
      grade +
      '. Keep each option under 8 words.',
    language !== 'English' ? 'Write the questions in ' + language + '.' : '',
    '',
    'Reply with ONLY a valid JSON array, no markdown, no explanation:',
    '[',
    '  {',
    '    "question": "Question text here?",',
    '    "options": ["Short answer A", "Short answer B", "Short answer C", "Short answer D"],',
    '    "correctIndex": 0,',
    '    "explanation": "Brief explanation of why this is correct."',
    '  }',
    ']',
  ]
    .filter(Boolean)
    .join('\n');

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
  };

  const res = await fetch(BASE_URL + '?key=' + API_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Quiz API error:', res.status, errText);
    throw new Error('Quiz generation failed: ' + res.status + ' ' + errText);
  }

  const data = await res.json();
  const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Strip markdown fences if present
  const cleaned = raw.replace(/```json|```/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned) as QuizQuestion[];
    // Validate structure
    if (!Array.isArray(parsed) || parsed.length === 0)
      throw new Error('Invalid quiz format');
    return parsed.slice(0, 3);
  } catch (parseErr) {
    console.error('Quiz parse error:', parseErr, 'Raw:', cleaned.slice(0, 300));
    throw new Error('Could not parse quiz response');
  }
}
