import { Grade, Language, ModelQuality, Subject } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMMA_API_KEY ?? '';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

export const MODEL_CONFIG: Record<
  ModelQuality,
  { id: string; label: string; emoji: string; desc: string; isGemma: boolean }
> = {
  fast: {
    id: 'gemini-2.5-flash',
    emoji: '⚡',
    label: 'Fast',
    desc: 'Quick answers, less data',
    isGemma: false,
  },
  smart: {
    id: 'gemma-4-26b-a4b-it',
    emoji: '🧠',
    label: 'Smart',
    desc: 'Deeper explanations',
    isGemma: true,
  },
  expert: {
    id: 'gemma-4-31b-it',
    emoji: '🏆',
    label: 'Expert',
    desc: 'Most thorough answers',
    isGemma: true,
  },
};

export const LANGUAGE_CONFIG: Record<
  Language,
  { flag: string; prompt: string }
> = {
  English: { flag: '🇬🇧', prompt: '' },
  Hindi: {
    flag: '🇮🇳',
    prompt: 'Reply in simple Hindi (Hinglish is fine if it helps clarity). ',
  },
  Spanish: { flag: '🇪🇸', prompt: 'Reply in simple Spanish. ' },
  Swahili: { flag: '🇰🇪', prompt: 'Reply in simple Swahili. ' },
  French: { flag: '🇫🇷', prompt: 'Reply in simple French. ' },
  Bengali: { flag: '🇧🇩', prompt: 'Reply in simple Bengali. ' },
};

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

const MATH_RULE =
  'Write all math in plain text only. Never use LaTeX or dollar-sign notation. ' +
  'Good: "x = (-b plus-or-minus sqrt(b squared minus 4ac)) divided by 2a". Bad: "$x = \\frac{-b}{2a}$".';

export const buildSystemPrompt = (
  subject: Subject,
  grade: Grade,
  language: Language,
): string =>
  [
    LANGUAGE_CONFIG[language].prompt,
    'You are EduReach, a friendly AI tutor for students in rural and underserved communities.',
    'You are teaching ' + subject + ' to a Grade ' + grade + ' student.',
    GRADE_INSTRUCTIONS[grade],
    'Keep answers under 100 words.',
    'Be warm and encouraging.',
    'End with one short follow-up question.',
    'Reply directly to the student with no preamble or meta-commentary.',
    MATH_RULE,
  ]
    .filter(Boolean)
    .join(' ');

export interface GemmaMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface ParsedResponse {
  answer: string;
  thinking: string | null;
  actualModel: string; // always set — which model actually answered
  usedFallback?: boolean; // true when a different model was used than requested
}

/**
 * Parse Gemma 4's structured thinking output.
 * Gemma 4 wraps reasoning in: <|channel>thought ... <channel|>
 * We separate this from the final answer so the UI can show/hide it.
 */
function parseGemmaResponse(raw: string): Omit<ParsedResponse, 'actualModel'> {
  // Try structured channel tags first (Gemma 4 native format)
  const channelRegex = /<\|channel>thought([\s\S]*?)<channel\|>/i;
  const channelMatch = raw.match(channelRegex);
  if (channelMatch) {
    return {
      thinking: channelMatch[1].trim(),
      answer: raw.replace(channelRegex, '').trim(),
    };
  }

  // Try <think>...</think> tags (some serving frameworks use this)
  const thinkRegex = /<think>([\s\S]*?)<\/think>/i;
  const thinkMatch = raw.match(thinkRegex);
  if (thinkMatch) {
    return {
      thinking: thinkMatch[1].trim(),
      answer: raw.replace(thinkRegex, '').trim(),
    };
  }

  // No structured thinking found — return as-is
  return { answer: raw.trim(), thinking: null };
}

export async function askGemma(
  subject: Subject,
  grade: Grade,
  language: Language,
  model: ModelQuality,
  history: GemmaMessage[],
  userQuestion: string,
  deepThinking = false,
): Promise<ParsedResponse> {
  if (!API_KEY) throw new Error('Missing EXPO_PUBLIC_GEMMA_API_KEY');

  const { id: modelId, isGemma } = MODEL_CONFIG[model];
  const url = BASE_URL + modelId + ':generateContent?key=' + API_KEY;

  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: 2048,
    temperature: 0.4,
  };
  // Note: thinkingConfig (thinkingBudget) is only available when running
  // Gemma 4 locally via HuggingFace or vLLM. The Google AI Studio REST
  // API does not support it — we control thinking via the deepThinking
  // flag in the UI and parse the response accordingly.

  const body = {
    system_instruction: {
      parts: [{ text: buildSystemPrompt(subject, grade, language) }],
    },
    contents: [...history, { role: 'user', parts: [{ text: userQuestion }] }],
    generationConfig,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('API error for model ' + modelId + ':', res.status, err);

    // gemma-4-31b-it is prone to 500 errors on the free tier (overloaded).
    // Automatically fall back to gemma-4-26b-a4b-it on server errors.
    if (res.status >= 500 && modelId === MODEL_CONFIG.expert.id) {
      console.warn('Expert model unavailable, falling back to Smart model...');
      const fallbackUrl =
        BASE_URL + MODEL_CONFIG.smart.id + ':generateContent?key=' + API_KEY;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        const fallbackParts =
          fallbackData?.candidates?.[0]?.content?.parts ?? [];
        const fallbackText = fallbackParts
          .map((p: { text?: string }) => p.text ?? '')
          .join('');
        if (fallbackText) {
          const parsed = parseGemmaResponse(fallbackText);
          return {
            ...parsed,
            actualModel: MODEL_CONFIG.smart.id,
            usedFallback: true,
          };
        }
      }
    }

    throw new Error('Gemma API error ' + res.status + ': ' + err);
  }

  const data = await res.json();

  // Gemma 4 may return thinking in a separate part with type "thinking"
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  let thinkingText = '';
  let answerText = '';

  for (const part of parts) {
    if (part.thought === true || part.type === 'thinking') {
      thinkingText += part.text ?? '';
    } else {
      answerText += part.text ?? '';
    }
  }

  // If we got structured parts, use them
  if (answerText) {
    return {
      answer: answerText.trim(),
      thinking: thinkingText.trim() || null,
      actualModel: modelId,
    };
  }

  // Fallback: parse from raw text
  const rawText = parts.map((p: { text?: string }) => p.text ?? '').join('');
  if (!rawText) throw new Error('Empty response from Gemma.');

  const parsed = parseGemmaResponse(rawText);
  return { ...parsed, actualModel: modelId };
}
