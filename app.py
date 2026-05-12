"""
NutriMenu - Flask Application
AI-Powered Digital Restaurant Menu Platform

Main application file for serving the NutriMenu platform.
Handles routing, static file serving, and authentication via Auth0.
"""

from flask import Flask, render_template, jsonify, session, redirect, url_for
from authlib.integrations.flask_client import OAuth
from urllib.parse import quote_plus, urlencode
from dotenv import load_dotenv
import os
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

# Initialize Flask Application
app = Flask(__name__, 
            template_folder=os.path.join(os.path.dirname(__file__), 'templates'),
            static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# ===== Configuration =====
# All configuration values are loaded from environment variables for security
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
app.config['DEBUG'] = os.getenv('DEBUG', 'True').lower() == 'true'
app.config['ENV'] = os.getenv('FLASK_ENV', 'development')

# ===== Auth0 Setup =====
oauth = OAuth(app)
auth0 = oauth.register(
    'auth0',
    client_id=os.getenv('AUTH0_CLIENT_ID'),
    client_secret=os.getenv('AUTH0_CLIENT_SECRET'),
    api_base_url=f"https://{os.getenv('AUTH0_DOMAIN')}",
    access_token_url=f"https://{os.getenv('AUTH0_DOMAIN')}/oauth/token",
    authorize_url=f"https://{os.getenv('AUTH0_DOMAIN')}/authorize",
    client_kwargs={
        'scope': 'openid profile email',
    },
    server_metadata_url=f"https://{os.getenv('AUTH0_DOMAIN')}/.well-known/openid-configuration"
)

# ===== Error Handlers =====
@app.errorhandler(404)
def page_not_found(error):
    """Handle 404 - Page Not Found errors"""
    return jsonify({
        'error': 'Page not found',
        'status': 404,
        'message': 'The requested page does not exist.'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 - Internal Server Error"""
    return jsonify({
        'error': 'Internal server error',
        'status': 500,
        'message': 'An unexpected error occurred. Please try again later.'
    }), 500

# ===== Authentication Routes =====
@app.route('/login')
def login():
    """Redirects the user to the Auth0 Universal Login page."""
    return auth0.authorize_redirect(redirect_uri=url_for('callback', _external=True))

@app.route('/callback')
def callback():
    """Handles the callback from Auth0 and stores user info in session."""
    token = auth0.authorize_access_token()
    session['user'] = token['userinfo']
    return redirect(url_for('index'))

@app.route('/logout')
def logout():
    """Clears the session and redirects to Auth0 logout endpoint."""
    session.clear()
    return redirect(
        f"https://{os.getenv('AUTH0_DOMAIN')}/v2/logout?"
        f"{urlencode({'returnTo': url_for('index', _external=True), 'client_id': os.getenv('AUTH0_CLIENT_ID')}, quote_via=quote_plus)}"
    )

# ===== Main Routes =====
@app.route('/')
def index():
    """Serves the main landing page."""
    return render_template('index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health Check Endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'NutriMenu',
        'timestamp': datetime.now().isoformat(),
        'version': '0.1.0'
    }), 200

@app.route('/api/placeholder/create-menu', methods=['POST'])
def placeholder_create_menu():
    """Placeholder Create Menu Endpoint for Phase 3"""
    return jsonify({
        'message': 'Menu creation functionality not yet implemented',
        'status': 'placeholder',
        'next_step': 'Phase 3 - Data Entry Form & Phase 4 - Menu Generation'
    }), 501

# ===== Context Processors (for templates) =====
@app.context_processor
def inject_app_info():
    """
    Inject application metadata and user session into all templates.
    Makes variables available globally in Jinja2 templates.
    """
    return {
        'app_name': 'NutriMenu',
        'app_version': '0.1.0',
        'current_year': datetime.now().year,
        'phase': 'Phase 2 - Authentication',
        'user': session.get('user')  # This is how the HTML knows if logged in
    }

# ===== Application Factory Pattern =====
def create_app(config=None):
    if config:
        app.config.update(config)
    return app

# ===== CLI Commands =====
@app.cli.command()
def init_db():
    """Initialize the database."""
    print('Database initialization not yet implemented.')
    print('Planned for: Phase 2+ (when data storage required)')

@app.cli.command()
def seed_db():
    """Seed the database with initial/sample data."""
    print('Database seeding not yet implemented.')

# ===== Development Server =====
if __name__ == '__main__':
    host = os.getenv('FLASK_HOST', 'localhost')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() == 'true'
    
    app = create_app()
    
    print('=' * 60)
    print('NutriMenu - Development Server')
    print('=' * 60)
    print('Starting Flask application with Auth0 Integration...')
    print(f'Visit: http://{host}:{port}')
    print('Press Ctrl+C to stop the server')
    print('=' * 60)
    
    app.run(host=host, port=port, debug=debug, use_reloader=True)
