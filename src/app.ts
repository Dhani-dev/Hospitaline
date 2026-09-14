import Fastify from "fastify";
import { ServiceContainer } from "./bootstrap/createServices";
import { queryMethodPlugin } from "./plugins/queryMethod";
import { doctorRoutes } from "./routes/doctorRoutes";
import { hospitalRoutes } from "./routes/hospitalRoutes";
import { pacienteRoutes } from "./routes/pacienteRoutes";

export function buildApp(services: ServiceContainer) {
  const app = Fastify({ logger: true });

  app.register(queryMethodPlugin);

  app.get("/health", async () => ({ status: "ok" }));

  const apiPrefixes = ["/api/v1", "/api/v2"];

  for (const prefix of apiPrefixes) {
    app.register(hospitalRoutes(services), { prefix });
    app.register(doctorRoutes(services), { prefix });
    app.register(pacienteRoutes(services), { prefix });
  }

  return app;
}
