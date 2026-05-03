import { GoogleGenAI } from "@google/genai";

// Initialization logic
// Note: In AI Studio, GEMINI_API_KEY is ideally injected into process.env or import.meta.env
// The skill says process.env.GEMINI_API_KEY for React (Vite)
const API_KEY = (process as any).env?.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export async function summarizeActivities(
  activities: any[], 
  clientAddress?: string, 
  employeeAddress?: string,
  riskTolerance?: string,
  health?: string
) {
  if (!ai) return "AI Service not configured.";
  
  const activityTexts = activities.map(a => `[${a.date}] ${a.type}: ${a.notes}`).join('\n');
  let prompt = `Analyze the following sales activities for a client with a ${riskTolerance || 'Standard'} risk tolerance and a current relationship health of ${health || 'Neutral'}. 

Activity Log:
${activityTexts}

Please provide a highly actionable executive summary. Your recommendations MUST:
1. Align with the client's ${riskTolerance || 'stated'} risk profile.
2. Address any red flags indicated by the ${health || 'current'} relationship health.
3. Quantify momentum or identify specific friction points.
4. Suggest 2-3 concrete "Next Best Actions".`;

  if (clientAddress && employeeAddress) {
    prompt += `\n\nGeographic Context: The client is at "${clientAddress}" and the representative is at "${employeeAddress}". If they are within 30km (e.g., same Swiss canton or city), prioritize a face-to-face "Swiss Touch" meeting as a high-value next step.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional sales analyst. Provide brief, bulleted summaries. Maximum 3-4 bullets. Use professional, data-driven language. If proximity information between client and employee is provided, integrate it into your recommendations naturally (e.g., 'Nearby location suggests opportunity for desk-side review')."
      }
    });

    return response.text || "No summary generated.";
  } catch (error) {
    console.error("AI Summarization failed:", error);
    
    // Heuristic Fallback Summary
    const counts = activities.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const latestDate = activities.length > 0 ? activities.sort((a, b) => b.date.localeCompare(a.date))[0].date : null;
    
    let fallback = "**Heuristic Timeline Summary (AI Service Offline):**\n";
    fallback += `- Activity Count: ${activities.length} total touchpoints.\n`;
    if (counts.MEETING) fallback += `- Client Engagement: ${counts.MEETING} face-to-face sessions held.\n`;
    if (counts.CALL || counts.EMAIL) fallback += `- Communication: High frequency via ${counts.CALL || 0} calls and ${counts.EMAIL || 0} emails.\n`;
    if (latestDate) fallback += `- Recency: Most recent interaction occurred on ${latestDate}.\n`;
    fallback += "- Recommendation: Continue scheduled cadence while AI service restores.";
    
    return fallback;
  }
}

export async function generatePipelineInsights(opportunities: any[]) {
  if (!ai) return "AI Service not configured.";

  const data = opportunities.map(o => ({
    title: o.title,
    stage: o.stage,
    value: o.value,
    priority: o.priority,
    type: o.type
  }));

  const prompt = `Review the following sales pipeline and identify high-leverage strategic opportunities:

${JSON.stringify(data, null, 2)}

Provide 3-4 high-impact bullets focusing on:
- Capital Concentration: Are we over-indexed on a specific segment?
- Relationship Friction: Identify stages where deal-flow is hitting a systemic bottleneck.
- Strategic Priority: Which deals should receive senior management attention this week?
- Growth Forecast: Brief assessment of overall pipeline quality vs. quantity.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a Chief Sales Officer at a top-tier Swiss investment bank. Your insights must be data-driven, strategic, and concise. Use banking-grade terminology."
      }
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("AI Insight generation failed:", error);
    const highPriorityCount = opportunities.filter(o => o.priority === 'HIGH' || o.priority === 'WINNING').length;
    const stageBreakdown = opportunities.reduce((acc, o) => {
      acc[o.stage] = (acc[o.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let fallback = "**Heuristic Pipeline Insights (AI Service Offline):**\n";
    fallback += `- Scale: ${opportunities.length} active opportunities detected.\n`;
    fallback += `- Urgency: ${highPriorityCount} deals flagged as high-priority or winning.\n`;
    if (stageBreakdown.PROPOSE) fallback += `- Near-Term: ${stageBreakdown.PROPOSE} deals currently in the 'Propose' phase.\n`;
    fallback += "- Strategy: Monitor stage velocity manually while AI refinement restores.";
    
    return fallback;
  }
}
