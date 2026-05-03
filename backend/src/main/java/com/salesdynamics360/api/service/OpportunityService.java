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
        return repository.save(opportunity);
    }

    public Opportunity update(String id, Opportunity updates) {
        Opportunity existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));

        if (updates.getStage() != null && updates.getStage() != existing.getStage()) {
            validateTransition(existing.getType(), existing.getStage(), updates.getStage());
            
            // Record History
            HistoryEntry entry = new HistoryEntry();
            entry.setType("STATUS_CHANGE");
            entry.setDescription("Stage changed from " + existing.getStage() + " to " + updates.getStage());
            entry.setUser("System"); 
            entry.setDate(new Date().toString());
            existing.getHistory().add(entry);
        }

        // Apply updates
        if (updates.getStage() != null) existing.setStage(updates.getStage());
        if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
        if (updates.getOwnerAlias() != null) existing.setOwnerAlias(updates.getOwnerAlias());
        if (updates.getPriority() != null) existing.setPriority(updates.getPriority());
        if (updates.getDynamicFields() != null) {
            existing.getDynamicFields().putAll(updates.getDynamicFields());
        }

        return repository.save(existing);
    }

    private void validateTransition(OpportunityType type, Stage current, Stage next) {
        Optional<TypeMetadata> meta = typeMetadataRepository.findById(type.name());
        if (meta.isPresent()) {
            String allowed = meta.get().getAllowedTransitions().get(current.name());
            if (allowed != null && !allowed.isEmpty()) {
                List<String> allowedList = Arrays.asList(allowed.split(","));
                if (!allowedList.contains(next.name())) {
                    throw new IllegalStateException("Invalid transition: " + current + " -> " + next);
                }
            }
        }
    }

    public void delete(String id) {
        repository.deleteById(id);
    }
}
