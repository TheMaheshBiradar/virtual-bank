import { Sequelize, DataTypes, Model } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'sales-h2.db'), // Named it sales-h2.db to align with user's H2 request
  logging: false
});

export class Client extends Model {}
Client.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  name: DataTypes.STRING,
  gender: DataTypes.STRING,
  segment: DataTypes.STRING,
  totalWealth: DataTypes.INTEGER,
  riskTolerance: DataTypes.STRING,
  lastContact: DataTypes.STRING,
  health: DataTypes.STRING,
  avatar: DataTypes.STRING,
  address: DataTypes.STRING
}, { sequelize, modelName: 'client' });

export class Opportunity extends Model {}
Opportunity.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  clientId: DataTypes.STRING,
  type: DataTypes.STRING,
  title: DataTypes.STRING,
  stage: DataTypes.STRING,
  ownerAlias: DataTypes.STRING,
  priority: DataTypes.STRING,
  date: DataTypes.STRING,
  accountName: DataTypes.STRING,
  value: DataTypes.INTEGER,
  estimatedCloseDate: DataTypes.STRING,
  prioritySegment: DataTypes.STRING,
  campaignCode: DataTypes.STRING,
  impactScore: DataTypes.INTEGER,
  productArea: DataTypes.STRING,
  voterCount: DataTypes.INTEGER,
  urgency: DataTypes.STRING,
  activities: { type: DataTypes.TEXT, defaultValue: '[]' },
  history: { type: DataTypes.TEXT, defaultValue: '[]' },
  // External System Scores (Synthetic signals from other Global systems)
  marketSentimentScore: { type: DataTypes.INTEGER, defaultValue: 50 }, // 0-100
  riskScore: { type: DataTypes.INTEGER, defaultValue: 30 },            // 0-100
}, { sequelize, modelName: 'opportunity' });

// StageTransition: one row per (opportunityType, fromStage) pair.
// toStages is a JSON array of allowed destination stage IDs.
export class StageTransition extends Model {}
StageTransition.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  opportunityType: { type: DataTypes.STRING, allowNull: false }, // SALES | TAGGING | PRODUCT
  fromStage:       { type: DataTypes.STRING, allowNull: false }, // QUALIFY | DEVELOP | PROPOSE | CLOSE
  toStages:        { type: DataTypes.TEXT,   allowNull: false }, // JSON array, e.g. '["DEVELOP","QUALIFY"]'
}, { sequelize, modelName: 'stage_transition', tableName: 'stage_transitions' });

// OpportunityScore: stores predictive AI scores with history for trend sparklines.
export class OpportunityScore extends Model {}
OpportunityScore.init({
  id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  opportunityId:   { type: DataTypes.STRING, allowNull: false },
  score:           { type: DataTypes.INTEGER, allowNull: false },       // 0–100
  grade:           { type: DataTypes.STRING, allowNull: false },        // A | B | C | D
  previousScore:   { type: DataTypes.INTEGER },                         // For trend calculation
  trend:           { type: DataTypes.STRING, defaultValue: 'NEW' },     // IMPROVING | DECLINING | STEADY | NEW
  improvers:       { type: DataTypes.TEXT, defaultValue: '[]' },        // JSON array of ScoreReason
  harmers:         { type: DataTypes.TEXT, defaultValue: '[]' },        // JSON array of ScoreReason
  recommendation:  { type: DataTypes.TEXT },                            // One-line next best action
}, { sequelize, modelName: 'opportunity_score', tableName: 'opportunity_scores' });

export async function initDatabase() {
  await sequelize.sync({ force: true }); // Wipes and recreates all tables on every startup (intentional for demo resets)

  // ── Seed Stage Transitions ──────────────────────────────────────────────
  // Source of truth for allowed stage movements per opportunity type.
  // The /api/metadata/status-transition endpoint reads directly from this table.
  const transitionSeed = [
    // SALES: linear forward with two-way flexibility mid-funnel
    { opportunityType: 'SALES', fromStage: 'QUALIFY', toStages: JSON.stringify(['DEVELOP']) },
    { opportunityType: 'SALES', fromStage: 'DEVELOP', toStages: JSON.stringify(['PROPOSE', 'QUALIFY']) },
    { opportunityType: 'SALES', fromStage: 'PROPOSE', toStages: JSON.stringify(['CLOSE', 'DEVELOP']) },
    { opportunityType: 'SALES', fromStage: 'CLOSE',   toStages: JSON.stringify(['PROPOSE']) },

    // TAGGING: fluid two-stage loop, can jump to CLOSE at any point
    { opportunityType: 'TAGGING', fromStage: 'QUALIFY', toStages: JSON.stringify(['DEVELOP', 'CLOSE']) },
    { opportunityType: 'TAGGING', fromStage: 'DEVELOP', toStages: JSON.stringify(['QUALIFY', 'CLOSE']) },

    // PRODUCT: strict linear — no back-transitions, CLOSE is terminal
    { opportunityType: 'PRODUCT', fromStage: 'QUALIFY', toStages: JSON.stringify(['DEVELOP']) },
    { opportunityType: 'PRODUCT', fromStage: 'DEVELOP', toStages: JSON.stringify(['PROPOSE']) },
    { opportunityType: 'PRODUCT', fromStage: 'PROPOSE', toStages: JSON.stringify(['CLOSE']) },
    { opportunityType: 'PRODUCT', fromStage: 'CLOSE',   toStages: JSON.stringify([]) },
  ];
  await StageTransition.bulkCreate(transitionSeed);
  console.log(`Stage transitions seeded: ${transitionSeed.length} rules across SALES, TAGGING, PRODUCT.`);
  
  // Swiss cities and addresses
  const swissAddresses = [
    'Bahnhofstrasse 45, 8001 Zurich',
    'Rue du Rhone 8, 1204 Geneva',
    'Via Nassa 1, 6900 Lugano',
    'Aeschenvorstadt 1, 4051 Basel',
    'Bundesplatz 1, 3011 Bern',
    'Quai du Mont-Blanc 13, 1201 Geneva',
    'Paradeplatz 6, 8001 Zurich',
    'Rue de la Gare 1, 1003 Lausanne',
    'Löwenplatz 1, 6004 Lucerne',
    'Gerechtigkeitsgasse 1, 3011 Bern',
    'Limmatquai 1, 8001 Zurich',
    'Rue du Grand-Pont 1, 1003 Lausanne',
    'Marktplatz 1, 4001 Basel',
    'Piazza della Riforma 1, 6900 Lugano',
    'Schwanenplatz 1, 6004 Lucerne',
    'Bahnhofsplatz 1, 9000 St. Gallen',
    'Theaterstrasse 1, 8001 Zurich',
    'Place Bel-Air 1, 1204 Geneva',
    'Bohl 1, 9000 St. Gallen',
    'Bahnhofstrasse 1, 6300 Zug'
  ];

  // Seed Clients
  const clientsData = Array.from({ length: 50 }).map((_, i) => ({
    id: `C${1000 + i}`,
    name: [
      'Alexander von Essen', 'Beatriz Silva', 'Chen Wei', 'David O\'Reilly', 'Elena Petrova',
      'Fatimah Al-Sayed', 'Giovanni Rossi', 'Helena Schmidt', 'Isabella Martinez', 'James Wilson',
      'Kaito Tanaka', 'Lucia Fernandez', 'Marcus Aurelius', 'Nadia Sokolov', 'Oliver Twist',
      'Priya Sharma', 'Quentin Tarantino', 'Ravi Shankar', 'Sophie Martin', 'Thomas Anderson'
    ][i % 20] + (i > 19 ? ` ${Math.floor(i/20)}` : ''),
    gender: i % 3 === 0 ? 'FEMALE' : i % 3 === 1 ? 'MALE' : 'NON_BINARY',
    segment: i % 10 === 0 ? 'UHNW' : i % 4 === 0 ? 'HNW' : i % 2 === 0 ? 'AFFLUENT' : 'RETAIL',
    totalWealth: Math.floor(Math.random() * 80000000) + 500000,
    riskTolerance: i % 3 === 0 ? 'AGGRESSIVE' : i % 3 === 1 ? 'CONSERVATIVE' : 'MODERATE',
    lastContact: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    health: i % 15 === 0 ? 'AT_RISK' : i % 5 === 0 ? 'NEUTRAL' : 'HEALTHY',
    avatar: `https://i.pravatar.cc/150?u=C${1000 + i}`,
    address: swissAddresses[i % swissAddresses.length]
  }));
  
  await Client.bulkCreate(clientsData);

  // Seed Opportunities — 20 realistic Global institutional sales entries
  const opportunitiesData = [
    // ── SALES ────────────────────────────────────────────────────────────
    {
      id: '1', clientId: 'C1000', type: 'SALES',
      title: 'Global Equities Expansion',
      stage: 'QUALIFY', ownerAlias: 'AJ', priority: 'HIGH', date: 'OCT 24, 2024',
      accountName: 'Northern Trust Group', value: 850000, estimatedCloseDate: '2025-01-20',
      activities: JSON.stringify([
        { id: 'a1', type: 'MEETING', date: '2024-10-25', notes: 'Initial discovery call. Client expressed high interest in APAC equities expansion.' },
        { id: 'a2', type: 'CALL',    date: '2024-10-28', notes: 'Follow-up. Client prefers German for official documents.' },
        { id: 'a3', type: 'EMAIL',   date: '2024-10-30', notes: 'Draft sent in German. Client requested a simpler format in response.' },
      ]),
      history: JSON.stringify([])
    },
    {
      id: '2', clientId: 'C1003', type: 'SALES',
      title: 'FX Derivatives Mandate',
      stage: 'DEVELOP', ownerAlias: 'MN', priority: 'WINNING', date: 'NOV 05, 2024',
      accountName: 'Helvetia Capital Partners', value: 2400000, estimatedCloseDate: '2025-02-28',
      activities: JSON.stringify([
        { id: 'b1', type: 'MEETING', date: '2024-11-06', notes: 'Presented FX overlay strategy. CFO highly engaged, requested full mandate analysis.' },
        { id: 'b2', type: 'EMAIL',   date: '2024-11-10', notes: 'Sent mandate deck and proposed fee structure. Awaiting investment committee sign-off.' },
      ]),
      history: JSON.stringify([
        { id: 'h1', type: 'STATUS_CHANGE', description: 'Moved to DEVELOP', user: 'MN', date: '5/11/2024, 9:00:00 AM' }
      ])
    },
    {
      id: '3', clientId: 'C1006', type: 'SALES',
      title: 'Private Credit Allocation',
      stage: 'PROPOSE', ownerAlias: 'AD', priority: 'HIGH', date: 'NOV 18, 2024',
      accountName: 'Zurich Pension Board', value: 5100000, estimatedCloseDate: '2025-03-15',
      activities: JSON.stringify([
        { id: 'c1', type: 'MEETING', date: '2024-11-19', notes: 'Board presentation. 3 of 5 board members voted to proceed to formal proposal.' },
      ]),
      history: JSON.stringify([
        { id: 'h1', type: 'STATUS_CHANGE', description: 'Moved to DEVELOP', user: 'AD', date: '4/11/2024, 2:00:00 PM' },
        { id: 'h2', type: 'STATUS_CHANGE', description: 'Moved to PROPOSE', user: 'AD', date: '18/11/2024, 10:00:00 AM' }
      ])
    },
    {
      id: '4', clientId: 'C1009', type: 'SALES',
      title: 'Structured Notes Programme',
      stage: 'CLOSE', ownerAlias: 'SR', priority: 'WINNING', date: 'DEC 01, 2024',
      accountName: 'Lucerne Family Office', value: 3750000, estimatedCloseDate: '2024-12-31',
      activities: JSON.stringify([
        { id: 'd1', type: 'MEETING', date: '2024-12-02', notes: 'Final term sheet review. Client legal team approved. Signing scheduled Dec 20.' },
        { id: 'd2', type: 'EMAIL',   date: '2024-12-05', notes: 'Countersigned term sheet received. Compliance cleared. Moving to settlement.' },
      ]),
      history: JSON.stringify([
        { id: 'h1', type: 'STATUS_CHANGE', description: 'Moved to DEVELOP', user: 'SR', date: '5/11/2024, 9:00:00 AM' },
        { id: 'h2', type: 'STATUS_CHANGE', description: 'Moved to PROPOSE', user: 'SR', date: '20/11/2024, 3:00:00 PM' },
        { id: 'h3', type: 'STATUS_CHANGE', description: 'Moved to CLOSE',   user: 'AD', date: '1/12/2024, 11:00:00 AM' }
      ])
    },
    {
      id: '5', clientId: 'C1012', type: 'SALES',
      title: 'Sustainable Infrastructure Debt',
      stage: 'QUALIFY', ownerAlias: 'AJ', priority: 'MED', date: 'JAN 08, 2025',
      accountName: 'Basel Green Endowment', value: 1200000, estimatedCloseDate: '2025-04-30',
      activities: JSON.stringify([
        { id: 'e1', type: 'EMAIL', date: '2025-01-09', notes: 'Sent ESG-aligned infrastructure debt overview. Sustainability officer acknowledged receipt.' },
      ]),
      history: JSON.stringify([])
    },
    {
      id: '6', clientId: 'C1015', type: 'SALES',
      title: 'Emerging Market Bond Portfolio',
      stage: 'DEVELOP', ownerAlias: 'MN', priority: 'HIGH', date: 'JAN 22, 2025',
      accountName: 'Vaud Canton Treasury', value: 4200000, estimatedCloseDate: '2025-05-20',
      activities: JSON.stringify([
        { id: 'f1', type: 'MEETING', date: '2025-01-23', notes: 'Deep dive into EM credit risk. Treasury team requested a bespoke country-filter overlay.' },
        { id: 'f2', type: 'CALL',    date: '2025-01-29', notes: 'Discussed country exclusion list. Client added 4 more markets for political reasons.' },
      ]),
      history: JSON.stringify([
        { id: 'h1', type: 'STATUS_CHANGE', description: 'Moved to DEVELOP', user: 'MN', date: '22/01/2025, 10:00:00 AM' }
      ])
    },
    {
      id: '7', clientId: 'C1018', type: 'SALES',
      title: 'Multi-Asset Discretionary Mandate',
      stage: 'PROPOSE', ownerAlias: 'AD', priority: 'LOW', date: 'FEB 03, 2025',
      accountName: 'Rhone Asset Management', value: 920000, estimatedCloseDate: '2025-06-01',
      activities: JSON.stringify([]),
      history: JSON.stringify([
        { id: 'h1', type: 'STATUS_CHANGE', description: 'Moved to DEVELOP', user: 'AD', date: '3/02/2025, 9:00:00 AM' },
        { id: 'h2', type: 'STATUS_CHANGE', description: 'Moved to PROPOSE',  user: 'AD', date: '10/02/2025, 3:00:00 PM' }
      ])
    },
    // ── TAGGING ──────────────────────────────────────────────────────────
    {
      id: '8', clientId: 'C1001', type: 'TAGGING',
      title: 'Tier-1 GWM Onboarding',
      stage: 'QUALIFY', ownerAlias: 'SK', priority: 'WINNING', date: 'NOV 02, 2024',
      prioritySegment: 'GWM', campaignCode: 'SUMMER_DRIVE_24', impactScore: 9,
      activities: JSON.stringify([]), history: JSON.stringify([])
    },
    {
      id: '9', clientId: 'C1004', type: 'TAGGING',
      title: 'UHNW ESG Relationship Tag',
      stage: 'DEVELOP', ownerAlias: 'AJ', priority: 'HIGH', date: 'NOV 15, 2024',
      prioritySegment: 'GWM', campaignCode: 'ESG_DRIVE_24', impactScore: 8,
      activities: JSON.stringify([
        { id: 'g1', type: 'MEETING', date: '2024-11-16', notes: 'Client confirmed interest in ESG tagging across all asset classes.' },
      ]),
      history: JSON.stringify([
        { id: 'h1', type: 'STATUS_CHANGE', description: 'Moved to DEVELOP', user: 'AJ', date: '15/11/2024, 9:00:00 AM' }
      ])
    },
    {
      id: '10', clientId: 'C1007', type: 'TAGGING',
      title: 'Institutional Mandate Tracker',
      stage: 'QUALIFY', ownerAlias: 'MN', priority: 'MED', date: 'DEC 10, 2024',
      prioritySegment: 'IB', campaignCode: 'IB_Q4_24', impactScore: 6,
      activities: JSON.stringify([]), history: JSON.stringify([])
    },
    {
      id: '11', clientId: 'C1010', type: 'TAGGING',
      title: 'AM Cross-Sell Pipeline Tag',
      stage: 'DEVELOP', ownerAlias: 'SR', priority: 'LOW', date: 'JAN 14, 2025',
      prioritySegment: 'AM', campaignCode: 'XSELL_Q1_25', impactScore: 5,
      activities: JSON.stringify([
        { id: 'h1', type: 'CALL', date: '2025-01-15', notes: 'Client requested weekly digest of tagged opportunities.' },
      ]),
      history: JSON.stringify([
        { id: 'h1', type: 'STATUS_CHANGE', description: 'Moved to DEVELOP', user: 'SR', date: '14/01/2025, 10:00:00 AM' }
      ])
    },
    {
      id: '12', clientId: 'C1013', type: 'TAGGING',
      title: 'Zurich UHNW Prospect Cluster',
      stage: 'QUALIFY', ownerAlias: 'AJ', priority: 'HIGH', date: 'FEB 01, 2025',
      prioritySegment: 'GWM', campaignCode: 'ZRH_UHNW_25', impactScore: 9,
      activities: JSON.stringify([]), history: JSON.stringify([])
    },
    {
      id: '13', clientId: 'C1016', type: 'TAGGING',
      title: 'Geneva Corridor Relationship Map',
      stage: 'DEVELOP', ownerAlias: 'MN', priority: 'WINNING', date: 'FEB 17, 2025',
      prioritySegment: 'GWM', campaignCode: 'GVA_CORRIDOR_25', impactScore: 10,
      activities: JSON.stringify([
        { id: 'i1', type: 'MEETING', date: '2025-02-18', notes: 'Mapped 7 key relationships in the Geneva corridor. 3 flagged as high-conversion.' },
      ]),
      history: JSON.stringify([
        { id: 'h1', type: 'STATUS_CHANGE', description: 'Moved to DEVELOP', user: 'MN', date: '17/02/2025, 9:00:00 AM' }
      ])
    },
    // ── PRODUCT ──────────────────────────────────────────────────────────
    {
      id: '14', clientId: 'C1002', type: 'PRODUCT',
      title: 'Lombard Loan Automation',
      stage: 'DEVELOP', ownerAlias: 'WL', priority: 'HIGH', date: 'DEC 15, 2024',
      productArea: 'Advisor Portals', voterCount: 14, urgency: 'CRITICAL',
      activities: JSON.stringify([
        { id: 'j1', type: 'MEETING', date: '2024-12-16', notes: '3 integration blockers identified in legacy core banking. Escalated to CTO office.' },
        { id: 'j2', type: 'EMAIL',   date: '2024-12-20', notes: 'Awaiting architectural decision from CTO on integration approach.' },
      ]),
      history: JSON.stringify([
        { id: 'h1', type: 'STATUS_CHANGE', description: 'Moved to DEVELOP', user: 'WL', date: '15/12/2024, 9:00:00 AM' }
      ])
    },
    {
      id: '15', clientId: 'C1005', type: 'PRODUCT',
      title: 'Real-Time P&L Dashboard',
      stage: 'PROPOSE', ownerAlias: 'SK', priority: 'WINNING', date: 'NOV 28, 2024',
      productArea: 'Reporting', voterCount: 22, urgency: 'CRITICAL',
      activities: JSON.stringify([
        { id: 'k1', type: 'MEETING', date: '2024-11-29', notes: 'Trading desk loved the latency improvements in the prototype. Signed off on proposal.' },
      ]),
      history: JSON.stringify([
        { id: 'h1', type: 'STATUS_CHANGE', description: 'Moved to DEVELOP', user: 'SK', date: '1/11/2024, 9:00:00 AM' },
        { id: 'h2', type: 'STATUS_CHANGE', description: 'Moved to PROPOSE',  user: 'SK', date: '28/11/2024, 2:00:00 PM' }
      ])
    },
    {
      id: '16', clientId: 'C1008', type: 'PRODUCT',
      title: 'Order Routing Optimisation',
      stage: 'QUALIFY', ownerAlias: 'AJ', priority: 'HIGH', date: 'JAN 09, 2025',
      productArea: 'Trading', voterCount: 9, urgency: 'FEATURE_REQUEST',
      activities: JSON.stringify([]), history: JSON.stringify([])
    },
    {
      id: '17', clientId: 'C1011', type: 'PRODUCT',
      title: 'Client Portal Accessibility Upgrade',
      stage: 'CLOSE', ownerAlias: 'MN', priority: 'MED', date: 'OCT 30, 2024',
      productArea: 'Advisor Portals', voterCount: 31, urgency: 'CRITICAL',
      activities: JSON.stringify([
        { id: 'l1', type: 'EMAIL', date: '2024-10-31', notes: 'WCAG 2.2 AA compliance confirmed. Deployment green-lit by compliance.' },
      ]),
      history: JSON.stringify([
        { id: 'h1', type: 'STATUS_CHANGE', description: 'Moved to DEVELOP', user: 'MN', date: '1/10/2024, 9:00:00 AM' },
        { id: 'h2', type: 'STATUS_CHANGE', description: 'Moved to PROPOSE',  user: 'MN', date: '15/10/2024, 3:00:00 PM' },
        { id: 'h3', type: 'STATUS_CHANGE', description: 'Moved to CLOSE',    user: 'AD', date: '30/10/2024, 11:00:00 AM' }
      ])
    },
    {
      id: '18', clientId: 'C1014', type: 'PRODUCT',
      title: 'Regulatory Reporting Automation',
      stage: 'DEVELOP', ownerAlias: 'WL', priority: 'WINNING', date: 'JAN 20, 2025',
      productArea: 'Reporting', voterCount: 41, urgency: 'CRITICAL',
      activities: JSON.stringify([
        { id: 'm1', type: 'MEETING', date: '2025-01-21', notes: 'Automation would save 3.5 FTE hours/day. MiFID II + FINMA gaps confirmed.' },
        { id: 'm2', type: 'CALL',    date: '2025-01-27', notes: '8-week sprint timeline agreed. Stakeholders signed off on scope.' },
      ]),
      history: JSON.stringify([
        { id: 'h1', type: 'STATUS_CHANGE', description: 'Moved to DEVELOP', user: 'WL', date: '20/01/2025, 9:00:00 AM' }
      ])
    },
    {
      id: '19', clientId: 'C1017', type: 'PRODUCT',
      title: 'AI-Assisted KYC Review',
      stage: 'QUALIFY', ownerAlias: 'SR', priority: 'HIGH', date: 'FEB 10, 2025',
      productArea: 'Advisor Portals', voterCount: 18, urgency: 'FEATURE_REQUEST',
      activities: JSON.stringify([
        { id: 'n1', type: 'EMAIL', date: '2025-02-11', notes: 'Shared AI KYC proof-of-concept deck with compliance lead. Initial reaction positive.' },
      ]),
      history: JSON.stringify([])
    },
    {
      id: '20', clientId: 'C1019', type: 'PRODUCT',
      title: 'Dark Pool Liquidity Aggregator',
      stage: 'PROPOSE', ownerAlias: 'AJ', priority: 'HIGH', date: 'MAR 01, 2025',
      productArea: 'Trading', voterCount: 26, urgency: 'CRITICAL',
      activities: JSON.stringify([
        { id: 'o1', type: 'MEETING', date: '2025-03-02', notes: 'Backtests show 18bps execution improvement. Proposal to trading committee next week.' },
      ]),
      history: JSON.stringify([
        { id: 'h1', type: 'STATUS_CHANGE', description: 'Moved to DEVELOP', user: 'AJ', date: '10/02/2025, 9:00:00 AM' },
        { id: 'h2', type: 'STATUS_CHANGE', description: 'Moved to PROPOSE',  user: 'AJ', date: '1/03/2025, 10:00:00 AM' }
      ])
    }
  ];
  await Opportunity.bulkCreate(opportunitiesData);
  console.log(`Opportunities seeded: ${opportunitiesData.length} entries across SALES, TAGGING, PRODUCT.`);
  console.log('Database Initialized and Seeded.');
}
