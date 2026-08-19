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

  app.register(hospitalRoutes(services));
  app.register(doctorRoutes(services));
  app.register(pacienteRoutes(services));

  return app;
}
