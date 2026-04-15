import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'RAW_BUCKET', 'CURATED_BUCKET'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Load data from Glue Catalog
shipments = glueContext.create_dynamic_frame.from_catalog(database="supply_chain_db", table_name="shipments")
inventory = glueContext.create_dynamic_frame.from_catalog(database="supply_chain_db", table_name="inventory")

# Convert to Spark DataFrames
df_shipments = shipments.toDF()
df_inventory = inventory.toDF()

# 1. Process Shipments: Aggregate daily demand
df_daily_demand = df_shipments.groupBy("date", "sku").agg({"quantity": "sum"}).withColumnRenamed("sum(quantity)", "daily_demand")

# 2. Process Inventory: Get latest stock level per SKU and Warehouse
from pyspark.sql.window import Window
from pyspark.sql.functions import row_number, col

windowSpec = Window.partitionBy("sku", "warehouse").orderBy(col("last_updated").desc())
df_latest_inventory = df_inventory.withColumn("row", row_number().over(windowSpec)) \
    .filter(col("row") == 1).drop("row")

# 3. Join for Curated View: Current Stock vs. Daily Demand
df_curated = df_latest_inventory.join(df_daily_demand, "sku", "left")

# Write to Curated Zone in Parquet
glueContext.write_dynamic_frame.from_options(
    frame=DynamicFrame.fromDF(df_curated, glueContext, "df_curated"),
    connection_type="s3",
    connection_options={"path": f"s3://{args['CURATED_BUCKET']}/curated_inventory_status/"},
    format="parquet"
)

job.commit()
