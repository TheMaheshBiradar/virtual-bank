package com.salesdynamics360.api.controller;

import com.salesdynamics360.api.model.*;
import com.salesdynamics360.api.repository.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/metadata")
@CrossOrigin(origins = "*")
public class MetadataController {

    private final TypeMetadataRepository typeMetadataRepository;
    private final StageMetadataRepository stageMetadataRepository;
    private final AppUserRepository appUserRepository;

    public MetadataController(TypeMetadataRepository typeMetadataRepository,
                              StageMetadataRepository stageMetadataRepository,
                              AppUserRepository appUserRepository) {
        this.typeMetadataRepository = typeMetadataRepository;
        this.stageMetadataRepository = stageMetadataRepository;
        this.appUserRepository = appUserRepository;
    }

    @GetMapping("/schema")
    public Map<String, Object> getSchema() {
        Map<String, Object> response = new HashMap<>();
        
        List<TypeMetadata> types = typeMetadataRepository.findAll();
        Map<String, Object> typesMap = types.stream().collect(Collectors.toMap(
            TypeMetadata::getId,
            tm -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", tm.getId());
                map.put("label", tm.getLabel());
                map.put("color", tm.getColor());
                map.put("icon", tm.getIcon());
                map.put("fields", tm.getFields());
                
                // Convert allowedTransitions back to Map<String, List<String>>
                Map<String, List<String>> transitions = new HashMap<>();
                tm.getAllowedTransitions().forEach((k, v) -> {
                    if (v != null && !v.isEmpty()) {
                        transitions.put(k, Arrays.asList(v.split(",")));
                    } else {
                        transitions.put(k, Collections.emptyList());
                    }
                });
                map.put("allowedTransitions", transitions);
                return map;
            }
        ));
        
        response.put("types", typesMap);
        response.put("stages", stageMetadataRepository.findAll());
        response.put("users", appUserRepository.findAll());
        
        return response;
    }
}
