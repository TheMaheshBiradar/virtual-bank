package com.salesdynamics360.api.controller;

import com.salesdynamics360.api.model.Opportunity;
import com.salesdynamics360.api.repository.OpportunityRepository;
import com.salesdynamics360.api.service.ai.AiProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private static final Logger log = LoggerFactory.getLogger(AiController.class);

    private final AiProvider aiProvider;
    private final OpportunityRepository opportunityRepository;

    public AiController(@Qualifier("activeAiProvider") AiProvider aiProvider,
                         OpportunityRepository opportunityRepository) {
        this.aiProvider = aiProvider;
        this.opportunityRepository = opportunityRepository;
    }

    /**
     * GET /api/ai/status — returns current provider info
     */
    @GetMapping("/status")
    public Map<String, String> status() {
        return Map.of("provider", aiProvider.getProviderName());
    }

    /**
     * POST /api/ai/summarize — activity intelligence summary
     */
    @PostMapping("/summarize")
    public Map<String, String> summarizeActivities(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Map<String, String>> activities = (List<Map<String, String>>) request.getOrDefault("activities", List.of());
        String riskTolerance = (String) request.getOrDefault("riskTolerance", "Standard");
        String health = (String) request.getOrDefault("health", "Neutral");
        String clientAddress = (String) request.get("clientAddress");
        String employeeAddress = (String) request.get("employeeAddress");

        // Try AI provider first, fall back to heuristic
        try {
            String activityLog = activities.stream()
                    .map(a -> "[" + a.getOrDefault("date", "") + "] " + a.getOrDefault("type", "") + ": " + a.getOrDefault("notes", ""))
                    .collect(Collectors.joining("\n"));

            String systemPrompt = "You are a professional sales analyst at a top-tier Swiss investment bank. " +
                    "Provide brief, bulleted summaries. Maximum 4-5 bullets. Use professional, data-driven language. " +
                    "If proximity information between client and employee is provided, integrate it naturally.";

            StringBuilder userPrompt = new StringBuilder();
            userPrompt.append("Analyze the following sales activities for a client with a ")
                    .append(riskTolerance).append(" risk tolerance and a current relationship health of ").append(health).append(".\n\n");
            userPrompt.append("Activity Log:\n").append(activityLog).append("\n\n");
            userPrompt.append("Provide a highly actionable executive summary. Your recommendations MUST:\n");
            userPrompt.append("1. Align with the client's ").append(riskTolerance).append(" risk profile.\n");
            userPrompt.append("2. Address any red flags indicated by the ").append(health).append(" relationship health.\n");
            userPrompt.append("3. Quantify momentum or identify specific friction points.\n");
            userPrompt.append("4. Suggest 2-3 concrete \"Next Best Actions\".\n");

            if (clientAddress != null && employeeAddress != null && !clientAddress.isEmpty() && !employeeAddress.isEmpty()) {
                userPrompt.append("\nGeographic Context: The client is at \"").append(clientAddress)
                        .append("\" and the representative is at \"").append(employeeAddress)
                        .append("\". If they are within 30km, prioritize a face-to-face meeting.\n");
            }

            String result = aiProvider.generate(systemPrompt, userPrompt.toString());
            log.info("Activity summary generated via {}", aiProvider.getProviderName());
            return Map.of("summary", result, "provider", aiProvider.getProviderName());

        } catch (Exception e) {
            log.info("AI provider unavailable ({}), using heuristic engine", e.getMessage());
            return Map.of("summary", buildHeuristicActivitySummary(activities, riskTolerance, health, clientAddress, employeeAddress),
                          "provider", "Heuristic (local)");
        }
    }

    /**
     * POST /api/ai/insights — strategic pipeline intelligence
     */
    @PostMapping("/insights")
    public Map<String, String> generateInsights(@RequestBody(required = false) Map<String, Object> request) {
        List<Opportunity> opportunities = opportunityRepository.findAll();

        if (opportunities.isEmpty()) {
            return Map.of("summary", "No opportunities in pipeline. Begin prospecting to build deal flow.",
                          "provider", "N/A");
        }

        // Try AI provider first, fall back to heuristic
        try {
            String pipelineData = opportunities.stream().map(o -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("title", o.getTitle());
                m.put("stage", o.getStage());
                m.put("type", o.getType());
                m.put("priority", o.getPriority());
                m.put("score", o.getScore());
                m.put("grade", o.getGrade());
                if (o.getDynamicFields() != null && o.getDynamicFields().containsKey("value")) {
                    m.put("value", o.getDynamicFields().get("value"));
                }
                return m.toString();
            }).collect(Collectors.joining("\n"));

            String systemPrompt = "You are a Chief Sales Officer at a top-tier Swiss investment bank. " +
                    "Your insights must be data-driven, strategic, and concise. Use banking-grade terminology. " +
                    "Provide 4-5 high-impact bullets.";

            String userPrompt = "Review the following sales pipeline and identify high-leverage strategic opportunities:\n\n" +
                    pipelineData + "\n\n" +
                    "Focus on:\n" +
                    "- Capital Concentration: Are we over-indexed on a specific segment?\n" +
                    "- Relationship Friction: Identify stages where deal-flow is hitting a systemic bottleneck.\n" +
                    "- Strategic Priority: Which deals should receive senior management attention this week?\n" +
                    "- Growth Forecast: Brief assessment of overall pipeline quality vs. quantity.\n" +
                    "- Actionable next steps for the week.";

            String result = aiProvider.generate(systemPrompt, userPrompt);
            log.info("Pipeline insights generated via {}", aiProvider.getProviderName());
            return Map.of("summary", result, "provider", aiProvider.getProviderName());

        } catch (Exception e) {
            log.info("AI provider unavailable ({}), using heuristic engine", e.getMessage());
            return Map.of("summary", buildHeuristicPipelineInsights(opportunities),
                          "provider", "Heuristic (local)");
        }
    }

    // ───────────────────────────────────────────────────────────
    // Heuristic Fallback Engines
    // ───────────────────────────────────────────────────────────

    private String buildHeuristicActivitySummary(List<Map<String, String>> activities, String riskTolerance,
                                                  String health, String clientAddress, String employeeAddress) {
        StringBuilder sb = new StringBuilder();
        sb.append("**Activity Intelligence Summary**\n\n");

        int total = activities.size();
        Map<String, Long> typeCounts = activities.stream()
                .collect(Collectors.groupingBy(a -> a.getOrDefault("type", "OTHER"), Collectors.counting()));

        sb.append("- **Engagement Velocity:** ").append(total).append(" recorded touchpoint");
        if (total != 1) sb.append("s");
        sb.append(". ");
        if (total >= 4) sb.append("High-frequency engagement pattern — strong relationship momentum.\n");
        else if (total >= 2) sb.append("Moderate cadence — recommend increasing touchpoint frequency.\n");
        else sb.append("Low engagement. Immediate outreach recommended.\n");

        if (!typeCounts.isEmpty()) {
            List<String> channels = new ArrayList<>();
            typeCounts.forEach((type, count) -> channels.add(count + " " + type.toLowerCase() + "(s)"));
            sb.append("- **Channel Mix:** ").append(String.join(", ", channels)).append(".");
            if (typeCounts.containsKey("MEETING")) {
                sb.append(" Face-to-face engagement present — high-conviction signal.\n");
            } else {
                sb.append(" No in-person meetings — consider scheduling a discovery session.\n");
            }
        }

        String latestDate = activities.stream()
                .map(a -> a.getOrDefault("date", ""))
                .filter(d -> !d.isEmpty())
                .max(String::compareTo).orElse(null);
        if (latestDate != null) {
            sb.append("- **Last Activity:** ").append(latestDate).append(".\n");
        }

        sb.append("- **Risk Profile:** Client is ").append(riskTolerance).append(" risk tolerance");
        sb.append(" with ").append(health).append(" relationship health. ");
        if ("AT_RISK".equals(health)) {
            sb.append("**Action Required:** Senior-level touchpoint within 48 hours.\n");
        } else if ("HEALTHY".equals(health)) {
            sb.append("Maintain cadence; explore cross-sell.\n");
        } else {
            sb.append("Schedule check-in within 7 business days.\n");
        }

        if (clientAddress != null && employeeAddress != null) {
            String clientCity = extractCity(clientAddress);
            String empCity = extractCity(employeeAddress);
            if (clientCity != null && clientCity.equalsIgnoreCase(empCity)) {
                sb.append("- **Proximity Signal:** Same city (").append(clientCity).append(") — face-to-face meeting recommended.\n");
            }
        }

        sb.append("\n**Next Best Actions:**\n");
        if (!typeCounts.containsKey("MEETING") || typeCounts.getOrDefault("MEETING", 0L) < 2) {
            sb.append("1. Schedule in-person portfolio review session.\n");
        } else {
            sb.append("1. Prepare formal proposal incorporating latest feedback.\n");
        }
        sb.append("2. Send personalized market update aligned with risk profile.\n");
        sb.append("3. Log follow-up task for next week.\n");

        return sb.toString();
    }

    private String buildHeuristicPipelineInsights(List<Opportunity> opportunities) {
        StringBuilder sb = new StringBuilder();
        sb.append("**Pipeline Strategic Intelligence**\n\n");

        int total = opportunities.size();
        Map<String, Long> byStage = opportunities.stream()
                .collect(Collectors.groupingBy(o -> o.getStage() != null ? o.getStage().name() : "UNKNOWN", Collectors.counting()));
        Map<String, Long> byType = opportunities.stream()
                .collect(Collectors.groupingBy(o -> o.getType() != null ? o.getType().name() : "UNKNOWN", Collectors.counting()));

        sb.append("- **Pipeline Scale:** ").append(total).append(" active opportunities across ");
        sb.append(byType.size()).append(" deal categories. ");
        long salesCount = byType.getOrDefault("SALES", 0L);
        if (salesCount > total * 0.6) {
            sb.append("⚠️ Over-indexed on direct sales.\n");
        } else {
            sb.append("Healthy diversification.\n");
        }

        sb.append("- **Stage Distribution:** ");
        byStage.forEach((stage, count) -> sb.append(stage).append(": ").append(count).append("  "));
        sb.append("\n");
        long qualifyCount = byStage.getOrDefault("QUALIFY", 0L);
        if (qualifyCount > total * 0.5) {
            sb.append("  ⚠️ **Bottleneck:** Over 50% in QUALIFY — accelerate qualification.\n");
        }

        long totalValue = 0;
        int valuedDeals = 0;
        for (Opportunity opp : opportunities) {
            if (opp.getDynamicFields() != null && opp.getDynamicFields().containsKey("value")) {
                try {
                    totalValue += Long.parseLong(opp.getDynamicFields().get("value").replaceAll("[^\\d]", ""));
                    valuedDeals++;
                } catch (Exception ignored) {}
            }
        }
        if (valuedDeals > 0) {
            sb.append("- **Revenue Forecast:** $").append(String.format("%,d", totalValue));
            sb.append(" across ").append(valuedDeals).append(" deals. Avg: $").append(String.format("%,d", totalValue / valuedDeals)).append(".\n");
        }

        long highPriority = opportunities.stream()
                .filter(o -> "HIGH".equals(o.getPriority()) || "WINNING".equals(o.getPriority())).count();
        sb.append("- **Strategic Focus:** ").append(highPriority).append("/").append(total).append(" high-priority. ");
        long closeCount = byStage.getOrDefault("CLOSE", 0L);
        if (closeCount > 0) {
            sb.append(closeCount).append(" in CLOSE stage.\n");
        } else {
            sb.append("No deals in CLOSE — push top PROPOSE deals forward.\n");
        }

        double avgScore = opportunities.stream()
                .mapToInt(o -> o.getScore() != null ? o.getScore() : 50).average().orElse(50);
        long gradeA = opportunities.stream().filter(o -> "A".equals(o.getGrade())).count();
        sb.append("- **Health Score:** Pipeline avg **").append(String.format("%.0f", avgScore)).append("/100** ");
        sb.append("with ").append(gradeA).append(" Grade-A. ");
        if (avgScore >= 70) sb.append("Strong quality.\n");
        else if (avgScore >= 50) sb.append("Moderate — focus on upgrading B-grade deals.\n");
        else sb.append("⚠️ Below-average. Immediate review recommended.\n");

        long proposeCount = byStage.getOrDefault("PROPOSE", 0L);
        sb.append("\n**Weekly Priorities:**\n");
        if (proposeCount > 0) {
            sb.append("1. Accelerate ").append(proposeCount).append(" PROPOSE deal(s) toward close.\n");
        } else {
            sb.append("1. Push top DEVELOP deals into PROPOSE with formal proposals.\n");
        }
        sb.append("2. Review stalled QUALIFY opportunities.\n");
        sb.append("3. Schedule leadership pipeline review.\n");

        return sb.toString();
    }

    private String extractCity(String address) {
        if (address == null) return null;
        String[] parts = address.split(",");
        if (parts.length >= 2) {
            return parts[parts.length - 1].trim().replaceAll("^\\d+\\s*", "").trim();
        }
        return null;
    }
}
