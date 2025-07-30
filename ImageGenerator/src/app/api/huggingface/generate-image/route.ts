import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let quality = 'high';
  let qualityText = 'high quality';
  
  try {
    const requestData = await request.json();
    const { prompt, quality: requestQuality = 'high' } = requestData;
    quality = requestQuality;
    qualityText = quality === 'high' ? 'high quality' : 'fast quality';
    
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Invalid prompt provided" },
        { status: 400 }
      );
    }

    console.log(`Generating ${qualityText} images with Hugging Face for prompt:`, prompt);

    const successfulImages: string[] = [];
    
    // Progressive quality variations based on quality setting
    const variations = quality === 'high' 
      ? [", high quality", ", detailed, professional", ", ultra realistic, sharp", ", masterpiece, 8k"]
      : [", good quality", ", clean", ", clear", ", nice"];

    // Quality parameters based on selection
    const qualityLevels = quality === 'high' 
      ? [
          { steps: 30, guidance: 8.0, width: 768, height: 768, negative: "blurry, bad quality, distorted, low resolution" },
          { steps: 25, guidance: 7.5, width: 512, height: 512, negative: "blurry, bad quality" },
          { steps: 20, guidance: 7.0, width: 512, height: 512, negative: "blurry" }
        ]
      : [
          { steps: 15, guidance: 7.0, width: 512, height: 512, negative: "blurry, bad quality" },
          { steps: 10, guidance: 6.5, width: 384, height: 384, negative: "blurry" }
        ];
    
    // Generate images one at a time with quality fallback
    for (let i = 0; i < 4; i++) {
      let imageGenerated = false;
      const variedPrompt = prompt + variations[i];
      
      // Try each quality level
      for (let qualityIndex = 0; qualityIndex < qualityLevels.length && !imageGenerated; qualityIndex++) {
        const quality = qualityLevels[qualityIndex];
        
        try {
          const response = await fetch(
            "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
            {
              headers: {
                "Content-Type": "application/json",
              },
              method: "POST",
              body: JSON.stringify({
                inputs: variedPrompt,
                parameters: {
                  negative_prompt: quality.negative,
                  num_inference_steps: quality.steps,
                  guidance_scale: quality.guidance,
                  width: quality.width,
                  height: quality.height
                }
              }),
            }
          );

          if (response.ok) {
            const contentType = response.headers.get("content-type");
            
            if (contentType?.includes("application/json")) {
              const errorData = await response.json();
              console.log(`Image ${i + 1} at ${quality.width}x${quality.height} returned JSON (model loading):`, errorData);
              continue; // Try next quality level
            }

            const imageBlob = await response.blob();
            
            if (imageBlob.size > 0) {
              const arrayBuffer = await imageBlob.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString('base64');
              const imageUrl = `data:image/jpeg;base64,${base64}`;
              successfulImages.push(imageUrl);
              imageGenerated = true;
              console.log(`Image ${i + 1} generated successfully at ${quality.width}x${quality.height}`);
              break; // Success, no need to try lower quality
            } else {
              console.log(`Image ${i + 1} had empty blob at ${quality.width}x${quality.height}, trying lower quality`);
            }
          } else {
            console.log(`Image ${i + 1} failed with status ${response.status} at ${quality.width}x${quality.height}`);
          }
        } catch (error) {
          console.log(`Image ${i + 1} error at ${quality.width}x${quality.height}:`, error);
        }
      }
      
      if (!imageGenerated) {
        console.log(`Skipping image ${i + 1} after trying all quality levels`);
      }
    }

    // Return whatever images we successfully generated
    if (successfulImages.length > 0) {
      console.log(`Successfully generated ${successfulImages.length} ${qualityText} images with Hugging Face`);
      return NextResponse.json({ imageUrls: successfulImages }, { status: 200 });
    } else {
      throw new Error(`Failed to generate any ${qualityText} images - model may be loading`);
    }
  } catch (error) {
    console.error(`Error generating ${qualityText} images with Hugging Face:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : `Failed to generate ${qualityText} images` },
      { status: 500 }
    );
  }
} 