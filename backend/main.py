from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from . import crud, models, schemas
from .database import SessionLocal, engine, get_db
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/recipes", response_model=List[schemas.Recipe])
def read_recipes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    全てのレシピの一覧を取得します。
    """
    recipes = crud.get_recipes(db, skip=skip, limit=limit)
    return recipes

@app.get("/api/domains", response_model=List[schemas.Domain])
def read_domains(db: Session = Depends(get_db)):
    """
    利用可能な全てのドメインを取得します。
    """
    return crud.get_domains(db)

@app.post("/api/domains", response_model=schemas.Domain)
def create_domain(domain: schemas.DomainCreate, db: Session = Depends(get_db)):
    """
    新しいドメインを作成します。
    """
    return crud.create_domain(db=db, domain=domain)

@app.post("/api/recipes", response_model=schemas.Recipe)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    """
    新しいレシピを作成します。
    """
    return crud.create_recipe(db=db, recipe=recipe)

@app.put("/api/recipes/{recipe_id}", response_model=schemas.Recipe)
def update_recipe(recipe_id: int, recipe_update: schemas.RecipeUpdate, db: Session = Depends(get_db)):
    """
    指定されたIDのレシピを更新します。
    """
    db_recipe = crud.update_recipe(db=db, recipe_id=recipe_id, recipe_update=recipe_update)
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return db_recipe

@app.post("/api/recipes/{recipe_id}/notes", response_model=schemas.RecipeNote)
def create_note(recipe_id: int, note: schemas.RecipeNoteCreate, db: Session = Depends(get_db)):
    """
    特定のレシピにノートを追加します。
    """
    return crud.create_recipe_note(db=db, recipe_id=recipe_id, note=note)

# フロントエンドディレクトリが存在する場合のみ配信（ローカル開発やビルド済み環境用）
import os
if os.path.isdir("frontend"):
    app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
else:
    print("Frontend directory not found, skipping mount.")
