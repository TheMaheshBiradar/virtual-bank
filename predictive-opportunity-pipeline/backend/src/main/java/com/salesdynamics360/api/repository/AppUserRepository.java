package com.salesdynamics360.api.repository;

import com.salesdynamics360.api.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, String> {}
