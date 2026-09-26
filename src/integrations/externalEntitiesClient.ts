export type ExternalEntity = Record<string, unknown>;

export interface ExternalEntitiesClient {
  getLastUser(): Promise<ExternalEntity>;
  getLastEntrenador(): Promise<ExternalEntity>;
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

  getLastUser(): Promise<ExternalEntity> {
    return this.getLastEntity("biblio-express", this.usersUrl);
  }

  getLastEntrenador(): Promise<ExternalEntity> {
    return this.getLastEntity("pokenetes", this.entrenadorUrl);
  }

  private async getLastEntity(
    service: string,
    baseUrl: string,
  ): Promise<ExternalEntity> {
    const resourceUrl = baseUrl.replace(/\/$/, "");
    const lastResponse = await this.fetcher(`${resourceUrl}/last`, {
      signal: AbortSignal.timeout(5000)
    });

    if (lastResponse.ok) {
      return this.parseEntity(service, lastResponse);
    }

    if (lastResponse.status !== 404) {
      throw new ExternalApiError(service, lastResponse.status, await lastResponse.text());
    }

    const listResponse = await this.fetcher(resourceUrl, {
      signal: AbortSignal.timeout(5000)
    });
    if (!listResponse.ok) {
      throw new ExternalApiError(service, listResponse.status, await listResponse.text());
    }

    const body: unknown = await listResponse.json();
    if (!Array.isArray(body) || body.length === 0) {
      throw new ExternalApiError(service, listResponse.status, "Empty list response");
    }

    const last = body[body.length - 1];
    if (!last || typeof last !== "object" || Array.isArray(last)) {
      throw new ExternalApiError(service, listResponse.status, "Invalid JSON object response");
    }

    return last as ExternalEntity;
  }

  private async parseEntity(
    service: string,
    response: Response
  ): Promise<ExternalEntity> {
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ExternalApiError(service, response.status, "Invalid JSON object response");
    }

    return body as ExternalEntity;
  }
}
