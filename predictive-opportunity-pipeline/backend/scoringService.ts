/**
 * Predictive Opportunity Scoring Service
 * 
 * Uses Gemini 2.5 Flash to score opportunities 0–100 with explainable
 * positive/negative factors. Inspired by Dynamics 365 predictive scoring.
 */
import { GoogleGenAI } from '@google/genai';
import { Opportunity, Client, OpportunityScore } from './database';
import { Op } from 'sequelize';

const API_KEY = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

interface ScoreReason {
  factor: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface ScoringResult {
  opportunityId: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  improvers: ScoreReason[];
  harmers: ScoreReason[];
  recommendation: string;
}

function computeGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 75) return 'A';
  if (score >= 50) return 'B';
  if (score >= 25) return 'C';
  return 'D';
}

function computeTrend(current: number, previous: number | null): string {
  if (previous === null) return 'NEW';
  const delta = current - previous;
  if (delta >= 5) return 'IMPROVING';
  if (delta <= -5) return 'DECLINING';
  return 'STEADY';
}

/**
 * Fast, local math-based scoring.
 * Runs in milliseconds. Used for instant startup feedback.
 */
function calculateHeuristicScore(opp: any): number {
  let score = 50; // Baseline

  // 1. Activity (max +20)
  const activities = JSON.parse(opp.activities || '[]');
  score += Math.min(activities.length * 5, 20);

  // 2. Priority (max +15)
  if (opp.priority === 'HIGH') score += 10;
  if (opp.priority === 'WINNING') score += 15;
  if (opp.priority === 'LOW') score -= 10;

  // 3. System Signals (max +15)
  const sentiment = (opp.marketSentimentScore || 50) - 50; // -50 to 50
  score += Math.floor(sentiment * 0.2); // -10 to 10
  
  const risk = (opp.riskScore || 30); // 0 to 100
  score -= Math.floor(risk * 0.1); // -10 to 0

  // 4. Value (max +10)
  if ((opp.value || 0) > 100000) score += 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Stage 1: Run instant heuristic scores for all opportunities.
 */
export async function runQuickHeuristicScoring() {
  try {
    const opportunities = await Opportunity.findAll({ raw: true });
    if (opportunities.length === 0) {
      console.log('No opportunities found to score.');
      return;
    }

    const scores = (opportunities as any[]).map(opp => {
      const score = calculateHeuristicScore(opp);
      return {
        opportunityId: opp.id,
        score,
        grade: computeGrade(score),
        trend: 'NEW',
        recommendation: 'AI analysis in progress...',
        improvers: JSON.stringify([{ factor: 'Initial Analysis', description: 'Computing behavioral signals...', impact: 'LOW' }]),
        harmers: JSON.stringify([]),
      };
    });

    await OpportunityScore.bulkCreate(scores);
    console.log(`Stage 1: ${scores.length} heuristic scores created.`);
  } catch (err) {
    console.error('Stage 1 scoring failed:', err);
  }
}

/**
 * Scores all open opportunities (not in CLOSE stage, or optionally all).
 * Calls Gemini once with a batch prompt. Stores results in opportunity_scores.
 */
export async function scoreAllOpportunities(): Promise<{
  scored: number;
  duration_ms: number;
  summary: { gradeA: number; gradeB: number; gradeC: number; gradeD: number; avgScore: number };
}> {
  const start = Date.now();

  // Fetch all opportunities with their client data
  const opportunities = await Opportunity.findAll({ raw: true });
  const clients = await Client.findAll({ raw: true });
  const clientMap = new Map(clients.map((c: any) => [c.id, c]));

  if (!ai || opportunities.length === 0) {
    return { scored: 0, duration_ms: Date.now() - start, summary: { gradeA: 0, gradeB: 0, gradeC: 0, gradeD: 0, avgScore: 0 } };
  }

  // Get previous latest scores for trend calculation
  const previousScores = new Map<string, number>();
  for (const opp of opportunities as any[]) {
    const lastScore = await OpportunityScore.findOne({
      where: { opportunityId: opp.id },
      order: [['createdAt', 'DESC']],
      raw: true
    }) as any;
    if (lastScore) {
      previousScores.set(opp.id, lastScore.score);
    }
  }

  // Build enriched data for Gemini
  const enrichedData = (opportunities as any[]).map(opp => {
    const client = clientMap.get(opp.clientId) as any;
    const activities = JSON.parse(opp.activities || '[]');
    const history = JSON.parse(opp.history || '[]');
    return {
      id: opp.id,
      title: opp.title,
      type: opp.type,
      stage: opp.stage,
      priority: opp.priority,
      value: opp.value || null,
      estimatedCloseDate: opp.estimatedCloseDate || null,
      ownerAlias: opp.ownerAlias,
      date: opp.date,
      activityCount: activities.length,
      lastActivityDate: activities.length > 0 ? activities[activities.length - 1].date : null,
      activityTypes: [...new Set(activities.map((a: any) => a.type))],
      historySteps: history.length,
      clientSegment: client?.segment || 'UNKNOWN',
      clientHealth: client?.health || 'NEUTRAL',
      clientRiskTolerance: client?.riskTolerance || 'MODERATE',
      clientWealth: client?.totalWealth || 0,
      // Type-specific fields
      impactScore: opp.impactScore || null,
      voterCount: opp.voterCount || null,
      urgency: opp.urgency || null,
      productArea: opp.productArea || null,
      // External system signals
      marketSentimentScore: opp.marketSentimentScore || 50,
      riskScore: opp.riskScore || 30,
    };
  });

  const prompt = `You are a predictive sales scoring engine for Global, a top-tier Swiss private bank.

For each opportunity below, analyze the signals and assign a score from 0 to 100 based on these weighted criteria:
- Activity Recency (25%): Recent, diverse activities = higher score. No activities = significant penalty.
- Stage Velocity (20%): Opportunities that have moved through stages quickly score higher. Stuck opportunities score lower.
- Deal Value (15%): Higher value relative to pipeline = higher score. Missing value = mild penalty.
- Client Health (15%): HEALTHY = boost, NEUTRAL = neutral, AT_RISK = penalty. Higher wealth segment = slight boost.
- Priority Signal (10%): WINNING = max boost, HIGH = good, MED = neutral, LOW = penalty.
- Completeness (10%): Missing estimatedCloseDate, missing value, no activities = penalties.
- External System Signals (20%): Weave in the provided 'marketSentimentScore' (High = good) and 'riskScore' (High = bad).
- Risk Tolerance Fit (5%): Conservative clients with aggressive products = slight penalty. Good alignment = boost.

Grade mapping: A = 75-100, B = 50-74, C = 25-49, D = 0-24.

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences. Return exactly this structure:
{"scores":[{"opportunityId":"1","score":78,"grade":"A","improvers":[{"factor":"Activity Recency","description":"3 activities in the last 14 days shows strong engagement momentum","impact":"HIGH"}],"harmers":[{"factor":"Missing Close Date","description":"No estimated close date reduces forecasting confidence","impact":"HIGH"}],"recommendation":"Schedule final term sheet review with client legal team"}]}

Each opportunity must have exactly 2-3 improvers and 2-3 harmers. Each reason must have factor, description, and impact (HIGH/MEDIUM/LOW).
The recommendation must be one actionable sentence specific to that opportunity.

Opportunities to score:
${JSON.stringify(enrichedData, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a quantitative sales scoring engine. Return ONLY valid JSON. No explanation, no markdown fences, no extra text. Just the JSON object.',
      }
    });

    let text = response.text || '';
    // Strip markdown code fences if present
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const parsed = JSON.parse(text);
    const scores: ScoringResult[] = parsed.scores;

    // Store each score
    const gradeCount = { A: 0, B: 0, C: 0, D: 0 };
    let totalScore = 0;

    for (const s of scores) {
      const grade = computeGrade(s.score);
      const prevScore = previousScores.get(s.opportunityId) ?? null;
      const trend = computeTrend(s.score, prevScore);

      // Update the heuristic record with the refined AI score
      const existing = await OpportunityScore.findOne({
        where: { opportunityId: s.opportunityId },
        order: [['createdAt', 'DESC']]
      });

      if (existing) {
        await existing.update({
          score: s.score,
          grade,
          previousScore: prevScore,
          trend,
          improvers: JSON.stringify(s.improvers || []),
          harmers: JSON.stringify(s.harmers || []),
          recommendation: s.recommendation || '',
        });
      } else {
        await OpportunityScore.create({
          opportunityId: s.opportunityId,
          score: s.score,
          grade,
          previousScore: prevScore,
          trend,
          improvers: JSON.stringify(s.improvers || []),
          harmers: JSON.stringify(s.harmers || []),
          recommendation: s.recommendation || '',
        });
      }

      gradeCount[grade]++;
      totalScore += s.score;
    }

    const duration_ms = Date.now() - start;
    return {
      scored: scores.length,
      duration_ms,
      summary: {
        gradeA: gradeCount.A,
        gradeB: gradeCount.B,
        gradeC: gradeCount.C,
        gradeD: gradeCount.D,
        avgScore: Math.round(totalScore / scores.length),
      }
    };
  } catch (error) {
    console.error('AI refinement stage failed (falling back to heuristic summary):', error);
    
    // Fallback: Compute summary from existing Stage 1 scores
    const latestScores = await OpportunityScore.findAll({
      order: [['createdAt', 'DESC']],
      limit: opportunities.length,
      raw: true
    });

    const gradeCount = { A: 0, B: 0, C: 0, D: 0 };
    let totalScore = 0;
    for (const s of latestScores as any[]) {
      gradeCount[s.grade as keyof typeof gradeCount]++;
      totalScore += s.score;
    }

    return { 
      scored: 0, 
      duration_ms: Date.now() - start, 
      summary: { 
        gradeA: gradeCount.A, 
        gradeB: gradeCount.B, 
        gradeC: gradeCount.C, 
        gradeD: gradeCount.D, 
        avgScore: latestScores.length > 0 ? Math.round(totalScore / latestScores.length) : 0 
      } 
    };
  }
}

/**
 * Scores a single opportunity on-demand.
 * Used when a user wants to re-score a specific deal after updates.
 */
export async function scoreSingleOpportunity(opportunityId: string): Promise<ScoringResult | null> {
  const opp = await Opportunity.findByPk(opportunityId, { raw: true }) as any;
  if (!opp || !ai) return null;

  const client = await Client.findByPk(opp.clientId, { raw: true }) as any;
  const activities = JSON.parse(opp.activities || '[]');
  const history = JSON.parse(opp.history || '[]');

  const lastScore = await OpportunityScore.findOne({
    where: { opportunityId: opp.id },
    order: [['createdAt', 'DESC']],
    raw: true
  }) as any;

  const enrichedData = {
    id: opp.id,
    title: opp.title,
    type: opp.type,
    stage: opp.stage,
    priority: opp.priority,
    value: opp.value || null,
    estimatedCloseDate: opp.estimatedCloseDate || null,
    ownerAlias: opp.ownerAlias,
    date: opp.date,
    activityCount: activities.length,
    lastActivityDate: activities.length > 0 ? activities[activities.length - 1].date : null,
    activityTypes: [...new Set(activities.map((a: any) => a.type))],
    historySteps: history.length,
    clientSegment: client?.segment || 'UNKNOWN',
    clientHealth: client?.health || 'NEUTRAL',
    clientRiskTolerance: client?.riskTolerance || 'MODERATE',
    clientWealth: client?.totalWealth || 0,
    impactScore: opp.impactScore || null,
    voterCount: opp.voterCount || null,
    urgency: opp.urgency || null,
    productArea: opp.productArea || null,
    marketSentimentScore: opp.marketSentimentScore || 50,
    riskScore: opp.riskScore || 30,
  };

  const prompt = `You are a predictive sales scoring engine for Global.
Analyze this SINGLE opportunity and return a precise score (0-100), grade (A-D), 2-3 improvers, 2-3 harmers, and an actionable recommendation.

Opportunity Data:
${JSON.stringify(enrichedData, null, 2)}

Return ONLY valid JSON in this structure:
{"score":78,"grade":"A","improvers":[{"factor":"...","description":"...","impact":"HIGH"}],"harmers":[{"factor":"...","description":"...","impact":"HIGH"}],"recommendation":"..."}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction: 'Return ONLY valid JSON.' }
    });

    let text = response.text || '';
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const result = JSON.parse(text) as ScoringResult;

    const grade = computeGrade(result.score);
    const prevScore = lastScore?.score ?? null;
    const trend = computeTrend(result.score, prevScore);

    // Create a new score record
    await OpportunityScore.create({
      opportunityId: opp.id,
      score: result.score,
      grade,
      previousScore: prevScore,
      trend,
      improvers: JSON.stringify(result.improvers || []),
      harmers: JSON.stringify(result.harmers || []),
      recommendation: result.recommendation || '',
    });

    return result;
  } catch (error) {
    console.error('Single scoring failed:', error);
    return null;
  }
}

/**
 * Get the latest score for one opportunity, plus 30-day history.
 */
export async function getOpportunityScore(opportunityId: string) {
  const current = await OpportunityScore.findOne({
    where: { opportunityId },
    order: [['createdAt', 'DESC']],
    raw: true,
  }) as any;

  const opportunity = await Opportunity.findByPk(opportunityId, { raw: true }) as any;

  const history = await OpportunityScore.findAll({
    where: { opportunityId },
    order: [['createdAt', 'ASC']],
    attributes: ['score', 'createdAt'],
    raw: true,
  });

  if (current && opportunity) {
    current.marketSentimentScore = opportunity.marketSentimentScore;
    current.riskScore = opportunity.riskScore;
  }

  return { current, history };
}

/**
 * Get latest scores for ALL opportunities (leaderboard).
 */
export async function getScoreLeaderboard() {
  // Get all unique opportunity IDs
  const opps = await Opportunity.findAll({ attributes: ['id', 'title', 'type', 'stage'], raw: true }) as any[];
  
  const results = [];
  for (const opp of opps) {
    const latest = await OpportunityScore.findOne({
      where: { opportunityId: opp.id },
      order: [['createdAt', 'DESC']],
      raw: true,
    }) as any;

    if (latest) {
      results.push({
        opportunityId: opp.id,
        title: opp.title,
        type: opp.type,
        stage: opp.stage,
        score: latest.score,
        grade: latest.grade,
        trend: latest.trend,
        improvers: JSON.parse(latest.improvers || '[]'),
        harmers: JSON.parse(latest.harmers || '[]'),
        recommendation: latest.recommendation,
        scoredAt: latest.createdAt,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}
