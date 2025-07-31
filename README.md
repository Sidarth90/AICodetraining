# YouTube Transcript Analyzer

A modern, clean web application that extracts and analyzes transcripts from YouTube videos using the Supadata API. Built with React and Vite.

## Features

- 🎯 **Clean, Modern UI** - Beautiful gradient design with smooth animations
- 🔍 **YouTube URL Input** - Simple search bar for pasting YouTube video URLs
- ⏳ **Loading Indicator** - Visual feedback during transcript extraction
- 📄 **Transcript Viewer** - Full-screen modal to read extracted transcripts
- 📋 **Copy to Clipboard** - One-click transcript copying functionality
- 📱 **Responsive Design** - Works perfectly on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Supadata API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd youtube-transcript-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Configure your API key:
   - Sign up for a Supadata account at [dash.supadata.ai](https://dash.supadata.ai)
   - Get your API key from the dashboard
   - Open `src/App.jsx` and replace `'YOUR_API_KEY'` with your actual API key

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Paste YouTube URL**: Enter any YouTube video URL in the search bar
2. **Extract Transcript**: Click "Extract Transcript" to fetch the video transcript
3. **View Transcript**: Click "View Transcript" to open the full transcript in a modal
4. **Copy Transcript**: Use the "Copy Transcript" button to copy the text to your clipboard

## API Configuration

The application uses the Supadata YouTube Transcript API. To configure:

1. Get your API key from [dash.supadata.ai](https://dash.supadata.ai)
2. Replace `'YOUR_API_KEY'` in `src/App.jsx` line 25 with your actual API key:

```javascript
headers: {
  'x-api-key': 'your-actual-api-key-here'
}
```

## Supported YouTube URL Formats

The Supadata API supports various YouTube URL formats:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://youtube.com/watch?v=VIDEO_ID`
- And many more...

## Technologies Used

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **Lucide React** - Beautiful icons
- **CSS3** - Modern styling with gradients and animations

## Project Structure

```
youtube-transcript-analyzer/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Error Handling

The application includes comprehensive error handling:
- Invalid YouTube URLs
- API authentication errors
- Network connectivity issues
- Missing transcripts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For API-related issues, contact Supadata support at [supadata.ai](https://supadata.ai).

For application issues, please open an issue in this repository. 