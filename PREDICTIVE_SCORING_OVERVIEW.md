# Predictive Opportunity Scoring Overview
**Senior Business Analyst Summary**

## Executive Summary
The Predictive Opportunity Scoring system is an AI-driven "Sales Intelligence Co-Pilot" designed to transform raw pipeline data into actionable strategic insights. It leverages a two-stage orchestration model to provide instant responsiveness combined with deep qualitative analysis.

---

## 1. Architecture: Two-Stage Orchestration
To maintain platform performance while delivering high-fidelity insights, the system utilizes a tiered processing pipeline:

*   **Stage 1: Instant Heuristic Assessment (<100ms)**
    *   **Mechanism:** Deterministic math-based engine.
    *   **Logic:** Evaluates baseline metrics (activity counts, deal value, priority tags).
    *   **Value:** Ensures every opportunity has an immediate score and grade upon entry or startup.
*   **Stage 2: Asynchronous AI Refinement (Background)**
    *   **Mechanism:** Gemini 2.5 Flash LLM.
    *   **Logic:** Analyzes engagement quality, stage velocity, and cross-references external signals.
    *   **Value:** Enriches the score with "Improvers," "Harmers," and "Next Best Action" recommendations.

---

## 2. Multi-Dimensional Signal Synthesis
The AI acts as an **Orchestrator**, weighting three distinct signal categories:

| Signal Category | Weight | Description |
| :--- | :--- | :--- |
| **Behavioral Signals** | ~30% | Recency, frequency, and diversity of client engagement (Meetings vs. Calls vs. Emails). |
| **External Signals** | ~20% | Hard data from **Market Sentiment** (Trading Desk) and **Risk Exposure** (Compliance/Risk). |
| **Pipeline Metadata** | ~50% | Stage velocity, deal value vs. historical average, and data completeness (e.g., Close Date). |

---

## 3. Explainable AI (XAI) Components
The system prioritizes transparency to ensure sales reps trust and act upon the scores:

*   **Score Improvers & Harmers:** Categorized factors (e.g., "Lack of Decision-Maker Engagement") with impact ratings (HIGH/MEDIUM/LOW).
*   **Historical Sparklines:** 30-day visual trend analysis tracking the health trajectory of a deal.
*   **AI Recommendations:** Precise, actionable next steps specific to the opportunity context (e.g., "Schedule term sheet review").

---

## 4. Strategic Business Value
*   **Risk Mitigation:** Real-time identification of "at-risk" high-value deals with declining engagement.
*   **Resource Optimization:** Data-driven prioritization of "Grade A" opportunities.
*   **Forecast Accuracy:** Improved predictability of institutional conversion rates through weighted signal analysis.
