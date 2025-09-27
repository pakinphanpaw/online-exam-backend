const express = require('express');
const pool = require('./db');
const router = express.Router();


router.post('/calculate-score', async (req, res) => {
    const { user_id, exam_id } = req.body; 

    try {
 
        const studentCheck = await pool.query(
            `SELECT * FROM users 
             WHERE user_id = $1 
             AND role_id = (SELECT role_id FROM roles WHERE role_name = 'student')`,
            [user_id]
        );

        if (studentCheck.rows.length === 0) {
            return res.status(403).json({ error: "Unauthorized: Not a student" });
        }

        const studentAnswers = await pool.query(
            `SELECT sa.choice_id, c.iscorrect 
             FROM student_answer sa 
             JOIN choice c ON sa.choice_id = c.choice_id 
             WHERE sa.user_id = $1 
             AND sa.question_id IN (SELECT question_id FROM question WHERE exam_id = $2)`,
            [user_id, exam_id]
        );

        if (studentAnswers.rows.length === 0) {
            return res.status(404).json({ error: "No answers found for this student in the exam" });
        }

        
        const totalScore = studentAnswers.rows.filter(ans => ans.iscorrect).length;
        const result = await pool.query(
            `INSERT INTO student_exam_result (user_id, exam_id, total_score, completed_at)
             VALUES ($1, $2, $3, NOW()) RETURNING *`,
            [user_id, exam_id, totalScore]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error calculating score', err);
        res.status(500).json({ error: 'Error calculating score' });
    }
});





router.get('/:student_id/:exam_id', async (req, res) => {
    const { student_id, exam_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT * FROM student_exam_result WHERE student_id = $1 AND exam_id = $2`,
            [student_id, exam_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No exam result found' });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error('Error fetching student exam result', err);
        res.status(500).send('Error fetching student exam result');
    }
});

module.exports = router;
