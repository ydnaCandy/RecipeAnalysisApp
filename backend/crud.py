from sqlalchemy.orm import Session
from . import models, schemas
from datetime import datetime

def get_recipes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Recipe).offset(skip).limit(limit).all()

def create_domain(db: Session, domain: schemas.DomainCreate):
    db_domain = models.Domain(name=domain.name, description=domain.description)
    db.add(db_domain)
    db.commit()
    db.refresh(db_domain)
    
    for system in domain.systems:
        db_system = models.DomainSystem(domain_id=db_domain.id, system_name=system.system_name)
        db.add(db_system)
    
    db.commit()
    db.refresh(db_domain)
    return db_domain

def get_domains(db: Session):
    return db.query(models.Domain).all()

def create_recipe(db: Session, recipe: schemas.RecipeCreate):
    db_recipe = models.Recipe(
        domain_id=recipe.domain_id,
        title=recipe.title,
        sql_content=recipe.sql_content,
        summary=recipe.summary,
        created_at=datetime.utcnow()
    )
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

def update_recipe(db: Session, recipe_id: int, recipe_update: schemas.RecipeUpdate):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        return None
    
    if recipe_update.title is not None:
        db_recipe.title = recipe_update.title
    if recipe_update.sql_content is not None:
        db_recipe.sql_content = recipe_update.sql_content
    if recipe_update.summary is not None:
        db_recipe.summary = recipe_update.summary
        
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

def create_recipe_note(db: Session, recipe_id: int, note: schemas.RecipeNoteCreate):
    db_note = models.RecipeNote(
        recipe_id=recipe_id,
        author_name=note.author_name,
        note_type=note.note_type,
        content=note.content,
        created_at=datetime.utcnow()
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note
