/**
 * Psychometric IQ Calculation Engine
 * Uses Wechsler-style z-score mapping with difficulty-weighted scoring
 */

// Error function approximation for normal CDF
function erf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const p = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const v = 1 - p * Math.exp(-x * x);
  return x >= 0 ? v : -v;
}

/**
 * Calculate full cognitive assessment results
 * @param {Array} log - Array of {difficulty, correct, time, timeLimit, timedOut}
 * @returns {Object} Complete scoring breakdown
 */
export function calculateResults(log) {
  if (!log.length) return getEmptyResults();

  // Step 1: Difficulty-weighted accuracy (Expert=4x, Hard=3x, Medium=2x, Easy=1x)
  const wMax = log.reduce((s, l) => s + l.difficulty, 0);
  const wGot = log.filter(l => l.correct).reduce((s, l) => s + l.difficulty, 0);
  const wPct = Math.round((wGot / (wMax || 1)) * 100);

  // Step 2: Speed efficiency — ratio of time saved (only for correct answers)
  const speedScores = log.map(l => {
    if (l.timedOut || !l.correct) return 0;
    const used = Math.min(l.time, l.timeLimit);
    return Math.max(0, 1 - (used / (l.timeLimit || 1)));
  });
  const avgSpeed = speedScores.reduce((a, b) => a + b, 0) / speedScores.length;
  const speedPct = Math.round(avgSpeed * 100);

  // Step 3: Consistency — low variance in correct answer times = better executive function
  const correctTimes = log.filter(l => l.correct).map(l => l.time);
  const meanTime = correctTimes.length
    ? correctTimes.reduce((a, b) => a + b, 0) / correctTimes.length
    : 0;
  const variance = correctTimes.length > 1
    ? correctTimes.reduce((a, t) => a + Math.pow(t - meanTime, 2), 0) / correctTimes.length
    : 0;
  const stdDev = Math.sqrt(variance);
  const consistencyScore = Math.max(0, Math.min(1, (10 - stdDev) / 10));

  // Step 4: Composite score (0-100)
  // 70% weighted accuracy + 20% speed + 10% consistency
  const composite = Math.min(100, Math.max(0, Math.round(
    wPct * 0.70 +
    speedPct * 0.20 +
    consistencyScore * 10
  )));

  // Step 5: IQ estimation using z-score mapping
  // Composite 50 → IQ 100 (mean), each 21.5 points ≈ 1 SD (15 IQ points)
  const zScore = (composite - 50) / 21.5;
  const rawIQ = Math.round(100 + zScore * 15);
  const clampedIQ = Math.max(65, Math.min(145, rawIQ));
  const iqRange = `${clampedIQ - 3}–${clampedIQ + 3}`;

  // Step 6: Percentile from z-score (standard normal CDF)
  const percentile = Math.max(1, Math.min(99,
    Math.round(50 * (1 + erf(zScore / Math.sqrt(2))))
  ));

  // Grade classification based on IQ ranges
  const gradeKey = clampedIQ >= 125 ? 'Exceptional'
    : clampedIQ >= 110 ? 'Above Average'
    : clampedIQ >= 90 ? 'Average'
    : 'Developing';

  const gradeColor = {
    Exceptional: '#00D4FF',
    'Above Average': '#10B981',
    Average: '#F59E0B',
    Developing: '#FF6B35',
  }[gradeKey];

  const gradeEmoji = {
    Exceptional: '🏆',
    'Above Average': '🥇',
    Average: '🥈',
    Developing: '📈',
  }[gradeKey];

  // Average response time
  const avgTime = log.length
    ? Math.round(log.reduce((s, x) => s + x.time, 0) / log.length * 10) / 10
    : 0;

  // Speed bonus display value
  const speedBonus = Math.round(speedPct * 0.20);

  return {
    wPct, speedPct, speedBonus, consistencyScore, composite,
    zScore, clampedIQ, iqRange, percentile,
    gradeKey, gradeColor, gradeEmoji,
    avgTime, avgSpeed, stdDev,
  };
}

function getEmptyResults() {
  return {
    wPct: 0, speedPct: 0, speedBonus: 0, consistencyScore: 0, composite: 0,
    zScore: -2.33, clampedIQ: 65, iqRange: '62–68', percentile: 1,
    gradeKey: 'Developing', gradeColor: '#FF6B35', gradeEmoji: '📈',
    avgTime: 0, avgSpeed: 0, stdDev: 0,
  };
}
