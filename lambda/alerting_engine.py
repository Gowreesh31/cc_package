import json
import boto3
import os

sns = boto3.client('sns')
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

def lambda_handler(event, context):
    # Event triggered by Prediction Job completion
    # In a real scenario, we'd read the latest predictions from S3
    # For this mock, we'll simulate a check
    
    low_stock_items = [
        {'sku': 'SKU-001', 'predicted_stock': 20, 'days_until_stockout': 5},
        {'sku': 'SKU-005', 'predicted_stock': 15, 'days_until_stockout': 3}
    ]
    
    for item in low_stock_items:
        message = f"ALERT: Reorder {item['sku']}. Predicted stock {item['predicted_stock']} in {item['days_until_stockout']} days."
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"Supply Chain Alert: {item['sku']}",
            Message=message
        )
        print(f"Sent alert for {item['sku']}")
        
    return {
        'statusCode': 200,
        'body': json.dumps('Alerts processed')
    }
