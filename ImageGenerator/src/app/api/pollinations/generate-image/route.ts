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

    console.log(`Generating ${qualityText} images with Pollinations for prompt:`, prompt);

    const encodedPrompt = encodeURIComponent(prompt);
    const successfulImages: string[] = [];
    
    // Quality levels based on selection
    const qualityLevels = quality === 'high' 
      ? [
          { width: 1024, height: 1024, params: "&model=flux&enhance=true" }, // Ultra high quality
          { width: 768, height: 768, params: "&enhance=true" }, // High quality  
          { width: 512, height: 512, params: "" } // Standard quality (fallback)
        ]
      : [
          { width: 512, height: 512, params: "" }, // Fast standard quality
          { width: 384, height: 384, params: "" } // Very fast quality
        ];
    
    // Generate images one at a time with quality fallback
    for (let i = 0; i < 4; i++) {
      let imageGenerated = false;
      
      // Try each quality level
      for (let qualityIndex = 0; qualityIndex < qualityLevels.length && !imageGenerated; qualityIndex++) {
        const quality = qualityLevels[qualityIndex];
        let attempts = 0;
        const maxAttempts = 2; // Reduced attempts per quality level
        
        while (!imageGenerated && attempts < maxAttempts) {
          try {
            attempts++;
            const seed = Math.floor(Math.random() * 1000000);
            
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${quality.width}&height=${quality.height}&seed=${seed}&nologo=true${quality.params}`;
            
            const response = await fetch(imageUrl);
            if (response.ok) {
              successfulImages.push(imageUrl);
              imageGenerated = true;
              console.log(`Image ${i + 1} generated successfully at ${quality.width}x${quality.height} (attempt ${attempts})`);
              break; // Success, no need to try lower quality
            } else {
              console.log(`Image ${i + 1} failed at ${quality.width}x${quality.height} (attempt ${attempts})`);
            }
          } catch (error) {
            console.log(`Image ${i + 1} error at ${quality.width}x${quality.height} (attempt ${attempts}):`, error);
          }
          
          // Small delay between attempts
          if (!imageGenerated && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (!imageGenerated) {
          console.log(`Trying lower quality for image ${i + 1}...`);
        }
      }
      
      if (!imageGenerated) {
        console.log(`Skipping image ${i + 1} after trying all quality levels`);
      }
    }

    // Return whatever images we successfully generated
    if (successfulImages.length > 0) {
      console.log(`Successfully generated ${successfulImages.length} ${qualityText} images`);
      return NextResponse.json({ imageUrls: successfulImages }, { status: 200 });
    } else {
      throw new Error(`Failed to generate any ${qualityText} images at any quality level`);
    }
  } catch (error) {
    console.error(`Error generating ${qualityText} images with Pollinations:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : `Failed to generate ${qualityText} images` },
      { status: 500 }
    );
  }
} 