# MealKey - School Dining Hall Management System 🍽️

A comprehensive school cafeteria management system built for a Hackathon with Hebrew UI and RTL support.

## Features

### 🔐 Parent Interface (`/parent`)
- Email authentication (login/signup)
- View child's meal balance
- Daily meal history tracking
- Credit card payment form for meal plans
- Allergy and medical restrictions management

### 👶 Student Kiosk (`/kiosk`)
- Kid-friendly, colorful interface
- 4-digit PIN authentication
- Balance validation
- Success/error feedback in Hebrew
- Face ID simulation button

### 📊 Admin Dashboard (`/admin`)
- Real-time statistics (meals served, revenue)
- AI insights with predicted load graph
- Inventory alerts
- Live feed of student check-ins

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI (Radix UI)
- **Routing:** React Router
- **Backend:** PocketBase
- **Icons:** Lucide React
- **Font:** Heebo & Rubik (Hebrew support)

## Getting Started

### Prerequisites
- Node.js 18+
- PocketBase

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up PocketBase (see [POCKETBASE_SETUP.md](./POCKETBASE_SETUP.md))

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173

## Project Structure

```
src/
├── components/
│   └── ui/           # Shadcn UI components
├── lib/
│   ├── pocketbase.ts # PocketBase client & helpers
│   └── utils.ts      # Utility functions
├── pages/
│   ├── HomePage.tsx  # Landing page with navigation
│   ├── KioskPage.tsx # Student check-in interface
│   ├── ParentPage.tsx# Parent portal
│   └── AdminPage.tsx # Admin dashboard
├── App.tsx           # Main app with routing
└── index.css         # Global styles + RTL config
```

## RTL Support

The app is fully RTL (Right-to-Left) with:
- HTML `dir="rtl"` attribute
- Tailwind RTL configuration
- Hebrew fonts (Heebo, Rubik)
- Proper margin/padding handling

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
