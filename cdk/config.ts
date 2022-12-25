import * as path from 'path'

export const config: any = {
  app: {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION
    },
    tags: {
      'site': 'games-test-site',
    }
  },

  // Environment specific config
  dev: {
    appName: 'GamesSite',
    environment: 'dev',

    tags: {
      'env-type': 'dev'
    },
    s3ReactConstructProps: {
      domainName: 'greathonor.org',
      subDomainName: 'games',
      zoneName: 'greathonor.org',
      hostedZoneId: 'string',
      functionDir: path.join(__dirname, 'functions/')
    }
  },
}