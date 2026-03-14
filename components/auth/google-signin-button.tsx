"use client";

import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    google?: any;
    __gsiInitialized?: boolean;
  }
}

export function GoogleSignInButton({
  onCredential,
}: {
  onCredential: (credential: string) => void;
}) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onCredential);
  
  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  const initializeGoogle = useCallback(() => {
    if (!window.google || !buttonRef.current) return;

    // Only initialize once globally
    if (!window.__gsiInitialized) {
      window.google.accounts.id.initialize({
        client_id: "351034184858-u1loq1af6v2kjo6h3po6r5qhjfhuog74.apps.googleusercontent.com",
        callback: (response: { credential?: string }) => {
          if (response.credential) {
            callbackRef.current(response.credential);
          }
        },
      });
      window.__gsiInitialized = true;
    }

    // Clear and re-render button
    if (buttonRef.current) {
      buttonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 360,
        text: "continue_with",
        shape: "pill",
      });
    }
  }, []);

  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    
    if (existingScript) {
      // Script already loaded, just initialize
      if (window.google) {
        initializeGoogle();
      } else {
        existingScript.addEventListener("load", initializeGoogle);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;

    document.body.appendChild(script);
    
    // Don't remove script on cleanup - it should persist
  }, [initializeGoogle]);

  return <div ref={buttonRef} className="w-full flex justify-center" />;
}
