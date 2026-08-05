# Toucheng Living｜頭城生活 Open Data（Beta）

店家試填前端原型，採 Mobile First 自適應設計。

## 已完成
- 7 步驟 Wizard
- 10 種 Living Places 類別
- 每日營業狀態與最多兩個營業時段
- 照片 1～3 張，上傳前瀏覽器端縮圖轉 WebP
- Living Card 預覽（桌機左右、手機上下）
- LocalStorage 草稿暫存
- 測試用專屬修改 Token
- Supabase schema 草稿

## 尚未串接
- Supabase 專案 URL 與 anon key
- Storage 圖片上傳
- Edge Functions 投稿、Token 驗證與修改
- 管理員逐筆審核頁
- 審核通過後立即公開
- GitHub Actions 每週備份至私有儲存庫

## 本機預覽
```bash
python -m http.server 8000
```
開啟 http://localhost:8000

## 部署
可直接部署到 GitHub Pages。正式投稿寫入與管理功能需串接 Supabase。
