"use client"

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatWindow from '@/components/chat/ChatWindow';
import { useAuth } from '@/contexts/authContext';
import LoadingState from '@/components/LoadingState/LoadingState';
import AblyWrapper from '@/components/providers/AblyProvider';
import { useRouter } from 'next/navigation';

interface UserData {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  bio: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface ApiResponse {
  me: UserData;
  friends: UserData[];
}

export default function ChatPage() {
  const { userId } = useParams();
  const { email, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication status first
    if (!authLoading && !isAuthenticated) {
      router.push('/login'); // Redirect to login if not authenticated
      return;
    }

    async function fetchUserData() {
      if (!email) {
        return; // Wait for email to be available
      }

      try {
        const response = await fetch(`/api/friends?email=${encodeURIComponent(email)}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.statusText}`);
        }

        const data: ApiResponse = await response.json();
        if (!data.me) {
          throw new Error('User data not found in the response');
        }
        setCurrentUser(data.me);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && email) {
      fetchUserData();
    }
  }, [email, authLoading, isAuthenticated, router]);

  if (authLoading || isLoading) {
    return <LoadingState message="Loading chat..." submessage="Preparing your conversation" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 bg-gray-900 rounded-lg">
          <h2 className="text-xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-300">{error}</p>
          <button
            onClick={() => router.push('/auth')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 bg-gray-900 rounded-lg">
          <h1 className="text-xl font-bold text-yellow-500 mb-4">Unable to load user data</h1>
          <p className="text-gray-300">Please try refreshing the page</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <div className="flex-grow">
        <AblyWrapper>
          <ChatWindow currentUserId={currentUser.id} recipientId={userId as string} />
        </AblyWrapper>
      </div>
    </div>
  );
}