# Bitcoin Mining Simulator - Retro Web3 Edition

A real-time Bitcoin mining simulation with **authentic Solana Web3 integration** and Windows XP styling. Features live block production, real on-chain token burns, Solana wallet connection, and a professional mempool.space-style block explorer.

## 🎯 Features

### 🕰️ **Loading Experience**
- Authentic "Taking you back to 2009" loading screen
- Fast 2-second static loading with Windows XP styling

### ⛏️ **Real-time Mining Simulation**
- **Live Block Production**: Bitcoin-like block mining with Poisson process
- **Difficulty Retargeting**: Every 2016 blocks with realistic adjustments
- **Halving Events**: 4 halvings over 7-day seasons
- **Network Telemetry**: Live hash rate, difficulty, and block time tracking
- **WebSocket Streaming**: Real-time updates without page refresh

### 🔗 **Solana Web3 Integration**
- **Wallet Connection**: Phantom, Solflare wallet support with persistent sessions
- **Real Token Economy**: Actual $BTC SPL token deposits and withdrawals
- **On-chain Burns**: Rig purchases burn tokens on Solana blockchain
- **Custody System**: Secure custody wallets for deposits and burns
- **Live Balances**: Real-time wallet vs in-game balance tracking
- **Transaction History**: All burns and transfers recorded on-chain

### 🌐 **Frontend Dashboard (`/mining`)**
- **Live Network Status**: Height, avg block time, difficulty, next reward
- **Recent Blocks Table**: Latest 10 blocks with real-time updates
- **Wallet Integration**: Solana wallet connect (Phantom, Solflare, Backpack)
- **Inventory Tab**: View mining rigs, balances, and earnings (stubbed)
- **Shop Tab**: Browse and purchase mining equipment (stubbed)

### 📊 **Live Blocks Explorer (`/blocks`)**
- **mempool.space-style Interface**: Professional block explorer
- **Two-column Layout**: Block list + detailed block view
- **Real-time Updates**: New blocks stream to the top automatically
- **Search Functionality**: Find blocks by exact height
- **Advanced Filtering**: All blocks, orphans only, high-fee blocks
- **Infinite Scrolling**: Load older blocks on demand
- **Block Details**: Hash, timestamp, transactions, reward breakdown

### 🎨 **Authentic Windows XP Styling**
- **XP.css Framework**: Genuine Windows XP interface recreation
- **Consistent Buttons**: All buttons use authentic XP styling
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Window Controls**: Authentic minimize, maximize, close buttons
- **Mining Rig Cards**: Symmetrical layout with proper alignment

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation & Setup

1. **Clone and navigate:**
   ```bash
   cd retro-website
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

4. **Start the backend (Terminal 1):**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on `http://localhost:3001`

5. **Configure Solana (Optional for Web3 features):**
   ```bash
   cd backend
   cp env-example.txt .env
   # Edit .env with your Solana configuration
   ```

6. **Start the frontend (Terminal 2):**
   ```bash
   # From retro-website root directory
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

### 🎮 **Using the Application**

1. **Loading Screen**: Visit `http://localhost:3000`
2. **Mining Dashboard**: Automatic redirect to `/mining` after loading
3. **Live Blocks**: Click "Live Blocks" or visit `/blocks`
4. **Desktop Demo**: Visit `/desktop` for draggable windows
5. **Examples**: Visit `/examples` for component showcase

## ⚙️ Configuration

### Backend Configuration (`backend/config.ts`)

```typescript
export const config = {
  targetBlockInterval: 10,    // seconds between blocks
  halvingCount: 4,           // number of halvings in season
  seasonLength: 7,           // season length in days
  difficultyRetargetBlocks: 2016, // blocks between retargets
  maxDifficultyAdjustment: 4,     // max difficulty change (4x)
  initialDifficulty: 1000000,     // starting difficulty
  initialReward: 50,              // starting block reward
  maxBlocksInMemory: 500          // blocks kept in memory
};
```

### Environment Variables (`backend/env.example`)
Copy to `.env` and customize:
- `PORT`: Backend server port (default: 3001)
- `TARGET_BLOCK_INTERVAL`: Seconds between blocks
- `SEASON_LENGTH`: Total simulation length in days
- `HALVING_COUNT`: Number of reward halvings

## 🏗️ Architecture

### Backend (`/backend`)
- **Node.js + Express**: REST API server
- **WebSocket Server**: Real-time data streaming
- **Mining Engine**: Bitcoin simulation with Poisson process
- **TypeScript**: Full type safety

### Frontend (`/src`)
- **Next.js 15**: React framework with App Router
- **XP.css**: Authentic Windows XP styling
- **WebSocket Hooks**: Real-time data integration
- **Responsive Design**: Mobile-first approach

## 📡 API Endpoints

### REST API
- `GET /api/telemetry` - Current network statistics
- `GET /api/blocks?cursor=&limit=` - Paginated block list
- `GET /api/block/:height` - Single block details
- `GET /api/health` - Server health check

### WebSocket
- `ws://localhost:3001` - Real-time stream
- Messages: `{type: 'block'|'telemetry', data: Block|NetworkTelemetry}`

## 🧱 Block Structure

```typescript
interface Block {
  height: number;           // Block number
  timestamp: number;        // Unix timestamp
  hash: string;            // SHA256 block hash
  previousHash: string;    // Previous block hash
  difficulty: number;      // Mining difficulty
  reward: number;          // Total reward (subsidy + fees)
  txCount: number;         // Number of transactions
  totalFees: number;       // Sum of transaction fees
  isOrphan: boolean;       // Orphan block flag (2% chance)
  workTarget: string;      // Proof-of-work target
  transactions: Transaction[]; // Transaction list
}
```

## 🎮 Mining Simulation Details

### **Block Production**
- **Poisson Process**: Realistic random block timing
- **Target Interval**: 10 seconds (configurable)
- **Orphan Rate**: 2% chance for orphan blocks

### **Difficulty Adjustment**
- **Frequency**: Every 2016 blocks
- **Algorithm**: Actual vs expected time ratio
- **Limits**: Maximum 4x adjustment per retarget

### **Halving Schedule**
- **4 Halvings**: Over 7-day season
- **Reward Reduction**: 50 → 25 → 12.5 → 6.25 → 3.125 BTC
- **Dynamic Calculation**: Based on block height

### **Network Metrics**
- **Hash Rate**: Simulated network hash rate
- **Block Time EMA**: Exponential moving average
- **Telemetry**: Updated every second via WebSocket

## 🎨 UI Components

### **Mining Dashboard**
- Live network status bar
- Recent blocks table with real-time updates
- Wallet connection interface
- Inventory and shop tabs (stubbed for future expansion)

### **Live Blocks Explorer**
- **Block List**: Infinite scrolling with real-time updates
- **Block Details**: Complete block information panel
- **Search**: Find blocks by exact height
- **Filters**: All, orphans only, high-fee blocks
- **Auto-scroll**: Toggle for following new blocks

## 🎨 Design System

### **Spacing Scale** (`src/styles/blocks.module.css`)
```css
--spacing-xs: 4px   /* Tight spacing */
--spacing-sm: 8px   /* Small gaps */
--spacing-md: 12px  /* Medium spacing */
--spacing-lg: 16px  /* Large spacing */
```

### **Typography Hierarchy**
```css
--font-title: 20px     /* Page titles */
--font-section: 16px   /* Section headers */
--font-primary: 15px   /* List item primary text */
--font-meta: 12px      /* Meta information */
--line-height-list: 1.4 /* List item line height */
```

### **Layout Proportions**
```css
--col-left-width: 42%   /* Block list column */
--col-right-width: 58%  /* Block details column */
```

### **Customizing Design Tokens**
To adjust spacing and typography, edit the CSS variables in `src/styles/blocks.module.css`:

1. **Spacing**: Modify `--spacing-*` variables for consistent spacing
2. **Typography**: Adjust `--font-*` variables for text sizes
3. **Layout**: Change `--col-*-width` for column proportions
4. **Colors**: Use XP.css color variables for consistency

## 🔧 Development

### **Available Scripts**

**Frontend:**
```bash
npm run dev    # Development server
npm run build  # Production build
npm run start  # Production server
```

**Backend:**
```bash
npm run dev    # Development with nodemon
npm run build  # TypeScript compilation
npm run start  # Production server
```

### **Project Structure**
```
retro-website/
├── backend/                 # Mining simulation backend
│   ├── config.ts           # Mining configuration
│   ├── mining-engine.ts    # Core simulation logic
│   ├── server.ts           # Express + WebSocket server
│   ├── types.ts            # TypeScript interfaces
│   └── package.json        # Backend dependencies
├── src/
│   ├── app/
│   │   ├── blocks/page.tsx # Live blocks explorer
│   │   ├── mining/page.tsx # Mining dashboard
│   │   └── page.tsx        # Loading screen
│   ├── components/         # React components
│   ├── hooks/
│   │   └── useMiningData.ts # WebSocket hooks
│   └── globals.css         # XP.css + custom styles
└── package.json            # Frontend dependencies
```

## 🌟 Key Features

### **Real-time Data Flow**
1. Backend mines blocks using Poisson process
2. WebSocket broadcasts new blocks and telemetry
3. Frontend receives updates and updates UI instantly
4. No manual refresh required

### **Authentic XP Experience**
- Genuine Windows XP window controls
- Consistent button styling throughout
- Proper padding and alignment
- Responsive design maintaining XP aesthetics

### **Professional Block Explorer**
- mempool.space-inspired interface
- Real-time block streaming
- Advanced search and filtering
- Detailed block information
- Mobile-responsive design

## 🎯 Performance

- **Backend**: Handles 500 blocks in memory, older blocks via pagination
- **Frontend**: Efficient WebSocket reconnection, 50 recent blocks cached
- **Real-time**: 1-second tick rate with smooth UI updates
- **Responsive**: Optimized for mobile and desktop

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request

## 📄 License

MIT License - Feel free to use for educational and commercial projects.

---

**Experience the golden age of Bitcoin mining with authentic Windows XP nostalgia! 🖥️⛏️✨**
**Built with ❤️ and nostalgia for the golden age of computing! 🖥️✨**