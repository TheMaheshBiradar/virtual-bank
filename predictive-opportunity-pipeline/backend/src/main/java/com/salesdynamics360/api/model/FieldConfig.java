package com.salesdynamics360.api.model;
import jakarta.persistence.*;
import java.util.*;
@Entity
public class FieldConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @Column(name="config_key") // Avoid reserved word 'key'
    private String fieldKey;
    
    private String label;
    private String type;
    @ElementCollection
    private List<String> options = new ArrayList<>();
    private boolean required;
    private boolean showOnCard;
    private boolean isPrimary;
    public FieldConfig() {}
    public static FieldConfigBuilder builder() { return new FieldConfigBuilder(); }
    public static class FieldConfigBuilder {
        private FieldConfig instance = new FieldConfig();
        public FieldConfigBuilder key(String key) { instance.fieldKey = key; return this; }
        public FieldConfigBuilder label(String label) { instance.label = label; return this; }
        public FieldConfigBuilder type(String type) { instance.type = type; return this; }
        public FieldConfigBuilder options(List<String> options) { instance.options = options; return this; }
        public FieldConfigBuilder required(boolean required) { instance.required = required; return this; }
        public FieldConfigBuilder showOnCard(boolean show) { instance.showOnCard = show; return this; }
        public FieldConfigBuilder isPrimary(boolean primary) { instance.isPrimary = primary; return this; }
        public FieldConfig build() { return instance; }
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    // Maintain getKey/setKey for JSON serialization compatibility with frontend
    public String getKey() { return fieldKey; }
    public void setKey(String key) { this.fieldKey = key; }
    
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }
    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }
    public boolean isShowOnCard() { return showOnCard; }
    public void setShowOnCard(boolean showOnCard) { this.showOnCard = showOnCard; }
    public boolean isIsPrimary() { return isPrimary; }
    public void setIsPrimary(boolean primary) { this.isPrimary = primary; }
}
