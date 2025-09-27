const express = require('express');
const router = express.Router();
const Category = require('./models/category'); 


router.post("/", async (req, res) => {
  const { name, tags } = req.body;

  try {
    
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(200).json({
        message: "Category already exists",
        category: existingCategory,
      });
    }

    
    const newCategory = new Category({ name, tags });
    const savedCategory = await newCategory.save();

    res.status(201).json({
      message: "Category created successfully",
      category: savedCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Error creating category", error: error.message });
  }
});



router.get('/tags', async (req, res) => {
  const { name } = req.query;

  try {
    const category = await Category.findOne({ name });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ tags: category.tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Error fetching tags', error });
  }
});


router.patch('/add-tags', async (req, res) => {
  const { name, tags } = req.body;

  if (!name || !tags || !Array.isArray(tags)) {
    return res.status(400).json({ message: 'Invalid input. "name" must be a string and "tags" must be an array.' });
  }
  try {
    const updatedCategory = await Category.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${name}$`, 'i') } }, 
      { $addToSet: { tags: { $each: tags } } }, 
      { new: true } 
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Tags added successfully', category: updatedCategory });
  } catch (err) {
    console.error('Error adding tags:', err);
    res.status(500).json({ message: 'An error occurred while adding tags.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find(); 
    res.status(200).json(categories);
  } catch (err) {
    console.error('Error fetching categories from MongoDB:', err);
    res.status(500).json({ message: 'Error fetching categories', error: err });
  }
});

router.patch('/tags/edit', async (req, res) => {
  const { name, oldTag, newTag } = req.body; 

  try {
    
    const category = await Category.findOne({ name });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

  
    const tagIndex = category.tags.indexOf(oldTag);
    if (tagIndex === -1) {
      return res.status(404).json({ message: 'Tag not found' });
    }


    category.tags[tagIndex] = newTag;
    await category.save();

    res.status(200).json({ message: 'Tag updated successfully', category });
  } catch (err) {
    console.error('Error editing tag:', err);
    res.status(500).json({ message: 'Error editing tag', error: err });
  }
});

router.delete('/tags/delete', async (req, res) => {
  const { name, tag } = req.body; 

  try {
    
    const category = await Category.findOne({ name });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }


    const tagIndex = category.tags.indexOf(tag);
    if (tagIndex === -1) {
      return res.status(404).json({ message: 'Tag not found' });
    }

 
    category.tags.splice(tagIndex, 1);
    await category.save();

    res.status(200).json({ message: 'Tag deleted successfully', category });
  } catch (err) {
    console.error('Error deleting tag:', err);
    res.status(500).json({ message: 'Error deleting tag', error: err });
  }
});


router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, tags } = req.body;

  try {

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, tags },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ message: 'Error updating category', error: err });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category deleted successfully', category: deletedCategory });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ message: 'Error deleting category', error: err });
  }
});

router.get('/tags', async (req, res) => {
  const { name } = req.query;

  try {
    const category = await Category.findOne({ name });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ tags: category.tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Error fetching tags', error });
  }
});
module.exports = router;
