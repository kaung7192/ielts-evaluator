# IELTS Evaluator & Feedback Engine (Frontend Client)

This repository contains the interactive frontend single-page application for the IELTS Evaluator & Feedback Engine. It is built in React, TypeScript, and Tailwind CSS. 

To protect commercial prompts, scoring configurations, and API keys for launch, the backend grading server is maintained in a separate private repository.

---

## Key Features

*   **Multimodal Evaluation**: Supports both **Writing** (Academic/General Task 1 and Task 2) and **Speaking** (Part 1, Part 2, and Part 3) modes.
*   **Criteria-Based Scoring**: Scores candidate submissions across the four official IELTS criteria on a 1.0 to 9.0 scale:
    1.  Task Achievement / Task Response
    2.  Coherence and Cohesion
    3.  Lexical Resource
    4.  Grammatical Range and Accuracy
*   **Detailed Overall Score**: Calculates the official overall band score, rounded to the nearest half or whole band.
*   **Actionable Corrections Matrix**: Highlights spelling, grammatical, lexical, and structural mistakes with original text, suggested corrections, explanation of rules, severity levels, and the criteria they affect.
*   **General Feedback Lists**: Automatically compiles candidate's Strengths, Weaknesses, and clear, actionable steps for improvement.

---

## Tech Stack (Frontend)

*   **Framework**: React 19, TypeScript, Vite.
*   **Styling**: Tailwind CSS.
*   **Animations**: Motion.
*   **Icons**: Lucide React.

---

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kaung7192/ielts-evaluator.git
   cd ielts-evaluator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory and specify the URL of the running backend server:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

### Running Locally

To run the development server:
```bash
npm run dev
```

Open your browser and navigate to the local address shown in the terminal (usually **[http://localhost:5173](http://localhost:5173)**).

---

## How it Works

1. **Submission**: The React frontend captures the IELTS writing or speaking text submission.
2. **API Request**: The client sends the submission details to the `/api/evaluate` endpoint of the backend API specified by the `VITE_API_URL` environment variable.
3. **AI Generation**: The private backend server handles the request, securely querying Gemini API models with custom-tailored grading prompts and schemas.
4. **Interactive Report**: The frontend parses the structured JSON payload and renders an interactive dashboard showing criteria breakdowns, inline corrections, and advice lists.