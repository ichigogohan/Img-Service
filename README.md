# IMG Service

Node.js (TypeScript) + Express + Sharp + Docker で構築された、ユーザーアイコン専用の軽量な画像変換・配信サーバーです。

## 技術スタック
- **Runtime / Framework:** Node.js 22, Express, TypeScript
- **Image Processing / Upload:** Sharp, file-type, Multer
- **Infrastructure:** Docker, Docker Compose

## 起動方法

```bash
docker compose up --build -d
```
※ 起動前に `./icons/default.webp` を配置してください。

## API 仕様

### 1. 画像アップロード
- **POST** `/upload`
- **Headers:** `X-User-ID: <user_id>`
- **Body:** `file` (PNG / JPEG / WebP, 最大 5MB)
- **Response:** `204 No Content` (変換・保存成功) / `400 Bad Request`

```bash
curl -X POST http://localhost:3000/upload -H "X-User-ID: u1234" -F "file=@icon.png"
```

### 2. アイコン取得
- **GET** `/icons/:filename`
- **Response:** `200 OK` (存在しないIDの場合は `default.webp` を返却)

```bash
curl http://localhost:3000/icons/user123.webp -o icon.webp
```

## セキュリティ設計

### 認証・認可について
本サービスは、**画像処理・配信専用サーバー**として設計されています。
そのため、認証および認可（`X-User-ID` の正当性検証やユーザーの本人確認）は、前段に配置される **API Gateway またはリバースプロキシ** で行われることを前提としています。