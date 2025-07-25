#!/usr/bin/env python3
"""
Car Rental Deal Checker Web App
Flask web application with UI for finding cheapest car deals in Marseille
"""

from flask import Flask, render_template, request, jsonify
from datetime import datetime, timedelta
import json
import logging
from car_rental_agent import CarRentalAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/')
def index():
    """Main page with the car rental search interface"""
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search_deals():
    """API endpoint to search for car rental deals"""
    try:
        # Get search parameters from the request
        data = request.get_json()
        location = data.get('location', 'Marseille, France')
        pickup_date = data.get('pickup_date')
        return_date = data.get('return_date')
        
        # Create agent instance
        agent = CarRentalAgent()
        
        # Override dates if provided
        if pickup_date:
            agent.pickup_date = pickup_date
        if return_date:
            agent.return_date = return_date
        if location:
            agent.location = location
            
        # Get deals
        all_deals = agent.get_all_deals()
        cheapest_deal = agent.find_cheapest_deal()
        top_deals = agent.get_top_deals(5)
        
        return jsonify({
            'success': True,
            'cheapest_deal': cheapest_deal,
            'top_deals': top_deals,
            'total_deals': len(all_deals),
            'search_params': {
                'location': agent.location,
                'pickup_date': agent.pickup_date,
                'return_date': agent.return_date
            }
        })
        
    except Exception as e:
        logger.error(f"Error in search_deals: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)