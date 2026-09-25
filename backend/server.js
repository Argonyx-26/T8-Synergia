const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// In-memory storage for period history (for demonstration purposes)
// In a real application, this should be replaced with a database like MongoDB or PostgreSQL
const userHistories = {};

// Helper: Calculate BMI
const calculateBMI = (weight, height) => {
  if (!weight || !height) return 0;
  const w = parseFloat(weight);
  const h = parseFloat(height) / 100;
  return w / (h * h);
};

// POST /api/assess
app.post('/api/assess', (req, res) => {
  const { symptoms, weight, height } = req.body;

  if (!symptoms) {
    return res.status(400).json({ error: 'Symptoms data is required' });
  }

  let ovulationScore = 0;
  let androgenScore = 0;
  let metabolicScore = 0;

  // Ovulation criteria (0-30 points)
  if (symptoms.irregularPeriods) ovulationScore += 15;
  if (symptoms.noPeriods) ovulationScore += 15;

  // Androgen criteria (0-40 points)
  if (symptoms.excessHair) androgenScore += 15;
  if (symptoms.acne) androgenScore += 10;
  if (symptoms.hairLoss) androgenScore += 10;
  if (symptoms.darkPatches) androgenScore += 5;

  // Metabolic criteria (0-30 points)
  const bmi = calculateBMI(weight, height);
  if (bmi > 25) metabolicScore += 10;
  if (bmi > 30) metabolicScore += 5;
  if (symptoms.weightGain) metabolicScore += 7;
  if (symptoms.difficultyLosingWeight) metabolicScore += 5;
  if (symptoms.fatigue) metabolicScore += 3;

  const total = ovulationScore + androgenScore + metabolicScore;
  const breakdown = { ovulationScore, androgenScore, metabolicScore };

  // Risk Level
  let risk = {};
  if (total < 25) {
    risk = {
      level: 'Low Risk',
      color: 'bg-green-500',
      description: 'Your symptoms suggest a low likelihood of PCOS. Continue monitoring your cycle.'
    };
  } else if (total < 50) {
    risk = {
      level: 'Moderate Risk',
      color: 'bg-yellow-500',
      description: 'Some indicators suggest possible hormonal imbalance. Consider consulting a healthcare provider.'
    };
  } else {
    risk = {
      level: 'High Risk',
      color: 'bg-red-500',
      description: 'Multiple indicators suggest a strong likelihood of PCOS. Please consult a gynecologist for proper diagnosis.'
    };
  }

  // Personalized Advice
  const advice = [];
  if (metabolicScore >= 15 || bmi > 25) {
    advice.push({
      title: 'Weight & Lifestyle',
      tips: [
        'Focus on balanced nutrition with low glycemic index foods',
        'Aim for 150 minutes of moderate exercise per week',
        'Consider strength training to improve insulin sensitivity',
        'Prioritize sleep (7-9 hours) to regulate hormones',
      ],
    });
  }

  if (androgenScore >= 15) {
    advice.push({
      title: 'Skincare & Hair Care',
      tips: [
        'Use gentle, non-comedogenic skincare products',
        'Consider anti-androgen treatments (consult dermatologist)',
        'Explore hair removal options if excess hair bothers you',
        'Look into supplements like spearmint tea for androgen reduction',
      ],
    });
  }

  if (ovulationScore >= 15) {
    advice.push({
      title: 'Cycle Tracking',
      tips: [
        'Continue tracking periods to identify patterns',
        'Monitor basal body temperature to detect ovulation',
        'Consider ovulation predictor kits',
        'Discuss fertility concerns with your gynecologist',
      ],
    });
  }

  res.json({
    score: { total, breakdown },
    risk,
    advice
  });
});

// GET /api/history
app.get('/api/history', (req, res) => {
  const { userId = 'default_user' } = req.query;
  const history = userHistories[userId] || [];
  res.json({ history });
});

// POST /api/history
app.post('/api/history', (req, res) => {
  const { userId = 'default_user', entry } = req.body;
  if (!userHistories[userId]) {
    userHistories[userId] = [];
  }
  
  // Calculate cycle length if there's a previous entry
  if (userHistories[userId].length > 0) {
    const lastEntry = userHistories[userId][userHistories[userId].length - 1];
    const start = new Date(entry.startDate);
    const lastStart = new Date(lastEntry.startDate);
    const cycleLength = Math.floor((start.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24));
    if (cycleLength > 0) {
      entry.cycleLength = cycleLength;
    }
  }

  userHistories[userId].push(entry);
  
  // Keep only the last 6 entries
  if (userHistories[userId].length > 6) {
    userHistories[userId] = userHistories[userId].slice(-6);
  }

  res.json({ history: userHistories[userId] });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
