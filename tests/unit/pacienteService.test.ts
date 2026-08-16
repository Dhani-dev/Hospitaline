import { describe, expect, it, vi } from "vitest";
import { HttpError } from "../../src/errors/httpError";
import { PacienteService } from "../../src/services/pacienteService";

describe("PacienteService", () => {
  it("creates paciente when hospital exists and doctor is null", async () => {
    const pacienteRepo = {
      create: vi.fn().mockResolvedValue({ id: "paciente-1" })
    } as any;
    const hospitalRepo = {
      getById: vi.fn().mockResolvedValue({ id: "hospital-a" })
    } as any;
    const doctorRepo = {
      getById: vi.fn()
    } as any;

    const service = new PacienteService(pacienteRepo, hospitalRepo, doctorRepo);

    const result = await service.create({
      hospital_id: "hospital-a",
      doctor_id: null,
      first_name: "Test",
      last_name: "Paciente",
      birth_date: "2000-01-01",
      condition: "Observation",
      status: "stable"
    });

    expect(result.id).toBe("paciente-1");
    expect(doctorRepo.getById).not.toHaveBeenCalled();
  });

  it("throws when hospital does not exist", async () => {
    const pacienteRepo = {
      create: vi.fn()
    } as any;
    const hospitalRepo = {
      getById: vi.fn().mockResolvedValue(null)
    } as any;
    const doctorRepo = {
      getById: vi.fn()
    } as any;

    const service = new PacienteService(pacienteRepo, hospitalRepo, doctorRepo);

    await expect(
      service.create({
        hospital_id: "hospital-a",
        doctor_id: null,
        first_name: "Test",
        last_name: "Paciente",
        birth_date: "2000-01-01",
        condition: "Observation",
        status: "stable"
      })
    ).rejects.toBeInstanceOf(HttpError);
  });

  it("throws when doctor does not belong to same hospital", async () => {
    const pacienteRepo = {
      create: vi.fn()
    } as any;
    const hospitalRepo = {
      getById: vi.fn().mockResolvedValue({ id: "hospital-a" })
    } as any;
    const doctorRepo = {
      getById: vi.fn().mockResolvedValue({ id: "doctor-a", hospital_id: "hospital-b" })
    } as any;

    const service = new PacienteService(pacienteRepo, hospitalRepo, doctorRepo);

    await expect(
      service.create({
        hospital_id: "hospital-a",
        doctor_id: "doctor-a",
        first_name: "Test",
        last_name: "Paciente",
        birth_date: "2000-01-01",
        condition: "Observation",
        status: "stable"
      })
    ).rejects.toBeInstanceOf(HttpError);

    expect(pacienteRepo.create).not.toHaveBeenCalled();
  });

  it("covers patch, replace, list, remove, query and getById", async () => {
    const pacienteRepo = {
      create: vi.fn(),
      getById: vi.fn().mockResolvedValue({
        id: "paciente-1",
        hospital_id: "hospital-a",
        doctor_id: "doctor-a",
        first_name: "A",
        last_name: "B",
        birth_date: "2000-01-01",
        condition: "Observation",
        status: "stable"
      }),
      patch: vi.fn().mockResolvedValue({ id: "paciente-1" }),
      replace: vi.fn().mockResolvedValue({ id: "paciente-1" }),
      list: vi.fn().mockResolvedValue([]),
      remove: vi.fn().mockResolvedValue(true),
      query: vi.fn().mockResolvedValue({ data: [], page: 1, pageSize: 20, total: 0 })
    } as any;
    const hospitalRepo = {
      getById: vi.fn().mockResolvedValue({ id: "hospital-a" })
    } as any;
    const doctorRepo = {
      getById: vi.fn().mockResolvedValue({ id: "doctor-a", hospital_id: "hospital-a" })
    } as any;

    const service = new PacienteService(pacienteRepo, hospitalRepo, doctorRepo);

    await service.getById("paciente-1");
    await service.list();
    await service.patch("paciente-1", { status: "critical" });
    await service.replace("paciente-1", {
      hospital_id: "hospital-a",
      doctor_id: "doctor-a",
      first_name: "A",
      last_name: "B",
      birth_date: "2000-01-01",
      condition: "Observation",
      status: "stable"
    });
    await service.remove("paciente-1");
    await service.query({ filters: { status: "stable" } });

    expect(pacienteRepo.getById).toHaveBeenCalled();
    expect(pacienteRepo.patch).toHaveBeenCalledOnce();
    expect(pacienteRepo.replace).toHaveBeenCalledOnce();
    expect(pacienteRepo.list).toHaveBeenCalledOnce();
    expect(pacienteRepo.remove).toHaveBeenCalledOnce();
    expect(pacienteRepo.query).toHaveBeenCalledOnce();
  });

  it("returns null when patching missing paciente", async () => {
    const pacienteRepo = {
      getById: vi.fn().mockResolvedValue(null),
      patch: vi.fn()
    } as any;
    const service = new PacienteService(
      pacienteRepo,
      { getById: vi.fn() } as any,
      { getById: vi.fn() } as any
    );

    const result = await service.patch("missing", { status: "stable" });
    expect(result).toBeNull();
    expect(pacienteRepo.patch).not.toHaveBeenCalled();
  });
});
