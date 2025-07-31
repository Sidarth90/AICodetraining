const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3002;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running correctly!' });
});

// Proxy endpoint for SERP API
app.get('/api/youtube-search', async (req, res) => {
  try {
    const { query } = req.query;
    const apiKey = 'd03e83b7ec4b6a30c535ed425a6c8c64e886a6fe239e1868fe8ca3732c0b2384';
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const serpUrl = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(query)}&api_key=${apiKey}&num=20`;
    
    const response = await fetch(serpUrl);
    
    // Debug: Log the SERP API response status and headers
    console.log('SERP API Response Status:', response.status);
    console.log('SERP API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('SERP API Error:', response.status, response.statusText);
      return res.status(500).json({ error: `SERP API Error: ${response.status} ${response.statusText}` });
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse SERP API JSON response:', jsonError);
      return res.status(500).json({ error: 'Invalid JSON response from SERP API' });
    }

    if (data.error) {
      return res.status(400).json({ error: data.error });
    }

    // Debug logging
    console.log('SERP API Response structure:', {
      hasVideoResults: !!data.video_results,
      hasVideos: !!data.videos,
      videoResultsType: typeof data.video_results,
      videosType: typeof data.videos,
      keys: Object.keys(data)
    });

    // Log the first few video results to see the structure
    if (data.video_results && Array.isArray(data.video_results)) {
      console.log('First video result:', JSON.stringify(data.video_results[0], null, 2));
      console.log('Video results count:', data.video_results.length);
      console.log('All video results keys:', Object.keys(data.video_results[0] || {}));
    } else {
      console.log('Video results structure:', typeof data.video_results);
      console.log('Video results:', data.video_results);
    }

    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
}); 