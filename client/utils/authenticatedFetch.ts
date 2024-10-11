// utils/authenticatedFetch.ts
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('jwtToken');
  
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'An error occurred while processing your request.');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred.');
  }
};

export default authenticatedFetch;