import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as quicksight from 'aws-cdk-lib/aws-quicksight';
import * as athena from 'aws-cdk-lib/aws-athena';

export class SupplyChainStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1. S3 Data Lake Buckets
    const rawBucket = new s3.Bucket(this, 'RawBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    const curatedBucket = new s3.Bucket(this, 'CuratedBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // 2. Glue Database
    const databaseName = 'supply_chain_db';
    const database = new glue.CfnDatabase(this, 'SupplyChainDatabase', {
      catalogId: this.account,
      databaseInput: { name: databaseName },
    });

    // 3. Glue Table for Curated Inventory Status
    const curatedTable = new glue.CfnTable(this, 'CuratedInventoryTable', {
      catalogId: this.account,
      databaseName: databaseName,
      tableInput: {
        name: 'curated_inventory_status',
        tableType: 'EXTERNAL_TABLE',
        parameters: { 'classification': 'parquet' },
        storageDescriptor: {
          columns: [
            { name: 'sku', type: 'string' },
            { name: 'warehouse', type: 'string' },
            { name: 'last_updated', type: 'timestamp' },
            { name: 'quantity', type: 'int' },
            { name: 'daily_demand', type: 'double' },
          ],
          location: `s3://${curatedBucket.bucketName}/curated_inventory_status/`,
          inputFormat: 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat',
          outputFormat: 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat',
          serdeInfo: {
            serializationLib: 'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe',
          },
        },
      },
    });

    // 3b. Glue Table for Shipments
    const shipmentsTable = new glue.CfnTable(this, 'ShipmentsTable', {
      catalogId: this.account,
      databaseName: databaseName,
      tableInput: {
        name: 'shipments',
        tableType: 'EXTERNAL_TABLE',
        parameters: { 'classification': 'json' },
        storageDescriptor: {
          columns: [
            { name: 'id', type: 'string' },
            { name: 'sku', type: 'string' },
            { name: 'origin', type: 'string' },
            { name: 'destination', type: 'string' },
            { name: 'status', type: 'string' },
            { name: 'eta', type: 'string' },
            { name: 'quantity', type: 'int' },
            { name: 'date', type: 'string' },
          ],
          location: `s3://${rawBucket.bucketName}/realtime/shipments/`,
          inputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
          outputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
          serdeInfo: {
            serializationLib: 'org.openx.data.jsonserde.JsonSerDe',
          },
        },
      },
    });

    // 4. Athena WorkGroup
    const workGroup = new athena.CfnWorkGroup(this, 'SupplyChainWorkGroup', {
      name: 'SupplyChainWorkGroup',
      workGroupConfiguration: {
        resultConfiguration: {
          outputLocation: `s3://${curatedBucket.bucketName}/athena-results/`,
        },
      },
    });

    // 5. QuickSight User ARN (Placeholder - should be provided via context)
    const quicksightUserArn = `arn:aws:quicksight:${this.region}:${this.account}:user/default/SupplyChainAdmin`;

    // 6. QuickSight DataSource (Athena)
    const dataSource = new quicksight.CfnDataSource(this, 'AthenaDataSource', {
      awsAccountId: this.account,
      dataSourceId: 'AthenaDataSource',
      name: 'AthenaDataSource',
      type: 'ATHENA',
      dataSourceParameters: {
        athenaParameters: {
          workGroup: workGroup.name,
        },
      },
      permissions: [
        {
          principal: quicksightUserArn,
          actions: ['quicksight:DescribeDataSource', 'quicksight:DescribeDataSourcePermissions', 'quicksight:PassDataSource', 'quicksight:UpdateDataSource', 'quicksight:DeleteDataSource', 'quicksight:UpdateDataSourcePermissions'],
        },
      ],
    });

    // 7. QuickSight DataSets
    const inventoryDataSet = new quicksight.CfnDataSet(this, 'InventoryDataSet', {
      awsAccountId: this.account,
      dataSetId: 'InventoryDataSet',
      name: 'Current Inventory Status',
      importMode: 'SPICE',
      physicalTableMap: {
        'InventoryTable': {
          relationalTable: {
            dataSourceArn: dataSource.attrArn,
            catalog: 'AwsDataCatalog',
            schema: databaseName,
            name: 'curated_inventory_status',
            inputColumns: [
              { name: 'sku', type: 'STRING' },
              { name: 'warehouse', type: 'STRING' },
              { name: 'last_updated', type: 'DATETIME' },
              { name: 'quantity', type: 'INTEGER' },
              { name: 'daily_demand', type: 'DECIMAL' },
            ],
          },
        },
      },
      permissions: [
        {
          principal: quicksightUserArn,
          actions: ['quicksight:DescribeDataSet', 'quicksight:DescribeDataSetPermissions', 'quicksight:PassDataSet', 'quicksight:UpdateDataSet', 'quicksight:DeleteDataSet', 'quicksight:UpdateDataSetPermissions'],
        },
      ],
    });

    const shipmentDataSet = new quicksight.CfnDataSet(this, 'ShipmentDataSet', {
      awsAccountId: this.account,
      dataSetId: 'ShipmentDataSet',
      name: 'Shipment Status Tracking',
      importMode: 'SPICE',
      physicalTableMap: {
        'ShipmentTable': {
          relationalTable: {
            dataSourceArn: dataSource.attrArn,
            catalog: 'AwsDataCatalog',
            schema: databaseName,
            name: 'shipments',
            inputColumns: [
              { name: 'id', type: 'STRING' },
              { name: 'sku', type: 'STRING' },
              { name: 'status', type: 'STRING' },
              { name: 'destination', type: 'STRING' },
              { name: 'quantity', type: 'INTEGER' },
            ],
          },
        },
      },
      permissions: [
        {
          principal: quicksightUserArn,
          actions: ['quicksight:DescribeDataSet', 'quicksight:DescribeDataSetPermissions', 'quicksight:PassDataSet', 'quicksight:UpdateDataSet', 'quicksight:DeleteDataSet', 'quicksight:UpdateDataSetPermissions'],
        },
      ],
    });

    const stockoutRiskDataSet = new quicksight.CfnDataSet(this, 'StockoutRiskDataSet', {
      awsAccountId: this.account,
      dataSetId: 'StockoutRiskDataSet',
      name: 'Stockout Risk Analysis',
      importMode: 'SPICE',
      physicalTableMap: {
        'RiskQuery': {
          customSql: {
            dataSourceArn: dataSource.attrArn,
            name: 'StockoutRiskQuery',
            sqlQuery: `
              SELECT sku, warehouse, quantity, daily_demand,
              CASE WHEN quantity < (daily_demand * 3) THEN 'HIGH'
                   WHEN quantity < (daily_demand * 7) THEN 'MEDIUM'
                   ELSE 'LOW' END as risk_level
              FROM "supply_chain_db"."curated_inventory_status"
            `,
            columns: [
              { name: 'sku', type: 'STRING' },
              { name: 'warehouse', type: 'STRING' },
              { name: 'quantity', type: 'INTEGER' },
              { name: 'daily_demand', type: 'DECIMAL' },
              { name: 'risk_level', type: 'STRING' },
            ],
          },
        },
      },
      permissions: [
        {
          principal: quicksightUserArn,
          actions: ['quicksight:DescribeDataSet', 'quicksight:DescribeDataSetPermissions', 'quicksight:PassDataSet', 'quicksight:UpdateDataSet', 'quicksight:DeleteDataSet', 'quicksight:UpdateDataSetPermissions'],
        },
      ],
    });

    // 8. QuickSight Dashboard
    new quicksight.CfnDashboard(this, 'SupplyChainDashboard', {
      awsAccountId: this.account,
      dashboardId: 'SupplyChainDashboard',
      name: 'Supply Chain Operations Dashboard',
      sourceEntity: {
        sourceTemplate: {
          arn: `arn:aws:quicksight:${this.region}:${this.account}:template/SupplyChainTemplate`,
          dataSetReferences: [
            { dataSetArn: inventoryDataSet.attrArn, dataSetPlaceholder: 'InventoryDataSet' },
            { dataSetArn: shipmentDataSet.attrArn, dataSetPlaceholder: 'ShipmentDataSet' },
            { dataSetArn: stockoutRiskDataSet.attrArn, dataSetPlaceholder: 'StockoutRiskDataSet' },
          ],
        },
      },
      dashboardPublishOptions: {
        adHocFilteringOption: { availabilityStatus: 'ENABLED' },
      },
      permissions: [
        {
          principal: quicksightUserArn,
          actions: ['quicksight:DescribeDashboard', 'quicksight:ListDashboardVersions', 'quicksight:UpdateDashboardPermissions', 'quicksight:QueryDashboard', 'quicksight:UpdateDashboard', 'quicksight:DeleteDashboard', 'quicksight:DescribeDashboardPermissions', 'quicksight:UpdateDashboardPublishedVersion'],
        },
      ],
    });

    // 9. Ingestion Simulator Lambda
    const ingestionLambda = new lambda.Function(this, 'IngestionSimulator', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'ingestion_simulator.lambda_handler',
      code: lambda.Code.fromAsset('../lambda'),
      environment: {
        RAW_BUCKET: rawBucket.bucketName,
      },
    });
    rawBucket.grantWrite(ingestionLambda);

    // Schedule Ingestion every minute
    new events.Rule(this, 'IngestionSchedule', {
      schedule: events.Schedule.rate(Duration.minutes(1)),
      targets: [new targets.LambdaFunction(ingestionLambda)],
    });

    // 10. SNS for Alerts
    const alertTopic = new sns.Topic(this, 'SupplyChainAlertTopic');
    alertTopic.addSubscription(new subs.EmailSubscription('your-email@example.com'));

    // 11. Alerting Engine Lambda
    const alertLambda = new lambda.Function(this, 'AlertingEngine', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'alerting_engine.lambda_handler',
      code: lambda.Code.fromAsset('../lambda'),
      environment: {
        SNS_TOPIC_ARN: alertTopic.topicArn,
      },
    });
    alertTopic.grantPublish(alertLambda);

    // 12. Glue Job Role
    const glueRole = new iam.Role(this, 'GlueJobRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
      ],
    });
    rawBucket.grantRead(glueRole);
    curatedBucket.grantReadWrite(glueRole);

    // 13. Glue Job
    new glue.CfnJob(this, 'ETLJob', {
      name: 'SupplyChainETL',
      role: glueRole.roleArn,
      command: {
        name: 'glueetl',
        pythonVersion: '3',
        scriptLocation: `s3://${rawBucket.bucketName}/scripts/etl_job.py`,
      },
      defaultArguments: {
        '--RAW_BUCKET': rawBucket.bucketName,
        '--CURATED_BUCKET': curatedBucket.bucketName,
      },
    });
  }
}
