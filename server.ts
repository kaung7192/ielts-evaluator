import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API endpoint for IELTS Evaluation
  app.post('/api/evaluate', async (req, res) => {
    try {
      const { type, taskType, promptText, submissionText } = req.body;

      if (!submissionText || submissionText.trim().length < 10) {
        return res.status(400).json({ error: 'Submission text is too short or empty.' });
      }

      const isWriting = type === 'writing';
      const taskLabel = isWriting 
        ? (taskType === 'task1' ? 'Academic/General Task 1 (Report/Letter)' : 'Academic/General Task 2 (Essay)')
        : `Speaking ${taskType === 'part1' ? 'Part 1 (Introduction/Interview)' : taskType === 'part2' ? 'Part 2 (Long Turn/Cue Card)' : 'Part 3 (Discussion)'}`;

      const promptMsg = `You are a certified, senior IELTS examiner with over 15 years of experience grading official IELTS exams.
Evaluate the following IELTS candidate submission.

--- SUBMISSION METADATA ---
Type: ${type.toUpperCase()} (${taskLabel})
Target Band: 8.0
${promptText ? `IELTS Question/Topic: "${promptText}"` : 'Question/Topic: General Practice'}

--- CANDIDATE SUBMISSION ---
"${submissionText}"

--- EVALUATION REQUIREMENTS ---
Grade the response strictly according to the official IELTS public band descriptors.
Provide scoring across the four core IELTS criteria on a scale of 1.0 to 9.0 in steps of 0.5 (e.g. 5.5, 6.0, 6.5, etc.):
1. Task Achievement / Task Response (representing how well the candidate answered the prompt).
2. Coherence and Cohesion (paragraphing, sequencing, cohesive devices, and flow).
3. Lexical Resource (vocabulary choice, collocation, spelling, and range).
4. Grammatical Range and Accuracy (sentence variety, grammar errors, punctuation, and range).

Also calculate the overall band score (average of the four, rounded to the nearest half/whole band, e.g. 6.25 -> 6.5, 6.75 -> 7.0).

In addition, provide:
- High-quality metrics feedback explaining why they received this score for each metric.
- Actionable corrections matrix: Identify grammatical, spelling, lexical, or structural mistakes, showing:
  - original text segment
  - corrected version
  - explanation of the mistake and the correction
  - severity ('low', 'medium', 'high')
  - metric it belongs to ('taskAchievement', 'coherenceCohesion', 'lexicalResource', 'grammaticalRange')
- General lists of Strengths, Weaknesses, and Actionable Steps.
- Word count of the submission.
- Estimated speaking time in seconds (if speaking).`;

      const requestParams = {
        contents: promptMsg,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bandScores: {
                type: Type.OBJECT,
                properties: {
                  taskAchievement: { type: Type.NUMBER, description: 'Band score from 1 to 9 (step of 0.5)' },
                  coherenceCohesion: { type: Type.NUMBER, description: 'Band score from 1 to 9 (step of 0.5)' },
                  lexicalResource: { type: Type.NUMBER, description: 'Band score from 1 to 9 (step of 0.5)' },
                  grammaticalRange: { type: Type.NUMBER, description: 'Band score from 1 to 9 (step of 0.5)' }
                },
                required: ['taskAchievement', 'coherenceCohesion', 'lexicalResource', 'grammaticalRange']
              },
              overallBand: { type: Type.NUMBER, description: 'Calculated official band score (rounded)' },
              metricsFeedback: {
                type: Type.OBJECT,
                properties: {
                  taskAchievement: { type: Type.STRING },
                  coherenceCohesion: { type: Type.STRING },
                  lexicalResource: { type: Type.STRING },
                  grammaticalRange: { type: Type.STRING }
                },
                required: ['taskAchievement', 'coherenceCohesion', 'lexicalResource', 'grammaticalRange']
              },
              corrections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    metric: { type: Type.STRING, description: "One of 'taskAchievement', 'coherenceCohesion', 'lexicalResource', 'grammaticalRange'" },
                    originalText: { type: Type.STRING, description: 'The exact substring from the submission that has the error' },
                    correctedText: { type: Type.STRING, description: 'The corrected substring or suggestion' },
                    explanation: { type: Type.STRING, description: 'Why this correction is suggested and what rule applies' },
                    severity: { type: Type.STRING, description: "'low', 'medium', or 'high'" }
                  },
                  required: ['id', 'metric', 'originalText', 'correctedText', 'explanation', 'severity']
                }
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              weaknesses: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              actionableAdvice: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              wordCount: { type: Type.INTEGER },
              estimatedSpeakingTimeSeconds: { type: Type.INTEGER }
            },
            required: ['bandScores', 'overallBand', 'metricsFeedback', 'corrections', 'strengths', 'weaknesses', 'actionableAdvice', 'wordCount']
          }
        }
      };

      let response;
      let lastError;
      const modelsToTry = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-1.5-flash'];

      for (const modelName of modelsToTry) {
        let attempts = 0;
        const maxAttempts = 3;
        let success = false;

        while (attempts < maxAttempts) {
          try {
            console.log(`[IELTS Platform Server] Attempting evaluation with model ${modelName} (Attempt ${attempts + 1}/${maxAttempts})...`);
            response = await ai.models.generateContent({
              model: modelName,
              ...requestParams
            });
            success = true;
            break;
          } catch (error: any) {
            lastError = error;
            attempts++;
            console.warn(`[IELTS Platform Server] Attempt ${attempts} failed for model ${modelName}:`, error.message || error);
            
            // Check if error is transient (e.g. 503, 429, high demand) to wait and retry
            const isTransient = error.status === 'UNAVAILABLE' || 
                                error.status === 'RESOURCE_EXHAUSTED' || 
                                error.message?.includes('503') || 
                                error.message?.includes('429') ||
                                error.message?.toLowerCase().includes('demand') ||
                                error.message?.toLowerCase().includes('unavailable');

            if (isTransient && attempts < maxAttempts) {
              const waitTime = Math.pow(2, attempts) * 1000;
              console.log(`[IELTS Platform Server] Transient error encountered. Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
              break; // If not transient, or out of attempts, stop loop and fall back to the next model
            }
          }
        }
        if (success) {
          console.log(`[IELTS Platform Server] Successfully evaluated submission using model: ${modelName}`);
          break;
        }
      }

      if (!response) {
        throw lastError || new Error('All model attempts failed.');
      }

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini.');
      }

      const result = JSON.parse(responseText.trim());
      res.json(result);
    } catch (error: any) {
      console.error('Error in IELTS Evaluation:', error);
      res.status(500).json({ error: error.message || 'An error occurred during IELTS evaluation.' });
    }
  });

  // Integration with Vite dev server or serving static production build
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[IELTS Platform Server] Listening on http://0.0.0.0:${port} (Mode: ${isProd ? 'Production' : 'Development'})`);
  });
}

startServer();
