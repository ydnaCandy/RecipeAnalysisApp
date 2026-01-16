from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RecipeNoteBase(BaseModel):
    """
    レシピノートの共通属性（作成・参照時に共通するフィールド）。
    """
    author_name: str
    note_type: str
    content: str

class RecipeNoteCreate(RecipeNoteBase):
    pass

class RecipeNote(RecipeNoteBase):
    """
    APIレスポンス用のレシピノートモデル。IDと作成日時を含みます。
    """
    id: int
    recipe_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class RecipeBase(BaseModel):
    """
    レシピの共通属性。
    """
    title: str
    sql_content: str
    summary: str

class RecipeCreate(RecipeBase):
    domain_id: int

class RecipeUpdate(BaseModel):
    """
    レシピ更新用のモデル。
    全てのフィールドはOptionalであり、指定されたフィールドのみ更新されます。
    """
    title: Optional[str] = None
    sql_content: Optional[str] = None
    summary: Optional[str] = None

class Recipe(RecipeBase):
    id: int
    domain_id: int
    created_at: datetime
    notes: List[RecipeNote] = []

    class Config:
        from_attributes = True

class DomainSystemBase(BaseModel):
    """
    ドメインシステムの共通属性。
    """
    system_name: str

class DomainSystemCreate(DomainSystemBase):
    pass

class DomainSystem(DomainSystemBase):
    id: int
    domain_id: int

    class Config:
        from_attributes = True

class DomainBase(BaseModel):
    """
    ドメインの共通属性。
    """
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
