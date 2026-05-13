# NutriMenu — Project Memory

> **Last Updated:** 2026-05-12  
> **Status:** Phase 2 (Authentication) In Progress

---

## 1. Product Overview

**NutriMenu** is a SaaS platform that allows restaurant owners to upload their menu items (ingredients, weights, basic photos) and automatically generates a professional, interactive digital menu featuring API-calculated nutritional facts, allergen filtering, and AI-generated 3D interactive food models.

### MVP Phased Approach

| Phase        | Deliverable                                                                 | Status         |
| ------------ | --------------------------------------------------------------------------- | -------------- |
| **Phase 1**  | Static Landing Page explaining the product                                  | ✅ Completed   |
| **Phase 2**  | Login / Authentication system (Auth0)                                       | ✅ Completed   |
| **Phase 3**  | Account-Tied Menu Builder (1 Account = 1 Restaurant = 1 Menu)               | ✅ Completed   |
| **Phase 4a** | Public slug routing `/menu/<slug>`, Owner Dashboard, distinct nav links     | ✅ Completed   |
| **Phase 4b** | SQLite persistence, durable slug history, multi-tenant retrieval            | 🔄 In Progress |
| **Phase 5**  | Nutritional Engine + Allergen API integration                                | ⬜ Planned     |
| **Phase 6**  | Update Landing Page with a live, owner-curated menu showcase                 | ⬜ Planned     |

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

| Layer          | Technology                           |
| -------------- | ------------------------------------ |
| **Backend**    | Python · Flask                       |
| **Database**   | SQLite                               |
| **Frontend**   | Pure HTML · CSS · Vanilla JavaScript |
| **Deployment** | Render                               |

### Hard Constraints

- **No React, No Node.js.** Backend and frontend are strictly Python/Flask with pure HTML/CSS/JS.
- **Language: English only.** All UI text, error messages, code comments, variable names, and documentation must be in English.
- **Incremental development.** Each phase is prompted and built step-by-step. Do not build ahead.
- **Deployment Protocol:** The live site connected to Render must be updated and tested locally before pushing any commits.

---

## 4. Best Practices

- **Modularity:** Keep templates, routes, and static assets well-organized.
- **Clean Code:** Write well-documented Python with clear docstrings and comments.
- **Responsive UI:** All pages must be responsive and follow modern design principles.
- **Separation of Concerns:** Templates, styles, scripts, and backend logic stay separate.

---

## 5. Project Structure (Planned)

```text
NutriMenu/
├── app.py                  # Main Flask application
├── project_memory.md       # This file — full project context
├── BRAIN.md                # Current phase focus & next steps
├── .env                    # Environment variables (DO NOT COMMIT)
├── requirements.txt        # Python dependencies for Render
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
| 2026-05-12 | Auth0 selected for Phase 2 Authentication    | "Enterprise-grade security, free tier"  |
| 2026-05-14 | Introduced `/menu/<restaurant_slug>` as the canonical, **public**, unauthenticated viewer route. Removed the owner-gated `/menu/preview`. | Digital menus are meant to be shared (QR codes, links). Authentication on the viewer was a regression against product intent. Read access is now fully public; only create/edit/profile remain auth-gated. |
| 2026-05-14 | Added `/dashboard` as the post-login landing page and the central hub for owners. Replaced single-button nav with distinct links (Dashboard, My Profile, Create/Edit Menu, Logout). | A single overloaded CTA forced JS branching and confused users. A dedicated dashboard + explicit nav matches the mental model of a SaaS owner and lets us add owner-only features (analytics, share QR) without polluting other pages. |
| 2026-05-14 | Routing decisions migrated from JS to Jinja2 (server-rendered hrefs); removed `data-action="start"` + "feature coming soon" notification system. | SoC: the server knows the auth state authoritatively; making the client re-derive it via DOM sniffing was fragile and produced misleading "coming soon" toasts after the feature already shipped. |
| 2026-05-14 | Added in-memory demo restaurants (`olive-grove`, `sakura-house`, `trattoria-luce`) seeded at module load and linked from the landing page Menu Examples. | The landing page now demonstrates the finished product end-to-end without requiring a visitor account. Demos are isolated under a synthetic owner so a real Auth0 account can never collide with them. |
| 2026-05-14 | Slug allocation uses `slugify(name)` with a uniqueness guard and a per-owner reverse index (`owner_by_slug`). | Public URLs must be stable, human-readable, and impossible to spoof. Keying ownership by the immutable Auth0 `sub` plus a separate slug→sub index keeps URLs safe to share and resilient to future SQLite migration. |
| 2026-05-14 | Adopted Flask-SQLAlchemy + SQLite (`nutrimenu.db`) for persistent storage; replaced the in-memory `profiles_by_owner` / `menus_by_owner` / `owner_by_slug` dicts with `User` / `Meal` / `Ingredient` models keyed on the Auth0 `sub`. `flask init-db` now runs `db.create_all()`. | The in-memory stores lost every profile and menu on server restart, blocking real testing and deployment to Render. Moving to SQLite via SQLAlchemy gives durable owner-scoped data, lets slugs survive restarts as a public contract, and prepares the schema for the Phase 5 nutrition/allergen joins without further migration. |

## 7. Setup & Deployment

### Local Development Setup

1. **Prerequisites:** Python 3.8+ and pip.
2. **Virtual Environment & Dependencies:**
   ```bash
   python -m venv venv
   # On Windows: venv\Scripts\activate
   # On macOS/Linux: source venv/bin/activate
   pip install -r requirements.txt
   ```
3. **Environment Variables (.env):**
   Create a .env file in the project root containing the following configurations (never commit this file):

   ```
   # Flask Configuration
   FLASK_APP=app.py
   FLASK_ENV=development
   DEBUG=True
   SECRET_KEY=your_secure_random_string

   # Auth0 Configuration
   AUTH0_DOMAIN=your-tenant.region.auth0.com
   AUTH0_CLIENT_ID=your_auth0_client_id
   AUTH0_CLIENT_SECRET=your_auth0_client_secret
   ```

4. **Run The Application:**

   ```bash
   python app.py
   ```

The application will be available at: http://localhost:5000
