import fs from "fs";
import logger from "../logger/winston.logger.js";

export const getLocalFilePath = (filename: string) => {
  return `./public/uploads/${filename}`;
}

export const getStaticFilePath = (req: any, filename: string) => {
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
}

export const removeLocalFile = (filePath: string) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      logger.error("Failed to delete local file:", err);
    } else {
      logger.info("Removed Local:", filePath);
    }
  });
};

