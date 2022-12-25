#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { S3ReactStack } from '../lib/S3HostedReactSiteStack';
import { config } from '../config'
import merge from 'lodash.merge'

const app = new cdk.App();

const appConfig = merge(
  config.app,
  config[app.node.tryGetContext('environment') ?? throwExpression('Error: --context environment=<dev|staging|prod> must be set on cdk command')]
)

new S3ReactStack(
  app, 
  `${appConfig.appName}-${appConfig.environment}`,
  appConfig  
);

Object.entries(appConfig.tags).forEach(([key, value]) =>
  cdk.Tags.of(app).add(key, value as string)
)

function throwExpression(errorMessage: string): never {
  throw new Error(errorMessage);
};