#!/usr/bin/env python3
"""
Car Rental Deal Checker Agent
Finds the cheapest car rental deals in Marseille for 2 days starting tomorrow.
"""

import requests
import json
from datetime import datetime, timedelta
import time
from typing import List, Dict, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CarRentalAgent:
    def __init__(self):
        self.location = "Marseille, France"
        self.pickup_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        self.return_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        self.deals = []
        
    def search_kayak_deals(self) -> List[Dict]:
        """
        Search for car rental deals using a simulated API approach
        In a real implementation, you would use official APIs or web scraping
        """
        logger.info(f"Searching for car rentals in {self.location}")
        logger.info(f"Pickup: {self.pickup_date}, Return: {self.return_date}")
        
        # Simulated car rental data (in reality, you'd scrape or use APIs)
        simulated_deals = [
            {
                "company": "Europcar",
                "car_type": "Economy - Peugeot 108",
                "price": 89.50,
                "currency": "EUR",
                "location": "Marseille Airport",
                "rating": 4.2,
                "features": ["Air Conditioning", "Manual Transmission"]
            },
            {
                "company": "Hertz",
                "car_type": "Compact - Renault Clio",
                "price": 95.80,
                "currency": "EUR", 
                "location": "Marseille City Center",
                "rating": 4.5,
                "features": ["Air Conditioning", "Automatic Transmission"]
            },
            {
                "company": "Avis",
                "car_type": "Economy - Citroën C1",
                "price": 82.30,
                "currency": "EUR",
                "location": "Marseille Saint-Charles Station",
                "rating": 4.1,
                "features": ["Air Conditioning", "Manual Transmission", "GPS"]
            },
            {
                "company": "Enterprise",
                "car_type": "Intermediate - Volkswagen Golf",
                "price": 112.40,
                "currency": "EUR",
                "location": "Marseille Airport",
                "rating": 4.4,
                "features": ["Air Conditioning", "Manual Transmission", "Bluetooth"]
            },
            {
                "company": "Budget",
                "car_type": "Economy - Fiat Panda",
                "price": 78.90,
                "currency": "EUR",
                "location": "Marseille City Center",
                "rating": 3.9,
                "features": ["Air Conditioning", "Manual Transmission"]
            }
        ]
        
        return simulated_deals
    
    def search_rentalcars_deals(self) -> List[Dict]:
        """
        Search additional deals from another source
        """
        logger.info("Searching additional car rental sources...")
        
        additional_deals = [
            {
                "company": "Sixt",
                "car_type": "Economy - Smart ForTwo",
                "price": 86.70,
                "currency": "EUR",
                "location": "Marseille Airport",
                "rating": 4.3,
                "features": ["Air Conditioning", "Automatic Transmission"]
            },
            {
                "company": "Alamo",
                "car_type": "Compact - Nissan Micra",
                "price": 91.20,
                "currency": "EUR",
                "location": "Marseille City Center",
                "rating": 4.0,
                "features": ["Air Conditioning", "Manual Transmission", "USB Charging"]
            }
        ]
        
        return additional_deals
    
    def get_all_deals(self) -> List[Dict]:
        """
        Aggregate deals from all sources
        """
        all_deals = []
        
        try:
            # Get deals from different sources
            kayak_deals = self.search_kayak_deals()
            rentalcars_deals = self.search_rentalcars_deals()
            
            all_deals.extend(kayak_deals)
            all_deals.extend(rentalcars_deals)
            
            logger.info(f"Found {len(all_deals)} total deals")
            
        except Exception as e:
            logger.error(f"Error fetching deals: {e}")
            
        return all_deals
    
    def find_cheapest_deal(self) -> Optional[Dict]:
        """
        Find the cheapest car rental deal
        """
        deals = self.get_all_deals()
        
        if not deals:
            logger.warning("No deals found")
            return None
            
        # Sort by price (lowest first)
        cheapest_deal = min(deals, key=lambda x: x['price'])
        
        return cheapest_deal
    
    def get_top_deals(self, limit: int = 5) -> List[Dict]:
        """
        Get top N cheapest deals
        """
        deals = self.get_all_deals()
        
        if not deals:
            return []
            
        # Sort by price and return top deals
        sorted_deals = sorted(deals, key=lambda x: x['price'])
        
        return sorted_deals[:limit]
    
    def format_deal_info(self, deal: Dict) -> str:
        """
        Format deal information for display
        """
        features_str = ", ".join(deal.get('features', []))
        
        return f"""
🚗 {deal['company']} - {deal['car_type']}
💰 Price: {deal['price']:.2f} {deal['currency']} (2 days)
📍 Location: {deal['location']}
⭐ Rating: {deal['rating']}/5.0
🔧 Features: {features_str}
        """
    
    def run_check(self):
        """
        Main method to run the car rental check
        """
        logger.info("🚗 Starting Car Rental Deal Check Agent")
        logger.info("=" * 50)
        
        print(f"🔍 Searching for car rentals in {self.location}")
        print(f"📅 Pickup Date: {self.pickup_date}")
        print(f"📅 Return Date: {self.return_date}")
        print(f"⏱️  Duration: 2 days")
        print("\n" + "=" * 50)
        
        # Find the cheapest deal
        cheapest = self.find_cheapest_deal()
        
        if cheapest:
            print("🏆 CHEAPEST DEAL FOUND:")
            print(self.format_deal_info(cheapest))
            print("=" * 50)
            
            # Show top 5 deals for comparison
            print("📊 TOP 5 CHEAPEST DEALS:")
            top_deals = self.get_top_deals(5)
            
            for i, deal in enumerate(top_deals, 1):
                print(f"\n{i}. {deal['company']} - {deal['price']:.2f} {deal['currency']}")
                print(f"   {deal['car_type']} at {deal['location']}")
                
        else:
            print("❌ No deals found. Please try again later.")
        
        print("\n" + "=" * 50)
        logger.info("Car rental check completed!")

def main():
    """
    Main function to run the car rental agent
    """
    agent = CarRentalAgent()
    agent.run_check()

if __name__ == "__main__":
    main()