# Sales Management System: PROJECT SEED (INTEGRATED FULL-STACK)

This document contains the complete technical DNA of the **Sales Dynamics 360** platform. It describes the integrated architecture where the UI and Backend are separated into dedicated domains.

---

## 1. Directory Structure
- `/frontend`: React 18 / Vite / Tailwind UI.
- `/backend`: Spring Boot 3 / Java 17 / Gradle backend.
- `server.ts` (Root): Integration proxy and orchestration layer.

---

## 2. Java Backend Provider (`/backend`)
### Build Configuration (`build.gradle`)
```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.5'
    id 'io.spring.dependency-management' version '1.1.4'
}
// Dependencies: web, data-jpa, h2, lombok
```

### Core Logic (`OpportunityService.java`)
Implements business rules for stage transitions and audit logging.
- `validateTransition()`: Rejects invalid moves (e.g., QUALIFY -> CLOSE directly).
- `update()`: Automatically records `HistoryEntry` on mutation.

---

## 3. Frontend UI (`/frontend`)
- **State**: Consumes `GET /api/metadata/schema` to drive form fields and board behavior.
- **Components**: Atomic and reusable, following Swiss-Design principles.

---

## 4. Root Orchestration (`server.ts`)
The root server provides a high-fidelity proxy for development:
- **Dev Mode**: Vite middleware serves UI from `/frontend`. API routes match Java controllers.
- **Prod Mode**: Serves static artifacts from `/frontend/dist`.

---

## 5. Integration Checklist
1. **Restructure**: Move UI to `/frontend`.
2. **Setup SDK**: Use `@google/genai` for pipeline analysis.
3. **Connect API**: Update services to use the unified `/api` prefix.
4. **Safety**: Ensure all destructive UI elements use consistent `ConfirmModal` callback patterns.
5. **Role Check**: Gated logic via `AuthContext` to match the backend permission registry.
