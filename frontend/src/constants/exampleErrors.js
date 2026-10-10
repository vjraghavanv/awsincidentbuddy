// Three realistic example incidents the user can load with one click.

export const EXAMPLE_ERRORS = [
  {
    id: 'lambda-s3',
    label: 'Lambda + S3 AccessDenied',
    text: `An error occurred (AccessDenied) when calling the GetObject operation: User: arn:aws:sts::123456789012:assumed-role/my-lambda-role/my-function is not authorized to perform: s3:GetObject on resource: "arn:aws:s3:::my-app-bucket/config/settings.json" because no identity-based policy allows the s3:GetObject action
START RequestId: 7d1c... Version: $LATEST
ERROR Invoke Error {"errorType":"AccessDenied","errorMessage":"Access Denied"}`,
  },
  {
    id: 'cfn-create-failed',
    label: 'CloudFormation CREATE_FAILED',
    text: `CloudFormation stack "payments-service-prod" rolled back.
Resource handler returned message: "Resource of type 'AWS::RDS::DBInstance' with identifier 'payments-db' already exists." (RequestToken: a1b2c3, HandlerErrorCode: AlreadyExists)
Status: CREATE_FAILED
The following resource(s) failed to create: [PaymentsDatabase]. Rollback requested by user.`,
  },
  {
    id: 'apigw-403',
    label: 'API Gateway 403',
    text: `HTTP/1.1 403 Forbidden
x-amzn-ErrorType: MissingAuthenticationTokenException
{"message":"Missing Authentication Token"}

Request: GET https://abc123.execute-api.us-east-1.amazonaws.com/users/42
The request did not match any configured route or stage.`,
  },
]
