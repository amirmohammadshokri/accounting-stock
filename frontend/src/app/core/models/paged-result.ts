export interface PagedResult<T> {
    total: number;
    pageNumber: number;
    pageSize: number;
    items: T[];
    totals?: any;
}