# Running the Project Locally

This project is a full-stack application with a **Spring Boot (Java)** backend and a **React (Vite)** frontend.

## Prerequisites
- **Node.js** (v18+)
- **Java JDK 17**
- **Maven** (optional, you can use `./mvnw`)

---

## 1. Backend (Spring Boot)
The backend provides the API service.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Run the application:
   ```bash
   mvn spring-boot:run
   ```
   *The server will start on `http://localhost:8080`.*

---

## 2. Frontend (React + Vite)
The frontend is the user interface.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The interface will be available at `http://localhost:3000` (or the port shown in your terminal).*

---

## 3. How they communicate
- During development, the frontend Vite server proxies calls starting with `/api` to the Spring Boot server (`localhost:8080`).
- For production, run `npm run build` in the root directory. This builds the React app and copies the static files into `backend/src/main/resources/static`, allowing the Java application to serve the entire app as a single unit.
