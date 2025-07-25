# Car Rental Deal Finder 🚗

A simple web application that helps you find the cheapest car rental deals in Marseille for your desired dates.

## Features

- 🔍 Search for car rentals in Marseille (or any location)
- 📅 Flexible date selection with automatic 2-day rental setup
- 💰 Find the cheapest deals from multiple rental companies
- 📊 Compare top 5 deals with ratings and features
- 🎨 Beautiful, modern web interface
- ⚡ Real-time search with loading indicators

## Quick Start

### Option 1: Use the startup script (Recommended)
```bash
python3 run.py
```

### Option 2: Manual setup
```bash
# Install dependencies
pip install -r requirements.txt

# Run the web application
python3 app.py
```

### Option 3: Command line tool
```bash
# Run the command line version
python3 car_rental_agent.py
```

## Usage

1. Open your web browser and go to `http://localhost:5000`
2. The app defaults to searching for rentals starting tomorrow for 2 days in Marseille
3. Modify the location, dates, or duration as needed
4. Click "Find Best Deals" to search
5. View the cheapest deal highlighted at the top
6. Browse through the top 5 deals for comparison

## Files Structure

- `app.py` - Flask web application with API endpoints
- `car_rental_agent.py` - Core agent logic for finding car rental deals
- `templates/index.html` - Beautiful web interface
- `run.py` - Easy startup script
- `requirements.txt` - Python dependencies

## Current Implementation

The current version uses simulated car rental data for demonstration purposes. In a production environment, this would be connected to:

- Official car rental company APIs
- Web scraping of rental comparison sites
- Real-time pricing data

## Technologies Used

- **Backend**: Python, Flask
- **Frontend**: HTML5, CSS3, JavaScript, Tailwind CSS
- **Icons**: Font Awesome
- **Data Processing**: JSON, datetime handling

Enjoy finding great car rental deals! 🎉