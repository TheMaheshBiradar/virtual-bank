package com.salesdynamics360.api.controller;

import com.salesdynamics360.api.model.Opportunity;
import com.salesdynamics360.api.repository.OpportunityRepository;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/scoring")
@CrossOrigin(origins = "*")
public class ScoringController {

    private final OpportunityRepository opportunityRepository;

    public ScoringController(OpportunityRepository opportunityRepository) {
        this.opportunityRepository = opportunityRepository;
    }

    @GetMapping("/leaderboard")
    public List<Map<String, Object>> getLeaderboard() {
        return opportunityRepository.findAll().stream().map(opp -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("opportunityId", opp.getId());
            entry.put("title", opp.getTitle());
            entry.put("type", opp.getType() != null ? opp.getType().name() : null);
            entry.put("stage", opp.getStage() != null ? opp.getStage().name() : null);
            entry.put("score", opp.getScore() != null ? opp.getScore() : 50);
            entry.put("grade", opp.getGrade() != null ? opp.getGrade() : "B");
            entry.put("trend", "NEW");
            return entry;
        }).sorted((a, b) -> ((Integer) b.get("score")).compareTo((Integer) a.get("score")))
          .collect(Collectors.toList());
    }

    @PostMapping("/batch")
    public Map<String, Object> triggerBatchScoring() {
        List<Opportunity> opps = opportunityRepository.findAll();
        // Re-calculate scores using heuristic engine
        for (Opportunity opp : opps) {
            int score = 50;
            if (opp.getActivities() != null) {
                score += Math.min(opp.getActivities().size() * 5, 20);
            }
            if ("HIGH".equals(opp.getPriority())) score += 10;
            else if ("WINNING".equals(opp.getPriority())) score += 15;
            else if ("LOW".equals(opp.getPriority())) score -= 10;

            int sentiment = (opp.getMarketSentimentScore() != null ? opp.getMarketSentimentScore() : 50) - 50;
            score += (int) Math.floor(sentiment * 0.2);
            int risk = (opp.getRiskScore() != null ? opp.getRiskScore() : 30);
            score -= (int) Math.floor(risk * 0.1);

            String valueStr = opp.getDynamicFields() != null ? opp.getDynamicFields().get("value") : null;
            if (valueStr != null) {
                try {
                    long val = Long.parseLong(valueStr.replaceAll("[^\\d]", ""));
                    if (val > 100000) score += 10;
                } catch (Exception ignored) {}
            }

            int finalScore = Math.max(0, Math.min(100, score));
            opp.setScore(finalScore);
            if (finalScore >= 75) opp.setGrade("A");
            else if (finalScore >= 50) opp.setGrade("B");
            else if (finalScore >= 25) opp.setGrade("C");
            else opp.setGrade("D");
        }
        opportunityRepository.saveAll(opps);
        return Map.of("scored", opps.size(), "status", "OK");
    }
}
