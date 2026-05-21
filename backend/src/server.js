import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`HireSense AI API listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start API:", error.message);
    process.exit(1);
  });
