import { FastifyPluginAsync } from "fastify";
import { ServiceContainer } from "../bootstrap/createServices";
import { PacienteController } from "../controllers/pacienteController";

export const pacienteRoutes = (
  services: ServiceContainer,
  version: "v1" | "v2" = "v1"
): FastifyPluginAsync => {
  return async (fastify) => {
    const controller = new PacienteController(services.pacienteService);

    fastify.get("/pacientes", controller.list);
    if (version === "v2") {
      fastify.get("/pacientes/last", controller.getLast);
    }
    fastify.get(
      "/pacientes/:id",
      version === "v2" ? controller.getByIdV2 : controller.getById
    );
    fastify.post("/pacientes", controller.create);
    fastify.put("/pacientes/:id", controller.replace);
    fastify.patch("/pacientes/:id", controller.patch);
    fastify.delete("/pacientes/:id", controller.remove);
    fastify.route({ method: "QUERY", url: "/pacientes/query", handler: controller.query });
  };
};
