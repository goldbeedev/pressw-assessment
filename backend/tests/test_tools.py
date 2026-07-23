import pytest

from app.graph import tools as tools_module


@pytest.fixture(autouse=True)
def reset_saved_recipes():
    tools_module._saved_recipes.clear()
    yield
    tools_module._saved_recipes.clear()


def test_list_saved_recipes_when_empty():
    assert tools_module.list_saved_recipes.invoke({}) == "No recipes saved yet."


def test_save_recipe_then_list_reflects_it():
    save_result = tools_module.save_recipe.invoke(
        {"title": "Garlic Shrimp Pasta", "recipe_text": "boil pasta, saute shrimp..."}
    )
    assert "Garlic Shrimp Pasta" in save_result

    listed = tools_module.list_saved_recipes.invoke({})
    assert "Garlic Shrimp Pasta" in listed


def test_saving_two_recipes_lists_both():
    tools_module.save_recipe.invoke({"title": "Tacos", "recipe_text": "..."})
    tools_module.save_recipe.invoke({"title": "Fried Rice", "recipe_text": "..."})

    listed = tools_module.list_saved_recipes.invoke({})
    assert "Tacos" in listed
    assert "Fried Rice" in listed
