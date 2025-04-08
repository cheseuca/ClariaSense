'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function UnsubscribePage() {
    const [email, setEmail] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Processing...');

    useEffect(() => {
        // Extract the email query parameter from the URL
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get('email');
        setEmail(emailParam);

        if (!emailParam) {
            setStatus('No email provided.');
            return;
        }

        const unsubscribe = async () => {
            try {
                const res = await fetch(`/api/unsubscribe?email=${encodeURIComponent(emailParam)}`);
                if (res.ok) {
                    const data = await res.json();
                    setStatus(data.message || 'You have been unsubscribed.');
                } else {
                    const errorData = await res.json();
                    setStatus(errorData.error || 'Unsubscribe failed. Please try again.');
                }
            } catch (error) {
                setStatus('An error occurred.');
            }
        };

        unsubscribe();
    }, []);

    return (
        <div className="font-inter min-h-screen flex flex-col">
            <div className="max-w-screen-xl flex flex-start mx-auto p-4">
                {/* Logo Here */}
                <div className="">
                    <Image
                        src="/clariaSenseLogo.png"
                        width={100}
                        height={67}
                        alt="Logo"
                    />
                </div>
            </div>
            <main className="flex-grow flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Unsubscribe</h2>
                    <p>{status}</p>
                    <p>You may close this tab</p>
                </div>
            </main>
            <footer className="bg-white border-t border-gray-200 py-4 mt-8">
                <div className="max-w-screen-xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
                    <p className="text-gray-500 text-sm text-center w-full">
                        © {new Date().getFullYear()} ClariaSense. CPE 4 - 3 Group 7 S.Y. 2024-2025. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}