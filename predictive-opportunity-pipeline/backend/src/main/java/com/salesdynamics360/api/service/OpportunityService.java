package com.salesdynamics360.api.service;

import com.salesdynamics360.api.model.*;
import com.salesdynamics360.api.repository.OpportunityRepository;
import com.salesdynamics360.api.repository.TypeMetadataRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

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

    @Transactional
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

        // Full activity sync: properly merge to avoid Hibernate orphan conflicts
        if (updates.getActivities() != null) {
            syncActivities(existing, updates.getActivities());
        }

        calculateScore(existing);
        return repository.save(existing);
    }

    /**
     * Properly sync the activity list to avoid Hibernate's
     * "A collection with cascade=all-delete-orphan was no longer referenced" error.
     * 
     * Strategy:
     *  1. Remove activities no longer present in the incoming list
     *  2. Update activities that exist in both lists
     *  3. Add new activities (those with null id)
     */
    private void syncActivities(Opportunity existing, List<Activity> incoming) {
        List<Activity> currentList = existing.getActivities();

        // Collect incoming IDs (those that are non-null = existing entries)
        Set<Long> incomingIds = incoming.stream()
                .map(Activity::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // 1. Remove activities that are no longer in the incoming list
        currentList.removeIf(a -> a.getId() != null && !incomingIds.contains(a.getId()));

        // 2. Update existing activities in-place
        Map<Long, Activity> currentById = currentList.stream()
                .filter(a -> a.getId() != null)
                .collect(Collectors.toMap(Activity::getId, a -> a));

        for (Activity inc : incoming) {
            if (inc.getId() != null && currentById.containsKey(inc.getId())) {
                // Update in-place (same managed entity, no detach/reattach)
                Activity current = currentById.get(inc.getId());
                current.setType(inc.getType());
                current.setNotes(inc.getNotes());
                current.setDate(inc.getDate());
            }
        }

        // 3. Add new activities (null id = frontend-generated)
        for (Activity inc : incoming) {
            if (inc.getId() == null) {
                currentList.add(inc);
            }
        }
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
