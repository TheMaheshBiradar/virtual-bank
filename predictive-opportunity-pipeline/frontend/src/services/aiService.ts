/**
 * AI Service — calls the Java backend's heuristic scoring engine.
 * Falls back to a local summary only if the backend is unreachable.
 */

export async function summarizeActivities(
  activities: any[],
  clientAddress?: string,
  employeeAddress?: string,
  riskTolerance?: string,
  health?: string
) {
  if (!activities || activities.length === 0) {
    return "No activities recorded. Schedule an initial touchpoint to begin engagement tracking.";
  }

  try {
    const res = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activities,
        clientAddress,
        employeeAddress,
        riskTolerance: riskTolerance || 'Standard',
        health: health || 'Neutral',
      }),
    });
    if (!res.ok) throw new Error('Backend AI service unavailable');
    const data = await res.json();
    return data.summary || "No summary generated.";
  } catch (error) {
    console.error("AI Summarization failed, using local fallback:", error);

    // Minimal local fallback (should rarely trigger)
    const counts = activities.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const latestDate = activities.length > 0
      ? activities.sort((a, b) => b.date.localeCompare(a.date))[0].date
      : null;

    let fallback = "**Activity Summary**\n";
    fallback += `- ${activities.length} touchpoint(s) recorded.\n`;
    if (counts.MEETING) fallback += `- ${counts.MEETING} face-to-face session(s).\n`;
    if (counts.CALL || counts.EMAIL) fallback += `- ${counts.CALL || 0} call(s) and ${counts.EMAIL || 0} email(s).\n`;
    if (latestDate) fallback += `- Most recent: ${latestDate}.\n`;
    fallback += "- Recommendation: Maintain scheduled engagement cadence.";

    return fallback;
  }
}

export async function generatePipelineInsights(opportunities: any[]) {
  try {
    const res = await fetch('/api/ai/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunities }),
    });
    if (!res.ok) throw new Error('Backend AI service unavailable');
    const data = await res.json();
    return data.summary || "No insights generated.";
  } catch (error) {
    console.error("AI Insight generation failed, using local fallback:", error);

    const highPriorityCount = opportunities.filter(
      (o) => o.priority === 'HIGH' || o.priority === 'WINNING'
    ).length;
    const stageBreakdown = opportunities.reduce((acc, o) => {
      acc[o.stage] = (acc[o.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let fallback = "**Pipeline Insights**\n";
    fallback += `- ${opportunities.length} active opportunities.\n`;
    fallback += `- ${highPriorityCount} high-priority or winning deals.\n`;
    if (stageBreakdown.PROPOSE) fallback += `- ${stageBreakdown.PROPOSE} deal(s) in Propose stage.\n`;
    fallback += "- Recommendation: Review stage velocity for optimization opportunities.";

    return fallback;
  }
}
