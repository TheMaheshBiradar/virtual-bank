package com.salesdynamics360.api.repository;
import com.salesdynamics360.api.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ClientRepository extends JpaRepository<Client, String> {}
