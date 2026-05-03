package com.salesdynamics360.api.model;
import jakarta.persistence.*;

@Entity
public class Client {
    @Id
    private String id;
    private String name;
    private String gender;
    private String segment;
    private long totalWealth;
    private String riskTolerance;
    private String lastContact;
    private String health;
    private String avatar;
    private String address;

    public Client() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getSegment() { return segment; }
    public void setSegment(String segment) { this.segment = segment; }
    public long getTotalWealth() { return totalWealth; }
    public void setTotalWealth(long totalWealth) { this.totalWealth = totalWealth; }
    public String getRiskTolerance() { return riskTolerance; }
    public void setRiskTolerance(String riskTolerance) { this.riskTolerance = riskTolerance; }
    public String getLastContact() { return lastContact; }
    public void setLastContact(String lastContact) { this.lastContact = lastContact; }
    public String getHealth() { return health; }
    public void setHealth(String health) { this.health = health; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}
