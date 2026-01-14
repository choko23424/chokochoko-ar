# ARを活用した学校紹介（Webアプリ側）
## 開発環境
- HTML, CSS, JavaScript
- AR.js
  - マーカー型AR[^1]

### 開発環境（ツール）
- Visual Studio Code (Google Antigravity)
- GitHub
- Cloudflare Pages

### 参考
#### 生成AI
- Google AI Studio (Gemini 2.5 Pro -> Gemini 3.0 Pro Preview)
- Perplexity
#### 資料
- AR.js公式ドキュメント


---

[^1]: なぜ「マーカー型AR」を選んだのか？
学校紹介をする上では明らかにマーカー型ではなく、位置情報を使ったARの方が便利だと考えた。理由は、マーカーをわざわざ読み取るという作業がいらないから。しかし、学校なので室内での使用（GPSは建物内に強くない）、そして隣り合った部屋を別々のモデルで正確に表示しなければいけない為、なくなくマーカー型を選んだ。
