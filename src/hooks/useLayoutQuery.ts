import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CanvasNode } from '../types/canvas';
import { fetchRemoteLayout, saveRemoteLayout } from '../utils/mockApi';

export function useLayoutQuery() {
  const queryClient = useQueryClient();

  // Query to fetch remote layout
  const { data: remoteNodes, isLoading, isError, error } = useQuery<CanvasNode[]>({
    queryKey: ['layout'],
    queryFn: fetchRemoteLayout,
    refetchOnWindowFocus: false,
  });

  // Mutation to save layout with optimistic updates
  const saveMutation = useMutation<CanvasNode[], Error, CanvasNode[], { previousNodes: CanvasNode[] | undefined }>({
    mutationFn: saveRemoteLayout,
    
    // Perform optimistic updates
    onMutate: async (newNodes) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['layout'] });

      // Snapshot the previous value
      const previousNodes = queryClient.getQueryData<CanvasNode[]>(['layout']);

      // Optimistically update to the new value
      queryClient.setQueryData<CanvasNode[]>(['layout'], newNodes);

      // Return context object with the snapshot value for rollback
      return { previousNodes };
    },
    
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, _newNodes, context) => {
      if (context?.previousNodes) {
        queryClient.setQueryData(['layout'], context.previousNodes);
        console.error('Optimistic save mutation failed, rolling back to previous layout state.', err);
      }
    },
    
    // Always refetch or update after success or error to ensure state synchronization
    onSettled: (data) => {
      if (data) {
        queryClient.setQueryData(['layout'], data);
      }
    },
  });

  return {
    remoteNodes,
    isLoading,
    isError,
    error,
    saveLayout: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}
