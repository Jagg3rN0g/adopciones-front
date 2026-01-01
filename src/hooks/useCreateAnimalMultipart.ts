'use client';

import { useState } from 'react';
import type { Animal } from '@/app/types/animal';

type Result = {
    data: Animal | null;
    error: string | null;
    loading: boolean;
    createAnimalMultipart: (fd: FormData) => Promise<Animal>;
};

export function useCreateAnimalMultipart(): Result {
    const [data, setData] = useState<Animal | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function createAnimalMultipart(fd: FormData): Promise<Animal> {
        setLoading(true);
        setError(null);
        setData(null);

        const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

        // Obtenemos el token del store
        // Nota: para usar el hook dentro de una función, mejor acceder a getState, 
        // pero este hook es un componente funcional, así que podríamos usar useAuthStore().token
        // Sin embargo, para evitar re-renders innecesarios o problemas de closure, 
        // getState() es seguro en callbacks.
        const { token } = await import('@/app/store/auth.store').then(m => m.useAuthStore.getState());

        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${base}/animals`, {
            method: 'POST',
            headers,
            body: fd,
        });

        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
            const msg = json?.message || `Error al crear animal (${res.status})`;
            setError(msg);
            setLoading(false);
            throw new Error(msg);
        }

        setData(json.data as Animal);
        setLoading(false);
        return json.data as Animal;
    }

    return { data, error, loading, createAnimalMultipart };
}
