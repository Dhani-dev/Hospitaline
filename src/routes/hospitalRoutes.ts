import { FastifyPluginAsync } from "fastify";
import { ServiceContainer } from "../bootstrap/createServices";
import { HospitalController } from "../controllers/hospitalController";

export const hospitalRoutes = (
  services: ServiceContainer,
  version: "v1" | "v2"
): FastifyPluginAsync => {
  return async (fastify) => {
    const controller = new HospitalController(services.hospitalService);

    fastify.get("/hospitals", controller.list);
    if (version === "v2") {
      fastify.get("/hospitals/last", controller.list);
    }
    fastify.get(
      "/hospitals/:id",
      version === "v2" ? controller.getByIdV2 : controller.getById
    );
    fastify.post("/hospitals", controller.create);
    fastify.put("/hospitals/:id", controller.replace);
    fastify.patch("/hospitals/:id", controller.patch);
    fastify.delete("/hospitals/:id", controller.remove);
    fastify.route({ method: "QUERY", url: "/hospitals/query", handler: controller.query });
  };
};
