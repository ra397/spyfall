# Spyfall

A real-time multiplayer implementation of the social deduction game [Spyfall](https://en.wikipedia.org/wiki/Spyfall_(card_game)). Built with vanilla JavaScript and Firebase.

**[Play Now](https://spyfall-3af5b.web.app)**

## Overview

Spyfall is a game where players are assigned roles at a specific location, except for one player who is the "Spy". The Spy must figure out the location through conversation while other players try to identify the Spy.


## Features

- 28 unique locations with 7 occupations each (196 total roles)
- 3-10 player support with configurable round duration (5-10 minutes)
- Real-time synchronization across all players
- Session persistence (survives page refresh)
- Multi-round sessions with persistent lobbies
- Owner controls for game management

## Tech Stack

**Frontend**
- Vanilla JavaScript (ES6+)
- Web Components (Custom Elements + Shadow DOM)
- Vite

**Backend**
- Firebase Firestore (real-time database)
- Firebase Hosting
- Serverless architecture

## Installation

```bash
# Clone and install
git clone <repository-url>
cd spyfall
npm install

# Development
npm run dev

# Production build
npm run build

# Deploy to Firebase
npm run build
firebase deploy
```

## How to Play

1. One player creates a game and shares the 4-character code
2. Others join using the code
3. Owner starts round (3-10 players required)
4. Non-spies get location + occupation, Spy gets neither
5. Players ask questions to identify the Spy or figure out the location
6. Round ends when timer expires or owner ends it
---
