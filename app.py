"""
NutriMenu - Flask Application
AI-Powered Digital Restaurant Menu Platform

Main application file for serving the NutriMenu platform.
Handles routing, static file serving, and future integrations with
authentication, database, and external APIs.
"""

from flask import Flask, render_template, jsonify
import os
from datetime import datetime

# Initialize Flask Application
app = Flask(__name__, 
            template_folder=os.path.join(os.path.dirname(__file__), 'templates'),
            static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# ===== Configuration =====
app.config['SECRET_KEY'] = 'nutrimenu-dev-key-change-in-production'
app.config['DEBUG'] = True  # Development mode; set to False in production
app.config['ENV'] = 'development'

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


# ===== Routes =====

@app.route('/')
def index():
    """
    Landing Page Route
    Serves the main NutriMenu landing page with product overview,
    features, and call-to-action buttons.
    """
    return render_template('index.html')


@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health Check Endpoint
    Returns the current health status of the application.
    Useful for monitoring and deployment verification.
    """
    return jsonify({
        'status': 'healthy',
        'service': 'NutriMenu',
        'timestamp': datetime.now().isoformat(),
        'version': '0.1.0'
    }), 200


@app.route('/api/placeholder/login', methods=['POST'])
def placeholder_login():
    """
    Placeholder Login Endpoint
    TODO: Implement actual authentication with user credentials
    TODO: Integrate with database for user validation
    TODO: Generate JWT tokens or session cookies
    """
    return jsonify({
        'message': 'Login functionality not yet implemented',
        'status': 'placeholder',
        'next_step': 'Phase 2 - Authentication System'
    }), 501  # 501 Not Implemented


@app.route('/api/placeholder/create-menu', methods=['POST'])
def placeholder_create_menu():
    """
    Placeholder Create Menu Endpoint
    TODO: Implement menu data entry form handler
    TODO: Integrate with data validation
    TODO: Connect to database for storing menu items
    TODO: Trigger AI services for nutrition calculation and 3D model generation
    """
    return jsonify({
        'message': 'Menu creation functionality not yet implemented',
        'status': 'placeholder',
        'next_step': 'Phase 3 - Data Entry Form & Phase 4 - Menu Generation'
    }), 501  # 501 Not Implemented


# ===== Context Processors (for templates) =====

@app.context_processor
def inject_app_info():
    """
    Inject application metadata into all templates.
    Makes variables available globally in Jinja2 templates.
    """
    return {
        'app_name': 'NutriMenu',
        'app_version': '0.1.0',
        'current_year': datetime.now().year,
        'phase': 'Phase 1 - Landing Page'
    }


# ===== Application Factory Pattern (for future scalability) =====

def create_app(config=None):
    """
    Application factory function.
    Allows for creating multiple app instances with different configurations.
    Useful for testing and future multi-instance deployments.
    
    Args:
        config (dict): Optional configuration overrides
        
    Returns:
        Flask: Configured Flask application instance
    """
    if config:
        app.config.update(config)
    
    return app


# ===== CLI Commands (for future utilities) =====

@app.cli.command()
def init_db():
    """
    Initialize the database.
    TODO: Create database tables and schema
    TODO: Implement with SQLAlchemy or similar ORM
    """
    print('Database initialization not yet implemented.')
    print('Planned for: Phase 2+ (when authentication and data storage required)')


@app.cli.command()
def seed_db():
    """
    Seed the database with initial/sample data.
    TODO: Add sample restaurant and menu data for testing
    """
    print('Database seeding not yet implemented.')
    print('Planned for: Phase 2+ (when authentication and data storage required)')


# ===== Development Server =====

if __name__ == '__main__':
    # Note: In production, use a proper WSGI server (Gunicorn, uWSGI, etc.)
    # Do NOT use Flask's development server in production
    
    # Create app instance
    app = create_app()
    
    # Run development server
    print('=' * 60)
    print('NutriMenu - Development Server')
    print('=' * 60)
    print('Starting Flask application...')
    print('Visit: http://localhost:5000')
    print('Press Ctrl+C to stop the server')
    print('=' * 60)
    
    app.run(
        host='localhost',
        port=5000,
        debug=True,
        use_reloader=True
    )
