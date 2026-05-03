package com.salesdynamics360.api.service;

import com.salesdynamics360.api.model.*;
import com.salesdynamics360.api.repository.OpportunityRepository;
import com.salesdynamics360.api.repository.TypeMetadataRepository;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class OpportunityService {
    private final OpportunityRepository repository;
    private final TypeMetadataRepository typeMetadataRepository;

    public OpportunityService(OpportunityRepository repository, TypeMetadataRepository typeMetadataRepository) {
        this.repository = repository;
        this.typeMetadataRepository = typeMetadataRepository;
    }

    public List<Opportunity> getAll() {
        return repository.findAll();
    }

    public Opportunity save(Opportunity opportunity) {
        calculateScore(opportunity);
        return repository.save(opportunity);
    }

    public Opportunity update(String id, Opportunity updates) {
        Opportunity existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));

        // Stage transition with validation
        if (updates.getStage() != null && updates.getStage() != existing.getStage()) {
            validateTransition(existing.getType(), existing.getStage(), updates.getStage());

            // Record server-side history for transitions
            HistoryEntry entry = new HistoryEntry();
            entry.setType("STATUS_CHANGE");
            entry.setDescription("Stage changed from " + existing.getStage() + " to " + updates.getStage());
            entry.setUser("System");
            entry.setDate(new Date().toString());
            existing.getHistory().add(entry);
        }

        // Apply simple field updates
        if (updates.getStage() != null) existing.setStage(updates.getStage());
        if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
        if (updates.getOwnerAlias() != null) existing.setOwnerAlias(updates.getOwnerAlias());
        if (updates.getPriority() != null) existing.setPriority(updates.getPriority());
        if (updates.getClientId() != null) existing.setClientId(updates.getClientId());
        if (updates.getDate() != null) existing.setDate(updates.getDate());
        if (updates.getType() != null) existing.setType(updates.getType());

        // Merge dynamic fields (don't replace, merge)
        if (updates.getDynamicFields() != null && !updates.getDynamicFields().isEmpty()) {
            existing.getDynamicFields().putAll(updates.getDynamicFields());
        }

        // Merge activities: only add genuinely new ones (those with null id)
        if (updates.getActivities() != null) {
            for (Activity incoming : updates.getActivities()) {
                if (incoming.getId() == null) {
                    existing.getActivities().add(incoming);
                }
            }
        }

        calculateScore(existing);
        return repository.save(existing);
    }

    private void calculateScore(Opportunity opp) {
        int score = 50; // Baseline

        // 1. Activity (max +20)
        if (opp.getActivities() != null) {
            score += Math.min(opp.getActivities().size() * 5, 20);
        }

        // 2. Priority (max +15)
        if ("HIGH".equals(opp.getPriority())) score += 10;
        else if ("WINNING".equals(opp.getPriority())) score += 15;
        else if ("LOW".equals(opp.getPriority())) score -= 10;

        // 3. System Signals (max +15)
        int sentiment = (opp.getMarketSentimentScore() != null ? opp.getMarketSentimentScore() : 50) - 50;
        score += (int) Math.floor(sentiment * 0.2);

        int risk = (opp.getRiskScore() != null ? opp.getRiskScore() : 30);
        score -= (int) Math.floor(risk * 0.1);

        // 4. Value (max +10)
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

    private void validateTransition(OpportunityType type, Stage current, Stage next) {
        Optional<TypeMetadata> meta = typeMetadataRepository.findById(type.name());
        if (meta.isPresent()) {
            String allowed = meta.get().getAllowedTransitions().get(current.name());
            if (allowed != null && !allowed.isEmpty()) {
                List<String> allowedList = Arrays.asList(allowed.split(","));
                if (!allowedList.contains(next.name())) {
                    throw new IllegalStateException(
                        "Invalid transition: " + current + " -> " + next +
                        ". Allowed: " + allowedList
                    );
                }
            }
        }
    }

    public void delete(String id) {
        repository.deleteById(id);
    }
}
