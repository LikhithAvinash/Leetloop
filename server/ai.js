/**
 * ai.js — Gemini-powered AI module for LeetLoop.
 *
 * Two core capabilities:
 *   1. Smart Hint Generator   — progressive hints that track count automatically
 *   2. Solution Evaluator     — analyses pasted code, classifies optimal/brute,
 *                                assigns a score (0–3), and explains why
 *
 * Uses @google/generative-ai with model gemini-2.5-flash (per user's lab notebook).
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let model = null;

function getModel() {
  if (model) return model;
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.includes('your_gemini')) {
    throw new Error('GEMINI_API_KEY is not configured in server/.env');
  }
  const genAI = new GoogleGenerativeAI(key);
  model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  return model;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SMART HINT GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
//
// Progressive hints — each subsequent hint reveals more detail.
// The AI MUST NOT give the actual code solution.
//
async function generateHint({ problemName, difficulty, category, hintNumber, userCode, language }) {
  const m = getModel();
  const langNote = (language === 'Pseudo')
    ? 'The student is writing pseudo-code / planning their approach (not actual code).'
    : `The student is coding in ${language || 'Python'}.`;

  const prompt = `You are LeetLoop AI — an expert coding interview coach embedded in a spaced-repetition study app.

PROBLEM: "${problemName}"
DIFFICULTY: ${difficulty}
CATEGORY: ${category}
LANGUAGE: ${language || 'Python'}
HINT NUMBER REQUESTED: ${hintNumber} of 3

${langNote}
${userCode ? `THE STUDENT'S CURRENT CODE:\n\`\`\`\n${userCode}\n\`\`\`\n` : 'The student has not written any code yet.'}

YOUR TASK — provide Hint #${hintNumber}:

RULES:
- Hint 1: Give a HIGH-LEVEL conceptual nudge. Mention the data structure or technique category (e.g. "Think about using a hash map to track seen values") but do NOT describe the algorithm steps.
- Hint 2: Be MORE SPECIFIC about the approach. Describe the key insight or trick (e.g. "You can use a sliding window — shrink when the sum exceeds k"). If the student pasted code, reference their specific mistake.
- Hint 3: Give a NEAR-COMPLETE walkthrough of the algorithm in plain English, step by step, but still do NOT write actual code. If the student pasted code, point out exactly what line/logic is wrong and what the fix should be conceptually.
- NEVER give the full working code solution under any hint level.
- Keep responses concise (3-5 sentences max).
- Be encouraging and conversational.
- If the student is writing pseudo-code, evaluate the logic/approach rather than syntax.

Respond ONLY with the hint text. No preamble, no "Hint #N:" prefix.`;

  const result = await m.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SOLUTION EVALUATOR
// ─────────────────────────────────────────────────────────────────────────────
//
// Analyses user's code and produces a structured evaluation:
//   - type: 'optimal' | 'brute'
//   - score: 0–3  (matching the existing scheduler scale)
//   - timeComplexity / spaceComplexity
//   - explanation
//
// The score mapping mirrors scheduler.js:
//   3 = Optimal approach, clean implementation, no issues
//   2 = Correct solution but minor inefficiency or brute-force-clean
//   1 = Partially correct / significant issues / very inefficient
//   0 = Wrong / doesn't compile / fundamentally broken
//
async function evaluateSolution({ problemName, difficulty, category, code, hintsTaken, language }) {
  const m = getModel();
  const isPseudo = language === 'Pseudo';

  const prompt = isPseudo
    ? `You are LeetLoop AI — an expert coding interview coach.

PROBLEM: "${problemName}"
DIFFICULTY: ${difficulty}
CATEGORY: ${category}
HINTS USED: ${hintsTaken}

THE STUDENT HAS WRITTEN PSEUDO-CODE (not actual code):
\`\`\`
${code}
\`\`\`

Evaluate whether this pseudo-code describes a correct and efficient algorithm. Respond in EXACTLY this JSON format (no markdown fences, no extra text):
{
  "type": "optimal" or "brute",
  "score": <0-3 integer>,
  "timeComplexity": "<Big-O or 'Depends on implementation'>",
  "spaceComplexity": "<Big-O or 'Depends on implementation'>",
  "isCorrect": true or false,
  "explanation": "<2-3 sentence evaluation of whether this approach is logically correct and efficient>",
  "improvements": "<1-2 sentence suggestion or null if score is 3>"
}
SCORING: 3=optimal correct approach, 2=correct but suboptimal, 1=partially correct or logical errors, 0=wrong approach.
Respond with ONLY the JSON object, nothing else.`
    : `You are LeetLoop AI — an expert code reviewer for a spaced-repetition coding study app.

PROBLEM: "${problemName}"
DIFFICULTY: ${difficulty}
CATEGORY: ${category}
LANGUAGE: ${language || 'Python'}
HINTS THE STUDENT USED BEFORE SUBMITTING: ${hintsTaken}

STUDENT'S SUBMITTED CODE (${language || 'Python'}):
\`\`\`${(language || 'python').toLowerCase()}
${code}
\`\`\`

EVALUATE this solution and respond in EXACTLY this JSON format (no markdown fences, no extra text):
{
  "type": "optimal" or "brute",
  "score": <0-3 integer>,
  "timeComplexity": "<Big-O notation>",
  "spaceComplexity": "<Big-O notation>",
  "isCorrect": true or false,
  "explanation": "<2-3 sentence evaluation>",
  "improvements": "<1-2 sentence suggestion or null if score is 3>"
}

SCORING RULES (you MUST follow this scale exactly):
- score 3: Optimal time/space complexity for this problem. Clean, correct implementation. This is the BEST possible approach.
- score 2: Correct solution but uses a suboptimal approach (e.g. O(n²) when O(n) exists), OR it's a clean brute-force approach.
- score 1: Solution has logical errors, edge-case bugs, or is very inefficient (e.g. O(2^n) when O(n) exists).
- score 0: Code doesn't work, has syntax errors, or uses a fundamentally wrong approach.

TYPE CLASSIFICATION:
- "optimal": The solution uses the best-known time complexity for this problem.
- "brute": The solution uses a simpler but less efficient approach (e.g. nested loops, exhaustive search).

HINT PENALTY: If hints > 0, factor that into the score.
- 0 hints taken: no penalty
- 1 hint taken: score can be at most 2 (even if code is optimal)
- 2 hints taken: score can be at most 1
- 3+ hints taken: score is 0

Respond with ONLY the JSON object, nothing else.`;

  const result = await m.generateContent(prompt);
  const response = await result.response;
  const text = response.text().trim();

  // Parse JSON — handle potential markdown wrapping
  let cleaned = text;
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    // Clamp score to valid range
    parsed.score = Math.max(0, Math.min(3, Math.floor(parsed.score)));
    // Normalise type
    parsed.type = parsed.type === 'brute' ? 'brute' : 'optimal';
    return parsed;
  } catch (e) {
    console.error('AI response parse error:', e.message, '\nRaw:', text);
    // Fallback: return a safe default
    return {
      type: 'brute',
      score: 1,
      timeComplexity: 'Unknown',
      spaceComplexity: 'Unknown',
      isCorrect: false,
      explanation: 'AI could not parse the solution. The code was submitted with a default score.',
      improvements: 'Try submitting again.',
    };
  }
}

module.exports = { generateHint, evaluateSolution };
