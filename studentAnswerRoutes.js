const express = require('express');
const pool = require('./mongo');
const router = express.Router();


router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM student_answer');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching student answers', err);
        res.status(500).send('Error fetching student answers');
    }
});


router.get('/:student_id', async (req, res) => {
    const { student_id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM student_answer WHERE student_id = $1', [student_id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching student answers by student_id', err);
        res.status(500).send('Error fetching student answers');
    }
});



router.get('/question/:question_id', async (req, res) => {
    const { question_id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM student_answer WHERE question_id = $1', [question_id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching student answers by question_id', err);
        res.status(500).send('Error fetching student answers');
    }
});


router.post('/', async (req, res) => {
    const { student_id, choice_id, question_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO student_answer (student_id, choice_id, question_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [student_id, choice_id, question_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error inserting student answer', err);
        res.status(500).send('Error inserting student answer');
    }
});


router.put('/:answer_id', async (req, res) => {
    const { answer_id } = req.params;
    const { choice_id } = req.body;
    try {
        const result = await pool.query(
            'UPDATE student_answer SET choice_id = $1, created_at = NOW() WHERE answer_id = $2 RETURNING *',
            [choice_id, answer_id]
        );
        res.json({ message: 'Answer updated successfully', answer: result.rows[0] });
    } catch (err) {
        console.error('Error updating student answer', err);
        res.status(500).send('Error updating student answer');
    }
});


router.delete('/:answer_id', async (req, res) => {
    const { answer_id } = req.params;
    try {
        await pool.query('DELETE FROM student_answer WHERE answer_id = $1', [answer_id]);
        res.json({ message: 'Answer deleted successfully' });
    } catch (err) {
        console.error('Error deleting student answer', err);
        res.status(500).send('Error deleting student answer');
    }
});

module.exports = router;
