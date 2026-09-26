import { LocalEntityName } from "../types/entities";

export const cacheKeys = {
  local: (entity: LocalEntityName, id: string) => `hospitaline:local:${entity}:${id}`,
  last: (entity: LocalEntityName) => `hospitaline:local:${entity}:last`,
  peerLast: (api: "biblio-express" | "pokenetes", entity: "users" | "entrenador") =>
    `hospitaline:peer:${api}:${entity}:last`
};
