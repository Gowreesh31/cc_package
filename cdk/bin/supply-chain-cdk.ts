#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SupplyChainStack } from '../supply-chain-stack';

const app = new cdk.App();
new SupplyChainStack(app, 'SupplyChainStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
