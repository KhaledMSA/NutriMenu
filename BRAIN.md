# BRAIN — The Developer's Mindset & Core Philosophy

> **Identity:** Professional Full-Stack Software Engineer & AI Architect.
> **Core Mission:** Building intelligent, low-friction SaaS platforms combining academic rigor with practical, scalable engineering.

---

## 1. Engineering Philosophy

- **Structured, Incremental Execution:** Development must flow logically and incrementally. Every phase (MVP Landing Page -> Login -> Form -> Generation) must be fully functional and stable before moving to the next.
- **Simplicity & Total Control:** Keep the stack lean and deeply understood. We enforce a strict **Python and Flask** architecture with **SQLite**. React and Node.js are intentionally excluded for this MVP to maintain a focused, server-rendered application.
- **Intelligent Processing:** We approach complex features (like the Nutritional Engine and Image-to-3D integrations) with an AI-first mindset, treating them as intelligent agents that process data rather than simple API endpoints.

## 2. Core Architecture & Best Practices

- **Security First (Environment Variables):** Hardcoding credentials is strictly forbidden. All API keys (especially for future AI and nutritional APIs), database URIs, and Flask secret keys must be isolated securely using `.env` files.
- **Strict Separation of Concerns (SoC):** The architecture must remain highly modular to ensure scalability. Frontend assets (HTML, CSS, Vanilla JS) are strictly separated from backend logic. Within the Flask backend, routing, database models, and utility functions must reside in their own isolated modules.
- **Asynchronous Processing for Heavy Loads:** Knowing that 3D model generation and external API calls can be time-consuming, the system must be designed to handle heavy tasks asynchronously. We will offload heavy processing to background workers to ensure the main thread remains unblocked and the UI stays highly responsive.

## 3. UI/UX & Design Principles

- **Zero-Friction Interactions:** The user experience must be effortless. Forms will utilize tables, dropdowns, and step-by-step wizards to minimize manual typing and ensure clean data collection.
- **Premium Aesthetics:** Modern, calm, dark-themed interfaces. The UI should be comfortable for the eye, conveying trust and high-tech capability to restaurant owners.

## 4. Strict Workflow & Communication Rules for the AI

- **Linguistic Consistency (English Only):** All communication, codebase, UI text, error handling, and documentation are strictly and exclusively in English.
- **No Guessing (Double-Checking):** The AI must NEVER guess variable names, file structures, or existing code. It must explicitly ask the developer for the current code state before providing modifications.
- **Strict Adherence to Current Scope:** Never build ahead. If the current focus is Phase 2, do not generate database models or background task logic for future phases.
- **Modular Codecraft:** Write code that is clean, decoupled, and strictly follows the SoC principles. Documentation must be self-explanatory with professional, clear English comments.

## 5. Current Focus

> **Active Phase:** Phase 3 — Data Entry Form  
> **Objective:** Build an intuitive, zero-friction data entry interface for restaurant owners to input dish names, ingredients, and optional photos. Ensure the form utilizes dropdowns and structured tables to minimize manual typing and prepare data for future AI/Nutritional API processing.
