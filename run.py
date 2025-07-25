#!/usr/bin/env python3
"""
Startup script for Car Rental Deal Finder
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    print("📦 Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False
    return True

def run_app():
    """Run the Flask application"""
    print("🚀 Starting Car Rental Deal Finder...")
    print("🌐 The app will be available at: http://localhost:5000")
    print("🔍 Search for car rentals in Marseille and find the best deals!")
    print("\n" + "="*50)
    
    try:
        from app import app
        app.run(debug=True, host='0.0.0.0', port=5000)
    except ImportError:
        print("❌ Error: Flask not installed. Installing requirements first...")
        if install_requirements():
            from app import app
            app.run(debug=True, host='0.0.0.0', port=5000)
    except Exception as e:
        print(f"❌ Error starting application: {e}")

if __name__ == "__main__":
    print("🚗 Car Rental Deal Finder - Starting Up...")
    
    # Check if requirements are installed
    try:
        import flask
    except ImportError:
        if not install_requirements():
            sys.exit(1)
    
    run_app()