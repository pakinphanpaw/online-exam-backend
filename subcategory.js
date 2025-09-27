const express = require('express');
const pool = require('./db'); 
const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subcategory'); 
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching subcategories', err.stack);
    res.status(500).send('Error fetching subcategories');
  }
});


router.post('/', async (req, res) => {
    const { subcategory_name, category_name } = req.body; 
  
    try {
    
      const categoryResult = await pool.query('SELECT category_id FROM category WHERE category_name = $1', [category_name]);
  
    
      if (categoryResult.rows.length === 0) {
        return res.status(404).send('Category not found');  
      }
  
      const category_id = categoryResult.rows[0].category_id; 
  
      const result = await pool.query(
        'INSERT INTO subcategory (subcategory_name, category_id) VALUES ($1, $2) RETURNING *',
        [subcategory_name, category_id]
      );
  
      res.status(201).json(result.rows[0]); 
    } catch (err) {
      console.error('Error inserting subcategory', err.stack);
      res.status(500).send('Error inserting subcategory'); 
    }
});



router.put('/:id', async (req, res) => {
    const { id } = req.params; 
    const { subcategory_name, category_name } = req.body;
    
    try {
      const categoryResult = await pool.query('SELECT category_id FROM category WHERE category_name = $1', [category_name]);
      if (categoryResult.rows.length === 0) {
        return res.status(404).send('Category not found');
      }
  
      const category_id = categoryResult.rows[0].category_id;
      const result = await pool.query(
        'UPDATE subcategory SET subcategory_name = $1, category_id = $2 WHERE subcategory_id = $3 RETURNING *',
        [subcategory_name, category_id, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).send('Subcategory not found');
      }
  
      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error('Error updating subcategory', err.stack);
      res.status(500).send('Error updating subcategory');
    }
  });
  


  

module.exports = router;
