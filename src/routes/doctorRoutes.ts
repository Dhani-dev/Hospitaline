import { FastifyPluginAsync } from "fastify";
import { ServiceContainer } from "../bootstrap/createServices";
import { DoctorController } from "../controllers/doctorController";

export const doctorRoutes = (
  services: ServiceContainer
): FastifyPluginAsync => {
  return async (fastify) => {
    const controller = new DoctorController(services.doctorService);

    fastify.get("/doctors", controller.list);
    fastify.get("/doctors/:id", controller.getById);
    fastify.post("/doctors", controller.create);
    fastify.put("/doctors/:id", controller.replace);
    fastify.patch("/doctors/:id", controller.patch);
    fastify.delete("/doctors/:id", controller.remove);
    fastify.route({ method: "QUERY", url: "/doctors/query", handler: controller.query });
  };
};
