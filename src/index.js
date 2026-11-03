import app from "./app.js";
import { config } from "./config/env.config.js";

app.listen(config.app.port, () => {
  console.log(`Server is running on http://localhost:${config.app.port}`);
  console.log(`Check server life on http://localhost:${config.app.port}/health`);
});
