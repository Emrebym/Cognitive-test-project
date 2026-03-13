# 🧠 Cognitive Assessment

A comprehensive cognitive assessment tool with IQ estimation, built with React + Vite.

## Features

- **5 Cognitive Domains**: Working Memory, Attention & Focus, Logical Reasoning, Processing Speed, Verbal Intelligence
- **51+ Questions** across 4 difficulty levels (Easy → Expert)
- **12+ Question Types**: Sequences, reverse sequences, word recall, spatial grids, story recall, N-back, matrices, analogies, series, logic, pattern counting, timed math
- **Psychometric IQ Calculation**: Wechsler-style z-score mapping with difficulty weighting
- **Bilingual**: Full English / Turkish support
- **Dark / Light Mode**
- **Pause / Resume**: Timer freezes during pause
- **Detailed Report**: Composite score, IQ range, percentile, radar chart, section breakdown, difficulty analysis, question log

## IQ Scoring Method

```
Composite = (Weighted Accuracy × 0.70) + (Speed × 0.20) + (Consistency × 0.10)

IQ = 100 + ((Composite - 50) / 21.5) × 15

Where:
- Weighted Accuracy: Expert questions worth 4x, Hard 3x, Medium 2x, Easy 1x
- Speed: Ratio of time remaining when answering (only for correct answers)
- Consistency: Low variance in response times = higher score
```

## Setup

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── main.jsx              # Entry point
├── App.jsx               # Main app + all question components
├── contexts.js           # React contexts (Lang, Theme, Paused)
├── data/
│   ├── translations.js   # EN/TR translations
│   └── questionBank.js   # Question bank + section metadata
├── hooks/
│   └── useThemeColors.js # Theme color hook
├── utils/
│   ├── helpers.js        # shuffle, buildSections, difficulty colors
│   └── iqCalculation.js  # Psychometric IQ engine
└── styles/
    └── global.css        # Fonts, animations, resets
```

## Tech Stack

- **React 18** with hooks
- **Vite 6** for build tooling
- **JetBrains Mono** + **Outfit** fonts
- Zero external UI dependencies
