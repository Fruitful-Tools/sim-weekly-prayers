# SIM Weekly Prayers

A bilingual web application for weekly prayers, allowing you to stay updated with current events and join us in praying for nations around the world.

*一個為萬國代禱的雙語網路應用程式，讓您跟隨時事脈動，與我們同為世界萬國禱告。*

[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289da?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/eFjTJgzxkH)

🌐 **繁體中文說明**: [README.md](README.md)

## 📱 Features

- **Bilingual Support**: Supports Traditional Chinese and English interfaces
- **Weekly Prayers**: Regularly updated prayer content for nations worldwide
- **PWA Support**: Installable on mobile devices for native app experience
- **Responsive Design**: Adapts to various device screen sizes
- **Dark Mode**: Supports light and dark theme switching
- **Search Functionality**: Quick search through prayer content
- **Image Upload**: Support for prayer content with images

## 🚀 Quick Start

### Prerequisites

- Node.js 22 or higher (24 recommended)
- npm or yarn

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/schwannden/sim-weekly-prayers.git
cd sim-weekly-prayers

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will run at `http://localhost:8080`

### Environment Configuration

Create a `.env.local` file and configure Supabase connection:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + SWC
- **UI Framework**: shadcn/ui component library + Tailwind CSS
- **Backend**: Supabase (PostgreSQL database)
- **State Management**: TanStack Query + React Context
- **Internationalization**: i18next (default Traditional Chinese)
- **PWA**: Service Worker + Manifest file
- **Code Quality**: ESLint + Prettier + Husky pre-commit hooks

## 📝 Development Commands

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run build:dev   # Build for development
npm run lint        # Run ESLint code checks
npm run lint:fix    # Run ESLint and auto-fix issues
npm run format      # Format all files
npm run format:check # Check if files are properly formatted
npm run preview     # Preview production build
```

## 📁 Project Structure

```
src/
├── pages/                 # Page components (Home, Prayers, PrayerDetail, etc.)
├── components/
│   └── ui/               # shadcn/ui component library (40+ components)
├── hooks/                # Custom hooks including authentication
├── i18n/
│   └── locales/          # Internationalization language files (EN/ZH-TW)
├── integrations/
│   └── supabase/         # Database client and TypeScript type definitions
└── main.tsx              # Application entry point
```

## 🗄 Database Schema

Using Supabase as backend service with core tables:

- **`prayers`**: Main prayer records containing `week_date`, `image_url`, timestamps
- **`prayer_translations`**: Bilingual content linked to prayers with `language`, `title`, `content`

Authentication uses Supabase Auth with Row Level Security (RLS) policies.

## 🎨 Development Guidelines

### Import Aliases
- Use `@/*` mapping to `src/*` (configured in vite.config.ts and tsconfig.json)
- Use this alias for all internal imports: `import { Button } from "@/components/ui/button"`

### Internationalization
- Default language: Traditional Chinese (`zh-TW`)
- Switch languages via `LanguageSwitcher` component
- Use `useTranslation` hook from react-i18next

### Code Style
- Utility-first CSS with Tailwind
- Support for light/dark themes (via `next-themes`)
- Responsive design using Tailwind breakpoints
- shadcn/ui provides consistent component styling

## 🧪 Code Quality

- **Pre-commit Hooks**: Husky runs lint-staged before commits
- **Automated Formatting**: Prettier formats TypeScript, JavaScript, JSON, CSS, and Markdown files
- **Code Linting**: ESLint with React, TypeScript, and Prettier integration
- **Configuration Files**:
  - `.prettierrc`: Prettier formatting rules
  - `eslint.config.js`: ESLint configuration
  - `.husky/pre-commit`: Runs lint-staged on commit

## 🤝 Contributing

We welcome contributions to the project! Please see [CONTRIBUTING.md](.github/CONTRIBUTING.md) for detailed contribution guidelines.

### Quick Contribution Process

1. Fork this project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Thanks to all developers who contributed to this project and the support from the SIM Taiwan team.

---

**Contact Us**: If you have any questions or suggestions, please create an Issue or contribute via Pull Request.