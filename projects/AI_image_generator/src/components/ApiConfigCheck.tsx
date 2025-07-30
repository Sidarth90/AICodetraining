"use client";

import { useState, useEffect } from "react";

export default function ApiConfigCheck() {
  const [status, setStatus] = useState<"loading" | "configured" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkApiConfig = async () => {
      try {
        const response = await fetch("/api/replicate/test");
        const data = await response.json();
        
        if (data.configured) {
          setStatus("configured");
        } else {
          setStatus("error");
          setMessage(data.message);
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to check API configuration");
      }
    };

    checkApiConfig();
  }, []);

  if (status === "loading") {
    return (
      <div className="fixed top-0 left-0 right-0 bg-purple-100 text-purple-800 p-2 text-center">
        Checking API configuration...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="fixed top-0 left-0 right-0 bg-red-100 text-red-800 p-4 text-center shadow-lg">
        <p className="font-semibold">⚠️ API Configuration Error</p>
        <p className="text-sm mt-1">{message}</p>
        <p className="text-sm mt-2">
          Please add your Replicate API token to the .env file:
          <code className="bg-red-50 px-2 py-1 rounded mx-2 font-mono">
            REPLICATE_API_TOKEN=your_token_here
          </code>
        </p>
      </div>
    );
  }

  return null;
} 