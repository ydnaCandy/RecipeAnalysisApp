import os
import sys

# 親ディレクトリ（backendの親）をパスに追加してモジュール解決できるようにする
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend import models
from backend.database import engine

def init_db():
    print("データベース初期化プロセスを開始します...")
    
    # create_all(checkfirst=True) はSQLAlchemyの機能で、
    # データベース内の全テーブルを確認し、未作成のものだけを作成します。
    # すでに存在するテーブルはスキップされます。
    print("必要なテーブルを確認・作成しています...")
    models.Base.metadata.create_all(bind=engine)
    
    print("データベース初期化が完了しました。")

if __name__ == "__main__":
    init_db()
