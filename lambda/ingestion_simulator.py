import json
import boto3
import os
import random
from datetime import datetime

s3 = boto3.client('s3')
RAW_BUCKET = os.environ['RAW_BUCKET']

def lambda_handler(event, context):
    # 1. Simulate Shipment Ingestion
    sku = f'SKU-{random.randint(1, 10):03d}'
    shipment_record = {
        'date': datetime.now().strftime('%Y-%m-%d'),
        'sku': sku,
        'warehouse': random.choice(['WH-NORTH', 'WH-SOUTH', 'WH-EAST', 'WH-WEST']),
        'quantity': random.randint(5, 50),
        'status': 'SHIPPED',
        'timestamp': datetime.now().isoformat()
    }
    
    shipment_file = f"realtime/shipments/shipment_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    s3.put_object(Bucket=RAW_BUCKET, Key=shipment_file, Body=json.dumps(shipment_record))
    
    # 2. Simulate Inventory Update
    inventory_record = {
        'sku': sku,
        'warehouse': random.choice(['WH-NORTH', 'WH-SOUTH', 'WH-EAST', 'WH-WEST']),
        'current_stock': random.randint(50, 500),
        'reorder_point': 100,
        'last_updated': datetime.now().isoformat()
    }
    
    inventory_file = f"realtime/inventory/inv_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    s3.put_object(Bucket=RAW_BUCKET, Key=inventory_file, Body=json.dumps(inventory_record))
    
    return {
        'statusCode': 200,
        'body': json.dumps(f'Successfully ingested shipment and inventory for {sku}')
    }
