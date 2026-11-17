import { Request } from 'express';
import { FieldError, invalid } from './http-error';

export type Pagination = { page: number; limit: number; skip: number };

export function parsePagination(query: Request['query']): Pagination {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  const details: FieldError[] = [];
  if (!Number.isInteger(page) || page < 1) details.push({ field: 'page', message: 'page must be an integer of at least 1' });
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) details.push({ field: 'limit', message: 'limit must be an integer between 1 and 100' });
  if (details.length) throw invalid(details);
  return { page, limit, skip: (page - 1) * limit };
}

export function paged(items: unknown[], total: { n: number }[], { page, limit }: Pagination) {
  const count = total[0]?.n ?? 0;
  return { items, page, limit, total: count, totalPages: Math.ceil(count / limit) };
}
