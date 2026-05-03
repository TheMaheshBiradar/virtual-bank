package com.salesdynamics360.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.*;

@Entity
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

    public Opportunity() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public OpportunityType getType() { return type; }
    public void setType(OpportunityType type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Stage getStage() { return stage; }
    public void setStage(Stage stage) { this.stage = stage; }
    public String getOwnerAlias() { return ownerAlias; }
    public void setOwnerAlias(String ownerAlias) { this.ownerAlias = ownerAlias; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<Activity> getActivities() { return activities; }
    public void setActivities(List<Activity> activities) { this.activities = activities; }
    public List<HistoryEntry> getHistory() { return history; }
    public void setHistory(List<HistoryEntry> history) { this.history = history; }
    public Map<String, String> getDynamicFields() { return dynamicFields; }
    public void setDynamicFields(Map<String, String> dynamicFields) { this.dynamicFields = dynamicFields; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public Integer getMarketSentimentScore() { return marketSentimentScore; }
    public void setMarketSentimentScore(Integer marketSentimentScore) { this.marketSentimentScore = marketSentimentScore; }
    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }
    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
}
