import { PeerResponse } from "../types/entities";

export type ExternalEntity = Record<string, unknown>;

export interface PeerTarget {
  baseUrl: string;
  lastPath: string;
  listPath: string;
}

export interface ExternalEntitiesClient {
  getLastUser(traceId: string): Promise<PeerResponse>;
  getLastEntrenador(traceId: string): Promise<PeerResponse>;
  getPeers(traceId: string): Promise<{
    "biblio-express": PeerResponse;
    pokenetes: PeerResponse;
  }>;
}

export class ExternalApiError extends Error {
  constructor(
    public readonly service: string,
    public readonly status: number,
    message: string
  ) {
    super(`${service} API request failed (${status}): ${message}`);
    this.name = "ExternalApiError";
  }
}

type FetchLike = (
  input: string | URL,
  init?: RequestInit
) => Promise<Response>;

const REQUEST_TIMEOUT_MS = 5000;

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export function pickLastRecord(payload: unknown): ExternalEntity | null {
  if (Array.isArray(payload)) {
    const last = payload.at(-1);
    return isObject(last) ? last : null;
  }

  if (!isObject(payload)) {
    return null;
  }

  if (isObject(payload.local)) {
    return payload.local;
  }

  const nestedKeys = [
    "data",
    "users",
    "user",
    "books",
    "entrenador",
    "entrenadores",
    "hospitals",
    "doctors",
    "pacientes"
  ];

  for (const key of nestedKeys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      const last = value.at(-1);
      return isObject(last) ? last : null;
    }
    if (isObject(value) && key === "data") {
      return value;
    }
  }

  return payload;
}

function isObject(value: unknown): value is ExternalEntity {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function offlinePeer(entity: PeerResponse["entity"]): PeerResponse {
  return { live: false, entity, data: null };
}

export class HttpExternalEntitiesClient implements ExternalEntitiesClient {
  constructor(
    private readonly users: PeerTarget,
    private readonly entrenador: PeerTarget,
    private readonly fetcher: FetchLike = fetch
  ) {}

  getLastUser(traceId: string): Promise<PeerResponse> {
    return this.getLastPeer("biblio-express", "users", this.users, traceId);
  }

  getLastEntrenador(traceId: string): Promise<PeerResponse> {
    return this.getLastPeer("pokenetes", "entrenador", this.entrenador, traceId);
  }

  async getPeers(traceId: string) {
    const [users, entrenador] = await Promise.all([
      this.getLastUser(traceId),
      this.getLastEntrenador(traceId)
    ]);

    return {
      "biblio-express": users,
      pokenetes: entrenador
    };
  }

  private async getLastPeer(
    service: string,
    entity: PeerResponse["entity"],
    target: PeerTarget,
    traceId: string
  ): Promise<PeerResponse> {
    if (!target.baseUrl.trim()) {
      return offlinePeer(entity);
    }

    const lastUrl = joinUrl(target.baseUrl, target.lastPath);
    const listUrl = joinUrl(target.baseUrl, target.listPath);

    try {
      const lastResponse = await this.request(lastUrl, traceId);
      if (lastResponse.ok) {
        return {
          live: true,
          entity,
          data: pickLastRecord(await lastResponse.json())
        };
      }

      if (lastResponse.status !== 404) {
        throw new ExternalApiError(service, lastResponse.status, await lastResponse.text());
      }
    } catch (error) {
      if (error instanceof ExternalApiError) {
        return offlinePeer(entity);
      }
    }

    try {
      const listResponse = await this.request(listUrl, traceId);
      if (!listResponse.ok) {
        return offlinePeer(entity);
      }

      return {
        live: true,
        entity,
        data: pickLastRecord(await listResponse.json())
      };
    } catch {
      return offlinePeer(entity);
    }
  }

  private request(url: string, traceId: string): Promise<Response> {
    return this.fetcher(url, {
      headers: {
        Accept: "application/json",
        "x-trace-id": traceId
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  }
}
