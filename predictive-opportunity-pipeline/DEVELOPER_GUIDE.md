# Sales Dynamics 360: Technical Architecture & Implementation Guide
**Standard Operating Procedure for Engineering & Data Science Teams**

## 1. System Overview
Sales Dynamics 360 is a React-Vite / Node-Express integrated application designed for institutional scale. It utilizes a **Polylithic Architecture**, separating the UI concerns from the heavy computational lifting of the AI-driven scoring engine.

---

## 2. The Predictive Scoring Pipeline (Internal Logic)
The core value proposition of the platform is the **Two-Stage Scoring Orchestrator**. This ensures low-latency UI feedback while maintaining high-fidelity AI insights.

### Stage 1: The Heuristic Engine (Mathematical Baseline)
*   **Trigger:** Immediate (Server startup or deal creation).
*   **Computational Complexity:** O(n).
*   **Logic:** Executes a deterministic algorithm weighing three factors:
    1.  **Activity Density:** (Meetings * 3 + Calls * 2 + Tasks * 1) / Days since creation.
    2.  **Metadata Completeness:** Penalties for missing `value` or `estimatedCloseDate`.
    3.  **Priority Bias:** Weighted multipliers for HIGH and WINNING priorities.
*   **Output:** Baseline score (0-100) and temporary "Initializing..." status.

### Stage 2: The Gemini AI Refiner (Qualitative Inference)
*   **Trigger:** Asynchronous background job.
*   **LLM Model:** Google Gemini 2.5 Flash.
*   **Context Window:** Injects Opportunity metadata, Client sentiment, Risk scores, and Activity logs.
*   **Refinement Logic:** The AI functions as a "Signal Orchestrator," adjusting the heuristic score by ±20% based on qualitative signals (e.g., "CTO-level engagement detected" vs "Repeated internal rescheduling").
*   **Output:** Refined Score, Grade (A-D), Trend (IMPROVING/DECLINING), and Explainability data (Improvers/Harmers).

---

## 3. Data Schema & Persistence
We utilize **Spring Data JPA ORM with H2** for high-performance local state management.

### Key Models:
*   **`Opportunity`**: The primary entity. Contains flexible `activities` and `history` JSON blobs to support heterogeneous deal types (Sales vs. Product).
*   **`OpportunityScore`**: An append-only historical log of scores. This enables the **30-Day Trend Sparklines** in the UI.
*   **`StageTransition`**: A rules-engine table that defines valid workflows (e.g., preventing a "Skip-to-Close" anti-pattern).

---

## 4. UI Design System: "Global Premium"
The interface is built on a custom **Minimalist High-Contrast** design system:
*   **Typography:** Inter (Sans-serif) with varying weights (400-900) to establish information hierarchy.
*   **Palette:**
    *   **Primary:** Global Red (`#E60000`) for CTA and critical numbers.
    *   **Surface:** Neutral Greys (`#F9F9F9`) and high-density White.
    *   **Accents:** Indigo-700 (Strategic Tagging), Emerald-500 (Grade A), Amber-500 (Grade C).
*   **Interactions:** Leverages `framer-motion` for physics-based card transitions and `react-beautiful-dnd` for the Kanban experience.

---

## 5. Security & Authentication
The platform is designed to support **OAuth2 PKCE** flows (configured in `auth.md`).
*   **Session Management:** Stateless JWT-based authentication.
*   **Data Isolation:** Built-in support for tenant/desk-level scoping of opportunities.

---

## 6. Deployment & Scaling
*   **Local Dev:** `npm run dev` (Parallel Vite + Backend processes).
*   **Production:** `npm run build` generates a static asset bundle served by the Express server, ensuring 100% deployment consistency across environments.

---
*Documentation Version: 1.2.0*  
*Last Updated: 2026-05-03*
