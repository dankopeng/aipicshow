-- 創建 images 表
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_key TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
