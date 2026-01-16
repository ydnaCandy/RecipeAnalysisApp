import sys
import os

# 親ディレクトリ（backendの親）をパスに追加してモジュール解決できるようにする
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend import models
from backend.database import SessionLocal

def create_test_data():
    db = SessionLocal()
    try:
        # データ存在チェック
        # ドメインテーブルにレコードがあるかで判定
        if db.query(models.Domain).first():
            print("データが既に存在するため、テストデータの作成をスキップします。")
            return

        print("テストデータの作成を開始します...")
        
        # --- 以下データ作成ロジック（変更なし） ---

        # Create Sample Domain: Sales
        sales_domain = models.Domain(name="営業 (Sales)", description="売上、顧客データに関する分析ドメイン")
        db.add(sales_domain)
        db.commit()
        db.refresh(sales_domain)

        # Add Systems
        db.add(models.DomainSystem(domain_id=sales_domain.id, system_name="Salesforce"))
        db.add(models.DomainSystem(domain_id=sales_domain.id, system_name="Google Analytics"))
        
        # Create Sample Recipe
        sql_sample = """
    SELECT 
        o.order_id,
        c.customer_name,
        p.product_name,
        o.amount
    FROM orders o
    JOIN customers c ON o.customer_id = c.customer_id
    JOIN products p ON o.product_id = p.product_id
    WHERE o.order_date >= '2023-01-01'
        """
        sales_recipe = models.Recipe(
            domain_id=sales_domain.id,
            title="月次売上集計(顧客・商品別)",
            sql_content=sql_sample.strip(),
            summary="顧客ごと、商品ごとの売上実績を集計する基本クエリ。"
        )
        db.add(sales_recipe)
        db.commit()
        db.refresh(sales_recipe)
        
        # Add Note
        db.add(models.RecipeNote(
            recipe_id=sales_recipe.id,
            author_name="データ分析チーム",
            note_type="caution",
            content="キャンセル注文が含まれないようにWHERE句のステータス確認が必要かも。"
        ))
        db.commit()

        # Create Sample Domain: Production
        prod_domain = models.Domain(name="製造 (Production)", description="工場、在庫、品質管理に関する分析")
        db.add(prod_domain)
        db.commit()
        db.refresh(prod_domain)
        
        db.add(models.DomainSystem(domain_id=prod_domain.id, system_name="IoT Log DB"))
        db.add(models.DomainSystem(domain_id=prod_domain.id, system_name="Inventory App"))
        
        db.commit()
        print("テストデータの作成が完了しました。")

    finally:
        db.close()

if __name__ == "__main__":
    create_test_data()
