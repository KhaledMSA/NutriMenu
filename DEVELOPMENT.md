# NutriMenu Project Development Guide

## Running the Application

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Setup Instructions

1. **Create a Virtual Environment** (Optional but recommended)
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Development Server**
   ```bash
   python app.py
   ```
   
   The application will be available at: **http://localhost:5000**

---

## Project Structure

```
NutriMenu/
├── app.py                      # Main Flask application (Phase 1)
├── requirements.txt            # Python dependencies
├── project_memory.md           # Project context & decisions
├── BRAIN.md                    # Current phase focus
│
├── templates/
│   └── index.html              # Landing page template (Jinja2)
│
├── static/
│   ├── css/
│   │   └── style.css           # Landing page styles (CSS3)
│   ├── js/
│   │   └── script.js           # Landing page interactions (Vanilla JS)
│   └── images/                 # Static image assets (future)
│
├── models/                     # Database models (Phase 2+)
│   └── __init__.py
│
├── routes/                     # Flask route blueprints (Phase 2+)
│   └── __init__.py
│
└── nutrimenu.db                # SQLite database (Phase 2+)
```

---

## Development Notes

### Phase 1 - Landing Page (Current)
- ✅ Static landing page created
- ✅ Modern dark theme styling
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Basic interactive animations
- ✅ Flask server setup

### Phase 2 - Authentication (Planned)
- Login/Registration system
- User session management
- Password reset flow

### Phase 3 - Data Entry (Planned)
- Menu item form
- Ingredient input
- Photo upload

### Phase 4 - Menu Generation (Planned)
- API integration (nutrition data)
- AI 3D model generation
- Dynamic menu display

### Phase 5 - Live Example (Planned)
- Update landing page with live menu preview
- Customer-facing digital menu interface

---

## Important Files

- **[app.py](app.py)** - Flask application entry point
- **[templates/index.html](templates/index.html)** - Landing page template
- **[static/css/style.css](static/css/style.css)** - Styling with CSS variables
- **[static/js/script.js](static/js/script.js)** - Interactive features

---

## Technology Stack

| Layer        | Technology                 |
| ------------ | -------------------------- |
| **Backend**  | Python 3.8+, Flask 3.0.0   |
| **Frontend** | HTML5, CSS3, Vanilla JS    |
| **Database** | SQLite (Phase 2+)          |
| **Server**   | Gunicorn (production)      |

---

## Future API Integrations

### Nutrition & Allergen Calculation
- Integration with USDA FoodData Central API or similar
- Automatic calorie and allergen labeling from ingredient data

### AI 3D Model Generation
- Integration with AI image-to-3D APIs (e.g., Tripo AI, Meshy, or similar)
- Automatic 3D food visualization from basic photos

---

## Deployment Notes

For production deployment:
1. Set `DEBUG = False` in `app.py`
2. Use a production WSGI server (Gunicorn, uWSGI)
3. Set up proper environment variables
4. Use a production database (PostgreSQL recommended)
5. Configure HTTPS/SSL
6. Set up proper logging and monitoring

Example Gunicorn command:
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## Contact & Support

For questions or issues, refer to project_memory.md for context and decision log.
