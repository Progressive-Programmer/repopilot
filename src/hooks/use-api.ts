
"use client";

import { useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useToast } from './use-toast';

interface ApiError {
    message: string;
    needsReauth?: boolean;
}

interface ApiResponse<T> {
    data?: T;
    linkHeader?: string | null;
    error?: ApiError;
}

/**
 * A custom hook to standardize API calls, handle errors, and manage session state.
 * It automatically triggers a sign-out if the API indicates an invalid session.
 */
export function useApi() {
    const { toast } = useToast();

    const handleFetch = useCallback(async <T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
        try {
            const response = await fetch(url, options);

            // If the response is a 401, it could be an expired token.
            if (response.status === 401) {
                const errorData: ApiError = await response.json();
                if (errorData.needsReauth) {
                    toast({
                        variant: 'destructive',
                        title: 'Session Expired',
                        description: 'Your session has expired. Please sign in again.',
                    });
                    // Delay sign-out slightly to allow toast to be seen
                    setTimeout(() => signOut(), 2000);
                }
                return { error: { message: errorData.message || 'Authentication error.' } };
            }
            
            if (!response.ok) {
                const errorData: ApiError = await response.json().catch(() => ({ message: response.statusText }));
                return { error: { message: errorData.message || `An HTTP error occurred: ${response.status}` } };
            }
            
            // Handle successful but empty responses (e.g., 204 No Content)
            if (response.status === 204) {
                 return { data: undefined };
            }
            
            // For other successful responses, parse the JSON body.
            const { data, linkHeader } = await response.json();
            return { data, linkHeader };

        } catch (error: any) {
            console.error(`API call failed for ${url}:`, error);
            return { error: { message: error.message || 'A network error occurred.' } };
        }
    }, [toast]);

    const get = useCallback(<T>(url: string) => {
        return handleFetch<T>(url, { method: 'GET' });
    }, [handleFetch]);

    const put = useCallback(<T>(url:string, body: any) => {
         return handleFetch<T>(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    }, [handleFetch]);


    return { get, put };
}
