// Client-side mock analyzer.
// Lets AWS Incident Buddy run as a standalone demo on Amplify with NO backend.
// It inspects the pasted error for keywords and returns a realistic structured
// analysis in the same shape the Lambda/Bedrock backend returns.
//
// This is clearly labelled demonstration logic — it does NOT call a model.

const SERVICE_RULES = [
  {
    match: /s3:getobject|s3:putobject|accessdenied.*s3|s3.*accessdenied/i,
    build: () => ({
      service: 'AWS Lambda + Amazon S3',
      severity: 'HIGH',
      summary:
        'A process (likely a Lambda function) was denied permission to read an object from S3. The call failed with AccessDenied before any data was returned.',
      likelyCause:
        'The execution role may be missing the s3:GetObject permission for the target bucket, or an S3 bucket policy / SCP could be explicitly denying access.',
      confidence: 'MEDIUM',
      recommendedActions: [
        'Inspect the Lambda execution role and confirm whether an identity-based policy grants s3:GetObject on the specific bucket and key prefix.',
        'Check the S3 bucket policy and any Service Control Policies for an explicit Deny that could override the allow.',
        'Verify the object key and bucket name in the request actually match an existing object.',
      ],
      checkNext: [
        'The Lambda execution role in IAM (attached and inline policies).',
        'The S3 bucket policy for the target bucket.',
        'CloudTrail for the denied GetObject event to see the exact principal and resource.',
      ],
      safetyWarning:
        'This is a likely cause, not a confirmed one. Verify the exact permission gap before editing IAM. Avoid granting broad s3:* access — scope the permission to the specific bucket and prefix.',
    }),
  },
  {
    match: /cloudformation|create_failed|rollback|already exists|stack/i,
    build: () => ({
      service: 'AWS CloudFormation',
      severity: 'HIGH',
      summary:
        'A CloudFormation stack operation failed and rolled back. At least one resource could not be created, which caused the whole stack to revert.',
      likelyCause:
        'A resource in the template may conflict with one that already exists (for example a database, bucket, or role with the same identifier), so creation could not proceed.',
      confidence: 'HIGH',
      recommendedActions: [
        'Open the stack Events tab and find the first CREATE_FAILED event — the root failure is usually the earliest one, not the rollback messages after it.',
        'Check whether the named resource already exists outside this stack (manually created or left over from a prior deployment).',
        'If a leftover resource is confirmed, import it or choose a unique name rather than deleting production data.',
      ],
      checkNext: [
        'The CloudFormation stack Events, ordered oldest-first.',
        'The console for the specific resource type mentioned (e.g. RDS, S3, IAM).',
      ],
      safetyWarning:
        'This is a likely cause, not a confirmed one. Do not delete the conflicting resource without verifying it is safe to remove — it may hold live data. Prefer resource import or renaming.',
    }),
  },
  {
    match: /api\s?gateway|403|forbidden|missing authentication token|execute-api/i,
    build: () => ({
      service: 'Amazon API Gateway',
      severity: 'MEDIUM',
      summary:
        'API Gateway returned a 403 Forbidden with "Missing Authentication Token". This usually means the request did not match any configured route or stage, rather than a true auth failure.',
      likelyCause:
        'The request path or HTTP method may not match a deployed route, or the stage name could be missing from the URL — API Gateway returns this generic 403 when no route matches.',
      confidence: 'MEDIUM',
      recommendedActions: [
        'Confirm the exact path and method exist as a configured route and have been deployed to the stage you are calling.',
        'Check that the invoke URL includes the correct stage segment (e.g. /prod) if using a REST API.',
        'If the route requires an authorizer, confirm the request includes the expected token or signature.',
      ],
      checkNext: [
        'The API Gateway routes/resources and their deployed stage.',
        'The invoke URL structure against the configured route.',
      ],
      safetyWarning:
        'This is a likely cause, not a confirmed one. Verify the route configuration before changing authorizers or resource policies, which can unintentionally open or block access.',
    }),
  },
]

const GENERIC = (incident) => ({
  service: 'AWS (service not conclusively identified)',
  severity: 'MEDIUM',
  summary:
    'The error could not be mapped to a specific AWS service with high confidence from the provided text. The analysis below is general guidance based on the message content.',
  likelyCause:
    'The failure may stem from a permissions issue, a misconfiguration, or a missing/renamed resource. More context from logs would be needed to narrow this down.',
  confidence: 'LOW',
  recommendedActions: [
    'Identify the AWS service and API call named in the error message or request ID.',
    'Check CloudWatch Logs and CloudTrail around the time of the failure for the first error event.',
    'Confirm the IAM principal involved has the specific permission the failing action requires.',
  ],
  checkNext: [
    'CloudWatch Logs for the component that produced this error.',
    'CloudTrail for the failing API call and the principal involved.',
  ],
  safetyWarning:
    'This is advisory guidance, not a confirmed diagnosis. Verify the root cause in your own AWS environment before applying any IAM or infrastructure change.',
})

/**
 * Produce a mock structured analysis for an incident string.
 * @param {string} incident
 * @returns {object}
 */
export function mockAnalyze(incident) {
  const text = incident || ''
  const rule = SERVICE_RULES.find((r) => r.match.test(text))
  return rule ? rule.build() : GENERIC(text)
}
