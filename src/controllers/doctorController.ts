import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { IDoctorService } from "../services/contracts";
import { handleControllerError } from "./baseController";

const doctorCreateSchema = z.object({
  hospital_id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  specialty: z.string().min(1),
  email: z.string().email()
});

const doctorPatchSchema = doctorCreateSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  "At least one field is required"
);

const doctorQuerySchema = z.object({
  filters: z
    .object({
      hospital_id: z.string().uuid().optional(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      specialty: z.string().optional(),
      email: z.string().optional()
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

export class DoctorController {
  constructor(private readonly doctorService: IDoctorService) {}

  list = async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await this.doctorService.list();
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
      const doctor = await this.doctorService.getById(request.params.id);
      if (!doctor) {
        return reply.status(404).send({ message: "Doctor not found" });
      }
      return reply.status(200).send(doctor);
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  create = async (
    request: FastifyRequest<{ Body: unknown }>,
    reply: FastifyReply
  ) => {
    try {
      const payload = doctorCreateSchema.parse(request.body);
      const created = await this.doctorService.create(payload);
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
      const payload = doctorCreateSchema.parse(request.body);
      const updated = await this.doctorService.replace(request.params.id, payload);
      if (!updated) {
        return reply.status(404).send({ message: "Doctor not found" });
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
      const payload = doctorPatchSchema.parse(request.body);
      const updated = await this.doctorService.patch(request.params.id, payload);
      if (!updated) {
        return reply.status(404).send({ message: "Doctor not found" });
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
      const removed = await this.doctorService.remove(request.params.id);
      if (!removed) {
        return reply.status(404).send({ message: "Doctor not found" });
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
      const payload = doctorQuerySchema.parse(request.body ?? {});
      const result = await this.doctorService.query(payload);
      return reply.status(200).send(result);
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };
}
