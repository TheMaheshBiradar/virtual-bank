package com.salesdynamics360.api.model;
import jakarta.persistence.*;
@Entity
public class HistoryEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private String date;
    
    @Column(name="user_name")
    private String userName;
    
    private String description;
    private String type;
    public HistoryEntry() {}
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    
    // Maintain getUser/setUser for JSON serialization compatibility
    public String getUser() { return userName; }
    public void setUser(String user) { this.userName = user; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
