"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { usePlaidLink, PlaidLinkOnSuccess, PlaidLinkOptions } from 'react-plaid-link';
import { Haptics, NotificationType, ImpactStyle } from '@capacitor/haptics';

interface PlaidLinkProps {
    userId: string;
    onSuccess?: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const PlaidLink: React.FC<PlaidLinkProps> = ({ userId, onSuccess }) => {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch Link Token from our backend
    const createLinkToken = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/api/plaid/create-link-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = typeof errorData.error === 'string'
                    ? errorData.error
                    : (errorData.error?.display_message || errorData.error?.error_message || errorData.error?.error_code || 'Failed to create link token');
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setToken(data.link_token);
        } catch (err: any) {
            console.error('Error creating link token:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        createLinkToken();
    }, [createLinkToken]);

    // 2. Handle successful link
    const handleOnSuccess = useCallback<PlaidLinkOnSuccess>(
        async (publicToken, metadata) => {
            setLoading(true);
            try {
                // Exchange public token for access token
                await fetch(`${API_BASE}/api/plaid/exchange-public-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        publicToken,
                        userId,
                        institutionName: metadata.institution?.name || 'Bank',
                    }),
                });

                // Trigger an initial sync
                // Note: For now we'll just signal success to the parent
                Haptics.notification({ type: NotificationType.Success }).catch(() => {});
                if (onSuccess) onSuccess();
            } catch (error) {
                console.error('Error exchanging public token:', error);
            } finally {
                setLoading(false);
            }
        },
        [userId, onSuccess]
    );

    const config: PlaidLinkOptions = {
        token,
        onSuccess: handleOnSuccess,
    };

    const { open, ready } = usePlaidLink(config);

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                onClick={() => {
                    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                    open();
                }}
                disabled={!ready || loading}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${!ready || loading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                    }`}
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connecting...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                        </svg>
                        Link Bank Account
                    </>
                )}
            </button>
            {error && (
                <span className="text-[10px] text-red-500 max-w-[150px] text-right leading-tight">
                    Error: {error}
                </span>
            )}
        </div>
    );
};

export default PlaidLink;
