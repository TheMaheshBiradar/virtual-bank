# Switching to Azure OpenAI: Integration Guide

This document outlines the necessary architectural and code-level changes required to migrate the **Sales Dynamics 360** scoring engine from Google Gemini to **Microsoft Azure OpenAI**.

---

## 1. Environment Configuration
You will need to update your `.env` file with Azure-specific credentials:

```bash
# REMOVE
# GEMINI_API_KEY="..."

# ADD
AZURE_OPENAI_API_KEY="your-azure-key"
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o" # or your specific model deployment
AZURE_OPENAI_API_VERSION="2024-02-15-preview"
```

---

## 2. Dependency Changes
You will need to replace the Google generative AI library with the standard OpenAI SDK (which supports Azure).

```bash
npm uninstall @google/genai
npm install openai
```

---

## 3. Backend Implementation Changes (`backend/scoringService.ts`)

### 3.1 Client Initialization
```typescript
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

const client = new OpenAIClient(
  process.env.AZURE_OPENAI_ENDPOINT!,
  new AzureKeyCredential(process.env.AZURE_OPENAI_API_KEY!)
);
```

### 3.2 Prompt Execution Logic
The `generateContent` method from Gemini must be replaced with the `getChatCompletions` method.

**Before (Gemini):**
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt,
  config: { systemInstruction: '...' }
});
const text = response.text;
```

**After (Azure OpenAI):**
```typescript
const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_NAME!;
const response = await client.getChatCompletions(deploymentId, [
  { role: "system", content: "You are a professional sales analyst..." },
  { role: "user", content: prompt }
]);
const text = response.choices[0].message?.content;
```

---

## 4. Frontend Integration Changes (`frontend/src/services/aiService.ts`)
If you also use AI on the frontend for timeline summaries, you will need to mirror the changes above.

> **Note:** For security, it is highly recommended to proxy all AI calls through the **Backend** rather than calling Azure OpenAI directly from the browser, as this avoids exposing your Azure API Key in the network tab.

---

## 5. Architectural Considerations
*   **Rate Limits:** Azure OpenAI uses "Tokens Per Minute" (TPM) and "Requests Per Minute" (RPM). You may need to implement a queue if you have a large pipeline (50+ deals).
*   **JSON Mode:** Azure OpenAI supports a dedicated `response_format: { type: "json_object" }` which is more reliable than Gemini's text-based JSON stripping for Stage 2 scoring.
*   **Latency:** GPT-4o typically has slightly higher latency than Gemini Flash but often provides higher reasoning depth for complex "Next Best Action" recommendations.

---
*Migration Guide Version: 1.0.0*
