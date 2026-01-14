from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)

    systems = relationship("DomainSystem", back_populates="domain")
    recipes = relationship("Recipe", back_populates="domain")

class DomainSystem(Base):
    __tablename__ = "domain_systems"

    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    system_name = Column(String)

    domain = relationship("Domain", back_populates="systems")

class Recipe(Base):
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
    __tablename__ = "recipe_notes"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    author_name = Column(String)
    note_type = Column(String)  # 'caution', 'memo'
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    recipe = relationship("Recipe", back_populates="notes")
