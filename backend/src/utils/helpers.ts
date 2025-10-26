import fs from "fs";
import logger from "../logger/winston.logger.js";

export const removeLocalFile = (filePath: string) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      logger.error("Failed to delete local file:", err);
    } else {
      logger.info("Removed Local:", filePath);
    }
  });
};
