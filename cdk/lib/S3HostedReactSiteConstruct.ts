import { Construct } from 'constructs'
import { S3ReactConstructProps } from '../@types'
import {
    aws_ssm as ssm,
    aws_s3 as s3,
    aws_iam as iam,
    aws_route53 as route53,
    aws_route53_targets as route53targets,
    aws_certificatemanager as acm,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    Stack,
    RemovalPolicy,
    aws_cloudfront as cf,
    Duration
} from 'aws-cdk-lib'

export class S3ReactConstruct extends Construct {

    constructor(
        scope: Construct,
        id: string,
        props: S3ReactConstructProps,
    ) {
        super(scope, id)

        console.log('function directory: ', props.functionDir)

        const fqdn = props.subDomainName ? `${props.subDomainName}.${props.domainName}` : props.domainName

        const stackName = Stack.of(this).stackName

        // s3 bucket for logging
        const loggingBucket = new s3.Bucket(scope, 'loggingBucket', {
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            versioned: true,
            accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE
        });

        // s3 bucket for hosting
        const rootBucket = new s3.Bucket(this, 'rootBucket', {
            cors: [
                {
                    allowedMethods: [
                        s3.HttpMethods.GET,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.DELETE,
                    ],
                    allowedOrigins: ["*"],
                    allowedHeaders: ["*"],
                },
            ],
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            //enforceSSL: true,
            versioned: true,
        });

        // cloud front origin access identity
        const originAccessIdentity = new cf.OriginAccessIdentity(this, 'originAccessIdentity', /* all optional props */ {
            comment: `OAI for ${fqdn}`,
        });

        // s3 bucket policy
        const rootBucketPolicy = new s3.BucketPolicy(this, 'rootBucketPolicy', {
            bucket: rootBucket,
            removalPolicy: RemovalPolicy.DESTROY,

        });

        // bucket policy statement
        rootBucketPolicy.document.addStatements(
            new iam.PolicyStatement({
                resources: [rootBucket.bucketArn, `${rootBucket.bucketArn}/*`],
                actions: ['s3:GetObject'],
                effect: iam.Effect.ALLOW,
                principals: [new iam.CanonicalUserPrincipal(originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
            })
        )

        // import the existing hosted zone
        const publicHostedZone = route53.PublicHostedZone.fromLookup(this, 'importedHostedZone', {
            domainName: props.domainName
        })

        const subjectAlternativeNames = [
            `www.${fqdn}`,
        ]

        const domainNames = subjectAlternativeNames.concat([
            fqdn
        ])

        // acm certificate
        const acmCert = new acm.DnsValidatedCertificate(this, 'sslCertificate', {
            domainName: fqdn,
            subjectAlternativeNames,
            hostedZone: publicHostedZone,
            validation: acm.CertificateValidation.fromDns(publicHostedZone)

        });

        // rewrite lambda function
        const rewriteFunction = new cloudfront.Function(this, 'Function', {
            code: cloudfront.FunctionCode.fromFile({ filePath: `${props.functionDir}/url-rewrite.js` }),
        });

        const responseHeaderPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersResponseHeaderPolicy', {
            comment: 'Security headers response header policy',
            securityHeadersBehavior: {
                contentSecurityPolicy: {
                    override: true,
                    contentSecurityPolicy: "default-src 'self'"
                },
                strictTransportSecurity: {
                    override: true,
                    accessControlMaxAge: Duration.days(2 * 365),
                    includeSubdomains: true,
                    preload: true
                },
                contentTypeOptions: {
                    override: true
                },
                referrerPolicy: {
                    override: true,
                    referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN
                },
                xssProtection: {
                    override: true,
                    protection: true,
                    modeBlock: true
                },
                frameOptions: {
                    override: true,
                    frameOption: cloudfront.HeadersFrameOption.DENY
                }
            }
        });

        const cloudfrontDistribution = new cloudfront.Distribution(this, 'CloudFrontDistribution', {
            certificate: acmCert,
            domainNames,
            logBucket: loggingBucket,
            enableLogging: true,
            logIncludesCookies: true,
            defaultRootObject: 'index.html',
            defaultBehavior: {
                origin: new origins.S3Origin(rootBucket, {
                    originAccessIdentity: originAccessIdentity
                }),
                functionAssociations: [{
                    function: rewriteFunction,
                    eventType: cloudfront.FunctionEventType.VIEWER_REQUEST
                }],
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                responseHeadersPolicy: responseHeaderPolicy
            },
        });

        // route53 A record
        new route53.ARecord(this, 'ARecord', {
            recordName: fqdn,
            target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(cloudfrontDistribution)),
            zone: publicHostedZone
        });

        // add ssm parameters for the deployment
        new ssm.StringParameter(this, 'assetsBucketName', {
            parameterName: `${stackName}-assetsBucketName`,
            stringValue: rootBucket.bucketName,
            type: ssm.ParameterType.STRING
        })

        new ssm.StringParameter(this, 'cfDistId', {
            parameterName: `${stackName}-cfDistId`,
            stringValue: cloudfrontDistribution.distributionId,
            type: ssm.ParameterType.STRING
        })

    }
}