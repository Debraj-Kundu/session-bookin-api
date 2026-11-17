import mongoose from "mongoose";
import { app } from "./app";
import { config } from "./config";
import { seed } from "./seed";

async function main() {
  mongoose.connection.on("error", (err) =>
    console.error("MongoDB connection error:", err),
  );
  await mongoose.connect(config.mongoUri);
  await seed();
  app.listen(config.port, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Listening on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
