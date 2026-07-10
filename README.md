# IELTS Evaluator & Feedback Engine

A full-stack, AI-powered IELTS preparation tool designed to evaluate student writing and speaking submissions. Powered by the Gemini API, this tool analyzes responses against the official IELTS public band descriptors, providing detailed scores, grammatical corrections, and actionable feedback.

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
*   **Resilient API Backend**: Features automatic exponential backoff retries and model fallbacks (using `gemini-2.5-flash`, `gemini-3.5-flash`, and `gemini-1.5-flash`) to ensure high availability and bypass API overload.

---

## Tech Stack

*   **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React (for UI icons), Motion (for smooth layout animations), and Vite.
*   **Backend**: Node.js Express server configured with the new `@google/genai` SDK and dotenv.

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
   Create a `.env` file in the root directory (based on `.env.example`) and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

### Running Locally

To run the development server (which starts the Express API and Vite frontend together):
```bash
npm run dev
```

Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)** to view the application.

---

## How it Works

1. **Submission**: The React frontend captures the IELTS writing or speaking text submission.
2. **API Request**: The text is sent to the `/api/evaluate` endpoint on the Express server.
3. **AI Generation**: The backend uses the Google Gen AI SDK to ask Gemini for a structured evaluation based on a certified IELTS examiner prompt.
4. **Resiliency Layer**: If the primary Gemini model is unavailable or encounters transient 503 limits, the server waits, retries, or falls back to alternative models.
5. **Interactive Report**: The frontend receives the structured JSON response and renders an interactive dashboard showing criteria breakdowns, color-coded corrections, strengths, weaknesses, and custom metrics (such as word count and estimated speaking time).