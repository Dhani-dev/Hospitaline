export type ExternalEntity = Record<string, unknown>;

export interface ExternalEntitiesClient {
  getUserById(id: string): Promise<ExternalEntity | null>;
  getEntrenadorById(id: string): Promise<ExternalEntity | null>;
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

type Fetch = (
  input: string | URL,
  init?: RequestInit
) => Promise<Response>;

export class HttpExternalEntitiesClient implements ExternalEntitiesClient {
  constructor(
    private readonly usersUrl: string,
    private readonly entrenadorUrl: string,
    private readonly fetcher: Fetch = fetch
  ) {}

  getUserById(id: string): Promise<ExternalEntity | null> {
    return this.getEntity("users", this.usersUrl, id);
  }

  getEntrenadorById(id: string): Promise<ExternalEntity | null> {
    return this.getEntity("entrenador", this.entrenadorUrl, id);
  }

  private async getEntity(
    service: string,
    baseUrl: string,
    id: string
  ): Promise<ExternalEntity | null> {
    const response = await this.fetcher(
      `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(id)}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new ExternalApiError(service, response.status, await response.text());
    }

    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ExternalApiError(service, response.status, "Invalid JSON object response");
    }

    return body as ExternalEntity;
  }
}
