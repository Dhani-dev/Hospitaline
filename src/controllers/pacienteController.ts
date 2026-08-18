import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { IPacienteService } from "../services/contracts";
import { handleControllerError } from "./baseController";

const pacienteCreateSchema = z.object({
  hospital_id: z.string().uuid(),
  doctor_id: z.string().uuid().nullable(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  condition: z.string().min(1),
  status: z.enum(["stable", "critical", "discharged"])
});

const pacientePatchSchema = pacienteCreateSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  "At least one field is required"
);

const pacienteQuerySchema = z.object({
  filters: z
    .object({
      hospital_id: z.string().uuid().optional(),
      doctor_id: z.string().uuid().nullable().optional(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      status: z.enum(["stable", "critical", "discharged"]).optional(),
      condition: z.string().optional()
    })
    .optional(),
  sort: z
    .object({
      field: z.string(),
      direction: z.enum(["asc", "desc"]).optional()
    })
    .optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional()
});

export class PacienteController {
  constructor(private readonly pacienteService: IPacienteService) {}

  list = async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await this.pacienteService.list();
      return reply.status(200).send(data);
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  getById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const paciente = await this.pacienteService.getById(request.params.id);
      if (!paciente) {
        return reply.status(404).send({ message: "Paciente not found" });
      }
      return reply.status(200).send(paciente);
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  create = async (
    request: FastifyRequest<{ Body: unknown }>,
    reply: FastifyReply
  ) => {
    try {
      const payload = pacienteCreateSchema.parse(request.body);
      const created = await this.pacienteService.create(payload);
      return reply.status(201).send(created);
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  replace = async (
    request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
    reply: FastifyReply
  ) => {
    try {
      const payload = pacienteCreateSchema.parse(request.body);
      const updated = await this.pacienteService.replace(request.params.id, payload);
      if (!updated) {
        return reply.status(404).send({ message: "Paciente not found" });
      }
      return reply.status(200).send(updated);
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  patch = async (
    request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
    reply: FastifyReply
  ) => {
    try {
      const payload = pacientePatchSchema.parse(request.body);
      const updated = await this.pacienteService.patch(request.params.id, payload);
      if (!updated) {
        return reply.status(404).send({ message: "Paciente not found" });
      }
      return reply.status(200).send(updated);
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  remove = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const removed = await this.pacienteService.remove(request.params.id);
      if (!removed) {
        return reply.status(404).send({ message: "Paciente not found" });
      }
      return reply.status(204).send();
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  query = async (
    request: FastifyRequest<{ Body: unknown }>,
    reply: FastifyReply
  ) => {
    try {
      const payload = pacienteQuerySchema.parse(request.body ?? {});
      const result = await this.pacienteService.query(payload);
      return reply.status(200).send(result);
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };
}
