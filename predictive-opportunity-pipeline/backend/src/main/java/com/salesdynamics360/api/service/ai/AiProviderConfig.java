package com.salesdynamics360.api.service.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Selects the active AI provider based on application.properties.
 *
 * Configuration:
 *   ai.provider=gemini   → uses Gemini (requires ai.gemini.api-key)
 *   ai.provider=openai   → uses OpenAI (requires ai.openai.api-key)
 *   ai.provider=heuristic → uses local rule engine (default, no API key needed)
 */
@Configuration
public class AiProviderConfig {

    private static final Logger log = LoggerFactory.getLogger(AiProviderConfig.class);

    @Value("${ai.provider:heuristic}")
    private String providerName;

    @Bean
    public AiProvider activeAiProvider(GeminiAiProvider gemini,
                                       OpenAiProvider openai,
                                       HeuristicAiProvider heuristic) {
        AiProvider selected;
        switch (providerName.toLowerCase().trim()) {
            case "gemini":
                selected = gemini;
                break;
            case "openai":
                selected = openai;
                break;
            case "heuristic":
            default:
                selected = heuristic;
                break;
        }
        log.info("┌─────────────────────────────────────────────┐");
        log.info("│  AI Provider: {}",  String.format("%-30s│", selected.getProviderName()));
        log.info("└─────────────────────────────────────────────┘");
        return selected;
    }
}
