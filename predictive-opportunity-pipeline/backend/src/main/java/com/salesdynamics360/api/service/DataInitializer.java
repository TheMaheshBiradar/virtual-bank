package com.salesdynamics360.api.service;

import com.salesdynamics360.api.model.*;
import com.salesdynamics360.api.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;

@Service
public class DataInitializer {
    private final OpportunityRepository opportunityRepository;
    private final OpportunityService opportunityService;
    private final TypeMetadataRepository typeMetadataRepository;
    private final AppUserRepository appUserRepository;
    private final StageMetadataRepository stageMetadataRepository;
    private final ClientRepository clientRepository;

    public DataInitializer(OpportunityRepository opportunityRepository,
                           OpportunityService opportunityService,
                           TypeMetadataRepository typeMetadataRepository,
                           AppUserRepository appUserRepository,
                           StageMetadataRepository stageMetadataRepository,
                           ClientRepository clientRepository) {
        this.opportunityRepository = opportunityRepository;
        this.opportunityService = opportunityService;
        this.typeMetadataRepository = typeMetadataRepository;
        this.appUserRepository = appUserRepository;
        this.stageMetadataRepository = stageMetadataRepository;
        this.clientRepository = clientRepository;
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

        // 4. Initialize Clients
        String[] names = {"Alexander von Essen", "Beatriz Silva", "Chen Wei", "David O'Reilly", "Elena Petrova",
                "Fatimah Al-Sayed", "Giovanni Rossi", "Helena Schmidt", "Isabella Martinez", "James Wilson",
                "Kaito Tanaka", "Lucia Fernandez", "Marcus Aurelius", "Nadia Sokolov", "Oliver Twist",
                "Priya Sharma", "Quentin Beck", "Ravi Shankar", "Sophie Martin", "Thomas Anderson"};
        String[] addresses = {"Bahnhofstrasse 45, 8001 Zurich", "Rue du Rhone 8, 1204 Geneva",
                "Via Nassa 1, 6900 Lugano", "Aeschenvorstadt 1, 4051 Basel", "Bundesplatz 1, 3011 Bern",
                "Quai du Mont-Blanc 13, 1201 Geneva", "Paradeplatz 6, 8001 Zurich",
                "Rue de la Gare 1, 1003 Lausanne", "Löwenplatz 1, 6004 Lucerne",
                "Gerechtigkeitsgasse 1, 3011 Bern", "Limmatquai 1, 8001 Zurich",
                "Rue du Grand-Pont 1, 1003 Lausanne", "Marktplatz 1, 4001 Basel",
                "Piazza della Riforma 1, 6900 Lugano", "Schwanenplatz 1, 6004 Lucerne",
                "Bahnhofsplatz 1, 9000 St. Gallen", "Theaterstrasse 1, 8001 Zurich",
                "Place Bel-Air 1, 1204 Geneva", "Bohl 1, 9000 St. Gallen", "Bahnhofstrasse 1, 6300 Zug"};
        String[] genders = {"FEMALE", "MALE", "NON_BINARY"};
        String[] risks = {"AGGRESSIVE", "CONSERVATIVE", "MODERATE"};

        Random rng = new Random(42);
        List<Client> clients = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            Client c = new Client();
            c.setId("C" + (1000 + i));
            c.setName(names[i % 20] + (i > 19 ? " " + (i / 20) : ""));
            c.setGender(genders[i % 3]);
            c.setSegment(i % 10 == 0 ? "UHNW" : i % 4 == 0 ? "HNW" : i % 2 == 0 ? "AFFLUENT" : "RETAIL");
            c.setTotalWealth(rng.nextInt(80000000) + 500000);
            c.setRiskTolerance(risks[i % 3]);
            c.setLastContact(Instant.now().minusSeconds(rng.nextInt(10000000)).toString());
            c.setHealth(i % 15 == 0 ? "AT_RISK" : i % 5 == 0 ? "NEUTRAL" : "HEALTHY");
            c.setAvatar("https://i.pravatar.cc/150?u=C" + (1000 + i));
            c.setAddress(addresses[i % 20]);
            clients.add(c);
        }
        clientRepository.saveAll(clients);

        // 5. Initialize Opportunities (with clientId links)
        Opportunity opp1 = new Opportunity();
        opp1.setType(OpportunityType.SALES);
        opp1.setTitle("Global Equities Expansion");
        opp1.setOwnerAlias("AJ");
        opp1.setStage(Stage.QUALIFY);
        opp1.setPriority("HIGH");
        opp1.setDate("OCT 24, 2024");
        opp1.setDynamicFields(new HashMap<>(Map.of(
                "accountName", "Northern Trust Group",
                "value", "850000",
                "estimatedCloseDate", "2024-12-20"
        )));
        opp1.setActivities(new ArrayList<>(Collections.singletonList(
                new Activity(null, "MEETING", "Initial discovery call. Client expressed high interest in APAC equities expansion.", "2024-10-25")
        )));

        Opportunity opp2 = new Opportunity();
        opp2.setType(OpportunityType.SALES);
        opp2.setTitle("FX Derivatives Mandate");
        opp2.setOwnerAlias("MN");
        opp2.setStage(Stage.DEVELOP);
        opp2.setPriority("WINNING");
        opp2.setDate("NOV 05, 2024");
        opp2.setDynamicFields(new HashMap<>(Map.of(
                "accountName", "Helvetia Capital Partners",
                "value", "2400000",
                "estimatedCloseDate", "2025-02-28"
        )));
        opp2.setActivities(new ArrayList<>(Arrays.asList(
                new Activity(null, "MEETING", "Presented FX overlay strategy. CFO highly engaged.", "2024-11-06"),
                new Activity(null, "EMAIL", "Sent mandate deck and proposed fee structure.", "2024-11-10")
        )));

        Opportunity opp3 = new Opportunity();
        opp3.setType(OpportunityType.SALES);
        opp3.setTitle("Private Credit Allocation");
        opp3.setOwnerAlias("AD");
        opp3.setStage(Stage.PROPOSE);
        opp3.setPriority("HIGH");
        opp3.setDate("NOV 18, 2024");
        opp3.setDynamicFields(new HashMap<>(Map.of(
                "accountName", "Zurich Pension Board",
                "value", "5100000",
                "estimatedCloseDate", "2025-03-15"
        )));

        Opportunity opp4 = new Opportunity();
        opp4.setType(OpportunityType.SALES);
        opp4.setTitle("Structured Notes Programme");
        opp4.setOwnerAlias("SR");
        opp4.setStage(Stage.CLOSE);
        opp4.setPriority("WINNING");
        opp4.setDate("DEC 01, 2024");
        opp4.setDynamicFields(new HashMap<>(Map.of(
                "accountName", "Lucerne Family Office",
                "value", "3750000",
                "estimatedCloseDate", "2024-12-31"
        )));
        opp4.setActivities(new ArrayList<>(Arrays.asList(
                new Activity(null, "MEETING", "Final term sheet review. Client legal team approved.", "2024-12-02"),
                new Activity(null, "EMAIL", "Countersigned term sheet received. Compliance cleared.", "2024-12-05")
        )));

        Opportunity opp5 = new Opportunity();
        opp5.setType(OpportunityType.TAGGING);
        opp5.setTitle("Tier-1 GWM Onboarding");
        opp5.setOwnerAlias("SK");
        opp5.setStage(Stage.QUALIFY);
        opp5.setPriority("WINNING");
        opp5.setDate("NOV 02, 2024");
        opp5.setDynamicFields(new HashMap<>(Map.of(
                "prioritySegment", "GWM",
                "campaignCode", "SUMMER_DRIVE_24",
                "impactScore", "9"
        )));

        Opportunity opp6 = new Opportunity();
        opp6.setType(OpportunityType.TAGGING);
        opp6.setTitle("UHNW ESG Relationship Tag");
        opp6.setOwnerAlias("AJ");
        opp6.setStage(Stage.DEVELOP);
        opp6.setPriority("HIGH");
        opp6.setDate("NOV 15, 2024");
        opp6.setDynamicFields(new HashMap<>(Map.of(
                "prioritySegment", "GWM",
                "campaignCode", "ESG_DRIVE_24",
                "impactScore", "8"
        )));

        Opportunity opp7 = new Opportunity();
        opp7.setType(OpportunityType.PRODUCT);
        opp7.setTitle("Lombard Loan Automation");
        opp7.setOwnerAlias("WL");
        opp7.setStage(Stage.DEVELOP);
        opp7.setPriority("HIGH");
        opp7.setDate("DEC 15, 2024");
        opp7.setDynamicFields(new HashMap<>(Map.of(
                "productArea", "Advisor Portals",
                "voterCount", "14",
                "urgency", "CRITICAL"
        )));
        opp7.setActivities(new ArrayList<>(Arrays.asList(
                new Activity(null, "MEETING", "3 integration blockers identified in legacy core banking.", "2024-12-16"),
                new Activity(null, "EMAIL", "Awaiting architectural decision from CTO.", "2024-12-20")
        )));

        Opportunity opp8 = new Opportunity();
        opp8.setType(OpportunityType.PRODUCT);
        opp8.setTitle("Real-Time P&L Dashboard");
        opp8.setOwnerAlias("SK");
        opp8.setStage(Stage.PROPOSE);
        opp8.setPriority("WINNING");
        opp8.setDate("NOV 28, 2024");
        opp8.setDynamicFields(new HashMap<>(Map.of(
                "productArea", "Reporting",
                "voterCount", "22",
                "urgency", "CRITICAL"
        )));

        Opportunity opp9 = new Opportunity();
        opp9.setType(OpportunityType.PRODUCT);
        opp9.setTitle("AI-Assisted KYC Review");
        opp9.setOwnerAlias("SR");
        opp9.setStage(Stage.QUALIFY);
        opp9.setPriority("HIGH");
        opp9.setDate("FEB 10, 2025");
        opp9.setDynamicFields(new HashMap<>(Map.of(
                "productArea", "Advisor Portals",
                "voterCount", "18",
                "urgency", "FEATURE_REQUEST"
        )));

        Opportunity opp10 = new Opportunity();
        opp10.setType(OpportunityType.SALES);
        opp10.setTitle("Emerging Market Bond Portfolio");
        opp10.setOwnerAlias("MN");
        opp10.setStage(Stage.DEVELOP);
        opp10.setPriority("HIGH");
        opp10.setDate("JAN 22, 2025");
        opp10.setDynamicFields(new HashMap<>(Map.of(
                "accountName", "Vaud Canton Treasury",
                "value", "4200000",
                "estimatedCloseDate", "2025-05-20"
        )));

        // Save through OpportunityService so the heuristic scoring engine runs on each
        for (Opportunity opp : Arrays.asList(opp1, opp2, opp3, opp4, opp5, opp6, opp7, opp8, opp9, opp10)) {
            opportunityService.save(opp);
        }
    }
}
