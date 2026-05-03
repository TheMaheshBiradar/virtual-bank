package com.salesdynamics360.api.model;
import jakarta.persistence.*;
@Entity
public class AppUser {
    @Id
    private String id;
    private String name;
    private String alias;
    private String role;
    private String color;
    private String email;
    public AppUser() {}
    public static AppUserBuilder builder() { return new AppUserBuilder(); }
    public static class AppUserBuilder {
        private AppUser instance = new AppUser();
        public AppUserBuilder id(String id) { instance.id = id; return this; }
        public AppUserBuilder name(String name) { instance.name = name; return this; }
        public AppUserBuilder alias(String alias) { instance.alias = alias; return this; }
        public AppUserBuilder role(String role) { instance.role = role; return this; }
        public AppUserBuilder color(String color) { instance.color = color; return this; }
        public AppUserBuilder email(String email) { instance.email = email; return this; }
        public AppUser build() { return instance; }
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
