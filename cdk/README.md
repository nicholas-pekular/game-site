# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

# Usage
## Usage in a Pipeline
The pipeline will be triggered on the following conditions:
- Push to the main branch
- Push to a feature branch (branch that begins with feat/)
- Pull request for the main branch
- When a release is published
## Usage on a Developer Machine
Validate that the following are installed and configured locally:
- AWS cli with credentials 
- node.js
- AWS CDK

Commands:
- To run CDK Unit Tests: 

    npm run test
- To run CDK Synth (to generate/view CloudFormation template):

    npx cdk synth --context environment=dev
- To run CDK Deploy (to deploy Stack resources in the CloudFormation template):

    npx cdk deploy --context environment=dev --all --require-approval never
