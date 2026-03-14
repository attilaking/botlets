# 🤖 Botlets.io

**Autonomous AI bots living in a 3D voxel pub — watch them work, chat, and interact!**

Botlets.io is a fun, interactive 3D simulation where AI-driven characters (botlets) autonomously go about their daily routines inside a virtual pub and its surroundings. Each bot has a unique personality, role, and set of behaviors. They walk around, perform tasks, greet each other, and stop for a chat when they meet.

## ✨ Features

- **Autonomous Bots** — Each botlet has its own personality, role, and routine. They move around independently, performing tasks like bartending, DJing, bouncing, cleaning, and patrolling.
- **Bot Encounters** — When two bots get close, they stop, face each other, and have a conversation with speech bubble indicators.
- **Interactive 3D World** — A fully realized pub environment with a bar, dance floor, stage, slot machines, pool table, kitchen, toilets, and an outdoor garden area with a fountain, pond, and motorbike parking.
- **Click to Interact** — Click on any bot to see their profile, thoughts, and current activity.
- **AI-Powered Conversations** — Bots generate contextual conversations using AI when they meet.
- **Diverse Cast** — Bartenders, bouncers, DJs, waitresses, greeters, cleaners, police officers, and regular patrons — each with unique looks and behaviors.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite 5 |
| **3D Rendering** | Three.js + @react-three/fiber + @react-three/drei |
| **State Management** | Zustand |
| **AI Backend** | Node.js + Express + Anthropic Claude API |
| **Real-time** | Socket.IO |
| **Deployment** | Vercel |

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- An **Anthropic API key** (for AI conversations)

### Installation

```bash
# Clone the repo
git clone https://github.com/attilaking/botlets.git
cd botlets

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

### Running Locally

```bash
# Start the dev server (frontend + backend)
npm start

# Or run them separately:
npm run dev       # Vite dev server (port 5173)
npm run server    # Express API server (port 3001)
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🤖 Meet the Botlets

| Bot | Role | Personality |
|-----|------|-------------|
| 🍺 **Mike** | Bartender | Head bartender, knows every cocktail, tells great jokes |
| 💪 **Tony** | Bouncer | Big and intimidating but surprisingly philosophical |
| 🎧 **Luna** | DJ | Reads the crowd perfectly, lives behind the decks |
| 🍸 **Jenny** | Waitress | Fast, charming, never spills a drop |
| 🎰 **Dave** | Slots Regular | "One more spin!" — always optimistic |
| 📺 **Sarah** | Sports Fan | Gets loud during goals, trivia champion |
| 🕺 **Rico** | Dancer | Never misses a beat, incredibly charismatic |
| 🍻 **Old Pete** | Regular | 30 years of stories, everyone loves him |
| 👋 **Gina** | Greeter | Welcomes everyone with a smile |
| 🤝 **Marco** | Greeter | Smooth-talker, ex-salesman, hands out flyers |
| 🧹 **Brenda** | Cleaner | Takes pride in keeping the place spotless |
| 👮 **Officer Dan** | Policeman | Friendly but firm, patrols the area |

## 🗂️ Project Structure

```
botlets/
├── src/
│   ├── ai/              # Bot AI — MissionEngine, BotBrain
│   ├── bots/            # Bot rendering — BotManager
│   ├── stores/          # Zustand stores — botStore, worldStore
│   ├── utils/           # Constants, bot definitions, locations
│   ├── world/           # 3D world — ChunkManager (pub, furniture, outdoors)
│   ├── App.jsx          # Main app component
│   └── index.css        # Styles
├── server/
│   └── index.js         # Express API + Socket.IO server
├── scripts/
│   └── fix-exports.mjs  # Build-time fix for broken npm packages
├── vite.config.js       # Vite config with custom resolver plugin
└── package.json
```

## 🤝 Contributing

This is a fun side project and contributions are welcome! Whether it's:

- 🆕 **New bot personalities** — Add your own characters
- 🏠 **World building** — Add new rooms, furniture, or outdoor areas
- 🧠 **Smarter AI** — Improve bot pathfinding or conversation logic
- 🎨 **Visual polish** — Animations, effects, or UI improvements
- 🐛 **Bug fixes** — Found a bot stuck in a wall? Fix it!

### How to contribute

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-bot`)
3. Make your changes
4. Test locally with `npm start`
5. Open a PR

## 📄 License

MIT — do whatever you want with it. Have fun! 🎉
