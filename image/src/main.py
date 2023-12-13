"""
import numpy as np

def handler(event, context):
    arr = np.random.randint(0, 10, (3, 3))
    return {
        "statusCode": 200,
        "body": {"message": "Hello from Lambda!", "array": arr.tolist()}
    }

"""

import boto3
import os
from aws_lambda_powertools import Tracer

# Sets service via POWERTOOLS_SERVICE_NAME env var
tracer = Tracer()  

@tracer.capture_lambda_handler
def handler(event: any, context: any):

    user: str = event["user"]
    visit_count: int = 0

    # Prepare the DynamoDB client
    dynamodb = boto3.resource("dynamodb")
    table_name = os.environ["TABLE_NAME"]
    table = dynamodb.Table(table_name)

    # Get the visit count from the DynamoDB table
    response = table.get_item(Key={"user": user})
    if "Item" in response:
        visit_count = response["Item"]["visit_count"]

    # Increment the visit count and put the item into DynamoDB table.
    visit_count += 1
    table.put_item(Item={"user": user, "visit_count": visit_count})

    message: str = f"Hello {user}! You have visited us {visit_count} times."
    print(message)
    return {"message": message}

# local run test
'''
if __name__ == "__main__":
    os.environ["TABLE_NAME"] = "visit-count-table"
    test_event = {"user": "local_alim"}
    result = handler(test_event, None)
    print(result)

'''
