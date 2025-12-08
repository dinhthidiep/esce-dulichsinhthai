export interface ApiResponse<T extends object> {
  status: number | boolean;
  data: T;
  message: string;
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}