import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { logger } from "./utils/logger.js";

dotenv.config();

const port = process.env.PORT || 5000;

await connectDatabase();

const app = createApp();
app.listen(port, () => {
  logger.info(`API listening on port ${port}`);
});
