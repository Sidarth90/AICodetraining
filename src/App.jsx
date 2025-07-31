import React, { useState } from 'react';
import { Copy, X, Check, Brain, Sparkles, AlertCircle, Clock, Search, Youtube, FileText } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState('transcript'); // 'transcript' or 'youtube-search'
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // YouTube Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState('');

  // API Keys
  const SUPADATA_API_KEY = 'sd_3971646d5c59d2f2abd78ef34a3d283d';
  const DEEPSEEK_API_KEY = 'sk-113b9705c06a483a9423aad8fb346d2d';
  const SERP_API_KEY = 'd03e83b7ec4b6a30c535ed425a6c8c64e886a6fe239e1868fe8ca3732c0b2384';

  // DeepSeek API configuration
  const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
  const DEEPSEEK_MODEL = 'deepseek-chat';

  // Function to truncate text to fit context window (approximately 32k tokens)
  const truncateForContext = (text, maxChars = 120000) => {
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars) + '\n\n[Content truncated due to length...]';
  };

  // Function to delay execution
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Function to analyze transcript with DeepSeek with retry logic
  const analyzeTranscript = async (transcriptText) => {
    setAnalyzing(true);
    setError('');

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const truncatedText = truncateForContext(transcriptText);
        
        const analysisPrompt = `You are an expert content analyst. Analyze this YouTube video transcript and provide insights in the following format:

## 📊 Content Analysis

**Main Topics Covered:**
[List the main topics and themes discussed]

**Key Points:**
[Extract the most important points and insights]

**Content Structure:**
[Describe how the content is organized - intro, main sections, conclusion, etc.]

**Target Audience:**
[Who would benefit most from this content?]

**Engagement Factors:**
[What makes this content engaging or valuable?]

**Actionable Insights:**
[What can viewers/creators learn or apply from this content?]

## 🎯 Content Optimization Suggestions

**SEO Opportunities:**
[Keywords and topics that could improve discoverability]

**Content Gaps:**
[What related topics could be covered in follow-up content?]

**Engagement Improvements:**
[How could this content be made more engaging?]

Please provide a comprehensive analysis that would be valuable for content creators and viewers.`;

        const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: DEEPSEEK_MODEL,
            messages: [
              {
                role: 'system',
                content: 'You are an expert content analyst specializing in YouTube video analysis and content optimization.'
              },
              {
                role: 'user',
                content: `${analysisPrompt}\n\nTranscript:\n${truncatedText}`
              }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            stream: false
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 429) {
            // Rate limit hit - implement exponential backoff
            const waitTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            retryCount++;
            
            if (retryCount < maxRetries) {
              setError(`Rate limit hit. Retrying in ${waitTime/1000} seconds... (Attempt ${retryCount}/${maxRetries})`);
              await delay(waitTime);
              continue;
            } else {
              throw new Error('Rate limit exceeded. Please wait a few minutes before trying again.');
            }
          } else if (response.status === 402) {
            throw new Error('Insufficient balance in your DeepSeek account. Please add credits to continue using AI analysis.');
          } else if (response.status === 401) {
            throw new Error('Invalid DeepSeek API key. Please check your API key.');
          } else if (response.status === 400) {
            throw new Error(`DeepSeek API Error: ${errorData.error?.message || 'Invalid request'}`);
          } else {
            throw new Error(`DeepSeek API Error: ${errorData.error?.message || response.statusText}`);
          }
        }

        const data = await response.json();
        const analysisResult = data.choices[0].message.content;
        setAnalysis(analysisResult);
        setError(''); // Clear any previous error messages
        break; // Success - exit retry loop

      } catch (err) {
        retryCount++;
        
        if (retryCount >= maxRetries) {
          setError(`Analysis failed after ${maxRetries} attempts: ${err.message}`);
          console.error('Error analyzing transcript:', err);
        } else {
          // Continue retrying
          continue;
        }
      }
    }
    
    setAnalyzing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setTranscript(null);
    setAnalysis(null);

    try {
      const response = await fetch(`https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(url)}&text=true`, {
        headers: {
          'x-api-key': SUPADATA_API_KEY
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Supadata API key.');
        } else if (response.status === 404) {
          throw new Error('Transcript not found for this video. The video might not have captions.');
        } else {
          throw new Error(`API Error: ${errorData.message || response.statusText}`);
        }
      }

      const data = await response.json();
      setTranscript(data);
      
      // Automatically analyze the transcript
      if (data.content) {
        await analyzeTranscript(data.content);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch transcript. Please check your API key and try again.');
      console.error('Error fetching transcript:', err);
    } finally {
      setLoading(false);
    }
  };

  // YouTube Search functionality - COMPLETELY REWRITTEN
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError('');
    setSearchResults(null);

    try {
      const response = await fetch(`http://localhost:3002/api/youtube-search?query=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`SERP API Error: ${data.error}`);
      }

      // Validate and clean the data structure
      const videoResults = data.video_results || data.videos || [];
      
      if (!Array.isArray(videoResults)) {
        throw new Error('Invalid response format: expected array of videos');
      }

             // Clean and validate each video object
       const cleanedVideos = videoResults
         .filter(video => video && typeof video === 'object')
         .map(video => {
           // Debug: Log the original video object to see what we're getting
           console.log('Original video object:', video);
           
           // Extract video ID from YouTube link
           const videoId = video.link ? video.link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1] : null;
           
           // Generate thumbnail URL with fallback options
           let thumbnailUrl = '';
           if (video.thumbnail || video.thumbnail_url || video.thumbnail_url_medium || video.thumbnail_url_high || video.thumbnail_url_default) {
             thumbnailUrl = video.thumbnail || video.thumbnail_url || video.thumbnail_url_medium || video.thumbnail_url_high || video.thumbnail_url_default;
           } else if (videoId) {
             thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
           }
           
           // Debug: Log thumbnail information
           console.log('Video:', video.name);
           console.log('Video ID:', videoId);
           console.log('Original thumbnail:', video.thumbnail);
           console.log('Generated thumbnail URL:', thumbnailUrl);
           
           return {
             name: String(video.name || video.title || 'Untitled Video'),
             link: String(video.link || ''),
             thumbnail: String(thumbnailUrl),
             videoId: videoId, // Store video ID for fallback thumbnails
             channel: String(video.channel || video.author || 'Unknown Channel'),
             views: video.views || 'N/A',
             date: video.date || 'N/A',
             duration: video.duration || 'N/A',
             description: String(video.description || video.snippet || 'No description available')
           };
         })
         .filter(video => video.link); // Only require link, not thumbnail

      setSearchResults({
        videos: cleanedVideos,
        query: searchQuery
      });

    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('CORS')) {
        setSearchError('Connection Error: Make sure the proxy server is running. Run "npm run dev:full" to start both frontend and backend.');
      } else {
        setSearchError(err.message || 'Failed to search YouTube. Please try again.');
      }
      console.error('Error searching YouTube:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCopyTranscript = async () => {
    if (transcript?.content) {
      try {
        await navigator.clipboard.writeText(transcript.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy transcript:', err);
      }
    }
  };

  const handleCopyAnalysis = async () => {
    if (analysis) {
      try {
        await navigator.clipboard.writeText(analysis);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy analysis:', err);
      }
    }
  };

  const handleViewTranscript = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const formatViews = (views) => {
    if (!views || views === 'N/A') return 'N/A';
    
    const viewsStr = String(views);
    const cleanViews = viewsStr.replace(/[^\d,]/g, '');
    
    if (!cleanViews) return 'N/A';
    
    const num = parseInt(cleanViews.replace(/,/g, ''));
    
    if (isNaN(num)) return 'N/A';
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // SIMPLE SEARCH RESULTS RENDERER
  const renderSearchResults = () => {
    if (!searchResults || !searchResults.videos) {
      return null;
    }

    const { videos, query } = searchResults;

    if (videos.length === 0) {
      return (
        <div className="no-results">
          <h2 className="results-title">No Results Found</h2>
          <p>No videos found for "{query}". Try a different search term.</p>
        </div>
      );
    }

    return (
      <div className="search-results">
        <h2 className="results-title">
          Found {videos.length} videos for "{query}"
        </h2>
        <div className="video-grid">
          {videos.map((video, index) => (
            <div key={index} className="video-card">
              <div className="video-thumbnail">
                                 <img 
                   src={video.thumbnail || (video.videoId ? `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg` : '')} 
                   alt={video.name}
                   onLoad={() => console.log('Thumbnail loaded successfully:', video.name)}
                   onError={(e) => {
                     console.log('Thumbnail failed to load for:', video.name);
                     console.log('Failed URL:', e.target.src);
                     console.log('Video ID:', video.videoId);
                     // Try fallback thumbnail
                     if (video.videoId && e.target.src !== `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`) {
                       console.log('Trying hqdefault fallback...');
                       e.target.src = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
                     } else if (video.videoId && e.target.src !== `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`) {
                       console.log('Trying mqdefault fallback...');
                       e.target.src = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
                     } else {
                       console.log('All thumbnail attempts failed, showing placeholder');
                       e.target.style.display = 'none';
                       e.target.nextSibling.style.display = 'flex';
                     }
                   }}
                 />
                 <div className="placeholder-thumbnail" style={{ display: 'none' }}>
                   <div className="placeholder-text">No Thumbnail</div>
                 </div>
                <div className="video-duration">
                  {video.duration}
                </div>
              </div>
              <div className="video-info">
                <h3 className="video-title">{video.name}</h3>
                <div className="video-meta">
                  <span className="video-channel">{video.channel}</span>
                  <span className="video-views">{formatViews(video.views)} views</span>
                  <span className="video-date">{video.date}</span>
                </div>
                <p className="video-description">{video.description}</p>
                <a 
                  href={video.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="video-link"
                >
                  Watch on YouTube
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      {/* Navigation Header */}
      <nav className="nav-header">
        <div className="nav-container">
          <h1 className="nav-title">CreatorTube</h1>
          <div className="nav-buttons">
            <button
              onClick={() => setCurrentPage('transcript')}
              className={`nav-button ${currentPage === 'transcript' ? 'active' : ''}`}
            >
              <FileText size={16} />
              Transcript Analyzer
            </button>
            <button
              onClick={() => setCurrentPage('youtube-search')}
              className={`nav-button ${currentPage === 'youtube-search' ? 'active' : ''}`}
            >
              <Youtube size={16} />
              YouTube Search
            </button>
          </div>
        </div>
      </nav>

      {/* Transcript Analyzer Page */}
      {currentPage === 'transcript' && (
        <div className="container">
          <div className="search-container">
            <h1 className="title">YouTube Transcript Analyzer</h1>
            <p className="subtitle">
              Extract and analyze transcripts from any YouTube video using AI-powered insights
            </p>

            <form onSubmit={handleSubmit} className="search-form">
              <div className="input-group">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube video URL here..."
                  className="search-input"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="search-button"
                disabled={loading || !url.trim()}
              >
                {loading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    Extracting transcript...
                  </div>
                ) : (
                  'Extract & Analyze'
                )}
              </button>
            </form>

            {error && (
              <div className="error-message">
                <div className="error-header">
                  <AlertCircle size={16} />
                  <strong>Error</strong>
                </div>
                <p>{error}</p>
                {error.includes('Rate limit') && (
                  <div className="error-help">
                    <p><strong>Rate Limit Tips:</strong></p>
                    <ul>
                      <li>Wait 1-2 minutes before trying again</li>
                      <li>Try with a shorter video transcript</li>
                      <li>Check your DeepSeek usage limits</li>
                    </ul>
                  </div>
                )}
                {error.includes('Insufficient balance') && (
                  <div className="error-help">
                    <p><strong>To fix this:</strong></p>
                    <ol>
                      <li>Visit <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer">DeepSeek Platform</a></li>
                      <li>Add credits to your account</li>
                      <li>Try the analysis again</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {transcript && (
              <div className="success-message">
                <p>✅ Transcript extracted successfully!</p>
                <div className="action-buttons">
                  <button
                    onClick={handleViewTranscript}
                    className="view-transcript-btn"
                  >
                    View Transcript
                  </button>
                  {analysis && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="view-analysis-btn"
                    >
                      <Sparkles size={16} />
                      View AI Analysis
                    </button>
                  )}
                </div>
              </div>
            )}

            {analyzing && (
              <div className="analyzing-message">
                <div className="loading">
                  <div className="spinner"></div>
                  <Brain size={16} />
                  Analyzing transcript with AI...
                </div>
              </div>
            )}
          </div>

          {showModal && (transcript || analysis) && (
            <div className="modal-overlay" onClick={closeModal}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">
                    {analysis ? 'AI Analysis & Transcript' : 'Video Transcript'}
                  </h2>
                  <button onClick={closeModal} className="close-button">
                    <X size={24} />
                  </button>
                </div>
                <div className="modal-content">
                  {analysis && (
                    <div className="analysis-section">
                      <h3 className="section-title">
                        <Sparkles size={16} />
                        AI Analysis
                      </h3>
                      <div className="analysis-text">
                        {analysis}
                      </div>
                    </div>
                  )}
                  
                  {transcript && (
                    <div className="transcript-section">
                      <h3 className="section-title">
                        <Copy size={16} />
                        Video Transcript
                      </h3>
                      <div className="transcript-text">
                        {transcript.content}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-actions">
                  {analysis && (
                    <button
                      onClick={handleCopyAnalysis}
                      className="copy-button"
                    >
                      {copied ? (
                        <>
                          <Check size={16} />
                          Copied Analysis!
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Copy Analysis
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleCopyTranscript}
                    className="copy-button"
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        Copied Transcript!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy Transcript
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* YouTube Search Page - COMPLETELY REWRITTEN */}
      {currentPage === 'youtube-search' && (
        <div className="container">
          <div className="search-container">
            <h1 className="title">YouTube Search</h1>
            <p className="subtitle">
              Search YouTube videos and discover trending content with detailed analytics
            </p>

            <form onSubmit={handleSearchSubmit} className="search-form">
              <div className="input-group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for YouTube videos..."
                  className="search-input"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="search-button"
                disabled={searchLoading || !searchQuery.trim()}
              >
                {searchLoading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    Searching...
                  </div>
                ) : (
                  <>
                    <Search size={16} />
                    Search Videos
                  </>
                )}
              </button>
            </form>

            {searchError && (
              <div className="error-message">
                <div className="error-header">
                  <AlertCircle size={16} />
                  <strong>Error</strong>
                </div>
                <p>{searchError}</p>
              </div>
            )}

            {renderSearchResults()}
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 