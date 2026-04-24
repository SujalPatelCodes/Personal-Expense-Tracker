# TrackIt — Personal Expense Tracker

TrackIt is a premium, high-performance financial management application designed to give you complete control over your spending. Built with a modern glassmorphic UI and real-time data synchronization, it offers sophisticated analytics that transform raw transactions into actionable financial insights.

![GitHub last commit](https://img.shields.io/github/last-commit/SujalPatelDeveloper/Personal-Expense-Tracker?style=for-the-badge&color=6366f1)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)

## ✨ Key Features

### 📊 Advanced Analytics
- **Financial Year Intelligence**: Custom logic supporting fiscal year reporting (April–March) instead of just standard calendar years.
- **Spending Trends**: Dynamic bar charts with interactive hover tooltips and vertical value scaling for high-spending days.
- **Category Insights**: Visual distribution of expenses using interactive donut charts with dynamic center totals.
- **Smart Predictions**: Weekend vs. Weekday analysis and proactive spending alerts.

### 💸 Core Management
- **Expense Tracking**: Quick-entry form with category tagging and notes.
- **Subscription Management**: Dedicated module for tracking recurring payments (Weekly, Monthly, Yearly) with automatic commitment calculation.
- **Real-time Sync**: Powered by Supabase for instantaneous data updates across all your devices.

### 📱 Premium UX/UI
- **Glassmorphic Design**: A state-of-the-art interface featuring backdrop blurs, soft gradients, and fluid micro-animations.
- **Fully Responsive**: Optimized for Mobile, Tablet, and Desktop with specific touch-friendly controls.
- **Export Power**: One-click professional PDF report generation, CSV data export, and Excel integration.

## 🚀 Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Vanilla CSS (Modern CSS variables, Flexbox/Grid)
- **Database/Auth**: Supabase
- **Visualizations**: Recharts
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Reporting**: jsPDF + AutoTable

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SujalPatelDeveloper/Personal-Expense-Tracker.git
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   Create a `.env` file in the root and add your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 📄 License
This project is for personal use and portfolio demonstration. Built with ❤️ by Sujal Patel.
