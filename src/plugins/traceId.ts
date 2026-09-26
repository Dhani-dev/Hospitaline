import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

declare module "fastify" {
  interface FastifyRequest {
    traceId: string;
  }
}

export function resolveTraceId(headerValue: string | string[] | undefined): string {
  if (typeof headerValue === "string" && headerValue.trim()) {
    return headerValue.trim();
  }

  return randomUUID();
}

export function registerTraceId(fastify: FastifyInstance): void {
  fastify.addHook("onRequest", async (request, reply) => {
    const traceId = resolveTraceId(request.headers["x-trace-id"]);

    request.traceId = traceId;
    request.log = request.log.child({ traceId });
    reply.header("x-trace-id", traceId);
  });
}
