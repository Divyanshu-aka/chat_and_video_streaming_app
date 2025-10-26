import dotenv from "dotenv";
import { httpServer } from "./app.js";
import connectDB from "./db/index.js";
import logger from "./logger/winston.logger.js";

dotenv.config({
  path: "./.env",
});

const startServer = () =>{
  httpServer.listen(process.env.PORT || 8080 , () => {
    logger.info(`⚙️ Server running on port ${process.env.PORT || 8080}`);
  })
}

try {
  await connectDB();
  startServer();
} catch (err) {
  logger.error("MongoDB connection error:"+ err);
}