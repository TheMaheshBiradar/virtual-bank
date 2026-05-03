package com.salesdynamics360.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Opportunity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    private OpportunityType type;

    private String title;

    @Enumerated(EnumType.STRING)
    private Stage stage;

    private String ownerAlias;
    private String priority; // HIGH, MED, LOW, WINNING
    private String date; // OCT 24, 2024
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "opportunity_id")
    private List<Activity> activities = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "opportunity_id")
    private List<HistoryEntry> history = new ArrayList<>();

    @ElementCollection
    private Map<String, String> dynamicFields = new HashMap<>();

    // Predictive Scoring
    private Integer score = 50;
    private String grade = "B";
    private Integer marketSentimentScore = 50;
    private Integer riskScore = 30;
    private String recommendation = "Awaiting analysis...";

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
