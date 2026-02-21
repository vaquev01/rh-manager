import { Person } from "@/lib/types";

// Base URL for API calls. In Next.js App Router, relative URLs work for client components.
const API_BASE = "/api";

export const personsApi = {
    /**
     * Fetch all persons for a specific tenant/company with optional pagination and filtering.
     * This handles thousands of records efficiently unlike the in-memory context.
     */
    getPersons: async (filters: { unitId?: string; companyId?: string; q?: string; page?: number; limit?: number }) => {
        const params = new URLSearchParams();
        if (filters.unitId) params.append("unitId", filters.unitId);
        if (filters.companyId) params.append("companyId", filters.companyId);
        if (filters.q) params.append("q", filters.q);
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());

        const res = await fetch(`${API_BASE}/people?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch persons");
        return res.json();
    },

    /**
     * Fetch a single person by ID
     */
    getPerson: async (id: string) => {
        const res = await fetch(`${API_BASE}/people/${id}`);
        if (!res.ok) throw new Error("Failed to fetch person");
        return res.json();
    },

    /**
     * Create a new person
     */
    createPerson: async (data: Omit<Person, "id">) => {
        const res = await fetch(`${API_BASE}/people`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create person");
        return res.json();
    },

    /**
     * Update an existing person
     */
    updatePerson: async (id: string, data: Partial<Person>) => {
        const res = await fetch(`${API_BASE}/people/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update person");
        return res.json();
    },

    /**
     * Delete a person
     */
    deletePerson: async (id: string) => {
        const res = await fetch(`${API_BASE}/people/${id}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete person");
        return res.json();
    }
};
