package com.salesdynamics360.api.model;
import jakarta.persistence.*;
import java.util.*;
@Entity
public class TypeMetadata {
    @Id
    private String id;
    private String label;
    private String color;
    private String icon;
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "type_metadata_id")
    private List<FieldConfig> fields = new ArrayList<>();
    @ElementCollection
    private Map<String, String> allowedTransitions = new HashMap<>();
    public TypeMetadata() {}
    public static TypeMetadataBuilder builder() { return new TypeMetadataBuilder(); }
    public static class TypeMetadataBuilder {
        private TypeMetadata instance = new TypeMetadata();
        public TypeMetadataBuilder id(String id) { instance.id = id; return this; }
        public TypeMetadataBuilder label(String label) { instance.label = label; return this; }
        public TypeMetadataBuilder color(String color) { instance.color = color; return this; }
        public TypeMetadataBuilder icon(String icon) { instance.icon = icon; return this; }
        public TypeMetadataBuilder fields(List<FieldConfig> fields) { instance.fields = fields; return this; }
        public TypeMetadataBuilder allowedTransitions(Map<String, String> transitions) { instance.allowedTransitions = transitions; return this; }
        public TypeMetadata build() { return instance; }
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public List<FieldConfig> getFields() { return fields; }
    public void setFields(List<FieldConfig> fields) { this.fields = fields; }
    public Map<String, String> getAllowedTransitions() { return allowedTransitions; }
    public void setAllowedTransitions(Map<String, String> allowedTransitions) { this.allowedTransitions = allowedTransitions; }
}
