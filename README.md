
# SIM 每週禱告 (SIM Weekly Prayers)

一個為萬國代禱的雙語網路應用程式，讓您跟隨時事脈動，與我們同為世界萬國禱告。

*A bilingual web application for weekly prayers, allowing you to stay updated with current events and join us in praying for nations around the world.*

[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289da?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/eFjTJgzxkH)

🌐 **English README**: [README_en.md](README_en.md)

## 📱 特色功能

- **雙語支援**: 支援繁體中文與英文介面
- **每週禱告**: 定期更新的萬國代禱內容
- **PWA 支援**: 可安裝到手機桌面，提供原生應用程式體驗
- **響應式設計**: 適配各種裝置螢幕尺寸
- **暗黑模式**: 支援明暗主題切換
- **搜尋功能**: 快速搜尋禱告內容
- **圖片上傳**: 支援禱告內容配圖

## 🚀 快速開始

### 系統需求

- Node.js 18 或更新版本
- npm 或 yarn

### 安裝與執行

```bash
# 克隆專案
git clone https://github.com/schwannden/sim-weekly-prayers.git
cd sim-weekly-prayers

# 安裝依賴套件
npm install

# 啟動開發伺服器
npm run dev
```

應用程式將在 `http://localhost:8080` 執行

### 環境設定

建立 `.env.local` 檔案並設定 Supabase 連線資訊：
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🛠 技術架構

- **前端**: React 18 + TypeScript + Vite + SWC
- **UI 框架**: shadcn/ui 元件庫 + Tailwind CSS
- **後端**: Supabase (PostgreSQL 資料庫)
- **狀態管理**: TanStack Query + React Context
- **國際化**: i18next (預設繁體中文)
- **PWA**: Service Worker + Manifest 檔案
- **程式碼品質**: ESLint + Prettier + Husky 預提交鉤子

## 📝 開發指令

```bash
npm run dev         # 啟動開發伺服器
npm run build       # 建置正式版本
npm run build:dev   # 建置開發版本
npm run lint        # 執行 ESLint 程式碼檢查
npm run lint:fix    # 執行 ESLint 並自動修復問題
npm run format      # 格式化所有檔案
npm run format:check # 檢查檔案格式是否正確
npm run preview     # 預覽正式版本
```

## 📁 專案結構

```
src/
├── pages/                 # 頁面元件 (首頁、禱告、詳細頁面等)
├── components/
│   └── ui/               # shadcn/ui 元件庫 (40+ 個元件)
├── hooks/                # 自訂 Hook (包含身份驗證)
├── i18n/
│   └── locales/          # 國際化語言檔案 (EN/ZH-TW)
├── integrations/
│   └── supabase/         # 資料庫客戶端與 TypeScript 型別定義
└── main.tsx              # 應用程式進入點
```

## 🗄 資料庫架構

使用 Supabase 作為後端服務，核心資料表：

- **`prayers`**: 主要禱告記錄，包含 `week_date`、`image_url`、時間戳記
- **`prayer_translations`**: 雙語內容，連結到禱告記錄，包含 `language`、`title`、`content`

身份驗證使用 Supabase Auth 搭配行級安全性 (RLS) 政策。

## 🎨 開發規範

### 匯入別名
- 使用 `@/*` 對應到 `src/*` (在 vite.config.ts 和 tsconfig.json 中設定)
- 所有內部匯入使用此別名：`import { Button } from "@/components/ui/button"`

### 國際化
- 預設語言：繁體中文 (`zh-TW`)
- 透過 `LanguageSwitcher` 元件切換語言
- 使用 react-i18next 的 `useTranslation` Hook

## 🧪 程式碼品質

- **預提交鉤子**: Husky 在提交前執行 lint-staged
- **自動格式化**: Prettier 格式化 TypeScript、JavaScript、JSON、CSS 和 Markdown 檔案
- **程式碼檢查**: ESLint 搭配 React、TypeScript 和 Prettier 整合
- **設定檔案**:
  - `.prettierrc`: Prettier 格式化規則
  - `eslint.config.js`: ESLint 設定
  - `.husky/pre-commit`: 提交時執行 lint-staged

## 🤝 貢獻指南

歡迎參與專案開發！請參閱 [CONTRIBUTING.md](.github/CONTRIBUTING.md) 了解詳細的貢獻指南。

### 快速貢獻流程

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的變更 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 授權條款

此專案採用 MIT 授權條款。詳見 [LICENSE](LICENSE) 檔案。

## 🙏 致謝

感謝所有為此專案貢獻的開發者和 SIM Taiwan 團隊的支持。

---

**聯絡我們**: 如有任何問題或建議，請建立 Issue 或透過 Pull Request 參與貢獻。
