import { FastifyReply } from "fastify";
import { ZodError } from "zod";
import { HttpError } from "../errors/httpError";

export function handleControllerError(error: unknown, reply: FastifyReply): FastifyReply {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Validation error",
      issues: error.issues
    });
  }

  if (error instanceof HttpError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: "Internal server error" });
}
