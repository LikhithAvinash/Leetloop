const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateHint, evaluateSolution } = require('../ai');

/**
 * POST /api/ai/hint
 * Body: { problemName, difficulty, category, hintNumber, userCode? }
 * Returns: { hint: string, hintNumber: number }
 */
router.post('/ai/hint', auth, async (req, res) => {
  const { problemName, difficulty, category, hintNumber, userCode, language } = req.body;

  if (!problemName || !hintNumber) {
    return res.status(400).json({ error: 'problemName and hintNumber are required' });
  }
  if (hintNumber < 1 || hintNumber > 3) {
    return res.status(400).json({ error: 'hintNumber must be 1, 2, or 3' });
  }

  try {
    const hint = await generateHint({
      problemName,
      difficulty: difficulty || 'Medium',
      category: category || 'General',
      hintNumber,
      userCode: userCode || '',
      language: language || 'Python',
    });
    res.json({ hint, hintNumber });
  } catch (err) {
    console.error('AI Hint Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/evaluate
 * Body: { problemName, difficulty, category, code, hintsTaken }
 * Returns: { type, score, timeComplexity, spaceComplexity, isCorrect, explanation, improvements }
 */
router.post('/ai/evaluate', auth, async (req, res) => {
  const { problemName, difficulty, category, code, hintsTaken, language } = req.body;

  if (!problemName || !code || !code.trim()) {
    return res.status(400).json({ error: 'problemName and code are required' });
  }

  try {
    const evaluation = await evaluateSolution({
      problemName,
      difficulty: difficulty || 'Medium',
      category: category || 'General',
      code: code.trim(),
      hintsTaken: typeof hintsTaken === 'number' ? hintsTaken : 0,
      language: language || 'Python',
    });
    res.json(evaluation);
  } catch (err) {
    console.error('AI Evaluate Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
