package com.salesdynamics360.api.service.ai;

import org.springframework.stereotype.Component;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Heuristic (rule-based) fallback provider.
 * Used when no AI API key is configured or ai.provider=heuristic.
 * Requires no external API calls — runs entirely locally.
 */
@Component
public class HeuristicAiProvider implements AiProvider {

    @Override
    public String generate(String systemPrompt, String userPrompt) {
        // The heuristic provider doesn't do text generation.
        // It signals the caller to use its own heuristic logic.
        throw new UnsupportedOperationException("HEURISTIC_FALLBACK");
    }

    @Override
    public String getProviderName() {
        return "Heuristic (local)";
    }
}
