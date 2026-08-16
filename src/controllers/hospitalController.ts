import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { IHospitalService } from "../services/contracts";
import { handleControllerError } from "./baseController";

const hospitalCreateSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  phone: z.string().min(7)
});

const hospitalPatchSchema = hospitalCreateSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  "At least one field is required"
);

const hospitalQuerySchema = z.object({
  filters: z
    .object({
      name: z.string().optional(),
      city: z.string().optional(),
      phone: z.string().optional()
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

export class HospitalController {
  constructor(private readonly hospitalService: IHospitalService) {}

  list = async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await this.hospitalService.list();
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
      const hospital = await this.hospitalService.getById(request.params.id);
      if (!hospital) {
        return reply.status(404).send({ message: "Hospital not found" });
      }
      return reply.status(200).send(hospital);
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  create = async (
    request: FastifyRequest<{ Body: unknown }>,
    reply: FastifyReply
  ) => {
    try {
      const payload = hospitalCreateSchema.parse(request.body);
      const created = await this.hospitalService.create(payload);
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
      const payload = hospitalCreateSchema.parse(request.body);
      const updated = await this.hospitalService.replace(request.params.id, payload);
      if (!updated) {
        return reply.status(404).send({ message: "Hospital not found" });
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
      const payload = hospitalPatchSchema.parse(request.body);
      const updated = await this.hospitalService.patch(request.params.id, payload);
      if (!updated) {
        return reply.status(404).send({ message: "Hospital not found" });
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
      const removed = await this.hospitalService.remove(request.params.id);
      if (!removed) {
        return reply.status(404).send({ message: "Hospital not found" });
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
      const payload = hospitalQuerySchema.parse(request.body ?? {});
      const result = await this.hospitalService.query(payload);
      return reply.status(200).send(result);
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };
}
