import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { personsApi } from "./services/persons";
import { Person } from "./types";

export const personsKeys = {
    all: ["persons"] as const,
    lists: () => [...personsKeys.all, "list"] as const,
    list: (filters: Record<string, any>) => [...personsKeys.lists(), { filters }] as const,
    details: () => [...personsKeys.all, "detail"] as const,
    detail: (id: string) => [...personsKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated/filtered list of persons
 */
export function usePersons(filters: { unitId?: string; companyId?: string; q?: string; page?: number; limit?: number }) {
    return useQuery({
        queryKey: personsKeys.list(filters),
        queryFn: () => personsApi.getPersons(filters),
    });
}

/**
 * Hook to fetch a single person
 */
export function usePerson(id: string | null) {
    return useQuery({
        queryKey: personsKeys.detail(id!),
        queryFn: () => personsApi.getPerson(id!),
        enabled: !!id, // Only fetch if ID exists
    });
}

/**
 * Hook to create a person with optimistic updates
 */
export function useCreatePerson() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<Person, "id">) => personsApi.createPerson(data),
        onSuccess: () => {
            // Invalidate all persons lists so they refetch automatically
            queryClient.invalidateQueries({ queryKey: personsKeys.lists() });
        },
    });
}

export function useUpdatePerson() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Person> }) => personsApi.updatePerson(id, data),
        onSuccess: (updatedPerson, variables) => {
            // Optimizely update the specific detail cache
            queryClient.setQueryData(personsKeys.detail(variables.id), updatedPerson);
            // Invalidate lists to show changes
            queryClient.invalidateQueries({ queryKey: personsKeys.lists() });
        },
    });
}

export function useDeletePerson() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => personsApi.deletePerson(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: personsKeys.lists() });
        },
    });
}
