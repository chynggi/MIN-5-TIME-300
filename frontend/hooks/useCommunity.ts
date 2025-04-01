import { Entry, CommunityResponse, CommunityQueryParams } from '@/types/community';
import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';

export const useCommunityEntries = (
  params: CommunityQueryParams
): UseQueryResult<CommunityResponse> => {
  return useQuery({
    queryKey: ['community-entries', params],
    queryFn: () => fetch('/api/community?' + new URLSearchParams({
      page: params.page.toString(),
      ...(params.emotion?.length && { emotion: params.emotion.join(',') }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.search && { search: params.search })
    })).then(res => res.json()),
  });
};

export const useToggleLike = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, number>({
    mutationFn: (entryId: number) => 
      fetch(`/api/community/${entryId}/like`, { method: 'POST' })
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-entries'] });
    },
  });
};