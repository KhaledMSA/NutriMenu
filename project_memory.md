# NutriMenu — Project Memory

> **Last Updated:** 2026-05-09  
> **Status:** Project Initialization

---

## 1. Product Overview

**NutriMenu** is a SaaS platform that allows restaurant owners to upload their menu items (ingredients, weights, basic photos) and automatically generates a professional, interactive digital menu featuring API-calculated nutritional facts, allergen filtering, and AI-generated 3D interactive food models.

### MVP Phased Approach

| Phase       | Deliverable                                  | Status     |
| ----------- | -------------------------------------------- | ---------- |
| **Phase 1** | Static Landing Page explaining the product   | 🔜 Next    |
| **Phase 2** | Login / Authentication system                | ⬜ Planned |
| **Phase 3** | Data Entry Form for restaurant owners        | ⬜ Planned |
| **Phase 4** | Dynamic Menu Generation from form inputs     | ⬜ Planned |
| **Phase 5** | Update Landing Page with a live menu example | ⬜ Planned |

### Architecture Notes (Future Integrations)

- **Nutritional Engine:** Integration with a calorie/allergen API to auto-calculate nutritional facts from ingredient lists and weights. API to be selected later.
- **Image-to-3D Integration:** Integration with an AI-powered API to generate 3D interactive food models from basic photos. API to be selected later.

---

## 2. Target Persona

**Restaurant Owners** who:

- Lack professional, modern digital menus.
- Do not have the resources or expertise to calculate accurate caloric values.
- Cannot reliably identify and label allergens in their dishes.
- Want an easy, fully automated way to modernize their customer experience.
- Have little to no technical knowledge and need a simple, intuitive interface.

---

## 3. Tech Stack & Constraints

| Layer        | Technology                           |
| ------------ | ------------------------------------ |
| **Backend**  | Python · Flask                       |
| **Database** | SQLite                               |
| **Frontend** | Pure HTML · CSS · Vanilla JavaScript |

### Hard Constraints

- **No React, No Node.js.** Backend and frontend are strictly Python/Flask with pure HTML/CSS/JS.
- **Language: English only.** All UI text, error messages, code comments, variable names, and documentation must be in English.
- **Incremental development.** Each phase is prompted and built step-by-step. Do not build ahead.

---

## 4. Best Practices

- **Modularity:** Keep templates, routes, and static assets well-organized.
- **Clean Code:** Write well-documented Python with clear docstrings and comments.
- **Responsive UI:** All pages must be responsive and follow modern design principles.
- **Separation of Concerns:** Templates, styles, scripts, and backend logic stay separate.

---

## 5. Project Structure (Planned)

```
NutriMenu/
├── app.py                  # Main Flask application
├── project_memory.md       # This file — full project context
├── BRAIN.md                # Current phase focus & next steps
├── templates/              # Jinja2 HTML templates
├── static/
│   ├── css/                # Stylesheets
│   ├── js/                 # Client-side JavaScript
│   └── images/             # Static image assets
├── models/                 # Database models (future)
├── routes/                 # Flask route blueprints (future)
└── nutrimenu.db            # SQLite database (future)
```

---

## 6. Decision Log

| Date       | Decision                                     | Rationale                               |
| ---------- | -------------------------------------------- | --------------------------------------- |
| 2026-05-09 | Project initialized with phased MVP approach | Incremental delivery, avoid scope creep |
| 2026-05-09 | Flask + SQLite + Vanilla JS stack selected   | Simplicity, no framework overhead       |
| 2026-05-09 | English-only constraint established          | Consistency across code and UI          |
