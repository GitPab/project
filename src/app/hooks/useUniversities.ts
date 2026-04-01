import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../services/api';
import type { UniversityRecord } from '../services/universityService';

// Query keys for caching
export const universityKeys = {
  all: ['universities'] as const,
  lists: () => [...universityKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...universityKeys.lists(), filters] as const,
  details: () => [...universityKeys.all, 'detail'] as const,
  detail: (id: string) => [...universityKeys.details(), id] as const,
};

// Hook to fetch all universities
export function useUniversities(includeInactive = false) {
  return useQuery({
    queryKey: universityKeys.list({ includeInactive }),
    queryFn: async () => {
      const response = await api.get(`/universities?includeInactive=${includeInactive}`);
      return response.data.data || response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch paginated universities
export function useUniversitiesPaginated(page = 1, limit = 20, search = '', includeInactive = false) {
  return useQuery({
    queryKey: universityKeys.list({ page, limit, search, includeInactive }),
    queryFn: async () => {
      const response = await api.get(`/universities?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&includeInactive=${includeInactive}`);
      return response.data;
    },
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });
}

// Hook to fetch a single university
export function useUniversity(id: string) {
  return useQuery({
    queryKey: universityKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/universities/${id}`);
      return response.data;
    },
    enabled: !!id, // Only run if id is provided
  });
}

// Hook to create a university
export function useCreateUniversity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<UniversityRecord>) => {
      const response = await api.post('/universities', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Thêm trường thành công');
      // Invalidate and refetch universities list
      queryClient.invalidateQueries({ queryKey: universityKeys.lists() });
    },
    onError: () => {
      toast.error('Không thể thêm trường');
    },
  });
}

// Hook to update a university
export function useUpdateUniversity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UniversityRecord> }) => {
      const response = await api.put(`/universities/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Cập nhật trường thành công');
      // Invalidate specific university and lists
      queryClient.invalidateQueries({ queryKey: universityKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: universityKeys.lists() });
    },
    onError: () => {
      toast.error('Không thể cập nhật trường');
    },
  });
}

// Hook to soft delete a university
export function useSoftDeleteUniversity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/universities/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Đã xóa trường');
      queryClient.invalidateQueries({ queryKey: universityKeys.lists() });
    },
    onError: () => {
      toast.error('Không thể xóa trường');
    },
  });
}

// Hook to restore a university
export function useRestoreUniversity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/universities/${id}/restore`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Đã khôi phục trường');
      queryClient.invalidateQueries({ queryKey: universityKeys.lists() });
    },
    onError: () => {
      toast.error('Không thể khôi phục trường');
    },
  });
}

// Hook for optimistic updates
export function useOptimisticUpdateUniversity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UniversityRecord> }) => {
      const response = await api.put(`/universities/${id}`, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: universityKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: universityKeys.lists() });
      
      // Snapshot previous values
      const previousUniversity = queryClient.getQueryData(universityKeys.detail(id));
      const previousList = queryClient.getQueryData(universityKeys.lists());
      
      // Optimistically update
      queryClient.setQueryData(universityKeys.detail(id), (old: any) => ({ ...old, ...data }));
      queryClient.setQueryData(universityKeys.lists(), (old: any[]) => {
        if (!old) return old;
        return old.map(u => u.id === id ? { ...u, ...data } : u);
      });
      
      return { previousUniversity, previousList };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousUniversity) {
        queryClient.setQueryData(universityKeys.detail(variables.id), context.previousUniversity);
      }
      if (context?.previousList) {
        queryClient.setQueryData(universityKeys.lists(), context.previousList);
      }
      toast.error('Cập nhật thất bại');
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: universityKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: universityKeys.lists() });
    },
  });
}
