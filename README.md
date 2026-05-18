# EduReach 🌍

### Offline-First AI Tutor for Underserved Students

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

> Built for the [Gemma 4 Good Hackathon](https://www.kaggle.com/competitions/gemma-4-good-hackathon) · Kaggle × Google DeepMind

---

## The Problem

Powerful AI tutors exist — but they require stable internet, a modern device, and often cost money. This makes them useless for the 260 million children worldwide who are out of school, or the hundreds of millions in rural communities with unreliable connectivity.

**EduReach is built for the students that current AI tools leave behind.**

---

<!-- ## App Preview -->

<!-- Add screenshots here after recording -->

<!-- | Home Screen  | Chat         | Quiz Me      | Offline Mode |
| ------------ | ------------ | ------------ | ------------ |
| _screenshot_ | _screenshot_ | _screenshot_ | _screenshot_ | -->

<!-- > 📹 **Demo Video:** _link coming soon_ -->

---

## What It Does

EduReach is a React Native mobile app giving students a personal AI tutor across Math, Science, and English — powered by **Gemma 4**.

### Core Features

- 🎓 **Grade-adaptive tutoring** — Grades 1–10, each with a distinct pedagogical approach calibrated to the student's level
- 🌐 **6 languages** — English, Hindi, Spanish, Swahili, French, Bengali with native-language prompting (not translation)
- 📡 **Offline-first queue** — Questions saved locally when offline with full conversation context, auto-answered on reconnect
- 🤖 **Multi-model routing** — Fast (Gemini 2.5 Flash), Smart (Gemma 4 26B MoE), Expert (Gemma 4 31B)
- 🧩 **Deep Thinking mode** — Toggle Gemma 4 reasoning; collapsible thinking accordion per response
- 🧪 **Quiz Me** — One tap generates 3 multiple-choice questions based on any explanation, with instant feedback and scoring
- ↺ **Explain differently** — One tap re-teaches the same concept with a new analogy
- 🔥 **Daily streak** — Tracks consecutive learning days to build study habits
- 📋 **Copy on long-press** — Copy any message to clipboard
- 🔄 **Graceful model fallback** — Auto-falls back to Smart if Expert is unavailable, shown transparently
- 🏷️ **Model badge** — Every AI response shows which model answered it

---

## Prize Track Alignment

### 🌵 Cactus Prize — Local-First Mobile Application

EduReach routes intelligently between three Gemma 4 model tiers. All data (chat history, offline queue, progress, streaks) is stored locally on-device. Architecture designed to swap the cloud API for on-device Gemma 4 E2B/E4B with a single config change.

### 🌍 Digital Equity & Inclusivity Track

6-language native prompting, Grade 1–10 calibration, works on ₹8,000 Android phones, offline queue ensures no question is ever lost due to poor connectivity.

### 📚 Future of Education Track

Grade-adaptive tutoring depth, Quiz Me for active recall, "Explain differently" for re-teaching, daily streak for habit formation, follow-up questions on every answer.

---

## Architecture

```
EduReach/
├── src/
│   ├── screens/
│   │   ├── SubjectPickerScreen.tsx   # Grade + Language + Model + Subject selection
│   │   └── ChatScreen.tsx            # Chat, offline support, quiz, deep thinking
│   ├── services/
│   │   ├── gemmaService.ts           # Multi-model routing, thinking parser, fallback
│   │   ├── quizService.ts            # Quiz generation via Gemini 2.5 Flash
│   │   ├── streakService.ts          # Daily streak tracking
│   │   ├── offlineQueue.ts           # Queue with history snapshot, dedup, size cap
│   │   └── progressService.ts        # Per-subject question count
│   ├── components/
│   │   ├── SimpleMarkdown.tsx        # Lightweight markdown renderer
│   │   └── OfflineBanner.tsx         # Offline status + queue count
│   ├── hooks/
│   │   └── useNetworkStatus.ts       # Real-time NetInfo wrapper
│   └── navigation/AppNavigator.tsx
```

### Offline Queue Design

```
Student asks question (no internet)
  → Saved to AsyncStorage with full conversation snapshot
  → Capped at 20 items, deduplicated by content
  → Shown as "⏳ Queued — will send when online"
  → NetInfo detects reconnection
  → Queue flushed in order using saved history snapshot
  → Answer shown; removed from queue only after confirmed response
```

### Multi-Model Routing

```
User selects Fast | Smart | Expert
  → Routes to correct model endpoint
  → Expert returns 500 → auto-retry with Smart model
  → Response tagged with actualModel for transparency
  → Gemma 4 thought tags parsed → collapsible thinking accordion
```

### Quiz Generation

```
Student taps "Quiz me" on any AI response
  → Explanation sent to Gemini 2.5 Flash with JSON schema prompt
  → 3 multiple-choice questions generated
  → Displayed inline with A/B/C/D options
  → Instant green/red feedback + explanation on answer
  → Score shown on completion
```

---

## Gemma 4 Integration

| Model  | ID                 | Use Case                            |
| ------ | ------------------ | ----------------------------------- |
| Fast   | gemini-2.5-flash   | Quick answers, low data             |
| Smart  | gemma-4-26b-a4b-it | Deeper explanations, MoE efficiency |
| Expert | gemma-4-31b-it     | Most thorough, advanced grades      |

Gemma 4's structured reasoning output is parsed from `<|channel>thought` tags and shown as a collapsible "Thinking process..." accordion per response — the same UX pattern as Google AI Studio.

The system prompt is assembled dynamically from five components: language prefix, persona, subject and grade, grade-specific instruction (10 distinct strings), and a math formatting rule that prevents LaTeX rendering issues.

---

## Setup

```bash
git clone https://github.com/KushalBhanot/EduReach.git
cd EduReach
yarn install

# Add your free API key from aistudio.google.com
echo "EXPO_PUBLIC_GEMMA_API_KEY=your_key_here" > .env

npx expo start
# Press 'a' for Android, 'i' for iOS simulator
```

---

## Social Impact

Target users are students in rural India, Sub-Saharan Africa, and Southeast Asia on ₹8,000–₹15,000 Android phones with intermittent 2G/3G connectivity. Private tutoring in India costs ₹500–₹2,000/month. EduReach is free.

The offline queue is the core differentiator — a student can ask questions on the walk to school with no signal, and get every answer automatically when they reach WiFi. No question is ever lost.

---

## Built By

**Kushal Bhanot** — SDE, incoming MSCS at USC
[LinkedIn](https://linkedin.com/in/kushalbhanot) · [GitHub](https://github.com/KushalBhanot)

---

## License

[CC-BY 4.0](LICENSE) — required by the Gemma 4 Good Hackathon rules.
