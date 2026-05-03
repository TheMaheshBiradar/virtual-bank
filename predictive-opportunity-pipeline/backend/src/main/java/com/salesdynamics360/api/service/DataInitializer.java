package com.salesdynamics360.api.service;

import com.salesdynamics360.api.model.*;
import com.salesdynamics360.api.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class DataInitializer {
    private final OpportunityRepository opportunityRepository;
    private final TypeMetadataRepository typeMetadataRepository;
    private final AppUserRepository appUserRepository;
    private final StageMetadataRepository stageMetadataRepository;

    public DataInitializer(OpportunityRepository opportunityRepository,
                           TypeMetadataRepository typeMetadataRepository,
                           AppUserRepository appUserRepository,
                           StageMetadataRepository stageMetadataRepository) {
        this.opportunityRepository = opportunityRepository;
        this.typeMetadataRepository = typeMetadataRepository;
        this.appUserRepository = appUserRepository;
        this.stageMetadataRepository = stageMetadataRepository;
    }

    @PostConstruct
    public void init() {
        if (typeMetadataRepository.count() > 0) return;

        // 1. Initialize Metadata Types
        TypeMetadata sales = TypeMetadata.builder()
                .id("SALES")
                .label("Sales Revenue")
                .color("bg-brand-primary")
                .icon("DollarSign")
                .fields(Arrays.asList(
                        FieldConfig.builder().key("accountName").label("Client Account").type("text").required(true).showOnCard(true).isPrimary(true).build(),
                        FieldConfig.builder().key("value").label("Est. Revenue").type("currency").required(true).showOnCard(true).build(),
                        FieldConfig.builder().key("estimatedCloseDate").label("Expected Close").type("date").required(true).showOnCard(true).build()
                ))
                .allowedTransitions(Map.of(
                        "QUALIFY", "DEVELOP",
                        "DEVELOP", "PROPOSE,QUALIFY",
                        "PROPOSE", "CLOSE,DEVELOP",
                        "CLOSE", "PROPOSE"
                ))
                .build();

        TypeMetadata tagging = TypeMetadata.builder()
                .id("TAGGING")
                .label("Strategic Tagging")
                .color("bg-blue-600")
                .icon("Tag")
                .fields(Arrays.asList(
                        FieldConfig.builder().key("prioritySegment").label("Priority Segment").type("select").options(Arrays.asList("GWM", "IB", "AM")).required(true).showOnCard(true).isPrimary(true).build(),
                        FieldConfig.builder().key("campaignCode").label("Campaign Tracker").type("text").showOnCard(true).build(),
                        FieldConfig.builder().key("impactScore").label("Strategic Impact (1-10)").type("number").showOnCard(true).build()
                ))
                .allowedTransitions(Map.of(
                        "QUALIFY", "DEVELOP,CLOSE",
                        "DEVELOP", "QUALIFY,CLOSE"
                ))
                .build();

        TypeMetadata product = TypeMetadata.builder()
                .id("PRODUCT")
                .label("Product Feedback")
                .color("bg-emerald-600")
                .icon("MessageSquare")
                .fields(Arrays.asList(
                        FieldConfig.builder().key("productArea").label("Platform Module").type("select").options(Arrays.asList("Trading", "Reporting", "Advisor Portals")).required(true).showOnCard(true).isPrimary(true).build(),
                        FieldConfig.builder().key("voterCount").label("Client Votes").type("number").showOnCard(true).build(),
                        FieldConfig.builder().key("urgency").label("Market Urgency").type("select").options(Arrays.asList("CRITICAL", "FEATURE_REQUEST", "NICE_TO_HAVE")).showOnCard(true).build()
                ))
                .allowedTransitions(Map.of(
                        "QUALIFY", "DEVELOP",
                        "DEVELOP", "PROPOSE",
                        "PROPOSE", "CLOSE",
                        "CLOSE", ""
                ))
                .build();

        typeMetadataRepository.saveAll(Arrays.asList(sales, tagging, product));

        // 2. Initialize Stage Metadata
        stageMetadataRepository.saveAll(Arrays.asList(
                StageMetadata.builder().id("QUALIFY").label("Qualify").count(12).total("$1.8M").build(),
                StageMetadata.builder().id("DEVELOP").label("Develop").count(8).total("$4.2M").build(),
                StageMetadata.builder().id("PROPOSE").label("Propose").count(5).total("$3.1M").build(),
                StageMetadata.builder().id("CLOSE").label("Close").count(3).total("$0.9M").build()
        ));

        // 3. Initialize Users
        appUserRepository.saveAll(Arrays.asList(
                AppUser.builder().id("1").name("Admin User").alias("AD").role("ADMIN").color("bg-black").email("admin@example.com").build(),
                AppUser.builder().id("2").name("Manager User").alias("MN").role("MANAGER").color("bg-zinc-800").email("manager@example.com").build(),
                AppUser.builder().id("3").name("Sales Rep 1").alias("SR").role("SALES_REP").color("bg-brand-primary").email("rep1@example.com").build()
        ));

        // 4. Initialize Mock Opportunities
        Opportunity opp1 = Opportunity.builder()
                .type(OpportunityType.SALES)
                .title("Global Equities Expansion")
                .ownerAlias("AJ")
                .stage(Stage.QUALIFY)
                .priority("HIGH")
                .date("OCT 24, 2024")
                .dynamicFields(new HashMap<>(Map.of(
                        "accountName", "Northern Trust Group - Mahesh",
                        "value", "850000",
                        "estimatedCloseDate", "2024-12-20"
                )))
                .activities(new ArrayList<>(Collections.singletonList(
                        new Activity(null, "MEETING", "Initial discovery call.", "2024-10-25")
                )))
                .build();

        Opportunity opp2 = Opportunity.builder()
                .type(OpportunityType.TAGGING)
                .title("Tier-1 GWM Onboarding")
                .ownerAlias("SK")
                .stage(Stage.QUALIFY)
                .priority("WINNING")
                .date("NOV 02, 2024")
                .dynamicFields(new HashMap<>(Map.of(
                        "prioritySegment", "GWM",
                        "campaignCode", "SUMMER_DRIVE_24",
                        "impactScore", "9"
                )))
                .build();

        Opportunity opp3 = Opportunity.builder()
                .type(OpportunityType.PRODUCT)
                .title("Lombard Loan Automation")
                .ownerAlias("WL")
                .stage(Stage.DEVELOP)
                .priority("HIGH")
                .date("DEC 15, 2024")
                .dynamicFields(new HashMap<>(Map.of(
                        "productArea", "Advisor Portals",
                        "voterCount", "14",
                        "urgency", "CRITICAL"
                )))
                .build();

        opportunityRepository.saveAll(Arrays.asList(opp1, opp2, opp3));
    }
}
