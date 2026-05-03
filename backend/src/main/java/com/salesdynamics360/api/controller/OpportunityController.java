package com.salesdynamics360.api.controller;
import com.salesdynamics360.api.model.Opportunity;
import com.salesdynamics360.api.service.OpportunityService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/opportunities")
@CrossOrigin(origins = "*")
public class OpportunityController {
    private final OpportunityService service;

    public OpportunityController(OpportunityService service) {
        this.service = service;
    }

    @GetMapping
    public List<Opportunity> getAll() {
        return service.getAll();
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
