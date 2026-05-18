# EduReach 🌍

**Offline-First AI Tutor for Underserved Students**

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

Built for the [Gemma 4 Good Hackathon](https://www.kaggle.com/competitions/gemma-4-good-hackathon) · Kaggle × Google DeepMind

---

## App Preview

| Home Screen | Chat | Quiz Me |
| ----------- | ---- | ------- |
|             |      |         |

<!-- 📹 **Demo Video:** _coming soon_ -->

---

## The Problem

Powerful AI tutors exist, but they require stable internet, a modern device, and often cost money. This makes them useless for the 260 million children worldwide who are out of school, or the hundreds of millions in rural communities with unreliable connectivity.

EduReach is built for the students that current AI tools leave behind.

---

## Features

- 🎓 **Grade-adaptive tutoring** — Grades 1 to 10, each with a distinct pedagogical approach calibrated to the student's level
- 🌐 **6 languages** — English, Hindi, Spanish, Swahili, French, Bengali with native-language prompting, not translation
- 📡 **Offline-first queue** — Questions saved locally with full conversation context, auto-answered when connectivity returns
- 🤖 **Multi-model routing** — Fast (Gemini 2.5 Flash), Smart (Gemma 4 26B MoE), Expert (Gemma 4 31B)
- 🧩 **Deep Thinking mode** — Toggle Gemma 4 reasoning with a collapsible thinking accordion per response
- 🧪 **Quiz Me** — One tap generates 3 multiple-choice questions from any explanation, with instant feedback and scoring
- ↺ **Explain differently** — Re-teaches the same concept with a new analogy on one tap
- 🔥 **Daily streak** — Tracks consecutive learning days to build study habits
- 📋 **Copy on long-press** — Copy any message to clipboard
- 🔄 **Graceful model fallback** — Auto-retries with Smart if Expert is unavailable, shown transparently to the student
- 🏷️ **Model badge** — Every AI response shows which model answered it

---

## Prize Tracks

**Cactus Prize** — EduReach routes between three Gemma 4 model tiers and stores all data locally on-device. The architecture is designed to swap the cloud API for on-device Gemma 4 E2B/E4B with a single config change.

**Digital Equity and Inclusivity** — 6-language native prompting, Grade 1 to 10 calibration, works on low-end Android phones, offline queue ensures no question is lost due to poor connectivity.

**Future of Education** — Grade-adaptive depth, Quiz Me for active recall, Explain differently for re-teaching, daily streak for habit formation.

---

## Architecture

```
EduReach/
├── src/
│   ├── screens/
│   │   ├── SubjectPickerScreen.tsx
│   │   └── ChatScreen.tsx
│   ├── services/
│   │   ├── gemmaService.ts       # Multi-model routing, thinking parser, fallback
│   │   ├── quizService.ts        # Quiz generation
│   │   ├── streakService.ts      # Daily streak tracking
│   │   ├── offlineQueue.ts       # Queue with history snapshot and dedup
│   │   └── progressService.ts
│   ├── components/
│   │   ├── SimpleMarkdown.tsx
│   │   └── OfflineBanner.tsx
│   ├── hooks/
│   │   └── useNetworkStatus.ts
│   └── navigation/AppNavigator.tsx
```

**Offline queue flow**

A student asks a question with no internet. The question is saved to AsyncStorage alongside a snapshot of the conversation history at that moment. When NetInfo detects connectivity, the queue flushes in order using those saved snapshots, and each item is removed only after a confirmed API response.

**Multi-model routing**

The app routes to the selected model endpoint. If Expert returns a 500 error, it retries automatically with Smart and shows the student which model answered. Gemma 4 reasoning output is parsed from channel tags and shown in a collapsible accordion.

**Quiz generation**

The student taps Quiz Me on any AI response. That explanation is sent to Gemini 2.5 Flash with a strict JSON schema prompt. Three multiple-choice questions come back, displayed inline with A/B/C/D options, instant color feedback on each answer, and a score at the end.

---

## Gemma 4 Integration

| Model  | ID                 | Use Case                            |
| ------ | ------------------ | ----------------------------------- |
| Fast   | gemini-2.5-flash   | Quick answers, low data             |
| Smart  | gemma-4-26b-a4b-it | Deeper explanations, MoE efficiency |
| Expert | gemma-4-31b-it     | Most thorough, advanced grades      |

The system prompt is assembled dynamically from five components: a language prefix, persona, subject and grade, a grade-specific instruction string (10 distinct strings, one per grade), and a math formatting rule that prevents LaTeX from appearing as raw symbols.

---

## Setup

```bash
git clone https://github.com/KushalBhanot/EduReach.git
cd EduReach
yarn install
echo "EXPO_PUBLIC_GEMMA_API_KEY=your_key_here" > .env
npx expo start
```

Get a free API key at [aistudio.google.com](https://aistudio.google.com). Press `a` for Android or `i` for iOS simulator.

---

## Social Impact

Target users are students in rural India, Sub-Saharan Africa, and Southeast Asia on low-end Android phones with intermittent 2G/3G connectivity. Private tutoring in India costs ₹500 to ₹2,000 per month. EduReach is free.

The offline queue is the core differentiator. A student can ask questions on the walk to school with no signal and get every answer automatically when they reach WiFi. No question is ever lost.

---

## Built By

**Kushal Bhanot** — SDE, incoming MSCS at USC
[LinkedIn](https://linkedin.com/in/kushalbhanot) · [GitHub](https://github.com/KushalBhanot)

---

## License

[CC-BY 4.0](LICENSE)
