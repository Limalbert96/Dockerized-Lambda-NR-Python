# Add New Relic Extension & AWS Python Base Image
FROM public.ecr.aws/x6n7b2o2/newrelic-lambda-layers-python:311-arm64 AS Extension
FROM public.ecr.aws/lambda/python:3.11

# Extension code
WORKDIR /opt
COPY --from=Extension /opt/ .

# Copy requirements.txt
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Copy all files in ./src
COPY src/* ${LAMBDA_TASK_ROOT}

# Install the specified packages
RUN pip freeze > requirements.txt
RUN pip install -r /var/task/requirements.txt

# Set the CMD to your handler.
CMD [ "main.handler" ]
