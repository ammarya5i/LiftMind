# LiftMind — AI Gym Coach

![LiftMind Logo](https://img.shields.io/badge/LiftMind-AI%20Gym%20Coach-f43f5e)

LiftMind is a smart, AI-driven fitness coach web app that provides personalized coaching for **all types of gym training** (Powerlifting, Bodybuilding, CrossFit, Calisthenics, General Strength, Endurance, and Functional Fitness). The system acts as an **interactive AI coaching assistant**, helping users generate personalized programs, record workouts, analyze performance, and chat with their AI coach. Features dynamic UI that adapts to your training style with type-specific metrics and progress tracking.

---

## 🌟 Features

- 🤖 **AI-Powered Coaching** - Chat with your personal AI fitness coach
- 📊 **Progress Analytics** - Track volume, PRs, and strength progression across all exercises
- 📅 **Workout Management** - View and track today's workout with detailed sets/reps
- ⚙️ **Customizable Settings** - Set goals, experience level, and training preferences
- 🎨 **Beautiful UI** - Modern, responsive design with smooth animations
- 🔒 **Secure Authentication** - Powered by Supabase Auth
- 💪 **All Training Styles** - Supports Powerlifting, Bodybuilding, CrossFit, Calisthenics, General Strength, Endurance, and Functional Fitness
- 🎯 **Dynamic UI** - Metrics and progress tracking adapt to your selected training type
- 📈 **Smart Analytics** - Universal metrics plus type-specific insights and charts

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Lucide React** - Icons

### Backend
- **Supabase** - Authentication & Database
- **DeepSeek API** - AI reasoning (via Next.js API routes)
- **Rate Limiting** - Upstash Redis for API protection

### Deployment
- **Netlify** - Frontend hosting (currently deployed)
- **Vercel** - Alternative frontend hosting option
- **Supabase Cloud** - Database & auth
- **Upstash Redis** - Rate limiting (optional, for production)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- DeepSeek API key (for AI chat)
- (Optional) Upstash Redis account for rate limiting

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <your-repo-url>
   cd LiftMind
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local`:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Fill in your credentials:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   DEEPSEEK_API_KEY=your_deepseek_api_key
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url (optional)
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token (optional)
   \`\`\`

4. **Set up Supabase Database**
   
   Run the SQL commands from `supabase-schema.sql` in your Supabase SQL editor to create the necessary tables.

5. **Configure Rate Limiting (Optional)**
   
   - Sign up for Upstash Redis (free tier available)
   - Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.local`
   - If not configured, rate limiting will be disabled (not recommended for production)

6. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

\`\`\`
LiftMind/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Dashboard page
│   ├── coach/             # AI Coach chat page
│   ├── progress/          # Progress analytics page
│   ├── settings/          # Settings page
│   ├── login/             # Authentication page
│   ├── layout.tsx         # Root layout with navigation
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── Navigation.tsx     # App navigation
│   └── AuthProvider.tsx   # Auth context provider
├── lib/                   # Utility libraries
│   ├── supabase.ts        # Supabase client & helpers
│   └── n8n.ts             # n8n webhook integration
├── types/                 # TypeScript types
│   └── database.types.ts  # Database schema types
└── public/                # Static assets
\`\`\`

---

## 🗄️ Database Schema

### Tables

#### `users`
Stores user profile and preferences
- `id` (uuid, PK)
- `phone` (text)
- `name` (text)
- `email` (text)
- `preferences` (jsonb)
- `conversation_history` (text)
- `created_at` (timestamp)

#### `workouts`
Stores workout sessions
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `date` (date)
- `lifts` (jsonb)
- `notes` (text)
- `created_at` (timestamp)

#### `sessions`
Stores coach interaction logs
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `summary` (text)
- `data` (jsonb)
- `created_at` (timestamp)

#### `programs`
Stores training programs
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `name` (text)
- `description` (text)
- `plan` (jsonb)
- `created_at` (timestamp)

See `supabase-schema.sql` for the complete SQL schema.

---

## 🔁 Data Flow

1. User sends a message → Frontend calls Next.js API route (`/api/ai-chat`)
2. API Route:
   - Validates input and checks rate limits
   - Fetches user context from Supabase
   - Builds AI prompt with user history and training type
   - Sends to DeepSeek API → receives AI response
   - Updates conversation history in Supabase
   - Returns response to frontend
3. Frontend displays response in chat UI
4. Dashboard and Progress pages read live data from Supabase with dynamic metrics based on training type

---

## 🎨 Design System

### Colors
- **Primary**: `#f43f5e` (rose) - Main brand color
- **Accent**: `#6366f1` (indigo) - Secondary actions
- **Background**: `#f8fafc` (slate-50) - Page background

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300-800

### Components
- **Cards**: `rounded-2xl` with soft shadows
- **Buttons**: Rounded with gradient hover effects
- **Glassmorphism**: Used for overlay effects

---

## 📱 Features Breakdown

### Dashboard (`/`)
- Welcome message with user's name
- Quick stats (streak, volume, workouts completed)
- Today's workout with set completion tracking
- Recent AI coach insights
- Quick action buttons

### Coach Chat (`/coach`)
- Real-time chat interface with AI fitness coach
- Personalized responses based on training type
- Message history with timestamps
- Typing indicators
- Beautiful message bubbles with animations

### Progress Analytics (`/progress`)
- Dynamic metrics based on training type
- Universal metrics: total workouts, volume, consistency
- Type-specific highlights (e.g., powerlifting PRs, bodybuilding volume, CrossFit WODs)
- Volume over time (bar chart)
- Strength progression (line chart)
- Uses Epley formula for 1RM estimation

### Settings (`/settings`)
- Personal information (name, email, phone)
- Training type selection (Powerlifting, Bodybuilding, CrossFit, Calisthenics, General, Endurance, Functional)
- Training preferences (goal, experience, units, focus area)
- Account management options

---

## 🔐 Authentication

Authentication is handled by Supabase Auth. Users can:
- Sign up with email/password
- Sign in with existing credentials
- Password reset (via Supabase)

---

## 🚢 Deployment

### Frontend (Netlify - Current Setup)

The project is configured for Netlify deployment with `netlify.toml`.

1. **Connect GitHub repository** to Netlify
2. **Add environment variables** in Netlify dashboard
3. **Deploy automatically** on every push to `main` branch

**Production URL**: `https://liftmind.netlify.app`

### Alternative: Deploy to Vercel

\`\`\`bash
npm run build
vercel deploy
\`\`\`

Vercel automatically detects Next.js and configures build settings.

### Database (Supabase)
- Already cloud-hosted
- Run migrations via Supabase dashboard
- Configure redirect URLs for authentication (see `DEPLOYMENT.md`)

### Environment Variables
- Ensure all required environment variables are set in your deployment platform
- Rate limiting requires Upstash Redis credentials (optional but recommended)
- See `ENVIRONMENT_SETUP.md` for complete list

For detailed deployment instructions, see `DEPLOYMENT.md`.

---

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. Create component in `components/` or page in `app/`
2. Add types to `types/database.types.ts` if needed
3. Add helper functions to `lib/supabase.ts`
4. Update n8n workflow if AI integration needed

---

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## 📧 Support

For questions or issues, please open a GitHub issue or contact the maintainers.

---

**Built with 💪 by the LiftMind team**

