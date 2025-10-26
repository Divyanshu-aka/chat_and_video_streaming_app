import mongoose from "mongoose";
import { DB_NAME } from "../utils/constants.js";
import logger from "../logger/winston.logger.js";

export let dbinstance: typeof mongoose | undefined = undefined;

const connectDB = async (): Promise<void> => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    dbinstance = connectionInstance;
    logger.info(
      `\n☘️  MongoDB Connected! Db host: ${connectionInstance.connection.host}\n`
    );
  } catch (error) {
    logger.error("MongoDB connection error: ", error);
    process.exit(1);
  }
};

export default connectDB;
