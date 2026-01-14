from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from . import crud, models, schemas
from .database import SessionLocal, engine, get_db
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Endpoints

@app.get("/api/init")
def init_db(db: Session = Depends(get_db)):
    # Check if data already exists
    if db.query(models.Domain).first():
        return {"message": "Data already initialized"}

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

    return {"message": "Initialized with sample data"}

@app.get("/api/recipes", response_model=List[schemas.Recipe])
def read_recipes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    recipes = crud.get_recipes(db, skip=skip, limit=limit)
    return recipes

@app.get("/api/domains", response_model=List[schemas.Domain])
def read_domains(db: Session = Depends(get_db)):
    return crud.get_domains(db)

@app.post("/api/domains", response_model=schemas.Domain)
def create_domain(domain: schemas.DomainCreate, db: Session = Depends(get_db)):
    return crud.create_domain(db=db, domain=domain)

@app.post("/api/recipes", response_model=schemas.Recipe)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    return crud.create_recipe(db=db, recipe=recipe)

@app.post("/api/recipes/{recipe_id}/notes", response_model=schemas.RecipeNote)
def create_note(recipe_id: int, note: schemas.RecipeNoteCreate, db: Session = Depends(get_db)):
    return crud.create_recipe_note(db=db, recipe_id=recipe_id, note=note)

# Serve Frontend
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
