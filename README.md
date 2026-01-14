# Analytics Recipe Manager

データ分析のナレッジを「料理のレシピ」のように管理するWebアプリケーション。
ドメイン（営業、製造など）ごとに利用システムと実行すべきSQLを整理・可視化します。

## 前提条件

*   Python 3.8+
*   Node.js & npm (フロントエンドの依存関係管理のみに使用)

## 環境構築

### 1. Python バックエンド

プロジェクトルートで以下のコマンドを実行し、仮想環境を作成・依存ライブラリをインストールします。

```bash
# 仮想環境の作成
python -m venv .venv

# 仮想環境のアクティベート
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# 依存パッケージのインストール
pip install -r requirements.txt
```

### 2. データベース

初回起動時に自動的に SQLite データベース (`recipe.db`) が作成されます。
サンプルデータを投入したい場合は、サーバー起動後にブラウザまたはcurlで以下にアクセスしてください。

```
GET /api/init
```

### 3. フロントエンド

Tailwind CSS 等の依存関係はCDNまたはローカルインストールで管理されています。
初期化（必要であれば）：

```bash
npm install
```

## アプリケーションの起動

仮想環境をアクティベートした状態で、以下のコマンドを実行してください。

```bash
uvicorn backend.main:app --reload --port 8000
```

起動後、ブラウザで [http://localhost:8000](http://localhost:8000) にアクセスするとダッシュボードが表示されます。

## ディレクトリ構成

*   `backend/`: FastAPI アプリケーションコード
*   `frontend/`: HTML, CSS, JavaScript ソースコード
*   `recipe.db`: SQLite データベースファイル (自動生成)
