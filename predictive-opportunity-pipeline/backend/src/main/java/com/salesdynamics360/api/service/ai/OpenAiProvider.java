package com.salesdynamics360.api.service.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.util.*;

/**
 * OpenAI ChatCompletion API provider.
 * Config:
 *   ai.openai.api-key=YOUR_KEY
 *   ai.openai.model=gpt-4o  (default)
 */
@Component
public class OpenAiProvider implements AiProvider {

    @Value("${ai.openai.api-key:}")
    private String apiKey;

    @Value("${ai.openai.model:gpt-4o}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String API_URL = "https://api.openai.com/v1/chat/completions";

    @Override
    public String generate(String systemPrompt, String userPrompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("OpenAI API key not configured (ai.openai.api-key)");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("temperature", 0.7);
        body.put("max_tokens", 1024);
        body.put("messages", List.of(
            Map.of("role", "system", "content", systemPrompt),
            Map.of("role", "user", "content", userPrompt)
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(API_URL, HttpMethod.POST, entity, Map.class);
            return extractOpenAiText(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("OpenAI API call failed: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractOpenAiText(Map<String, Object> responseBody) {
        if (responseBody == null) return "No response from OpenAI.";
        try {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            if (choices == null || choices.isEmpty()) return "No choices in OpenAI response.";
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            return (String) message.get("content");
        } catch (Exception e) {
            return "Failed to parse OpenAI response: " + e.getMessage();
        }
    }

    @Override
    public String getProviderName() {
        return "OpenAI (" + model + ")";
    }
}
