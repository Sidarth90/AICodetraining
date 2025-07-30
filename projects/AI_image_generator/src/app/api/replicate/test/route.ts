import { NextResponse } from "next/server";
import Replicate from "replicate";

export async function GET() {
  try {
    // Check if API token exists
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { 
          status: "error",
          message: "Replicate API token is not configured",
          configured: false
        },
        { status: 401 }
      );
    }

    // Try to initialize Replicate client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Try to list models to verify token works
    await replicate.models.list();

    return NextResponse.json(
      { 
        status: "success",
        message: "Replicate API is properly configured",
        configured: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Replicate API test error:", error);
    return NextResponse.json(
      { 
        status: "error",
        message: error instanceof Error ? error.message : "Failed to connect to Replicate API",
        configured: false
      },
      { status: 500 }
    );
  }
} 