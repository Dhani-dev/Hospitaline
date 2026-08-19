import { FastifyPluginAsync } from "fastify";
import { ServiceContainer } from "../bootstrap/createServices";
import { PacienteController } from "../controllers/pacienteController";

export const pacienteRoutes = (
  services: ServiceContainer
): FastifyPluginAsync => {
  return async (fastify) => {
    const controller = new PacienteController(services.pacienteService);

    fastify.get("/pacientes", controller.list);
    fastify.get("/pacientes/:id", controller.getById);
    fastify.post("/pacientes", controller.create);
    fastify.put("/pacientes/:id", controller.replace);
    fastify.patch("/pacientes/:id", controller.patch);
    fastify.delete("/pacientes/:id", controller.remove);
    fastify.route({ method: "QUERY", url: "/pacientes/query", handler: controller.query });
  };
};
