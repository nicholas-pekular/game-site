import { Stack } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { S3ReactStackProps } from '../@types'
import { S3ReactConstruct } from './S3HostedReactSiteConstruct'

export class S3ReactStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: S3ReactStackProps,
  ) {
    super(scope, id, props)

    const s3ReactSite = new S3ReactConstruct(
      this,
      'Games',
      props.s3ReactConstructProps,
    )
  }
}
