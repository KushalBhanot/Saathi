# EduReach 🌍

### Offline-First AI Tutor for Underserved Students

> Built for the [Gemma 4 Good Hackathon](https://www.kaggle.com/competitions/gemma-4-good-hackathon) · Kaggle × Google DeepMind

---

## The Problem

Powerful AI tutors exist — but they require a stable internet connection, a modern device, and often cost money. This makes them useless for the 260 million children worldwide who are out of school, or the hundreds of millions more in rural communities with unreliable connectivity.

**EduReach is built for the students that current AI tools leave behind.**

---

## What It Does

EduReach is a React Native mobile app that gives students a personal AI tutor across Math, Science, and English — powered by **Gemma 4**.

- 🧠 **AI-powered tutoring** — All answers are explained at a Grade 5 reading level, in simple language, with follow-up questions to keep students engaged
- 📡 **Offline-first** — Questions asked without internet are queued locally and automatically answered when connectivity is restored
- 📊 **Progress tracking** — Question history and topic coverage tracked per subject, persisted locally
- 🌐 **Works on low-end devices** — Designed for ₹8,000–₹15,000 Android phones common in rural India and Sub-Saharan Africa

---

## Demo

> 📱 Android APK and demo video coming soon

**Subjects supported:** Math · Science · English

**Sample interactions:**

- _"What are fractions?"_ → Simple explanation with a pizza analogy, follow-up question
- _"How do plants make food?"_ → Photosynthesis explained like watering a plant
- _"What is a noun?"_ → Grade 5 definition with relatable examples

---

## Architecture

```
EduReach/
├── src/
│   ├── screens/
│   │   ├── SubjectPickerScreen.tsx   # Home — choose Math, Science, English
│   │   └── ChatScreen.tsx            # AI chat interface with offline support
│   ├── services/
│   │   ├── gemmaService.ts           # Gemma 4 API integration
│   │   ├── offlineQueue.ts           # Queue questions when offline
│   │   └── progressService.ts        # Track topics per subject
│   ├── components/
│   │   ├── SimpleMarkdown.tsx        # Lightweight markdown renderer
│   │   └── OfflineBanner.tsx         # Offline status indicator
│   ├── hooks/
│   │   └── useNetworkStatus.ts       # Real-time network detection
│   ├── navigation/
│   │   └── AppNavigator.tsx          # React Navigation stack
│   └── types/
│       └── index.ts                  # Shared TypeScript types
├── App.tsx
└── .env                              # EXPO_PUBLIC_GEMMA_API_KEY
```

### How the offline queue works

```
User asks question (no internet)
        ↓
Question saved to AsyncStorage queue
        ↓
Message shown as "⏳ Queued"
        ↓
NetInfo detects connectivity restored
        ↓
Queue flushed → Gemma 4 API called
        ↓
Answer displayed in chat
```

---

## Gemma 4 Integration

EduReach uses the **Gemma 4 API** via Google AI Studio with a carefully crafted system prompt:

```
You are EduReach, a friendly AI tutor for students in rural and underserved
communities. Explain at a Grade 5 reading level using simple words. Keep
answers under 80 words. Be warm and encouraging. End with one short
follow-up question.
```

**Model:** `gemma-4-26b-a4b-it` (26B Mixture of Experts, 4B active parameters)  
**Why this model:** Designed for efficient inference, lower compute requirements, suitable for deployment in bandwidth-constrained environments.

**On-device roadmap:** The architecture is designed to swap the hosted API for an on-device model using [MediaPipe LLM Inference API](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference) or [LiteRT-LM](https://github.com/google-ai-edge/LiteRT-LM), enabling truly offline operation.

---

## Tech Stack

| Layer             | Technology                       |
| ----------------- | -------------------------------- |
| Mobile framework  | React Native + Expo              |
| Language          | TypeScript                       |
| Navigation        | React Navigation v7              |
| Local storage     | AsyncStorage                     |
| Network detection | @react-native-community/netinfo  |
| AI model          | Gemma 4 via Google AI Studio API |

---

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI
- Android Studio (for emulator) or physical Android device
- Google AI Studio API key ([get one free](https://aistudio.google.com))

### Installation

```bash
git clone https://github.com/KushalBhanot/EduReach.git
cd EduReach

# Install dependencies
yarn install

# Add your API key
echo "EXPO_PUBLIC_GEMMA_API_KEY=your_key_here" > .env

# Start the app
npx expo start
```

Press `a` for Android or `i` for iOS simulator.

---

## Social Impact

EduReach directly addresses the hackathon's core challenge: **making AI useful where infrastructure is lacking.**

**Target users:**

- Students in rural India, Sub-Saharan Africa, and Southeast Asia
- Schools with unreliable internet (2G/3G connectivity)
- Students who cannot afford private tutoring (average cost: ₹500–₹2000/month)

**The offline queue is the key innovation** — a student in a village with spotty connectivity can ask questions throughout the day. When the phone connects to WiFi at school or a local hotspot, all their questions are answered at once.

---

## Built By

**Kushal Bhanot** — Software Development Engineer  
[LinkedIn](https://linkedin.com/in/kushalbhanot) · [GitHub](https://github.com/KushalBhanot)

Incoming MSCS student at USC. Previously SDE at Dream Sports (Rario), building React Native gaming applications at scale.

---

## License

Apache 2.0 — in the spirit of Gemma 4's open license.
