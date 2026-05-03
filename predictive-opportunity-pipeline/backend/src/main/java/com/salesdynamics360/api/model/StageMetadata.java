package com.salesdynamics360.api.model;
import jakarta.persistence.*;
@Entity
public class StageMetadata {
    @Id
    private String id;
    private String label;
    private int count;
    private String total;
    public StageMetadata() {}
    public static StageMetadataBuilder builder() { return new StageMetadataBuilder(); }
    public static class StageMetadataBuilder {
        private StageMetadata instance = new StageMetadata();
        public StageMetadataBuilder id(String id) { instance.id = id; return this; }
        public StageMetadataBuilder label(String label) { instance.label = label; return this; }
        public StageMetadataBuilder count(int count) { instance.count = count; return this; }
        public StageMetadataBuilder total(String total) { instance.total = total; return this; }
        public StageMetadata build() { return instance; }
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }
    public String getTotal() { return total; }
    public void setTotal(String total) { this.total = total; }
}
