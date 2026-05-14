"""
NutriMenu - Flask Application
AI-Powered Digital Restaurant Menu Platform

Phase 4b — SQLite persistence via Flask-SQLAlchemy.
Owner identity is the Auth0 `sub`; one Auth0 account == one User row ==
one restaurant profile == one menu (cascading meals + ingredients).
"""

from flask import Flask, render_template, jsonify, session, redirect, url_for, request, flash, abort
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_sqlalchemy import SQLAlchemy
from authlib.integrations.flask_client import OAuth
from werkzeug.utils import secure_filename
from urllib.parse import quote_plus, urlencode
from dotenv import load_dotenv
from functools import wraps
import os
import re
import json
import uuid
from datetime import datetime

load_dotenv()

app = Flask(__name__,
            template_folder=os.path.join(os.path.dirname(__file__), 'templates'),
            static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# ===== Reverse Proxy Fix (Render / any TLS-terminating proxy) =====
# Render terminates SSL at its edge and forwards plain HTTP to the app. Without
# this, `url_for(..., _external=True)` builds `http://` URLs and Auth0 rejects
# the callback as a mismatch. Trust exactly one hop of X-Forwarded-* headers.
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# ===== Configuration =====
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
app.config['DEBUG'] = os.getenv('DEBUG', 'True').lower() == 'true'
app.config['ENV'] = os.getenv('FLASK_ENV', 'development')

# ===== Database Configuration =====
DB_PATH = os.path.join(os.path.dirname(__file__), 'nutrimenu.db')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', f'sqlite:///{DB_PATH}')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ===== File Upload Configuration =====
UPLOAD_FOLDER = os.path.join(app.static_folder, 'uploads')
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_UPLOAD_SIZE_BYTES
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ============================================================================
# Models
# ============================================================================
# Architecture: 1 Auth0 account == 1 User row == 1 restaurant profile == 1 menu.
# `auth0_sub` is the immutable identity key — never derive ownership from email.
# Meals and Ingredients cascade-delete with their parent so removing a User
# (rare; admin-only) leaves no orphans.

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    auth0_sub = db.Column(db.String(255), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255))

    restaurant_name = db.Column(db.String(255))
    slug = db.Column(db.String(255), unique=True, index=True)
    logo_filename = db.Column(db.String(255))

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    meals = db.relationship(
        'Meal',
        backref='owner',
        cascade='all, delete-orphan',
        order_by='Meal.position',
    )

    @property
    def has_profile(self):
        return bool(self.restaurant_name)

    @property
    def updated_at_iso(self):
        return self.updated_at.isoformat() + 'Z' if self.updated_at else ''


class Meal(db.Model):
    __tablename__ = 'meals'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'),
                        nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    photo_filename = db.Column(db.String(255))
    position = db.Column(db.Integer, default=0, nullable=False)

    ingredients = db.relationship(
        'Ingredient',
        backref='meal',
        cascade='all, delete-orphan',
        order_by='Ingredient.position',
    )

    def to_dict(self):
        return {
            'name': self.name,
            'description': self.description,
            'photo_filename': self.photo_filename,
            'ingredients': [ing.to_dict() for ing in self.ingredients],
        }


class Ingredient(db.Model):
    __tablename__ = 'ingredients'

    id = db.Column(db.Integer, primary_key=True)
    meal_id = db.Column(db.Integer, db.ForeignKey('meals.id', ondelete='CASCADE'),
                        nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    amount_grams = db.Column(db.Float, nullable=True)
    position = db.Column(db.Integer, default=0, nullable=False)

    def to_dict(self):
        return {'name': self.name, 'amount_grams': self.amount_grams}


# ============================================================================
# Helpers
# ============================================================================

def is_allowed_image(filename: str) -> bool:
    if not filename or '.' not in filename:
        return False
    return filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


_SLUG_PATTERN = re.compile(r'[^a-z0-9]+')


def slugify(value: str) -> str:
    base = _SLUG_PATTERN.sub('-', (value or '').strip().lower()).strip('-')
    return base or 'restaurant'


def make_unique_slug(desired: str, owner_user_id) -> str:
    """Return `desired` (slugified) if free or already owned by `owner_user_id`,
    otherwise append a short random suffix until it is unique."""
    candidate = slugify(desired)
    holder = User.query.filter_by(slug=candidate).first()
    if holder is None or holder.id == owner_user_id:
        return candidate
    while True:
        contender = f"{candidate}-{uuid.uuid4().hex[:5]}"
        if User.query.filter_by(slug=contender).first() is None:
            return contender


def current_owner_sub():
    user = session.get('user')
    return user.get('sub') if user else None


def current_user_record():
    """Fetch the User row for the authenticated session, or None."""
    sub = current_owner_sub()
    if not sub:
        return None
    return User.query.filter_by(auth0_sub=sub).first()


def upsert_user_from_session():
    """Ensure a User row exists for the current Auth0 session, return it."""
    sub = current_owner_sub()
    if not sub:
        return None
    user_row = User.query.filter_by(auth0_sub=sub).first()
    email = session['user'].get('email')
    if user_row is None:
        user_row = User(auth0_sub=sub, email=email)
        db.session.add(user_row)
        db.session.commit()
    elif email and user_row.email != email:
        user_row.email = email
        db.session.commit()
    return user_row


def login_required(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if not current_owner_sub():
            if request.method == 'POST' or request.accept_mimetypes.best == 'application/json':
                return jsonify({'status': 'error', 'message': 'Authentication required.'}), 401
            return redirect(url_for('login'))
        return view_func(*args, **kwargs)
    return wrapped


def save_uploaded_image(file_storage):
    if not file_storage or not file_storage.filename:
        return None
    if not is_allowed_image(file_storage.filename):
        raise ValueError(f"Unsupported image format: {file_storage.filename}")
    safe_base = secure_filename(file_storage.filename)
    saved_name = f"{uuid.uuid4().hex[:12]}_{safe_base}"
    file_storage.save(os.path.join(app.config['UPLOAD_FOLDER'], saved_name))
    return saved_name


# ===== Auth0 Setup =====
oauth = OAuth(app)
auth0 = oauth.register(
    'auth0',
    client_id=os.getenv('AUTH0_CLIENT_ID'),
    client_secret=os.getenv('AUTH0_CLIENT_SECRET'),
    api_base_url=f"https://{os.getenv('AUTH0_DOMAIN')}",
    access_token_url=f"https://{os.getenv('AUTH0_DOMAIN')}/oauth/token",
    authorize_url=f"https://{os.getenv('AUTH0_DOMAIN')}/authorize",
    client_kwargs={'scope': 'openid profile email'},
    server_metadata_url=f"https://{os.getenv('AUTH0_DOMAIN')}/.well-known/openid-configuration",
)


# ===== Error Handlers =====
@app.errorhandler(404)
def page_not_found(error):
    return jsonify({'error': 'Page not found', 'status': 404,
                    'message': 'The requested page does not exist.'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error', 'status': 500,
                    'message': 'An unexpected error occurred. Please try again later.'}), 500


# ===== Authentication Routes =====
@app.route('/login')
def login():
    return auth0.authorize_redirect(redirect_uri=url_for('callback', _external=True))


@app.route('/callback')
def callback():
    token = auth0.authorize_access_token()
    session['user'] = token['userinfo']
    # Materialize the User row immediately so downstream routes can rely on it.
    upsert_user_from_session()
    return redirect(url_for('dashboard'))


@app.route('/logout')
def logout():
    session.clear()
    return redirect(
        f"https://{os.getenv('AUTH0_DOMAIN')}/v2/logout?"
        f"{urlencode({'returnTo': url_for('index', _external=True), 'client_id': os.getenv('AUTH0_CLIENT_ID')}, quote_via=quote_plus)}"
    )


# ===== Main Routes =====
@app.route('/')
def index():
    return render_template('index.html', published_menus=list_published_menus())


def list_published_menus(limit: int = 6):
    """Return up to `limit` published menus (User has profile + at least one meal),
    most recently updated first."""
    rows = (User.query
            .filter(User.restaurant_name.isnot(None))
            .order_by(User.updated_at.desc())
            .all())
    published = []
    for u in rows:
        if not u.meals:
            continue
        first = u.meals[0]
        published.append({
            'restaurant_name': u.restaurant_name,
            'slug': u.slug,
            'logo_filename': u.logo_filename,
            'meal_count': len(u.meals),
            'first_meal_name': first.name,
            'first_meal_photo': first.photo_filename,
            'updated_at': u.updated_at_iso,
        })
        if len(published) >= limit:
            break
    return published


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'NutriMenu',
        'timestamp': datetime.now().isoformat(),
        'version': '0.1.0',
    }), 200


@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    """Restaurant profile (1-to-1 with the User row keyed by Auth0 sub)."""
    user_row = upsert_user_from_session()

    if request.method == 'GET':
        existing = user_row if user_row.has_profile else None
        return render_template('profile.html', profile=existing)

    restaurant_name = (request.form.get('restaurant_name') or '').strip()
    if not restaurant_name:
        return jsonify({'status': 'error', 'message': 'Restaurant name is required.'}), 400

    try:
        new_logo = save_uploaded_image(request.files.get('restaurant_logo'))
    except ValueError as exc:
        return jsonify({'status': 'error', 'message': str(exc)}), 400

    # Reissue the slug only when the underlying name actually changed.
    if user_row.slug and slugify(restaurant_name) == slugify(user_row.restaurant_name or ''):
        slug = user_row.slug
    else:
        slug = make_unique_slug(restaurant_name, user_row.id)

    user_row.restaurant_name = restaurant_name
    user_row.slug = slug
    if new_logo:
        user_row.logo_filename = new_logo

    db.session.commit()

    app.logger.info("Profile saved | owner=%s | restaurant=%s | slug=%s | logo=%s",
                    user_row.email, restaurant_name, slug, user_row.logo_filename)

    return jsonify({
        'status': 'success',
        'message': 'Profile saved.',
        'redirect_url': url_for('dashboard'),
    }), 200


def _handle_menu_submission(user_row):
    """Shared POST handler for /create-menu and /edit-menu. Validates the
    payload, saves uploaded photos, then replaces the user's meals atomically.
    Returns a Flask response."""
    raw_payload = request.form.get('menu_json')
    if not raw_payload:
        return jsonify({'status': 'error', 'message': 'Missing menu payload.'}), 400

    try:
        menu_payload = json.loads(raw_payload)
    except json.JSONDecodeError:
        return jsonify({'status': 'error', 'message': 'Menu payload is not valid JSON.'}), 400

    meals_input = menu_payload.get('meals') or []
    if not isinstance(meals_input, list) or len(meals_input) == 0:
        return jsonify({'status': 'error', 'message': 'At least one meal is required.'}), 400

    # Per-meal validation (authoritative; never trust client).
    for idx, meal in enumerate(meals_input):
        name = (meal.get('name') or '').strip()
        description = (meal.get('description') or '').strip()
        ingredients = meal.get('ingredients') or []
        if not name or not description:
            return jsonify({'status': 'error',
                            'message': f'Meal #{idx + 1}: name and description are required.'}), 400
        if not isinstance(ingredients, list) or len(ingredients) == 0:
            return jsonify({'status': 'error',
                            'message': f'Meal #{idx + 1}: at least one ingredient is required.'}), 400
        for ing_idx, ingredient in enumerate(ingredients):
            ing_name = (ingredient.get('name') or '').strip()
            if not ing_name:
                return jsonify({'status': 'error',
                                'message': f'Meal #{idx + 1} ingredient #{ing_idx + 1}: name is required.'}), 400
            raw_amount = ingredient.get('amount_grams')
            if raw_amount in (None, '', []):
                amount_grams = None
            else:
                try:
                    amount_grams = float(raw_amount)
                except (TypeError, ValueError):
                    return jsonify({'status': 'error',
                                    'message': f'Meal #{idx + 1} "{ing_name}": weight must be a number in grams.'}), 400
                if amount_grams < 0:
                    return jsonify({'status': 'error',
                                    'message': f'Meal #{idx + 1} "{ing_name}": weight cannot be negative.'}), 400
            ingredient['_validated_amount_grams'] = amount_grams

    # Preserve previously saved photos by positional index when no new file is sent.
    existing_photos = [m.photo_filename for m in user_row.meals]

    new_meals = []
    for idx, meal in enumerate(meals_input):
        photo_field = f'meal_photo_{idx}'
        try:
            new_photo = save_uploaded_image(request.files.get(photo_field))
        except ValueError as exc:
            return jsonify({'status': 'error', 'message': f'Meal #{idx + 1}: {exc}'}), 400
        photo_filename = new_photo if new_photo else (
            existing_photos[idx] if idx < len(existing_photos) else None
        )

        meal_row = Meal(
            name=(meal.get('name') or '').strip(),
            description=(meal.get('description') or '').strip(),
            photo_filename=photo_filename,
            position=idx,
        )
        for ing_idx, item in enumerate(meal.get('ingredients') or []):
            ing_name = (item.get('name') or '').strip()
            if not ing_name:
                continue
            meal_row.ingredients.append(Ingredient(
                name=ing_name,
                amount_grams=item.get('_validated_amount_grams'),
                position=ing_idx,
            ))
        new_meals.append(meal_row)

    log_action = 'updated' if user_row.meals else 'created'

    # Replace the meal collection in one transaction. cascade='all, delete-orphan'
    # tears down the prior meals + ingredients when we reassign the list.
    user_row.meals = new_meals
    user_row.updated_at = datetime.utcnow()
    db.session.commit()

    app.logger.info("Menu %s | owner=%s | meals=%d", log_action, user_row.email, len(new_meals))

    return jsonify({
        'status': 'success',
        'message': f'Menu {log_action} successfully.',
        'redirect_url': url_for('dashboard'),
    }), 200


@app.route('/create-menu', methods=['GET', 'POST'])
@login_required
def create_menu():
    """Menu builder for the authenticated owner. Profile is a prerequisite."""
    user_row = upsert_user_from_session()

    if not user_row.has_profile:
        if request.method == 'POST':
            return jsonify({
                'status': 'error',
                'message': 'Set up your restaurant profile first.',
                'redirect_url': url_for('profile'),
            }), 400
        flash('Please set up your restaurant profile before building a menu.', 'error')
        return redirect(url_for('profile'))

    if request.method == 'GET':
        existing_menu = {'meals': [m.to_dict() for m in user_row.meals]} if user_row.meals else None
        return render_template(
            'create_menu.html',
            profile=user_row,
            existing_menu=existing_menu,
        )

    return _handle_menu_submission(user_row)


@app.route('/edit-menu', methods=['GET', 'POST'])
@login_required
def edit_menu():
    """Edit the authenticated owner's existing menu."""
    user_row = upsert_user_from_session()

    if not user_row.has_profile:
        flash('Set up your restaurant profile first.', 'error')
        return redirect(url_for('profile'))

    if request.method == 'GET' and not user_row.meals:
        flash('You do not have a menu to edit yet. Create one first.', 'error')
        return redirect(url_for('create_menu'))

    if request.method == 'GET':
        existing_menu = {'meals': [m.to_dict() for m in user_row.meals]}
        return render_template(
            'create_menu.html',
            profile=user_row,
            existing_menu=existing_menu,
        )

    return _handle_menu_submission(user_row)


@app.route('/dashboard')
@login_required
def dashboard():
    user_row = upsert_user_from_session()
    profile_record = user_row if user_row.has_profile else None
    has_menu = bool(user_row.meals)

    public_menu_url = None
    if profile_record and has_menu:
        public_menu_url = url_for('public_menu', restaurant_slug=user_row.slug, _external=True)

    return render_template(
        'dashboard.html',
        profile=profile_record,
        has_menu=has_menu,
        meal_count=len(user_row.meals),
        public_menu_url=public_menu_url,
    )


@app.route('/menu/<restaurant_slug>')
def public_menu(restaurant_slug):
    """PUBLIC customer-facing digital menu (no authentication)."""
    user_row = User.query.filter_by(slug=restaurant_slug).first()
    if not user_row or not user_row.has_profile or not user_row.meals:
        abort(404)

    composed_menu = {
        'restaurant_name': user_row.restaurant_name,
        'logo_filename': user_row.logo_filename,
        'meals': [m.to_dict() for m in user_row.meals],
        'updated_at': user_row.updated_at_iso,
    }
    return render_template('digital_menu.html', menu=composed_menu)


# ===== Context Processors =====
@app.context_processor
def inject_app_info():
    user_session = session.get('user')
    sub = user_session.get('sub') if user_session else None
    db_user = User.query.filter_by(auth0_sub=sub).first() if sub else None
    return {
        'app_name': 'NutriMenu',
        'app_version': '0.1.0',
        'current_year': datetime.now().year,
        'phase': 'Phase 4b - SQLite Persistence',
        'user': user_session,
        'has_profile': bool(db_user and db_user.has_profile),
        'has_menu': bool(db_user and db_user.meals),
    }


# ===== Application Factory =====
def create_app(config=None):
    if config:
        app.config.update(config)
    return app


# ===== CLI Commands =====
@app.cli.command()
def init_db():
    """Create the SQLite database file and all tables."""
    db.create_all()
    print(f"Database initialized at: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print("Tables created: users, meals, ingredients")


@app.cli.command()
def seed_db():
    """Seed the database with initial/sample data."""
    print('Database seeding not yet implemented.')


# ===== Development Server =====
if __name__ == '__main__':
    host = os.getenv('FLASK_HOST', 'localhost')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() == 'true'

    # Auto-create tables on first run so a fresh checkout works without the CLI.
    with app.app_context():
        db.create_all()

    app = create_app()

    print('=' * 60)
    print('NutriMenu - Development Server')
    print('=' * 60)
    print('Starting Flask application with Auth0 + SQLite Integration...')
    print(f'Visit: http://{host}:{port}')
    print('Press Ctrl+C to stop the server')
    print('=' * 60)

    app.run(host=host, port=port, debug=debug, use_reloader=True)
