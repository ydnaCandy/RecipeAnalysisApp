# データ分析レシピ管理ツール 仕様書 (v3.6.2)

## 1. プロジェクト概要

データ分析のナレッジを「料理のレシピ」に例えて管理するWebアプリケーション。
ドメインごとに利用システムと実行すべきSQLを整理・可視化し、知見を蓄積する。

### 技術スタック
*   **Backend**: Python 3.x (FastAPI)
*   **Database**: SQLite (`recipe.db`)
*   **Frontend**: HTML5, Vanilla JavaScript
*   **Styling**: Tailwind CSS (CDN)
*   **Visualization**: Mermaid.js (CDN, v10+)
*   **Syntax Highlight**: highlight.js (CDN)

## 2. データベース設計 (SQLite)

### 2.1 domains (分析ドメイン)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | INTEGER (PK) | ドメインID |
| name | TEXT | ドメイン名 (例: "営業 (Sales)") |
| description | TEXT | 説明 |

### 2.2 domain_systems (ドメイン紐づきシステム)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | INTEGER (PK) | ID |
| domain_id | INTEGER (FK) | 所属ドメインID |
| system_name | TEXT | システム名 (例: "Salesforce") |

### 2.3 recipes (分析レシピ本体)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | INTEGER (PK) | レシピID |
| domain_id | INTEGER (FK) | 所属ドメインID |
| title | TEXT | レシピタイトル |
| sql_content | TEXT | 実行SQL |
| summary | TEXT | 分析概要 |
| created_at | DATETIME | 作成日時 |

### 2.4 recipe_notes (分析メモ・注意事項)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | INTEGER (PK) | メモID |
| recipe_id | INTEGER (FK) | レシピID |
| author_name | TEXT | 投稿者 |
| note_type | TEXT | 'memo' または 'caution' |
| content | TEXT | メモ内容 |
| created_at | DATETIME | 投稿日時 |

## 3. API エンドポイント

*   `GET /api/recipes`: レシピ一覧の取得
*   `GET /api/domains`: ドメイン一覧の取得
*   `POST /api/domains`: 新規ドメイン作成
*   `POST /api/recipes`: 新規レシピ作成
*   `PUT /api/recipes/{id}`: レシピの更新 (Title, Summary, SQL)
*   `POST /api/recipes/{id}/notes`: レシピへのメモ追加

## 4. フロントエンド機能

### 4.1 メインダッシュボード
*   **サイドバー**: ドメイン一覧を表示。クリックで切り替え可能。
*   **ヘッダー**:
    *   選択中ドメインと紐づくシステム（バッジ表示）を表示。
    *   **New Recipeボタン**: 新規レシピ作成モーダルを開く。
*   **レシピリール**: 選択ドメインのレシピをカード形式で横スクロール表示。

### 4.2 レシピ詳細モーダル
レシピカードクリックで表示。以下のコンポーネントを持つ。

1.  **ヘッダー**:
    *   レシピタイトル。
    *   **Editボタン**: レシピ編集モーダルを開く。
    *   閉じるボタン。
2.  **Summary (概要)**: 分析の目的やロジックの説明。
3.  **SQL Query (折りたたみ式)**:
    *   `<details>` 要素で実装。
    *   `highlight.js` によるシンタックスハイライト。
    *   コピーボタン付き。
4.  **Relationship Diagram (ER図)**:
    *   `<details>` 要素による折りたたみ表示（クリックで展開）。
    *   `Mermaid.js` を使用して SQL の JOIN 句から簡易ER図を自動生成・描画。
5.  **Knowledge & Notes**:
    *   知見や注意事項をタイムライン形式で表示。
    *   'Caution' タイプは赤色で強調表示。
    *   新規メモの追加投稿フォーム。

### 4.3 レシピ作成・編集モーダル
*   **作成**: タイトル、概要、SQLクエリを入力し、選択中のドメインに紐づくレシピを作成。
*   **編集**: 既存のレシピ情報をプレフィルド状態で開き、修正・更新が可能。

## 5. データベース初期化
*   **backend/data/init_db.py**: データベースファイルと全テーブルの作成を行う（既存テーブルはスキップ）。
*   **backend/data/create_test_data.py**: サンプルデータ（営業・製造ドメイン等）の投入を行う。
*   **Docker起動時**: `backend/entrypoint.sh` により、サーバー起動前に上記スクリプトが順次実行される。

## 6. 環境・制約事項

*   **環境分離**: Python環境は `.venv` 必須。
*   **依存管理**: バックエンドは `requirements.txt`、フロントエンド開発ツールは `package.json` で管理。
*   **CDN利用**: 実行時のフロントエンドライブラリ（Tailwind, Mermaid, highlight.js）はCDN経由で読み込む（ビルド不要）。
*   **ドキュメント**: コード内のコメントおよび Docstring は全て日本語で記述する。
