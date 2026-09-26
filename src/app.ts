import Fastify from "fastify";
import { ServiceContainer } from "./bootstrap/createServices";
import { queryMethodPlugin } from "./plugins/queryMethod";
import { doctorRoutes } from "./routes/doctorRoutes";
import { hospitalRoutes } from "./routes/hospitalRoutes";
import { pacienteRoutes } from "./routes/pacienteRoutes";
import { registerTraceId } from "./plugins/traceId";

export function buildApp(services: ServiceContainer) {
  const app = Fastify({ logger: true });

  app.register(queryMethodPlugin);
  registerTraceId(app);

  app.get("/health", async () => ({ status: "ok" }));

  const apiPrefixes = ["/api/v1", "/api/v2"];

  for (const prefix of apiPrefixes) {
    const version = prefix.endsWith("v2") ? "v2" : "v1";
    app.register(hospitalRoutes(services, version), { prefix });
    app.register(doctorRoutes(services, version), { prefix });
    app.register(pacienteRoutes(services, version), { prefix });
  }

  return app;
}
