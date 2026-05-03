import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, Client, Opportunity, StageTransition, OpportunityScore } from './database';
import { scoreAllOpportunities, getOpportunityScore, getScoreLeaderboard, runQuickHeuristicScoring, scoreSingleOpportunity } from './scoringService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await initDatabase();
  const app = express();
  const PORT = 3000;

  /**
   * ARCHITECTURE NOTE:
   * This Node.js server provides the Integrated Backend Service.
   * It implements the core business logic, persistence, and API orchestration 
   * defined in the High-Level Specification.
   */

  app.use(express.json());

  // Integrated Database Console (Mirroring H2 behavior)
  app.get('/h2-console*', async (req, res) => {
    const opps = await Opportunity.findAll();
    const clientsCount = await Client.count();
    
    const tableRows = opps.map(o => `
      <tr>
        <td style="border: 1px solid #ccc; padding: 4px;">${o.get('id')}</td>
        <td style="border: 1px solid #ccc; padding: 4px;">${o.get('clientId')}</td>
        <td style="border: 1px solid #ccc; padding: 4px;">${o.get('type')}</td>
        <td style="border: 1px solid #ccc; padding: 4px;">${o.get('title')}</td>
        <td style="border: 1px solid #ccc; padding: 4px;">${o.get('stage')}</td>
        <td style="border: 1px solid #ccc; padding: 4px;">${o.get('ownerAlias')}</td>
        <td style="border: 1px solid #ccc; padding: 4px;">${o.get('priority')}</td>
        <td style="border: 1px solid #ccc; padding: 4px; font-family: monospace; font-size: 10px;">${o.get('activities')}</td>
        <td style="border: 1px solid #ccc; padding: 4px; font-family: monospace; font-size: 10px;">${o.get('history')}</td>
      </tr>
    `).join('');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>H2 Console - Integrated Entry</title>
        <style>
          body { font-family: Segoe UI, Tahoma, sans-serif; background: #f0f0f0; margin: 0; }
          .header { background: #3c3c3c; color: white; padding: 10px; font-size: 14px; font-weight: bold; }
          .toolbar { background: #e0e0e0; padding: 5px; border-bottom: 1px solid #bbb; }
          .main { display: flex; height: calc(100vh - 70px); }
          .sidebar { width: 200px; background: white; border-right: 1px solid #bbb; padding: 10px; font-size: 13px; }
          .content { flex: 1; padding: 20px; background: white; }
          .sql-box { width: 100%; height: 100px; font-family: monospace; border: 1px solid #bbb; margin-bottom: 10px; }
          table { border-collapse: collapse; width: 100%; font-size: 12px; }
          th { background: #eee; text-align: left; }
        </style>
      </head>
      <body>
        <div class="header">H2 Console - Integrated Database (Persistent)</div>
        <div class="toolbar">
          <button onclick="location.reload()">Refresh Data</button>
        </div>
        <div class="main">
          <div class="sidebar">
            <strong>Tables</strong>
            <ul style="list-style: none; padding: 0;">
              <li>📂 PUBLIC
                <ul style="list-style: none; padding-left: 15px;">
                  <li>📑 OPPORTUNITIES (${opps.length})</li>
                  <li>📑 CLIENTS (${clientsCount})</li>
                  <li>📑 METADATA</li>
                </ul>
              </li>
            </ul>
          </div>
          <div class="content">
            <h3>SQL Query: SELECT * FROM OPPORTUNITIES</h3>
            <textarea class="sql-box">SELECT * FROM OPPORTUNITIES;</textarea>
            <button style="margin-bottom: 20px;">Run</button>
            
            <table>
              <thead>
                <tr>
                  <th style="border: 1px solid #ccc; padding: 4px;">ID</th>
                  <th style="border: 1px solid #ccc; padding: 4px;">CLIENT_ID</th>
                  <th style="border: 1px solid #ccc; padding: 4px;">TYPE</th>
                  <th style="border: 1px solid #ccc; padding: 4px;">TITLE</th>
                  <th style="border: 1px solid #ccc; padding: 4px;">STAGE</th>
                  <th style="border: 1px solid #ccc; padding: 4px;">OWNER</th>
                  <th style="border: 1px solid #ccc; padding: 4px;">PRIORITY</th>
                  <th style="border: 1px solid #ccc; padding: 4px;">ACTIVITIES</th>
                  <th style="border: 1px solid #ccc; padding: 4px;">HISTORY</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <p style="font-size: 11px; color: #888; margin-top: 20px;">
              Connected to <strong>jdbc:h2:mem:salesdb</strong> (Mapped to SQLite).
            </p>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', engine: 'Sequelize/SQLite' });
  });

  app.get('/api/clients', async (req, res) => {
    try {
      const clientsList = await Client.findAll();
      res.json(clientsList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/opportunities', async (req, res) => {
    try {
      const opps = await Opportunity.findAll();
      const clientsList = await Client.findAll();
      
      const enriched = opps.map(o => {
        const data = o.toJSON();
        const client = clientsList.find(c => c.get('id') === data.clientId);
        
        // Ensure activities and history are parsed
        let activities = [];
        try { activities = typeof data.activities === 'string' ? JSON.parse(data.activities) : data.activities || []; } catch(e) {}
        
        let history = [];
        try { history = typeof data.history === 'string' ? JSON.parse(data.history) : data.history || []; } catch(e) {}

        return { 
          ...data, 
          activities,
          history,
          clientName: client?.get('name') || 'Unknown Client', 
          clientAvatar: client?.get('avatar'),
          clientAddress: client?.get('address'),
          clientRiskTolerance: client?.get('riskTolerance'),
          clientHealth: client?.get('health')
        };
      });
      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/opportunities', async (req, res) => {
    try {
      const { dynamicFields, ...baseData } = req.body;
      const id = Math.random().toString(36).substr(2, 9);
      
      // Normalize data for database - merge dynamicFields into root
      const dbPayload = {
        ...baseData,
        ...(dynamicFields || {}),
        id,
        activities: JSON.stringify(baseData.activities || []),
        history: JSON.stringify(baseData.history || [])
      };
      
      const newOpp = await Opportunity.create(dbPayload);
      const client = await Client.findByPk(baseData.clientId);
      
      const response = {
        ...newOpp.toJSON(),
        activities: baseData.activities || [],
        history: baseData.history || [],
        clientName: client?.get('name') || 'Unknown Client',
        clientAvatar: client?.get('avatar')
      };
      
      res.status(201).json(response);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/opportunities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { dynamicFields, ...updates } = req.body;
      
      // Merge dynamicFields into updates if present
      const finalUpdates = { ...updates, ...(dynamicFields || {}) };
      
      const opp = await Opportunity.findByPk(id);
      if (!opp) return res.status(404).json({ error: 'Opportunity not found' });
      
      const existing = opp.toJSON();

      // Stage Transition Validation — reads from DB (stage_transitions table)
      if (finalUpdates.stage && finalUpdates.stage !== existing.stage) {
        const type = (existing.type as string) || 'SALES';
        const fromStage = existing.stage as string;

        const rule = await StageTransition.findOne({
          where: { opportunityType: type, fromStage }
        });

        if (rule) {
          let allowed: string[] = [];
          try { allowed = JSON.parse(rule.get('toStages') as string); } catch { allowed = []; }

          if (!allowed.includes(finalUpdates.stage)) {
            return res.status(400).json({
              error: `Invalid transition: ${type} cannot move from ${fromStage} → ${finalUpdates.stage}. Allowed: [${allowed.join(', ') || 'none'}]`
            });
          }
        }

        // Record History
        let history = [];
        try { history = typeof existing.history === 'string' ? JSON.parse(existing.history) : existing.history || []; } catch(e) {}
        
        const historyEntry = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'STATUS_CHANGE',
          description: `Stage changed from ${existing.stage} to ${finalUpdates.stage}`,
          user: 'System',
          date: new Date().toLocaleString()
        };
        history.push(historyEntry);
        finalUpdates.history = JSON.stringify(history);
      }

      // Final stringification check for and Sequelize
      if (finalUpdates.activities && typeof finalUpdates.activities !== 'string') {
        finalUpdates.activities = JSON.stringify(finalUpdates.activities);
      }
      if (finalUpdates.history && typeof finalUpdates.history !== 'string') {
        finalUpdates.history = JSON.stringify(finalUpdates.history);
      }

      await opp.update(finalUpdates);
      const updated = opp.toJSON();
      res.json({
        ...updated,
        activities: JSON.parse(updated.activities || '[]'),
        history: JSON.parse(updated.history || '[]')
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/opportunities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await Opportunity.destroy({ where: { id } });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ── Metadata Routes ────────────────────────────────────────────────────

  /**
   * GET /api/metadata/status-transition
   *
   * Returns all stage transition rules persisted in the DB.
   * Shape:
   *  {
   *    "SALES":   { "QUALIFY": ["DEVELOP"], ... },
   *    "TAGGING": { "QUALIFY": ["DEVELOP", "CLOSE"], ... },
   *    "PRODUCT": { "QUALIFY": ["DEVELOP"], ... }
   *  }
   *
   * The data is seeded in database.ts → initDatabase() on every startup.
   * To change a rule, update the transitionSeed array in database.ts.
   */
  app.get('/api/metadata/status-transition', async (req, res) => {
    try {
      const rows = await StageTransition.findAll();
      const result: Record<string, Record<string, string[]>> = {};

      for (const row of rows) {
        const type  = row.get('opportunityType') as string;
        const from  = row.get('fromStage') as string;
        const toRaw = row.get('toStages') as string;

        let toArr: string[] = [];
        try { toArr = JSON.parse(toRaw); } catch { toArr = []; }

        if (!result[type]) result[type] = {};
        result[type][from] = toArr;
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ── Schema (types + stages + users) — allowedTransitions sourced from DB ─
  app.get('/api/metadata/schema', async (req, res) => {
    // Pull transitions from DB so they stay in sync with /api/metadata/status-transition
    const transitionRows = await StageTransition.findAll();
    const transitions: Record<string, Record<string, string[]>> = {};
    for (const row of transitionRows) {
      const type  = row.get('opportunityType') as string;
      const from  = row.get('fromStage') as string;
      const toRaw = row.get('toStages') as string;
      let toArr: string[] = [];
      try { toArr = JSON.parse(toRaw); } catch { toArr = []; }
      if (!transitions[type]) transitions[type] = {};
      transitions[type][from] = toArr;
    }

    res.json({
      types: {
        SALES: {
          id: 'SALES',
          label: 'Sales Revenue',
          color: 'bg-brand-primary',
          icon: 'DollarSign',
          fields: [
            { key: 'accountName', label: 'Client Account', type: 'text', required: true, showOnCard: true, isPrimary: true },
            { key: 'value', label: 'Est. Revenue', type: 'currency', required: true, showOnCard: true },
            { key: 'estimatedCloseDate', label: 'Expected Close', type: 'date', required: true, showOnCard: true },
          ],
          allowedTransitions: transitions['SALES'] ?? {}
        },
        TAGGING: {
          id: 'TAGGING',
          label: 'Strategic Tagging',
          color: 'bg-indigo-700',
          icon: 'Tag',
          fields: [
            { key: 'prioritySegment', label: 'Priority Segment', type: 'select', options: ['GWM', 'IB', 'AM'], required: true, showOnCard: true, isPrimary: true },
            { key: 'campaignCode', label: 'Campaign Tracker', type: 'text', showOnCard: true },
            { key: 'impactScore', label: 'Strategic Impact (1-10)', type: 'number', showOnCard: true },
          ],
          allowedTransitions: transitions['TAGGING'] ?? {}
        },
        PRODUCT: {
          id: 'PRODUCT',
          label: 'Product Feedback',
          color: 'bg-emerald-600',
          icon: 'MessageSquare',
          fields: [
            { key: 'productArea', label: 'Platform Module', type: 'select', options: ['Trading', 'Reporting', 'Advisor Portals'], required: true, showOnCard: true, isPrimary: true },
            { key: 'voterCount', label: 'Client Votes', type: 'number', showOnCard: true },
            { key: 'urgency', label: 'Market Urgency', type: 'select', options: ['CRITICAL', 'FEATURE_REQUEST', 'NICE_TO_HAVE'], showOnCard: true },
          ],
          allowedTransitions: transitions['PRODUCT'] ?? {}
        }
      },
      stages: [
        { id: 'QUALIFY', label: 'Qualify', count: 12, total: '$1.8M' },
        { id: 'DEVELOP', label: 'Develop', count: 8, total: '$4.2M' },
        { id: 'PROPOSE', label: 'Propose', count: 5, total: '$3.1M' },
        { id: 'CLOSE', label: 'Close', count: 3, total: '$0.9M' }
      ],
      users: [
        { id: '1', name: 'Admin User', alias: 'AD', role: 'ADMIN', color: 'bg-black', email: 'admin@example.com', address: 'Main Financial Hub, Zurich' },
        { id: '2', name: 'Manager User', alias: 'MN', role: 'MANAGER', color: 'bg-zinc-800', email: 'manager@example.com', address: 'Regional Banking Center, Geneva' },
        { id: '3', name: 'Sales Rep 1', alias: 'SR', role: 'SALES_REP', color: 'bg-brand-red', email: 'rep1@example.com', address: 'Bahnhofstrasse 45, 8001 Zurich' },
      ]
    });
  });

  // ── Predictive Scoring API ────────────────────────────────────────────

  // POST /api/scoring/batch — Score all opportunities
  app.post('/api/scoring/batch', async (req, res) => {
    try {
      console.log('Starting batch opportunity scoring...');
      const result = await scoreAllOpportunities();
      console.log(`Scoring complete: ${result.scored} opportunities scored in ${result.duration_ms}ms`);
      res.json(result);
    } catch (error) {
      console.error('Batch scoring error:', error);
      res.status(500).json({ error: 'Scoring failed' });
    }
  });

  // GET /api/scoring/leaderboard — All opportunities ranked by score
  app.get('/api/scoring/leaderboard', async (req, res) => {
    try {
      const leaderboard = await getScoreLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  // GET /api/scoring/:opportunityId — Score detail + history for one opportunity
  app.get('/api/scoring/:opportunityId', async (req, res) => {
    try {
      const data = await getOpportunityScore(req.params.opportunityId);
      if (!data.current) {
        return res.json({ current: null, history: [] });
      }
      // Parse JSON fields for the response
      const current = {
        ...data.current,
        improvers: JSON.parse((data.current as any).improvers || '[]'),
        harmers: JSON.parse((data.current as any).harmers || '[]'),
      };
      res.json({ current, history: data.history });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch score' });
    }
  });

  // POST /api/scoring/:opportunityId/refresh — Trigger AI scoring for ONE opportunity
  app.post('/api/scoring/:opportunityId/refresh', async (req, res) => {
    try {
      const result = await scoreSingleOpportunity(req.params.opportunityId);
      if (!result) return res.status(404).json({ error: 'Opportunity not found' });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Single scoring failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: path.join(process.cwd(), 'frontend'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production path would be the backend static resources or a dedicated frontend dist
    const distPath = path.join(process.cwd(), 'frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // TWO-STAGE SCORING PIPELINE:
    // Give the DB a moment to settle after seeding
    setTimeout(() => {
      // 1. Instant Heuristic (Math-based, local, <100ms)
      runQuickHeuristicScoring().then(() => {
        console.log('Stage 1: Quick heuristic scores calculated.');
        
        // 2. AI Refinement (Gemini-based, background, 5-10s)
        console.log('Stage 2: Starting AI refinement background job...');
        scoreAllOpportunities().then(result => {
          console.log(`AI scoring complete: ${result.scored} opps refined (avg: ${result.summary.avgScore})`);
        }).catch(err => console.error('AI refinement failed:', err));
      });
    }, 500);
  });
}

startServer();
