# Sales Dynamics 360: The Definitive User Guide
**Empowering Institutional Sales with AI-Driven Intelligence**

Welcome to the comprehensive user manual for **Sales Dynamics 360**. This platform is designed to move beyond traditional CRM spreadsheets by providing real-time, predictive insights into your opportunity pipeline.

---

## 1. Getting Started: The Command Center
When you first log in, you are presented with the **Opportunity Management Workspace**. This is your central hub for deal execution.

### 1.1 The Navigation Header
*   **Pipeline Health Bar:** Located at the top, this provides a bird’s-eye view of your total portfolio health. It displays the distribution of Grades (A, B, C, D) across your active deals.
*   **Search & Global Filters:** Use the search bar to find specific clients or deal titles. The filter dropdowns allow you to isolate specific **Product Areas** (e.g., Trading, Advisor Portals) or **Owners**.
*   **Sorting Controls:** Critical for prioritization. You can sort by **Date**, **Value**, or our recommended **Score (High to Low)** to focus on the most promising deals first.

---

## 2. Navigating the Kanban Board
The Kanban board represents the four key stages of the Global deal lifecycle: **Qualify**, **Develop**, **Propose**, and **Close**.

### 2.1 Managing Opportunity Cards
Each card represents a distinct opportunity.
*   **Priority Badges:** High-priority deals are marked with a Red/Indigo badge. Deals nearing conversion ("WINNING") feature a soft green border and subtle glow.
*   **Type Icons:** 
    *   **Dollar Sign ($):** Standard Sales Revenue opportunities.
    *   **Tag Icon:** Strategic Tagging for long-term account positioning.
    *   **Message Bubble:** Product Feedback/Feature requests.
*   **Selection:** Click the small checkbox in the top-left of any card to select it for potential future bulk operations.

### 2.2 Moving Deals (Stage Transitions)
To progress a deal, click and hold the **Grip Rail** (the thin grey bar on the left of the card) and drag it to the next column.
*   **Constraint:** The system enforces standard sales hygiene. You cannot drag a deal directly from "Qualify" to "Close" without passing through the intermediate stages. An error message will appear if a transition is invalid.

---

## 3. The Deep-Dive: Opportunity Details
Clicking on any card expands it to reveal a rich, multi-tabbed interface.

### 3.1 The "Score" Tab (Predictive Insights)
This is the heart of the platform's AI intelligence.
*   **Numerical Score (0-100):** A real-time probability index.
*   **Historical Sparkline:** A 30-day graph showing whether the deal is trending up or down.
*   **AI Explainability (Improvers & Harmers):**
    *   *Example Improver:* "High Engagement with Key Decision Makers (+12 pts)"
    *   *Example Harmer:* "Extended period in 'Develop' stage without activity (-8 pts)"
*   **The AI Recommendation:** A bold, actionable instruction from the Gemini engine (e.g., *"Current market sentiment for Fixed Income is high; prioritize the Term Sheet review this week."*).
*   **Manual Refresh:** If you have just updated your notes, click the **Refresh Icon** (circular arrow) next to the Grade to force an immediate AI re-evaluation.

### 3.2 The "System Signals" Section
Visualized as progress bars, these show external data influence:
*   **Market Sentiment:** High scores (Green) indicate favorable macro conditions for this deal.
*   **Risk Profile:** Indicates the client's current risk tolerance alignment.

### 3.3 The "Activities" Tab
Where you log every client touchpoint.
*   **Types:** Call, Email, Meeting, Task.
*   **Impact:** The AI uses these logs to calculate "Engagement Velocity." Stale logs will lead to a declining score.

---

## 4. Roles & Responsibilities

### 4.1 Sales Representatives (Daily Use)
*   **Mandate:** Maintain data accuracy and follow AI recommendations.
*   **Daily Routine:**
    1.  Check the **Sort by Score** view to identify deals with declining trends.
    2.  Review the **AI Recommendations** for your top 5 deals.
    3.  Log all client interactions to "feed" the AI engine.

### 4.2 Desk Heads & Managers (Strategic Use)
*   **Mandate:** Portfolio health and resource management.
*   **Weekly Routine:**
    1.  Analyze the **Pipeline Health Bar** for any "C" or "D" grade clusters.
    2.  Identify deals where "Market Sentiment" is high but the "Score" is low—these are missed opportunities requiring senior intervention.
    3.  Monitor **Stage Velocity** to identify process bottlenecks.

---

## 5. Advanced System Logic & Edge Cases

### 5.1 The "Sparkle" Effect
A pulsating sparkle icon indicates the **Gemini AI Background Job** is running. During this window, the numerical score is a "Heuristic Estimate." Once the sparkle disappears, the score is "AI Refined."

### 5.2 Handling "No Score" States
On server startup, you may see **"Initializing pipeline health..."**. This is a brief calibration window (approx. 10s) where the system calculates Stage 1 baseline scores. No action is required.

### 5.3 Missing Metadata Penalties
The AI penalizes opportunities with missing "Essential Data." If your deal is stuck at a lower grade despite high activity, ensure you have filled in:
*   Estimated Revenue (Value)
*   Expected Close Date
*   Client Risk Tolerance Profile

---
*Manual Version 2.0.0 — Global Sales Dynamics 360*
