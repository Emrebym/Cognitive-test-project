<div align="center">

# 🧠 Cognitive Test Project

**A bilingual cognitive assessment app with multiple test types, IQ scoring, and adaptive difficulty**

![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)

</div>

---

## 📖 About

A React-based cognitive assessment application that evaluates users through various scientifically-informed test types. Features bilingual English/Turkish support, IQ score calculation based on performance, theme customization, and a comprehensive question bank. Built for pre-employment assessments and self-evaluation.

## ✨ Features

- **Multiple test types** — diverse cognitive challenges:
  - 🔢 **N-Back memory** — recall items from N steps ago
  - 📐 **Spatial grid** — remember and reproduce spatial patterns
  - 📖 **Story recall** — read passages and answer comprehension questions
  - 🔷 **Pattern recognition** — identify sequences and logical patterns
  - 🧮 **Mathematical reasoning** — solve numeric and logic problems
- **Bilingual support** — complete EN/TR language toggle with full translations
- **IQ scoring algorithm** — weighted calculation across test categories
- **Theme system** — custom hook (`useThemeColors`) for dynamic theming
- **Context-based state** — React Context API for global state management
- **Question bank** — large curated question dataset with difficulty levels
- **Progress tracking** — visual progress through the assessment
- **Pause & resume** — save progress and continue later

## 🏗️ Architecture

```
src/
├── App.jsx                    # Main app — routing between test sections
├── main.jsx                   # React entry point
├── contexts.js                # React Context for global state (language, scores, progress)
├── data/
│   ├── questionBank.js        # Full question dataset with categories & difficulty
│   └── translations.js        # EN/TR translation strings
├── utils/
│   ├── iqCalculation.js       # IQ scoring algorithm (weighted by category)
│   └── helpers.js             # Utility functions (shuffling, timing, formatting)
├── hooks/
│   └── useThemeColors.js      # Dynamic theme color hook
└── styles/
    └── global.css             # Global styles and CSS variables
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build | Vite 6 |
| State | React Context API |
| i18n | Custom translation system (EN/TR) |
| Scoring | Custom IQ calculation algorithm |
| Theming | Custom useThemeColors hook |

## 🚀 Getting Started

```bash
git clone https://github.com/Emrebym/Cognitive-test-project.git
cd Cognitive-test-project
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## 📝 License

MIT
