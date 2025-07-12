# AI 圖片展示網站

## 專案簡介

這是一個展示個人 AI 生成圖片的網站，提供圖片上傳、展示和管理功能。使用者可以上傳自己創作的 AI 生成圖片，並在網站上進行簡單展示和管理。

網站地址：[https://wish100.tidepeng.workers.dev](https://wish100.tidepeng.workers.dev)

## 功能特色

### 圖片瀏覽
- 響應式圖片網格，自動適應不同屏幕尺寸
- 空狀態提示，當無圖片時顯示友善提示
- 點擊圖片卡片可查看詳情

### 圖片詳情
- 顯示圖片大圖、標題和描述
- 顯示圖片元數據（上傳時間、文件路徑、圖片ID）
- 提供刪除功能，刪除後自動跳轉到首頁
- 返回按鈕，方便返回上一頁

### 圖片上傳
- 支持標題和描述輸入
- 圖片預覽功能，上傳前可查看選中圖片
- 完善的表單驗證，包括必填字段、文件格式和大小限制
- 友善的錯誤提示和上傳進度顯示

## 技術架構

### 前端技術
- **框架**：Remix
- **樣式**：Tailwind CSS
- **語言**：TypeScript

### 後端技術
- **API**：RESTful API
- **數據庫**：Cloudflare D1（SQLite 兼容的邊緣數據庫）
- **存儲服務**：Cloudflare R2（兼容 S3 的對象存儲）
- **部署平台**：Cloudflare Workers

## 開發指南

### 本地開發

啟動開發伺服器：

```sh
npm run dev
```

### 構建與部署

構建應用：

```sh
npm run build
```

部署到 Cloudflare Workers：

```sh
npm run deploy
```

## API 路由

- `GET /api/images` - 獲取所有圖片列表
- `POST /api/images` - 上傳新圖片
- `GET /api/images/:id` - 獲取單張圖片詳情
- `DELETE /api/images/:id` - 刪除圖片
- `GET /api/images/file/:filename` - 獲取圖片文件

## 前端頁面

- `/` - 首頁，展示所有上傳的圖片
- `/upload` - 上傳新圖片頁面
- `/images/:id` - 單張圖片詳情頁面
