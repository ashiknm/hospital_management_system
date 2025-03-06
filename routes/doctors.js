const express = require('express');
const router = express.Router();
const db = require('../database');


router.get('/', (req, res) => {
  db.all('SELECT * FROM doctors', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});


router.get('/:id', (req, res) => {
  db.get('SELECT * FROM doctors WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(row);
  });
});

router.get('/:doctorId/appointments', (req, res) => {
    const doctorId = req.params.doctorId;
    const date = req.query.date;
    
    let query = 'SELECT * FROM appointments WHERE doctorId = ?';
    let params = [doctorId];
    
    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }
    
    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

module.exports = router;