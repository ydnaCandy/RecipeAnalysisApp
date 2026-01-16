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

コンテナ起動時に以下のスクリプトが自動実行されます：
1. `backend/data/init_db.py`: データベースとテーブルの作成（既存データは保持）
2. `backend/data/create_test_data.py`: テストデータの投入（データが空の場合のみ）

手動で初期化を行いたい場合は、各スクリプトを直接実行してください。

### 3. フロントエンド

Tailwind CSS 等の依存関係はCDNまたはローカルインストールで管理されています。
初期化（必要であれば）：

```bash
npm install
```

## コンテナでの実行 (推奨)

Docker Composeを利用してアプリケーション一式（フロントエンド＋バックエンド）を起動します。

```bash
# ビルドとバックグラウンド起動
docker compose up -d --build

# ログの確認
docker compose logs -f
```

起動後、ブラウザで [http://localhost:13080](http://localhost:13080) にアクセスするとダッシュボードが表示されます。

## ローカル開発での起動

仮想環境をアクティベートした状態で、以下のコマンドを実行してください。

```bash
# DB初期化 (初回のみ)
python backend/data/init_db.py
python backend/data/create_test_data.py

# サーバー起動 (ポートは適宜変更可)
uvicorn backend.main:app --reload --port 13081
```

## ディレクトリ構成

*   `backend/`: FastAPI アプリケーションコード
*   `backend/data/`: データベース初期化スクリプト (`init_db.py`, `create_test_data.py`) および DBファイル
*   `frontend/`: HTML, CSS, JavaScript ソースコード