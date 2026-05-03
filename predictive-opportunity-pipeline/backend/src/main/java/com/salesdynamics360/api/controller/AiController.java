package com.salesdynamics360.api.controller;

import com.salesdynamics360.api.model.Opportunity;
import com.salesdynamics360.api.repository.OpportunityRepository;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private final OpportunityRepository opportunityRepository;

    public AiController(OpportunityRepository opportunityRepository) {
        this.opportunityRepository = opportunityRepository;
    }

    /**
     * Summarizes activities for a specific opportunity.
     * POST /api/ai/summarize
     */
    @PostMapping("/summarize")
    public Map<String, String> summarizeActivities(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Map<String, String>> activities = (List<Map<String, String>>) request.getOrDefault("activities", List.of());
        String riskTolerance = (String) request.getOrDefault("riskTolerance", "Standard");
        String health = (String) request.getOrDefault("health", "Neutral");
        String clientAddress = (String) request.get("clientAddress");
        String employeeAddress = (String) request.get("employeeAddress");

        StringBuilder sb = new StringBuilder();
        sb.append("**Activity Intelligence Summary**\n\n");

        // 1. Engagement volume
        int total = activities.size();
        Map<String, Long> typeCounts = activities.stream()
                .collect(Collectors.groupingBy(a -> a.getOrDefault("type", "OTHER"), Collectors.counting()));

        sb.append("- **Engagement Velocity:** ").append(total).append(" recorded touchpoint");
        if (total != 1) sb.append("s");
        sb.append(". ");
        if (total >= 4) sb.append("High-frequency engagement pattern detected — strong relationship momentum.\n");
        else if (total >= 2) sb.append("Moderate cadence — recommend increasing touchpoint frequency.\n");
        else sb.append("Low engagement. Immediate outreach recommended to re-establish momentum.\n");

        // 2. Channel mix
        if (!typeCounts.isEmpty()) {
            List<String> channels = new ArrayList<>();
            typeCounts.forEach((type, count) -> channels.add(count + " " + type.toLowerCase() + "(s)"));
            sb.append("- **Channel Mix:** ").append(String.join(", ", channels)).append(".");
            if (typeCounts.containsKey("MEETING")) {
                sb.append(" Face-to-face engagement present — high-conviction signal.\n");
            } else {
                sb.append(" No in-person meetings logged — consider scheduling a discovery session.\n");
            }
        }

        // 3. Recency
        String latestDate = activities.stream()
                .map(a -> a.getOrDefault("date", ""))
                .filter(d -> !d.isEmpty())
                .max(String::compareTo)
                .orElse(null);
        if (latestDate != null) {
            sb.append("- **Last Activity:** ").append(latestDate).append(".\n");
        }

        // 4. Risk-aligned recommendation
        sb.append("- **Risk Profile Alignment:** Client is ").append(riskTolerance).append(" risk tolerance");
        sb.append(" with ").append(health).append(" relationship health. ");
        if ("AT_RISK".equals(health) || "AGGRESSIVE".equals(riskTolerance)) {
            sb.append("**Action Required:** Prioritize a senior-level touchpoint within 48 hours.\n");
        } else if ("HEALTHY".equals(health)) {
            sb.append("Maintain current cadence; explore cross-sell opportunities.\n");
        } else {
            sb.append("Schedule a check-in within the next 7 business days.\n");
        }

        // 5. Proximity
        if (clientAddress != null && employeeAddress != null && !clientAddress.isEmpty() && !employeeAddress.isEmpty()) {
            // Simple Swiss canton proximity heuristic
            String clientCity = extractCity(clientAddress);
            String empCity = extractCity(employeeAddress);
            if (clientCity != null && clientCity.equalsIgnoreCase(empCity)) {
                sb.append("- **Proximity Signal:** Client and representative are in the same city (").append(clientCity).append("). ");
                sb.append("Strongly recommend a face-to-face \"Swiss Touch\" meeting for maximum impact.\n");
            }
        }

        // 6. Next Best Actions
        sb.append("\n**Next Best Actions:**\n");
        if (!typeCounts.containsKey("MEETING") || typeCounts.getOrDefault("MEETING", 0L) < 2) {
            sb.append("1. Schedule in-person discovery or portfolio review session.\n");
        } else {
            sb.append("1. Prepare formal proposal deck incorporating latest client feedback.\n");
        }
        if ("AT_RISK".equals(health)) {
            sb.append("2. Escalate to relationship manager for immediate retention strategy.\n");
        } else {
            sb.append("2. Send personalized market update aligned with client's risk profile.\n");
        }
        sb.append("3. Log follow-up task for next week to maintain engagement cadence.\n");

        return Map.of("summary", sb.toString());
    }

    /**
     * Generates strategic pipeline insights.
     * POST /api/ai/insights
     */
    @PostMapping("/insights")
    public Map<String, String> generateInsights(@RequestBody(required = false) Map<String, Object> request) {
        List<Opportunity> opportunities = opportunityRepository.findAll();

        if (opportunities.isEmpty()) {
            return Map.of("summary", "No opportunities in pipeline. Begin prospecting to build deal flow.");
        }

        StringBuilder sb = new StringBuilder();
        sb.append("**Pipeline Strategic Intelligence**\n\n");

        int total = opportunities.size();
        Map<String, Long> byStage = opportunities.stream()
                .collect(Collectors.groupingBy(o -> o.getStage() != null ? o.getStage().name() : "UNKNOWN", Collectors.counting()));
        Map<String, Long> byType = opportunities.stream()
                .collect(Collectors.groupingBy(o -> o.getType() != null ? o.getType().name() : "UNKNOWN", Collectors.counting()));

        // 1. Pipeline composition
        sb.append("- **Pipeline Scale:** ").append(total).append(" active opportunities across ");
        sb.append(byType.size()).append(" deal categories. ");
        long salesCount = byType.getOrDefault("SALES", 0L);
        if (salesCount > total * 0.6) {
            sb.append("⚠️ Revenue pipeline is over-indexed on direct sales — consider diversifying.\n");
        } else {
            sb.append("Healthy category diversification observed.\n");
        }

        // 2. Stage velocity
        long qualifyCount = byStage.getOrDefault("QUALIFY", 0L);
        long closeCount = byStage.getOrDefault("CLOSE", 0L);
        long proposeCount = byStage.getOrDefault("PROPOSE", 0L);
        sb.append("- **Stage Distribution:** ");
        byStage.forEach((stage, count) -> sb.append(stage).append(": ").append(count).append("  "));
        sb.append("\n");
        if (qualifyCount > total * 0.5) {
            sb.append("  ⚠️ **Bottleneck Detected:** Over 50% of deals remain in QUALIFY. ");
            sb.append("Recommend accelerating qualification criteria and discarding low-conviction leads.\n");
        }

        // 3. Revenue concentration
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
            sb.append("- **Revenue Forecast:** $").append(String.format("%,.0f", (double) totalValue));
            sb.append(" in weighted pipeline across ").append(valuedDeals).append(" revenue opportunities. ");
            sb.append("Average deal size: $").append(String.format("%,.0f", (double) totalValue / valuedDeals)).append(".\n");
        }

        // 4. Priority deals
        long highPriority = opportunities.stream()
                .filter(o -> "HIGH".equals(o.getPriority()) || "WINNING".equals(o.getPriority()))
                .count();
        sb.append("- **Strategic Focus:** ").append(highPriority).append(" of ").append(total);
        sb.append(" deals flagged as high-priority or winning. ");
        if (highPriority == total) {
            sb.append("Every deal is elevated — consider re-calibrating priority tiers for better resource allocation.\n");
        } else if (closeCount > 0) {
            sb.append(closeCount).append(" deal(s) in CLOSE stage requiring immediate senior attention.\n");
        }

        // 5. Scoring health
        double avgScore = opportunities.stream()
                .mapToInt(o -> o.getScore() != null ? o.getScore() : 50)
                .average().orElse(50);
        long gradeA = opportunities.stream().filter(o -> "A".equals(o.getGrade())).count();
        sb.append("- **Health Score:** Pipeline average is **").append(String.format("%.0f", avgScore)).append("/100** ");
        sb.append("with ").append(gradeA).append(" Grade-A opportunities. ");
        if (avgScore >= 70) sb.append("Strong pipeline quality.\n");
        else if (avgScore >= 50) sb.append("Moderate quality — focus on upgrading B-grade deals.\n");
        else sb.append("⚠️ Below-average quality. Immediate pipeline review recommended.\n");

        // 6. Actionable recommendations
        sb.append("\n**Weekly Priorities:**\n");
        if (proposeCount > 0) {
            sb.append("1. Accelerate ").append(proposeCount).append(" PROPOSE-stage deal(s) toward close.\n");
        } else {
            sb.append("1. Push top DEVELOP deals into PROPOSE with formal proposals.\n");
        }
        sb.append("2. Review and discard stalled QUALIFY opportunities to improve conversion metrics.\n");
        sb.append("3. Schedule leadership pipeline review to align resource allocation.\n");

        return Map.of("summary", sb.toString());
    }

    private String extractCity(String address) {
        if (address == null) return null;
        // Pattern: "Street, POSTCODE City" — extract the city after the postcode
        String[] parts = address.split(",");
        if (parts.length >= 2) {
            String cityPart = parts[parts.length - 1].trim();
            // Remove postcode digits
            return cityPart.replaceAll("^\\d+\\s*", "").trim();
        }
        return null;
    }
}
