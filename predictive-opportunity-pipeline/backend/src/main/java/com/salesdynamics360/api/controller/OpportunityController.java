package com.salesdynamics360.api.controller;

import com.salesdynamics360.api.model.Client;
import com.salesdynamics360.api.model.Opportunity;
import com.salesdynamics360.api.repository.ClientRepository;
import com.salesdynamics360.api.service.OpportunityService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/opportunities")
@CrossOrigin(origins = "*")
public class OpportunityController {
    private final OpportunityService service;
    private final ClientRepository clientRepository;
    private final ObjectMapper objectMapper;

    public OpportunityController(OpportunityService service, ClientRepository clientRepository, ObjectMapper objectMapper) {
        this.service = service;
        this.clientRepository = clientRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public List<Map<String, Object>> getAll() {
        List<Opportunity> opps = service.getAll();

        // Build a client lookup map for efficient enrichment
        Map<String, Client> clientMap = clientRepository.findAll().stream()
                .collect(Collectors.toMap(Client::getId, c -> c));

        return opps.stream().map(opp -> {
            @SuppressWarnings("unchecked")
            Map<String, Object> map = objectMapper.convertValue(opp, Map.class);

            // Enrich with client details if linked
            if (opp.getClientId() != null) {
                Client client = clientMap.get(opp.getClientId());
                if (client != null) {
                    map.put("clientName", client.getName());
                    map.put("clientAvatar", client.getAvatar());
                    map.put("clientAddress", client.getAddress());
                    map.put("clientRiskTolerance", client.getRiskTolerance());
                    map.put("clientHealth", client.getHealth());
                }
            }
            return map;
        }).collect(Collectors.toList());
    }

    /**
     * Accepts the raw JSON from the frontend, extracts only the safe fields,
     * and delegates to OpportunityService.update().
     * This avoids Jackson deserialization errors when the frontend sends
     * history/activity entries with string IDs (backend expects Long).
     */
    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Opportunity updates = new Opportunity();

        // Extract safe primitive fields
        if (body.containsKey("stage")) updates.setStage(com.salesdynamics360.api.model.Stage.valueOf((String) body.get("stage")));
        if (body.containsKey("title")) updates.setTitle((String) body.get("title"));
        if (body.containsKey("ownerAlias")) updates.setOwnerAlias((String) body.get("ownerAlias"));
        if (body.containsKey("priority")) updates.setPriority((String) body.get("priority"));
        if (body.containsKey("date")) updates.setDate((String) body.get("date"));
        if (body.containsKey("clientId")) updates.setClientId((String) body.get("clientId"));
        if (body.containsKey("type")) updates.setType(com.salesdynamics360.api.model.OpportunityType.valueOf((String) body.get("type")));

        // Extract dynamicFields map
        if (body.containsKey("dynamicFields") && body.get("dynamicFields") instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, String> df = (Map<String, String>) body.get("dynamicFields");
            updates.setDynamicFields(df);
        }

        // Extract activities — full array sync (supports add, edit, delete)
        if (body.containsKey("activities") && body.get("activities") instanceof List) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rawActivities = (List<Map<String, Object>>) body.get("activities");
            List<com.salesdynamics360.api.model.Activity> allActivities = new ArrayList<>();
            for (Map<String, Object> a : rawActivities) {
                com.salesdynamics360.api.model.Activity activity = new com.salesdynamics360.api.model.Activity();
                Object aid = a.get("id");
                // Preserve numeric IDs (existing entries), null out string IDs (new from frontend)
                if (aid instanceof Number) {
                    activity.setId(((Number) aid).longValue());
                }
                // id stays null for new entries → JPA will auto-generate
                activity.setType((String) a.get("type"));
                activity.setNotes((String) a.get("notes"));
                activity.setDate((String) a.get("date"));
                allActivities.add(activity);
            }
            updates.setActivities(allActivities);
        }

        // Let service handle the update (it manages history server-side)
        Opportunity saved = service.update(id, updates);

        // Return enriched response
        @SuppressWarnings("unchecked")
        Map<String, Object> result = objectMapper.convertValue(saved, Map.class);
        if (saved.getClientId() != null) {
            clientRepository.findById(saved.getClientId()).ifPresent(client -> {
                result.put("clientName", client.getName());
                result.put("clientAvatar", client.getAvatar());
                result.put("clientAddress", client.getAddress());
                result.put("clientRiskTolerance", client.getRiskTolerance());
                result.put("clientHealth", client.getHealth());
            });
        }
        return result;
    }

    @PostMapping
    public Opportunity create(@RequestBody Opportunity opportunity) {
        return service.save(opportunity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}
