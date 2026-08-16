export type QueryPayload<TFilters extends Record<string, unknown>> = {
  filters?: TFilters;
  sort?: {
    field: string;
    direction?: "asc" | "desc";
  };
  page?: number;
  pageSize?: number;
};

export type QueryResult<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};
