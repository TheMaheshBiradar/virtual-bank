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

    @PostMapping
    public Opportunity create(@RequestBody Opportunity opportunity) {
        return service.save(opportunity);
    }

    @PutMapping("/{id}")
    public Opportunity update(@PathVariable String id, @RequestBody Opportunity opportunity) {
        return service.update(id, opportunity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}
