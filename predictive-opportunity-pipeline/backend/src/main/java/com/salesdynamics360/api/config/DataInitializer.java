package com.salesdynamics360.api.config;

import com.salesdynamics360.api.model.*;
import com.salesdynamics360.api.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.*;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(
            OpportunityRepository opportunityRepository,
            TypeMetadataRepository typeMetadataRepository,
            StageMetadataRepository stageMetadataRepository) {
        return args -> {
            // 1. Initialize Metadata
            TypeMetadata sales = new TypeMetadata("SALES", "Sales Revenue", "bg-brand-primary", "DollarSign");
            sales.setAllowedTransitions(Map.of(
                "QUALIFY", "DEVELOP",
                "DEVELOP", "PROPOSE,QUALIFY",
                "PROPOSE", "CLOSE,DEVELOP",
                "CLOSE", "PROPOSE"
            ));
            typeMetadataRepository.save(sales);

            TypeMetadata tagging = new TypeMetadata("TAGGING", "Strategic Tagging", "bg-blue-600", "Tag");
            tagging.setAllowedTransitions(Map.of(
                "QUALIFY", "DEVELOP,CLOSE",
                "DEVELOP", "QUALIFY,CLOSE"
            ));
            typeMetadataRepository.save(tagging);

            // 2. Initialize Stages
            stageMetadataRepository.save(new StageMetadata("QUALIFY", "Qualify", 0));
            stageMetadataRepository.save(new StageMetadata("DEVELOP", "Develop", 1));
            stageMetadataRepository.save(new StageMetadata("PROPOSE", "Propose", 2));
            stageMetadataRepository.save(new StageMetadata("CLOSE", "Close", 3));

            // 3. Initialize Benchmark Opportunities
            Opportunity opp1 = Opportunity.builder()
                .title("Global Equities Expansion")
                .type(OpportunityType.SALES)
                .stage(Stage.QUALIFY)
                .ownerAlias("AJ")
                .priority("HIGH")
                .date("OCT 24, 2024")
                .dynamicFields(new HashMap<>(Map.of(
                    "accountName", "Northern Trust",
                    "value", "850000"
                )))
                .build();
            
            opportunityRepository.save(opp1);

            System.out.println("H2 Database Initialized with Benchmark Data.");
        };
    }
}
