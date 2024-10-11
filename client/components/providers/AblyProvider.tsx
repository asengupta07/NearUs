import React, { useMemo } from 'react';
import { configureAbly } from "@ably-labs/react-hooks";
import { Realtime } from 'ably';

interface AblyWrapperProps {
  children: React.ReactNode;
}

export default function AblyWrapper({ children }: AblyWrapperProps) {
  const client = useMemo(() => {
    const apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY;
    if (!apiKey) {
      throw new Error('Ably API key is not set. Please check your environment variables.');
    }

    configureAbly({ key: apiKey });
    return new Realtime({ key: apiKey });
  }, []);

  return (
    <div>
      {children}
    </div>
  );
}