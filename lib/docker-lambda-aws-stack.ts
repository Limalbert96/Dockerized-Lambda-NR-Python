import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class DockerLambdaAwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // Create DynamoDB table
    const dynamoDBTable = new dynamodb.Table(this, "visitCountTable", {
      partitionKey: {
        name: "user",
        type: dynamodb.AttributeType.STRING
      },
      // create backup
      // pointInTimeRecovery: true, 

      // default 5 Read & Write capacity unit, use autoscale
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

      // delete table on stack deletion. Default is RETAIN
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create custom role
    const role = new iam.Role(this, "DockerFuncRole", {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    // add managed policies to the custom role
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'));

    // docker image function
    const dockerFunc = new lambda.DockerImageFunction(this, "DockerFunc", {
      code: lambda.DockerImageCode.fromImageAsset( "./image", { 
        cmd: ['newrelic_lambda_wrapper.handler'] // assign cmd override for image config 
      } ), 
      memorySize: 1024, // MB
      timeout: cdk.Duration.seconds(10),
      architecture: lambda.Architecture.ARM_64, // needed for M1 mac
      tracing: lambda.Tracing.ACTIVE, // add xray action to policy
      role,
      environment: {
        NEW_RELIC_TRUSTED_ACCOUNT_KEY : "<NEW_RELIC_PARENT_ID>",
        NEW_RELIC_ACCOUNT_ID : "<NEW_RELIC_ACCOUNT_ID>",
        NEW_RELIC_EXTENSION_SEND_FUNCTION_LOGS : "true",
        NEW_RELIC_LAMBDA_EXTENSION_ENABLED : "true",
        NEW_RELIC_LAMBDA_HANDLER : "main.handler",
        NEW_RELIC_LICENSE_KEY : "<NEW_RELIC_LICENSE_KEY>",
        NEW_RELIC_LOG_ENDPOINT : "https://log-api.newrelic.com/log/v1" ,
        NEW_RELIC_TELEMETRY_ENDPOINT : "https://cloud-collector.newrelic.com/aws/lambda/v1",
        TABLE_NAME: dynamoDBTable.tableName,
      }
    });
    
    // create url endpoint
    const functionUrl = dockerFunc.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ["*"],
        allowedOrigins: ["*"],
      },
    });

    // generate function url
    new cdk.CfnOutput(this, "FunctionUrlValue", {
      value: functionUrl.url
    });

    // generate function arn
    new cdk.CfnOutput(this, 'FunctionArn', { 
      value: dockerFunc.functionArn
    });

    // generate table arn
    new cdk.CfnOutput(this, 'TableArn', { 
      value: dynamoDBTable.tableArn
    });

  }
}
