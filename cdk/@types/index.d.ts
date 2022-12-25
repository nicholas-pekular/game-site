import {
  StackProps,
} from 'aws-cdk-lib'

export interface S3ReactStackProps extends StackProps {
  appName: string
  environment: string
  s3ReactConstructProps: S3ReactConstructProps
  tags: {
    [key: string]: string
  }
}

export interface S3ReactConstructProps {
  domainName: string
  subDomainName?: string,
  functionDir: string
}