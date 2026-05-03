package com.salesdynamics360.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.*;

public enum Stage {
    QUALIFY, DEVELOP, PROPOSE, CLOSE
}

public enum OpportunityType {
    SALES, TAGGING, PRODUCT
}

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Activity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private String type; // CALL, EMAIL, MEETING, TASK
    private String notes;
    private String date; // Using String for simplicity to match frontend "OCT 24, 2024" or ISO
}

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoryEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private String date;
    private String user;
    private String description;
    private String type; // STATUS_CHANGE, EDIT, CREATE, ACTIVITY
}

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private String key;
    private String label;
    private String type; // text, number, date, select, currency
    
    @ElementCollection
    private List<String> options = new ArrayList<>();
    
    private boolean required;
    private boolean showOnCard;
    private boolean isPrimary;
}

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TypeMetadata {
    @Id
    private String id; // SALES, TAGGING, PRODUCT
    private String label;
    private String color;
    private String icon;
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "type_metadata_id")
    private List<FieldConfig> fields = new ArrayList<>();

    @ElementCollection
    private Map<String, String> allowedTransitions = new HashMap<>(); // Simplified: stage -> comma separated stages
}

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppUser {
    @Id
    private String id;
    private String name;
    private String alias;
    private String role;
    private String color;
    private String email;
}

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StageMetadata {
    @Id
    private String id; // QUALIFY, etc.
    private String label;
    private int count;
    private String total;
}
