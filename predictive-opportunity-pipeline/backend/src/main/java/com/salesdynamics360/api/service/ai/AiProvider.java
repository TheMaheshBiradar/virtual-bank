package com.salesdynamics360.api.service.ai;

/**
 * Strategy interface for AI text generation providers.
 * Implementations: GeminiAiProvider, OpenAiAiProvider, HeuristicAiProvider.
 * Selected via application.properties: ai.provider=gemini|openai|heuristic
 */
public interface AiProvider {

    /**
     * Generate text content from a system instruction and user prompt.
     * @param systemPrompt the system-level instruction (role, tone, constraints)
     * @param userPrompt   the user-facing prompt with data
     * @return generated text response
     */
    String generate(String systemPrompt, String userPrompt);

    /**
     * @return the provider name for logging/debugging
     */
    String getProviderName();
}
