import { apiClient } from '@/lib/api-client';
import type { UserFilters, UsersResponse, UserMutationPayload } from './types';

export async function getUsers(filters: UserFilters): Promise<UsersResponse> {
  const query = new URLSearchParams();
  if (filters.page) query.append('page', String(filters.page));
  if (filters.limit) query.append('limit', String(filters.limit));
  if (filters.search) query.append('search', filters.search);
  if (filters.roles) query.append('roles', filters.roles);
  if (filters.sort) query.append('sort', filters.sort);

  return apiClient<UsersResponse>(`/users?${query.toString()}`);
}

export async function createUser(data: UserMutationPayload) {
  return apiClient('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: string, data: UserMutationPayload) {
  return apiClient(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string) {
  return apiClient(`/users/${id}`, {
    method: 'DELETE',
  });
}
