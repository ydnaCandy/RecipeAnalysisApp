from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RecipeNoteBase(BaseModel):
    author_name: str
    note_type: str
    content: str

class RecipeNoteCreate(RecipeNoteBase):
    pass

class RecipeNote(RecipeNoteBase):
    id: int
    recipe_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class RecipeBase(BaseModel):
    title: str
    sql_content: str
    summary: str

class RecipeCreate(RecipeBase):
    domain_id: int

class Recipe(RecipeBase):
    id: int
    domain_id: int
    created_at: datetime
    notes: List[RecipeNote] = []

    class Config:
        from_attributes = True

class DomainSystemBase(BaseModel):
    system_name: str

class DomainSystemCreate(DomainSystemBase):
    pass

class DomainSystem(DomainSystemBase):
    id: int
    domain_id: int

    class Config:
        from_attributes = True

class DomainBase(BaseModel):
    name: str
    description: str

class DomainCreate(DomainBase):
    systems: List[DomainSystemCreate] = []

class Domain(DomainBase):
    id: int
    systems: List[DomainSystem] = []
    recipes: List[Recipe] = []

    class Config:
        from_attributes = True
