# EduReach 🌍

### Offline-First AI Tutor for Underserved Students

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

> Built for the [Gemma 4 Good Hackathon](https://www.kaggle.com/competitions/gemma-4-good-hackathon) · Kaggle × Google DeepMind

---

## The Problem

Powerful AI tutors exist — but they require stable internet, a modern device, and often cost money. This makes them useless for the 260 million children worldwide who are out of school, or the hundreds of millions in rural communities with unreliable connectivity.

**EduReach is built for the students that current AI tools leave behind.**

---

## What It Does

EduReach is a React Native mobile app giving students a personal AI tutor across Math, Science, and English — powered by **Gemma 4**.

### Core Features

- 🎓 **Grade-adaptive tutoring** — Grades 1–10, each with calibrated language and depth
- 🌐 **6 languages** — English, Hindi, Spanish, Swahili, French, Bengali
- 📡 **Offline-first queue** — Questions saved locally when offline, auto-answered on reconnect
- 🤖 **Multi-model routing** — Fast (Gemini 2.5 Flash), Smart (Gemma 4 26B MoE), Expert (Gemma 4 31B)
- 🧩 **Deep Thinking mode** — Toggle Gemma 4 reasoning; view collapsible thinking accordion per response
- ↺ **Explain differently** — One tap to get a fresh analogy if the first didn't land
- 📋 **Copy on long-press** — Copy any message to clipboard
- 🔄 **Graceful model fallback** — Auto-falls back to Smart if Expert is unavailable, with clear indication
- 📊 **Progress tracking** — Questions asked per subject, persisted locally

---

## Prize Track Alignment

### 🌵 Cactus Prize — Local-First Mobile Application

EduReach is a **local-first mobile app** that intelligently routes between three Gemma 4 model tiers. All data (chat history, offline queue, progress) is stored locally. Architecture is designed to swap the cloud API for on-device Gemma 4 E2B/E4B with one config change.

### 🌍 Digital Equity & Inclusivity Track

6-language support, Grade 1–10 calibration, works on ₹8,000 Android phones, offline queue ensures no question is lost due to poor connectivity.

### 📚 Future of Education Track

Adaptive tutoring per grade, "Explain differently" re-teaches with new analogies, follow-up questions on every answer, multi-model depth selection.

---

## Architecture

```
EduReach/
├── src/
│   ├── screens/
│   │   ├── SubjectPickerScreen.tsx   # Grade + Language + Model + Subject selection
│   │   └── ChatScreen.tsx            # Chat UI, offline support, deep thinking
│   ├── services/
│   │   ├── gemmaService.ts           # Multi-model routing, thinking parser, fallback
│   │   ├── offlineQueue.ts           # Queue with history snapshot, dedup, size cap
│   │   └── progressService.ts        # Per-subject progress tracking
│   ├── components/
│   │   ├── SimpleMarkdown.tsx        # Lightweight markdown renderer
│   │   └── OfflineBanner.tsx         # Offline status + queue count
│   ├── hooks/
│   │   └── useNetworkStatus.ts       # Real-time NetInfo wrapper
│   └── navigation/AppNavigator.tsx
```

### Offline Queue Design

```
Student asks question offline
  → Saved to AsyncStorage (max 20, deduped, with history snapshot)
  → Shown as "⏳ Queued"
  → NetInfo detects reconnection
  → Queue flushed using saved history snapshot
  → Answer shown; removed from queue only on success
```

### Multi-Model Routing

```
User selects Fast | Smart | Expert
  → Routes to correct model endpoint
  → Expert 500 → auto-retry with Smart
  → Response tagged with actualModel
  → Gemma 4 thought tags parsed → collapsible accordion
```

---

## Gemma 4 Integration

| Model  | ID                 | Use Case                       |
| ------ | ------------------ | ------------------------------ |
| Fast   | gemini-2.5-flash   | Quick answers, low data        |
| Smart  | gemma-4-26b-a4b-it | Deeper explanations, MoE       |
| Expert | gemma-4-31b-it     | Most thorough, advanced grades |

Gemma 4's structured reasoning output is parsed from channel tags and shown as a collapsible "Thinking process..." accordion — same UX pattern as Google AI Studio.

---

## Setup

```bash
git clone https://github.com/KushalBhanot/EduReach.git
cd EduReach
yarn install
echo "EXPO_PUBLIC_GEMMA_API_KEY=your_key_here" > .env
npx expo start
```

Get a free API key at [aistudio.google.com](https://aistudio.google.com). Press `a` for Android, `i` for iOS.

---

## Social Impact

Target users are students in rural India, Sub-Saharan Africa, and Southeast Asia on ₹8,000–₹15,000 Android phones with intermittent 2G/3G. Private tutoring costs ₹500–₹2,000/month in India. EduReach is free. The offline queue means no question is lost even without connectivity.

---

## Built By

**Kushal Bhanot** — SDE, incoming MSCS at USC  
[LinkedIn](https://linkedin.com/in/kushalbhanot) · [GitHub](https://github.com/KushalBhanot)

---

## License

[CC-BY 4.0](LICENSE) — required by the Gemma 4 Good Hackathon rules.
