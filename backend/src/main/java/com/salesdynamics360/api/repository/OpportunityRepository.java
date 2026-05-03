package com.salesdynamics360.api.repository;

import com.salesdynamics360.api.model.Opportunity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OpportunityRepository extends JpaRepository<Opportunity, String> {
}
