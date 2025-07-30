"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";

interface ImageSet {
  id: string;
  prompt: string;
  images: string[];
  timestamp: number;
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [currentImageSet, setCurrentImageSet] = useState<ImageSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadingTime, setLoadingTime] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState<'low' | 'high'>('high');
  const [estimatedTime, setEstimatedTime] = useState(30);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect for loading time
  useEffect(() => {
    if (loading) {
      setLoadingTime(0);
      loadingIntervalRef.current = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    }

    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, [loading]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  // Update estimated time based on quality selection
  useEffect(() => {
    // Based on actual logs: Low quality ~15s, High quality ~30s
    setEstimatedTime(selectedQuality === 'low' ? 15 : 30);
  }, [selectedQuality]);

  const generateImages = useCallback(async (quality: 'low' | 'high' = selectedQuality) => {
    if (!prompt.trim()) {
      setError("Please enter a prompt first");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const qualityText = quality === 'high' ? 'high quality' : 'fast quality';
      
      // Choose API endpoint based on quality
      const apiEndpoint = quality === 'high' 
        ? "/api/pollinations/generate-image" 
        : "/api/huggingface/generate-image"; // Hugging Face is faster for low quality
      
      let response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          quality: quality 
        }),
      });

      let data = await response.json();

      // If primary API fails, try backup
      if (!response.ok) {
        const backupEndpoint = quality === 'high' 
          ? "/api/huggingface/generate-image"
          : "/api/pollinations/generate-image";
        
        console.log(`${quality === 'high' ? 'Pollinations' : 'Hugging Face'} failed, trying backup...`);
        response = await fetch(backupEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            prompt: prompt.trim(),
            quality: quality 
          }),
        });
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to generate ${qualityText} images`);
      }

      if (!data.imageUrls || !Array.isArray(data.imageUrls) || data.imageUrls.length === 0) {
        throw new Error(`No ${qualityText} images were successfully generated`);
      }
      
      // Create a new image set and set it as current
      const newImageSet: ImageSet = {
        id: Date.now().toString(),
        prompt: prompt.trim(),
        images: data.imageUrls,
        timestamp: Date.now(),
      };
      
      setCurrentImageSet(newImageSet);
      setPrompt(""); // Clear prompt after successful generation
      
      // Show success message if we got fewer than 4 images
      if (data.imageUrls.length < 4) {
        setError(`Generated ${data.imageUrls.length} out of 4 ${qualityText} images successfully`);
        // Clear this message after a few seconds
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      const qText = quality === 'high' ? 'high quality' : 'fast quality';
      console.error(`${qText} image generation error:`, err);
      setError(err instanceof Error ? err.message : `Failed to generate ${qText} images. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [prompt, selectedQuality]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generateImages();
    }
  }, [generateImages]);

  const openSlideshow = useCallback((index: number) => {
    setCurrentImageIndex(index);
    setShowSlideshow(true);
  }, []);

  const closeSlideshow = useCallback(() => {
    setShowSlideshow(false);
  }, []);

  const nextImage = useCallback(() => {
    if (currentImageSet) {
      setCurrentImageIndex((prev) => (prev + 1) % currentImageSet.images.length);
    }
  }, [currentImageSet]);

  const prevImage = useCallback(() => {
    if (currentImageSet) {
      setCurrentImageIndex((prev) => (prev - 1 + currentImageSet.images.length) % currentImageSet.images.length);
    }
  }, [currentImageSet]);

  const clearGallery = useCallback(() => {
    setCurrentImageSet(null);
  }, []);

  return (
    <>
      <div className="w-full max-w-3xl mx-auto p-2 h-screen flex flex-col overflow-hidden">
        {/* Ultra Compact Header */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-3 rounded-lg shadow-lg flex-shrink-0">
          <h1 className="text-xl font-bold text-center mb-2">
            AI Image Generator ✨
          </h1>
          
          {/* Quality Selection */}
          <div className="flex gap-1 mb-2 justify-center">
            <button
              onClick={() => setSelectedQuality('low')}
              className={`px-3 py-1 text-xs rounded font-semibold transition-all ${
                selectedQuality === 'low'
                  ? "bg-purple-900 text-white" 
                  : "bg-purple-300 text-purple-800 hover:bg-purple-200"
              }`}
              disabled={loading}
            >
              🚀 Fast (~15s)
            </button>
            <button
              onClick={() => setSelectedQuality('high')}
              className={`px-3 py-1 text-xs rounded font-semibold transition-all ${
                selectedQuality === 'high'
                  ? "bg-purple-900 text-white" 
                  : "bg-purple-300 text-purple-800 hover:bg-purple-200"
              }`}
              disabled={loading}
            >
              💎 High Quality (~30s)
            </button>
          </div>
          
          {/* Minimal Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (error && !error.includes("Generated")) setError("");
                }}
                onKeyDown={handleKeyPress}
                placeholder={`Describe your ${selectedQuality === 'high' ? 'high-quality' : 'fast'} image...`}
                className="w-full px-2 py-1 text-sm rounded text-black focus:outline-none"
                disabled={loading}
              />
              {error && (
                <p className={`text-xs mt-1 px-1 py-0.5 rounded ${
                  error.includes("Generated") 
                    ? "text-green-300 bg-green-900/20" 
                    : "text-red-300 bg-red-900/20"
                }`}>
                  {error.includes("Generated") ? "✅" : "⚠️"} {error}
                </p>
              )}
            </div>
            <button
              onClick={() => generateImages(selectedQuality)}
              disabled={loading || !prompt.trim()}
              className={`px-3 py-1 text-sm rounded font-semibold transition-all flex-shrink-0
                ${loading || !prompt.trim()
                  ? "bg-purple-400 cursor-not-allowed" 
                  : "bg-purple-900 hover:bg-purple-950"}`}
            >
              {loading 
                ? `Creating...` 
                : `Generate ${selectedQuality === 'high' ? 'HQ' : 'Fast'}`
              }
            </button>
            {currentImageSet && (
              <button
                onClick={clearGallery}
                className="px-2 py-1 text-sm rounded font-semibold bg-purple-700 hover:bg-purple-800 transition-all flex-shrink-0"
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>

          {/* Loading Timer */}
          {loading && (
            <div className="mt-2 flex items-center justify-center gap-2 bg-purple-900/30 rounded px-2 py-1">
              <div className="flex items-center gap-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                <span className="text-xs">⏱️</span>
              </div>
              <span className="text-xs font-mono">
                {formatTime(loadingTime)} / ~{estimatedTime}s
              </span>
              <div className="flex items-center gap-1">
                <div className="w-12 bg-purple-700 rounded-full h-1">
                  <div 
                    className="bg-white h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((loadingTime / estimatedTime) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content - Takes remaining space */}
        <div className="flex-1 mt-2 min-h-0">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-full border-2 border-dashed border-purple-300 rounded bg-purple-50/50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-purple-600 text-sm font-semibold">
                  Creating {selectedQuality === 'high' ? 'High-Quality' : 'Fast'} Images...
                </p>
                <p className="text-purple-500 text-xs mt-1">
                  {selectedQuality === 'high' ? '💎 Premium Quality' : '🚀 Speed Mode'}
                </p>
                <div className="mt-2 flex items-center justify-center gap-2 bg-purple-100 rounded px-3 py-2">
                  <span className="text-xs">⏱️</span>
                  <span className="text-purple-700 text-xs font-mono font-semibold">
                    {formatTime(loadingTime)} / ~{estimatedTime}s
                  </span>
                  <div className="w-16 bg-purple-300 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((loadingTime / estimatedTime) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ultra Compact Image Grid */}
          {currentImageSet && !loading && (
            <div className="bg-white rounded shadow-lg p-2 h-full flex flex-col">
              <div className="mb-1 flex-shrink-0">
                <h3 className="text-xs font-semibold text-gray-800 truncate">
                  "{currentImageSet.prompt}"
                </h3>
                <p className="text-xs text-gray-500">
                  {currentImageSet.images.length} image{currentImageSet.images.length !== 1 ? 's' : ''} • {selectedQuality === 'high' ? 'High Quality' : 'Fast Quality'}
                </p>
              </div>
              
              {/* Grid - Takes remaining space */}
              <div className="grid grid-cols-2 gap-1 flex-1 min-h-0">
                {currentImageSet.images.map((imageUrl, index) => (
                  <div 
                    key={index}
                    className="group relative overflow-hidden rounded shadow hover:shadow-md transition-all cursor-pointer bg-gray-100"
                    onClick={() => openSlideshow(index)}
                  >
                    <Image
                      src={imageUrl}
                      alt={`High-quality generated image ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="400px"
                      quality={95}
                      priority={index < 2}
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                        {selectedQuality === 'high' ? 'High-Quality View' : 'Fast-Quality View'}
                      </div>
                    </div>
                    <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                      {index + 1}
                    </div>
                    <div className="absolute top-1 right-1 text-white text-xs px-1 py-0.5 rounded" 
                         style={{ backgroundColor: selectedQuality === 'high' ? '#8b5cf6' : '#10b981' }}>
                      {selectedQuality === 'high' ? '💎' : '🚀'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!currentImageSet && !loading && (
            <div className="flex items-center justify-center h-full border-2 border-dashed border-gray-300 rounded">
              <div className="text-center text-gray-500">
                <p className="text-sm font-medium">
                  Ready to Create {selectedQuality === 'high' ? 'High-Quality' : 'Fast'} Images
                </p>
                <p className="text-xs">
                  {selectedQuality === 'high' ? '💎 Premium Quality (~30s)' : '🚀 Speed Mode (~15s)'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Slideshow Modal */}
      {showSlideshow && currentImageSet && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={closeSlideshow}
            className="absolute top-4 right-4 text-white text-2xl z-10 hover:text-purple-300 transition-colors"
          >
            ✕
          </button>

          {/* Image Navigation - only show if more than 1 image */}
          {currentImageSet.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl z-10 hover:text-purple-300 transition-colors"
              >
                ‹
              </button>
              
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl z-10 hover:text-purple-300 transition-colors"
              >
                ›
              </button>
            </>
          )}

          {/* Current Image */}
          <div className="relative w-full h-full max-w-5xl max-h-5xl m-8">
            <Image
              src={currentImageSet.images[currentImageIndex]}
              alt={`High-quality generated image ${currentImageIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              quality={100}
            />
          </div>

          {/* Image Info */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center bg-black/50 px-4 py-2 rounded-lg">
            <p className="text-sm mb-1">"{currentImageSet.prompt}"</p>
            <p className="text-xs opacity-80">
              {selectedQuality === 'high' ? 'High-Quality' : 'Fast-Quality'} Image {currentImageIndex + 1} of {currentImageSet.images.length} • {selectedQuality === 'high' ? '💎 Premium' : '🚀 Speed'}
            </p>
          </div>

          {/* Thumbnail Navigation - only show if more than 1 image */}
          {currentImageSet.images.length > 1 && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2">
              {currentImageSet.images.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-12 h-12 relative overflow-hidden rounded border-2 transition-all ${
                    index === currentImageIndex ? 'border-purple-400' : 'border-white/50'
                  }`}
                >
                  <Image
                    src={imageUrl}
                    alt={`High-quality thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="48px"
                    quality={90}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
} 