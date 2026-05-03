package com.salesdynamics360.api.service.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.util.*;

/**
 * Google Gemini AI provider.
 * Config:
 *   ai.gemini.api-key=YOUR_KEY
 *   ai.gemini.model=gemini-2.5-flash  (default)
 */
@Component
public class GeminiAiProvider implements AiProvider {

    @Value("${ai.gemini.api-key:}")
    private String apiKey;

    @Value("${ai.gemini.model:gemini-2.5-flash}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String generate(String systemPrompt, String userPrompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Gemini API key not configured (ai.gemini.api-key)");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

        // Build request body per Gemini REST API spec
        Map<String, Object> body = new LinkedHashMap<>();

        // System instruction
        Map<String, Object> systemInstruction = Map.of(
            "parts", List.of(Map.of("text", systemPrompt))
        );
        body.put("system_instruction", systemInstruction);

        // User content
        body.put("contents", List.of(
            Map.of("role", "user", "parts", List.of(Map.of("text", userPrompt)))
        ));

        // Generation config
        body.put("generationConfig", Map.of(
            "temperature", 0.7,
            "maxOutputTokens", 1024
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            return extractGeminiText(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Gemini API call failed: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractGeminiText(Map<String, Object> responseBody) {
        if (responseBody == null) return "No response from Gemini.";
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            if (candidates == null || candidates.isEmpty()) return "No candidates in Gemini response.";
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            return "Failed to parse Gemini response: " + e.getMessage();
        }
    }

    @Override
    public String getProviderName() {
        return "Gemini (" + model + ")";
    }
}
