const express = require('express');
const pool = require('./db');
const router = express.Router();


router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Choice');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching choices', err);
        res.status(500).send('Error fetching choices');
    }
});


router.get('/:question_id', async (req, res) => {
    const { question_id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Choice WHERE question_id = $1', [question_id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching choices by question_id', err);
        res.status(500).send('Error fetching choices');
    }
});

router.post('/', async (req, res) => {
    const { choice_text, iscorrect, choice_order, question_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO Choice (choice_text, iscorrect, choice_order, question_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [choice_text, iscorrect, choice_order, question_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error inserting choice', err);
        res.status(500).send('Error inserting choice');
    }
});


router.put('/:choice_id', async (req, res) => {
    const { choice_id } = req.params;
    const { choice_text, iscorrect, choice_order } = req.body;
    try {
        const result = await pool.query(
            'UPDATE Choice SET choice_text = $1, iscorrect = $2, choice_order = $3 WHERE choice_id = $4 RETURNING *',
            [choice_text, iscorrect, choice_order, choice_id]
        );
        res.json({ message: 'Choice updated successfully', choice: result.rows[0] });
    } catch (err) {
        console.error('Error updating choice', err);
        res.status(500).send('Error updating choice');
    }
});


router.delete('/:choice_id', async (req, res) => {
    const { choice_id } = req.params;
    try {
        await pool.query('DELETE FROM Choice WHERE choice_id = $1', [choice_id]);
        res.json({ message: 'Choice deleted successfully' });
    } catch (err) {
        console.error('Error deleting choice', err);
        res.status(500).send('Error deleting choice');
    }
});

module.exports = router;
