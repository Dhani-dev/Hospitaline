import { FastifyPluginAsync } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    hasQueryMethod?: boolean;
  }
}

export const queryMethodPlugin: FastifyPluginAsync = async (fastify) => {
  const methods = (fastify as any).supportedMethods as string[] | undefined;
  const hasNativeQuery = methods?.includes("QUERY") ?? false;

  if (!fastify.hasQueryMethod && !hasNativeQuery) {
    fastify.addHttpMethod("QUERY", { hasBody: true });
    fastify.hasQueryMethod = true;
  }
};
