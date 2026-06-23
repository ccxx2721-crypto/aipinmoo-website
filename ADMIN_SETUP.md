# 愛拼哞圖片後台設定

目前網站是純 HTML/CSS/JS 靜態網站，不能安全地直接把圖片上傳到網站資料夾。
本專案採用 Supabase Auth + Supabase Storage + Supabase Database：

- Supabase Auth：管理者登入
- Supabase Storage：存放 LOGO、Hero 圖、案例前後圖
- Supabase Database：存放案例文字資料與圖片路徑

## 需要申請的服務

1. 建立 Supabase 專案：https://supabase.com
2. 到 Authentication 建立一個自己的管理者帳號
3. 到 SQL Editor 執行 `supabase/schema.sql`
4. 執行最後一行管理者設定：

```sql
insert into public.admin_users (email) values ('你的登入信箱');
```

## 需要設定的前端設定

打開 `site-config.js`，填入 Supabase 專案資訊：

```js
window.AIPIMOO_CONFIG = {
  supabaseUrl: "https://你的專案.supabase.co",
  supabaseAnonKey: "你的 anon public key",
  storageBucket: "aipimoo-images",
  maxImageSizeMb: 5
};
```

注意：`anon public key` 可以放在前端，真正安全性靠 Supabase RLS 規則。不要把 service role key 放到前端。

## 怎麼進入後台

部署後打開：

```text
/admin/
```

輸入你在 Supabase Auth 建立的 Email 與密碼。

## 怎麼測試上傳

1. 先登入 `/admin/`
2. 上傳品牌 LOGO
3. 上傳首頁 Hero 圖
4. 新增一筆完工案例，包含施工前、完工後、服務類型、地區、出工人數、工時、處理內容
5. 回首頁重新整理

## 怎麼確認前台案例有正常顯示

首頁的「完工案例」區：

- 如果沒有案例：顯示「真實案例陸續整理中」
- 如果有已發布案例：自動顯示案例卡片
- 桌機版：一排最多 3 張
- 手機版：一排 1 張
- 每張案例會顯示「施工前」「完工後」標籤

## 圖片限制

- 格式：jpg、png、webp
- 大小：預設最大 5MB
- 圖片會用固定比例顯示，不會變形

## 安全注意

- 不要把 Supabase service role key 放進網站檔案
- 不要把真正密碼寫在 HTML、JS、CSS
- 後台頁面雖然可被打開，但沒有管理者帳號無法上傳
- Supabase SQL 規則必須執行，否則安全保護不完整
