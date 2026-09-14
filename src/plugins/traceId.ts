import { FastifyPluginAsync } from "fastify";
import { randomUUID } from "node:crypto";

declare module "fastify" {
  interface FastifyRequest {
    traceId: string;
  }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const traceIdPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", async (request, reply) => {
    const incomingTraceId = request.headers["x-trace-id"];

    const traceId =
      typeof incomingTraceId === "string" &&
      uuidPattern.test(incomingTraceId)
        ? incomingTraceId
        : randomUUID();

    request.traceId = traceId;

    request.log = request.log.child({
      traceId
    });

    reply.header("x-trace-id", traceId);
  });
};