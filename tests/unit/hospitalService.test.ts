import { describe, expect, it, vi } from "vitest";
import { HospitalService } from "../../src/services/hospitalService";

describe("HospitalService", () => {
  it("delegates all operations to repository", async () => {
    const list = vi.fn().mockResolvedValue([]);
    const getById = vi.fn().mockResolvedValue(null);
    const create = vi.fn().mockResolvedValue({ id: "1" });
    const replace = vi.fn().mockResolvedValue({ id: "1" });
    const patch = vi.fn().mockResolvedValue({ id: "1" });
    const remove = vi.fn().mockResolvedValue(true);
    const query = vi.fn().mockResolvedValue({ data: [], page: 1, pageSize: 20, total: 0 });
    const repo = {
      list,
      getById,
      create,
      replace,
      patch,
      remove,
      query
    } as any;

    const service = new HospitalService(repo);
    await service.list();
    await service.getById("1");
    await service.create({ name: "A", address: "B", city: "C", phone: "1234567" });
    await service.replace("1", { name: "A", address: "B", city: "C", phone: "1234567" });
    await service.patch("1", { city: "D" });
    await service.remove("1");
    const result = await service.query({ filters: { city: "Bogota" }, page: 1, pageSize: 10 });

    expect(list).toHaveBeenCalledOnce();
    expect(getById).toHaveBeenCalledWith("1");
    expect(create).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledOnce();
    expect(patch).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith("1");
    expect(query).toHaveBeenCalledOnce();
    expect(result.total).toBe(0);
  });
});
