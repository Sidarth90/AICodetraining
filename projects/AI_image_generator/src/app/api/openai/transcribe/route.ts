import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const base64Audio = body.audio;

    if (!base64Audio) {
      return NextResponse.json({ error: "No audio data provided" }, { status: 400 });
    }

    // Convert the base64 audio data to a Buffer
    const audio = Buffer.from(base64Audio, "base64");

    // Create a temporary directory if it doesn't exist
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Define the file path for storing the temporary audio file
    const fileName = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webm`;
    const filePath = path.join(tmpDir, fileName);

    // Write the audio data to a temporary file
    fs.writeFileSync(filePath, audio);

    // Create a readable stream from the temporary file
    const readStream = fs.createReadStream(filePath);

    const data = await openai.audio.transcriptions.create({
      file: readStream,
      model: "whisper-1",
      language: "en", // You can make this configurable
      response_format: "json",
    });

    // Remove the temporary file after successful processing
    fs.unlinkSync(filePath);

    return NextResponse.json({ 
      text: data.text,
      success: true 
    });
  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio", success: false }, 
      { status: 500 }
    );
  }
}
