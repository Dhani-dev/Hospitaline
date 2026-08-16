import { describe, expect, it, vi } from "vitest";
import { DoctorService } from "../../src/services/doctorService";
import { HttpError } from "../../src/errors/httpError";

describe("DoctorService", () => {
  it("creates doctor when hospital exists", async () => {
    const doctorRepo = {
      create: vi.fn().mockResolvedValue({ id: "doctor-1" })
    } as any;
    const hospitalRepo = {
      getById: vi.fn().mockResolvedValue({ id: "hospital-1" })
    } as any;

    const service = new DoctorService(doctorRepo, hospitalRepo);
    const doctor = await service.create({
      hospital_id: "hospital-1",
      first_name: "Ana",
      last_name: "Lopez",
      specialty: "Cardiology",
      email: "ana@example.com"
    });

    expect(doctor.id).toBe("doctor-1");
    expect(doctorRepo.create).toHaveBeenCalledOnce();
  });

  it("throws when hospital does not exist", async () => {
    const doctorRepo = {
      create: vi.fn()
    } as any;
    const hospitalRepo = {
      getById: vi.fn().mockResolvedValue(null)
    } as any;

    const service = new DoctorService(doctorRepo, hospitalRepo);

    await expect(
      service.create({
        hospital_id: "11111111-1111-4111-8111-111111111111",
        first_name: "Ana",
        last_name: "Lopez",
        specialty: "Cardiology",
        email: "ana@example.com"
      })
    ).rejects.toBeInstanceOf(HttpError);

    expect(doctorRepo.create).not.toHaveBeenCalled();
  });

  it("validates hospital on replace and patch", async () => {
    const doctorRepo = {
      replace: vi.fn().mockResolvedValue({ id: "doctor-1" }),
      patch: vi.fn().mockResolvedValue({ id: "doctor-1" }),
      list: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(null),
      remove: vi.fn().mockResolvedValue(true),
      query: vi.fn().mockResolvedValue({ data: [], page: 1, pageSize: 20, total: 0 })
    } as any;
    const hospitalRepo = {
      getById: vi.fn().mockResolvedValue({ id: "hospital-1" })
    } as any;

    const service = new DoctorService(doctorRepo, hospitalRepo);

    await service.replace("doctor-1", {
      hospital_id: "hospital-1",
      first_name: "A",
      last_name: "B",
      specialty: "C",
      email: "a@b.com"
    });
    await service.patch("doctor-1", { hospital_id: "hospital-1" });
    await service.patch("doctor-1", { specialty: "Pediatrics" });
    await service.list();
    await service.getById("doctor-1");
    await service.remove("doctor-1");
    await service.query({ filters: { specialty: "Pediatrics" } });

    expect(doctorRepo.replace).toHaveBeenCalledOnce();
    expect(doctorRepo.patch).toHaveBeenCalledTimes(2);
    expect(doctorRepo.list).toHaveBeenCalledOnce();
    expect(doctorRepo.query).toHaveBeenCalledOnce();
  });
});
