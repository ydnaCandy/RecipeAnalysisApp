from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Domain(Base):
    """
    分析ドメイン（業務領域）を表すモデル。
    例: 「営業」「製造」「人事」など、分析のコンテキストを定義します。
    """
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)

    systems = relationship("DomainSystem", back_populates="domain")
    recipes = relationship("Recipe", back_populates="domain")

class DomainSystem(Base):
    """
    ドメインに関連するシステムを表すモデル。
    例: 営業ドメインにおける「Salesforce」「Google Analytics」など。
    """
    __tablename__ = "domain_systems"

    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    system_name = Column(String)

    domain = relationship("Domain", back_populates="systems")

class Recipe(Base):
    """
    分析レシピ（SQLクエリとそのメタデータ）を表すモデル。
    特定のドメインに紐づき、具体的な分析ロジックを保持します。
    """
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    title = Column(String)
    sql_content = Column(Text)
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    domain = relationship("Domain", back_populates="recipes")
    notes = relationship("RecipeNote", back_populates="recipe")

class RecipeNote(Base):
    """
    レシピに対するメモや注意書きを表すモデル。
    ナレッジシェアリングや実装時の注意点（Caution）を記録します。
    """
    __tablename__ = "recipe_notes"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    author_name = Column(String)
    note_type = Column(String)  # 'caution' または 'memo'
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    recipe = relationship("Recipe", back_populates="notes")
