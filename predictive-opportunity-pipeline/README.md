<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Global Opportunity Intelligence Platform

A premium Sales Intelligence Platform for institutional banking, standardized on a **Java/Spring Boot** backend and **React** frontend.

## Architecture
- **Backend**: Java 21, Spring Boot, Spring Data JPA, H2 Database (In-Memory).
- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite.
- **Analytics**: Heuristic Scoring Engine (Ported from AI Orchestrator).

## Run Locally

### Prerequisites
- **Java 21** or higher.
- **Maven**.
- **Node.js** (for the frontend).

### 1. Run the Backend (Java)
Navigate to the `backend` folder and run:
```bash
mvn spring-boot:run
```
The API will be available at `http://localhost:8080`.

### 2. Run the Frontend (React)
Navigate to the `frontend` folder and run:
```bash
npm install
npm run dev
```
The app will be available at `http://localhost:5173` (proxied to port 8080).

### 3. Analytics
The predictive scoring engine uses a sophisticated heuristic algorithm implemented in the `OpportunityService.java` to calculate deal health scores (0-100) and Grades (A-D) based on behavioral signals, client wealth, and market risk.
