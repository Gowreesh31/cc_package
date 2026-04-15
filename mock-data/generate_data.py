import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_mock_data():
    # 1. Historical Shipments (2 years)
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2025, 12, 31)
    date_range = pd.date_range(start_date, end_date, freq='D')
    
    skus = [f'SKU-{i:03d}' for i in range(1, 11)]
    warehouses = ['WH-NORTH', 'WH-SOUTH', 'WH-EAST', 'WH-WEST']
    
    shipments = []
    for date in date_range:
        for sku in skus:
            if np.random.random() > 0.3: # 70% chance of shipment
                shipments.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'sku': sku,
                    'warehouse': np.random.choice(warehouses),
                    'quantity': np.random.randint(10, 100),
                    'status': 'DELIVERED',
                    'lead_time_days': np.random.randint(2, 10)
                })
    
    df_shipments = pd.DataFrame(shipments)
    os.makedirs('mock-data', exist_ok=True)
    df_shipments.to_csv('mock-data/historical_shipments.csv', index=False)
    print("Generated historical_shipments.csv")

    # 2. Current Inventory
    inventory = []
    for sku in skus:
        inventory.append({
            'sku': sku,
            'warehouse': np.random.choice(warehouses),
            'current_stock': np.random.randint(50, 500),
            'reorder_point': 100,
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
    df_inventory = pd.DataFrame(inventory)
    df_inventory.to_csv('mock-data/current_inventory.csv', index=False)
    print("Generated current_inventory.csv")

    # 3. Supplier Data
    suppliers = []
    for sku in skus:
        suppliers.append({
            'sku': sku,
            'supplier_id': f'SUP-{np.random.randint(1, 5):02d}',
            'avg_lead_time': np.random.randint(5, 15),
            'cost_per_unit': round(np.random.uniform(10.0, 100.0), 2)
        })
    df_suppliers = pd.DataFrame(suppliers)
    df_suppliers.to_csv('mock-data/supplier_data.csv', index=False)
    print("Generated supplier_data.csv")

if __name__ == "__main__":
    generate_mock_data()
