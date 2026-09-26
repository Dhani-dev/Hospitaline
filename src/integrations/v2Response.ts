import { EntityV2Response, LocalEntityName, PeerResponse } from "../types/entities";
import { ExternalEntitiesClient } from "./externalEntitiesClient";

const OFFLINE_PEERS = {
  "biblio-express": { live: false, entity: "users", data: null } satisfies PeerResponse,
  pokenetes: { live: false, entity: "entrenador", data: null } satisfies PeerResponse
};

export async function buildEntityV2Response<T>(
  entity: LocalEntityName,
  local: T,
  traceId: string,
  client?: ExternalEntitiesClient
): Promise<EntityV2Response<T>> {
  const peers = client ? await client.getPeers(traceId) : OFFLINE_PEERS;

  return {
    api: "hospitaline",
    version: "2.0.0",
    trace_id: traceId,
    entity,
    local,
    peers
  };
}
