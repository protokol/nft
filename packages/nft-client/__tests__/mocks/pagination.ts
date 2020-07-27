export const mockPagination = (
    totalCountIsEstimate: boolean,
    count: number,
    pageCount: number,
    totalCount: number,
    next: string | null,
    previous: string | null,
    self: string,
    first: string,
    last: string,
): object => ({ totalCountIsEstimate, count, pageCount, totalCount, next, previous, self, first, last });
