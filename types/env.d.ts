// Environment variables for Firebase hosting
declare global {
  interface Window {
    env?: {
      NEXT_PUBLIC_GEMINI_API_KEY?: string;
    };
  }
}

export {};
