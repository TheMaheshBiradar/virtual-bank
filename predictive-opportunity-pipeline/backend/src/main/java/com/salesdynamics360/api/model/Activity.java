package com.salesdynamics360.api.model;
import jakarta.persistence.*;
@Entity
public class Activity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private String type;
    private String notes;
    private String date;
    public Activity() {}
    public Activity(Long id, String type, String notes, String date) {
        this.id = id; this.type = type; this.notes = notes; this.date = date;
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
}
