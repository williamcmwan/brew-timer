# Coffee Brew Timer

A simple, focused coffee brewing timer application that helps you brew perfect coffee every time.

## Features

- **Recipe Management**: Create and manage your favorite coffee brewing recipes
- **Step-by-Step Timer**: Guided brewing with timed steps and audio cues
- **Local Storage**: All recipes stored locally in your browser - no login required
- **Mobile Friendly**: Optimized for mobile devices and touch interfaces
- **Audio Feedback**: Sound notifications for step transitions and countdown alerts

## Getting Started

1. **Add Recipes**: Click the settings icon on the dashboard to manage your brewing recipes
2. **Start Brewing**: Select a recipe from the dashboard to start the timer
3. **Follow Steps**: The timer will guide you through each brewing step with audio cues
4. **Customize**: Edit recipes to match your preferred brewing methods

## Default Recipes

The app comes with three pre-loaded recipes:
- **V60 Pour Over**: Classic pour-over method with bloom and multiple pours
- **Chemex Classic**: Chemex brewing with structured timing
- **French Press**: Simple immersion brewing method

## Recipe Structure

Each recipe includes:
- Name and brewing method
- Coffee dose and water ratio
- Grind size recommendation
- Water temperature
- Step-by-step process with timing
- Target yield

## Development

### Client (Frontend)
```bash
cd client
npm install
npm run dev
```

### Server (Backend - Optional)
The simplified timer app works entirely in the browser with local storage. The server is not required for basic functionality.

```bash
cd server
npm install
npm run dev
```

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Storage**: Browser localStorage
- **Audio**: Web Audio API for timer sounds

## Simplified Architecture

This version focuses solely on the timer functionality:
- No user authentication required
- No complex equipment management
- No brew logging or analytics
- No server dependency for basic features
- Recipes stored locally in browser

Perfect for coffee enthusiasts who want a simple, reliable brewing timer without the complexity of a full brew journal system.