# セットアップガイド

このガイドでは、AE AI Extensionの開発環境セットアップ手順を説明します。

## 目次

1. [前提条件](#前提条件)
2. [プロジェクトのクローン](#プロジェクトのクローン)
3. [依存関係のインストール](#依存関係のインストール)
4. [Supabase設定](#supabase設定)
5. [環境変数の設定](#環境変数の設定)
6. [開発サーバーの起動](#開発サーバーの起動)
7. [CEP拡張のインストール](#cep拡張のインストール)
8. [トラブルシューティング](#トラブルシューティング)

## 前提条件

### 必須ソフトウェア

| ソフトウェア | バージョン | インストール方法 |
|-------------|-----------|-----------------|
| Node.js | 18.0+ | [nodejs.org](https://nodejs.org/) |
| pnpm | 8.0+ | `npm install -g pnpm` |
| Adobe After Effects | CC 2020+ | Adobe Creative Cloud |
| Git | 最新版 | [git-scm.com](https://git-scm.com/) |

### 推奨ソフトウェア

| ソフトウェア | 用途 |
|-------------|-----|
| VS Code | コードエディタ |
| Supabase CLI | ローカル開発 |
| Postman | API テスト |

## プロジェクトのクローン

```bash
# HTTPSでクローン
git clone https://github.com/your-org/ae-ai.git

# SSHでクローン
git clone git@github.com:your-org/ae-ai.git

# ディレクトリに移動
cd ae-ai
```

## 依存関係のインストール

```bash
# pnpmで依存関係をインストール
pnpm install
```

これにより、すべてのワークスペースパッケージの依存関係がインストールされます。

## Supabase設定

### Option A: Supabase Cloud（推奨）

1. [Supabase](https://supabase.com/)でアカウント作成
2. 新規プロジェクトを作成
3. ダッシュボードでSQLエディタを開く
4. 以下のSQLファイルを順番に実行:

```
supabase/migrations/001_create_tables.sql
supabase/migrations/002_enable_rls.sql
supabase/migrations/003_create_triggers.sql
supabase/migrations/004_seed_data.sql
```

5. プロジェクト設定から以下を取得:
   - Project URL
   - Anon Key
   - Service Role Key

### Option B: Supabase CLI（ローカル開発）

```bash
# Supabase CLIをインストール
npm install -g supabase

# ローカルSupabaseを起動
supabase start

# マイグレーションを適用
supabase db push
```

## 環境変数の設定

### UIパッケージ（packages/ui）

```bash
cp packages/ui/.env.example packages/ui/.env.local
```

`.env.local`を編集:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI API Keys
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### CEPパッケージ（packages/cep）

```bash
cp packages/cep/.env.example packages/cep/.env
```

`.env`を編集:

```env
API_BASE_URL=http://localhost:3000/api
```

## 開発サーバーの起動

### 全パッケージを起動

```bash
pnpm dev
```

これにより以下が起動します:
- Next.js UI: http://localhost:3000
- CEP開発サーバー: http://localhost:5173

### 個別に起動

```bash
# UIのみ
pnpm dev:ui

# CEPのみ
pnpm dev:cep

# TypeScript型チェック（ウォッチモード）
pnpm typecheck:watch
```

## CEP拡張のインストール

### 開発モード（デバッグ有効）

1. After Effectsを終了

2. デバッグモードを有効化:

**Windows:**
```cmd
reg add "HKCU\SOFTWARE\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
```

**macOS:**
```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

3. シンボリックリンクを作成:

**Windows:**
```cmd
mklink /D "%APPDATA%\Adobe\CEP\extensions\com.ae-ai.extension" "C:\path\to\ae_ai\packages\cep"
```

**macOS:**
```bash
ln -s /path/to/ae_ai/packages/cep ~/Library/Application\ Support/Adobe/CEP/extensions/com.ae-ai.extension
```

4. After Effectsを起動し、ウィンドウ > エクステンション > AE AI Extension

### プロダクションビルド

```bash
# CEPをビルド
pnpm build:cep

# ZXPファイルを作成（署名が必要）
cd packages/cep
./scripts/sign.sh
```

## トラブルシューティング

### 「拡張機能を読み込めません」エラー

1. デバッグモードが有効か確認
2. After Effectsを完全に再起動
3. CSXSバージョンを確認（AE 2020+は CSXS.11）

### Supabase接続エラー

1. 環境変数が正しく設定されているか確認
2. Supabaseプロジェクトが起動しているか確認
3. RLSポリシーが正しく設定されているか確認

### TypeScriptエラー

```bash
# 型定義を再ビルド
pnpm build:types

# 依存関係をクリーンインストール
pnpm clean && pnpm install
```

### ポート競合

デフォルトポートが使用中の場合:

```bash
# 別ポートで起動
PORT=3001 pnpm dev:ui
```

## 次のステップ

- [API リファレンス](./api-reference.md)
- [ユーザーマニュアル](./user-manual.md)
- [アーキテクチャ概要](./architecture.md)
