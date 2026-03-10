# API リファレンス

## 目次

1. [認証](#認証)
2. [キャラクター API](#キャラクター-api)
3. [スケルトン API](#スケルトン-api)
4. [アニメーション API](#アニメーション-api)
5. [Edge Functions](#edge-functions)
6. [エラーレスポンス](#エラーレスポンス)

## 認証

すべてのAPIリクエストにはSupabase認証が必要です。

### リクエストヘッダー

```
Authorization: Bearer <access_token>
```

### セッション取得

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, anonKey);
const { data: { session } } = await supabase.auth.getSession();
```

---

## キャラクター API

### キャラクター一覧取得

```http
GET /rest/v1/characters
```

**クエリパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|---|------|
| select | string | 取得するフィールド（デフォルト: *） |
| order | string | ソート順 |
| limit | number | 取得件数 |
| offset | number | オフセット |

**レスポンス:**

```json
[
  {
    "id": "uuid",
    "name": "キャラクター名",
    "description": "説明",
    "thumbnail_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### キャラクター作成

```http
POST /rest/v1/characters
```

**リクエストボディ:**

```json
{
  "name": "キャラクター名",
  "description": "説明（オプション）",
  "layer_mapping": {
    "head": "頭レイヤー",
    "body": "体レイヤー"
  }
}
```

### キャラクター更新

```http
PATCH /rest/v1/characters?id=eq.{id}
```

### キャラクター削除

```http
DELETE /rest/v1/characters?id=eq.{id}
```

---

## スケルトン API

### スケルトン取得

```http
GET /rest/v1/skeletons?character_id=eq.{character_id}
```

**レスポンス:**

```json
{
  "id": "uuid",
  "character_id": "uuid",
  "bones": [
    {
      "id": "spine",
      "name": "背骨",
      "parent_id": null,
      "position": [0, 0],
      "rotation": 0,
      "constraints": {
        "rotation_min": -30,
        "rotation_max": 30
      }
    }
  ],
  "created_at": "2024-01-01T00:00:00Z"
}
```

### スケルトン更新

```http
PATCH /rest/v1/skeletons?id=eq.{id}
```

**リクエストボディ:**

```json
{
  "bones": [...]
}
```

---

## アニメーション API

### プリセット一覧取得

```http
GET /rest/v1/animation_presets
```

**クエリパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|---|------|
| is_global | boolean | グローバルプリセットのみ |
| character_id | uuid | 特定キャラクターのプリセット |

### プリセット作成

```http
POST /rest/v1/animation_presets
```

**リクエストボディ:**

```json
{
  "name": "手を振る",
  "description": "基本的な挨拶アニメーション",
  "category": "gesture",
  "jsx_code": "var layer = comp.layer(1); ...",
  "parameters": {
    "duration": 2.0,
    "loop": true
  },
  "is_global": false,
  "character_id": "uuid"
}
```

---

## Edge Functions

### アニメーション生成

```http
POST /functions/v1/generate-animation
```

**リクエストボディ:**

```json
{
  "prompt": "手を振るアニメーションを作成",
  "characterId": "uuid",
  "options": {
    "duration": 2.0,
    "easing": "easeInOut",
    "loop": false
  }
}
```

**レスポンス:**

```json
{
  "success": true,
  "code": "var comp = app.project.activeItem; ...",
  "metadata": {
    "estimatedDuration": 2.0,
    "affectedLayers": ["arm_right", "hand_right"]
  }
}
```

### JSXコード実行

```http
POST /functions/v1/execute-jsx
```

**リクエストボディ:**

```json
{
  "code": "var layer = comp.layer(1); layer.transform.position.setValue([100, 100]);"
}
```

**レスポンス:**

```json
{
  "success": true,
  "result": "Position updated"
}
```

### キャラクターコンテキスト取得

```http
POST /functions/v1/get-character-context
```

**リクエストボディ:**

```json
{
  "characterId": "uuid"
}
```

**レスポンス:**

```json
{
  "character": {
    "id": "uuid",
    "name": "キャラクター名",
    "layerMapping": {}
  },
  "skeleton": {
    "bones": []
  },
  "styles": [],
  "recentAnimations": []
}
```

---

## エラーレスポンス

### エラー形式

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーの説明",
    "details": {}
  }
}
```

### エラーコード一覧

| コード | HTTPステータス | 説明 |
|-------|--------------|------|
| `UNAUTHORIZED` | 401 | 認証が必要 |
| `FORBIDDEN` | 403 | アクセス権限なし |
| `NOT_FOUND` | 404 | リソースが見つからない |
| `VALIDATION_ERROR` | 400 | バリデーションエラー |
| `RATE_LIMITED` | 429 | レート制限 |
| `INTERNAL_ERROR` | 500 | サーバーエラー |
| `SECURITY_VIOLATION` | 400 | セキュリティ違反（危険なコード検出） |

### レート制限

- **APIリクエスト**: 60リクエスト/分
- **AIリクエスト**: 20リクエスト/分
- **トークン制限**: 90,000トークン/分（OpenAI）

レート制限を超えた場合:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "details": {
      "retryAfter": 30
    }
  }
}
```

---

## TypeScript型定義

```typescript
// @ae-ai/types からインポート可能

interface Character {
  id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  layer_mapping: Record<string, string>;
  created_at: string;
  updated_at: string;
}

interface Skeleton {
  id: string;
  character_id: string;
  bones: Bone[];
}

interface Bone {
  id: string;
  name: string;
  parent_id?: string;
  position: [number, number];
  rotation: number;
  constraints?: BoneConstraints;
}

interface AnimationPreset {
  id: string;
  name: string;
  category: string;
  jsx_code: string;
  parameters: Record<string, unknown>;
}
```
