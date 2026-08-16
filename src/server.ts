import { buildApp } from "./app";
import { createDefaultServices } from "./bootstrap/createServices";
import { getEnvConfig } from "./config/env";

const { port } = getEnvConfig();

const app = buildApp(createDefaultServices());

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`Server listening on port ${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
