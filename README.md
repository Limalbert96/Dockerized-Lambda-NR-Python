# Building Dockerized Python Lambda with AWS CDK & Cloud Monitoring with New Relic

##  Background
This stack will create dockerized lambda (Python 3.11 - ARM_64) that will simulate visitor count.
It will check within DynamoDB table for `user` data. If user exists, then it will increment visit-count.

* [AWS CDK](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda-readme.html) is the Infrastructure as Code tool to provision and manage Lambda, DynamoDB, & role settings.
* [AWS Powertool for AWS Lambda (Python)](https://docs.powertools.aws.dev/lambda/python/latest/core/tracer/) is the library that is used to generate tracing.
* [New Relic](one.newrelic.com) is the Observability tool of choice that will present the Lambda's Distributed Tracing, Logs, & Invocation Details.

##  Prerequisites
### 1. Install AWS CLI
Run `brew install awscli`

### 2. Install AWS CDK (TypeScript)
Run `npm install -g aws-cdk`

### 3. Install Docker
Run`brew install --cask docker` to install Docker Desktop
<br> Run `docker ps -a` to check if docker is running 

##  Building the CDK Stack (DynamoDB, Dockerized Lambda, & Custom Execution Role for Lambda)
> **Note** 
> If you are building your own Lambda, follow the optional Step 1 & 3.

### 1. (Optional) Update the New Relic Extension Base Image According to the Language, Version, & OS/ Arch
Go to the [Dockerfile](./image/Dockerfile) file & update the [New Relic base image](./image/Dockerfile#L2)
<br> List of the base image can be found at [https://gallery.ecr.aws/x6n7b2o2?page=1](https://gallery.ecr.aws/x6n7b2o2?page=1)

> [!TIP] 
> If you are building your own project, make sure to include the same [code snippet](https://github.com/Limalbert96/Dockerized-Lambda-NR/blob/main/image/Dockerfile#L5-L20) within the Dockerfile and update the file as needed. You can verify the location of the New Relic extension locally by running the following command in your terminal.
> ```
> cd image
> docker build -t docker-image:test .
> docker run -p 9000:8080 docker-image:test
> ```
![Alt text](<./screenshots/NR Extension within Dockerfile.png>) 

### 2. Update Lambda Environment Variables
Go to the [docker-lambda-aws-stack.ts](./lib/docker-lambda-aws-stack.ts) file & update the [`environment`](./lib/docker-lambda-aws-stack.ts#L47-L57) variables
* NEW_RELIC_TRUSTED_ACCOUNT_KEY : `<NEW_RELIC_PARENT_ID>` 
* NEW_RELIC_ACCOUNT_ID : `<NEW_RELIC_ACCOUNT_ID>`
* NEW_RELIC_EXTENSION_SEND_FUNCTION_LOGS : `boolean_value`
* NEW_RELIC_LAMBDA_EXTENSION_ENABLED : `boolean value`
* NEW_RELIC_LAMBDA_HANDLER : `<FUNCTION_NAME>.handler`
* NEW_RELIC_LICENSE_KEY : `<NEW_RELIC_LICENSE_KEY>`
* NEW_RELIC_LOG_ENDPOINT : `<NR_LOG_END_POINT>`
* NEW_RELIC_TELEMETRY_ENDPOINT : `<NR_TELEMETRY_END_POINT>`

NEW_RELIC_TELEMETRY_ENDPOINT
* Production : https://cloud-collector.newrelic.com/aws/lambda/v1
* EU-production : https://cloud-collector.eu01.nr-data.net/aws/lambda/v1

NEW_RELIC_LOG_ENDPOINT
* Production : https://log-api.newrelic.com/log/v1
* EU-production : https://log-api.eu.newrelic.com/log/v1

### 3. (Optional) Update the CMD Override (Image Configuration)
Go to the [docker-lambda-aws-stack.ts](./lib/docker-lambda-aws-stack.ts) file & replace the [`cmd`](./lib/docker-lambda-aws-stack.ts#L40) value within the `code` construct depending on the Lambda language.
* Python: `newrelic_lambda_wrapper.handler` (underscores)
* Node: `newrelic-lambda-wrapper.handler` (hyphens)
* Java:
    - `RequestHandler` implementation: `com.newrelic.java.HandlerWrapper::handleRequest`
    - `RequestStreamHandlerWrapper` implementation: `com.newrelic.java.HandlerWrapper::handleStreamsRequest`

![Alt text](<./screenshots/Lambda Image Config.png>) 

### 4. Set AWS account access
Run `aws configure`
<br> Enter your AWS Access Key ID, AWS Secret Access Key, & Default region name.

### 5. Provision Resources for AWS CDK
Run `cdk bootstrap`
<br> This needs to be run once per region.

### 6. Deploy the CDK Stack
Run `cdk deploy`
<br> Within terminal, you should be getting the ARN details for the DynamoDB & Lambda function. Use it to find your newly created DynamoDB & Lambda.

##  Monitor Dockerized Lambda with New Relic

### 1. Run a test within Lambda
Test Event:
```
{
  "user": "ANY_VALUE"
}
```

### 2. Monitor within New Relic
Go to [one.newrelic.com](one.newrelic.com) > All Entities > Go to the Lambda Entity > Verify Distributed Tracing, Logs, & Invocation Detail.
> [!WARNING]  
> You might see log message `Startup check failed: Missing handler file (NEW_RELIC_LAMBDA_HANDLER=function.handler)`. This is an existing bug, and can be ignored.

## Results
**SUMMARY & INVOCATION DETAILS**
<br><br> New Relic Summary, Invocations, & Errors
<br><br>![Alt text](<./screenshots/NR Lambda Summary.png>) 
<br>![Alt text](<./screenshots/NR Lambda Invocations.png>) 
<br>![Alt text](<./screenshots/NR Lambda Errors.png>)

<br> **LOGS**
<br><br> AWS Cloudwatch Logs
<br><br>![Alt text](<./screenshots/Lambda Log.png>) 

<br> New Relic Logs
<br><br>![Alt text](<./screenshots/NR Lambda Log.png>) 

<br> **TRACES & SERVICE MAPS**
<br><br> AWS X-Ray and CloudWatch ServiceLens
<br><br>![Alt text](<./screenshots/Lambda Trace.png>) 
<br>![Alt text](<./screenshots/Lambda Service Map.png>) 

<br> New Relic Distributed Tracing
<br><br>![Alt text](<./screenshots/NR Lambda DT.png>) 
<br>![Alt text](<./screenshots/NR Lambda Success Trace & Service Map.png>) 
<br>![Alt text](<./screenshots/NR Error Trace.png>)

## Next Steps
You can leverage [New Relic Construct](https://constructs.dev/search?q=newrelic&offset=0&tags=aws-published) in Construct Hub to build alerting, dashboards, etc.
* Blog Post: [Streamline provisioning with New Relic resource types on the CloudFormation Registry](https://newrelic.com/blog/how-to-relic/streamline-provisioning-with-new-relic-resource-types-on-the-cloudformation-registry)

## Helpful Links
* [How to install AWS CDK (step-by-step guide)](https://towardsthecloud.com/install-aws-cdk#:~:text=The%20AWS%20CDK%20Toolkit%20provides,install%20%2Dg%20aws%2Dcdk%20.)
* [Solving Cannot find Module Error in AWS CDK](https://bobbyhadz.com/blog/cannot-find-module-error-aws-cdk)
