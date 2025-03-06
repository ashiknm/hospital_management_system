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
  db.get('SELECT * FROM doctors WHERE doctorId = ?', [req.params.id], (err, row) => {
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

  router.get('/:doctorId/available-slots/:date', (req, res) => {
    const doctorId = req.params.doctorId;
    const date = req.params.date;
    
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ error: 'Valid date parameter is required in YYYY-MM-DD format' });
    }
  
    const requestDate = new Date(date);
    const dayOfWeek = requestDate.getDay();
    
    // First get the doctor's working hours
    db.get('SELECT start_time, end_time FROM doctors WHERE doctorId = ?', [doctorId], (err, doctor) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }
      
      console.log(`Checking availability for doctor ${doctorId} on ${date}`);
      
      Promise.all([
        // 1. Check if the doctor has appointments on the specified date
        new Promise((resolve, reject) => {
          db.all('SELECT start_time, end_time FROM appointments WHERE doctorId = ? AND date = ?', 
            [doctorId, date], (err, appointments) => {
              if (err) reject(err);
              else resolve(appointments || []);
          });
        }),
        
        // 2. Check if the doctor is on leave that day
        new Promise((resolve, reject) => {
          db.get('SELECT 1 FROM leaves WHERE doctorId = ? AND date = ?', 
            [doctorId, date], (err, leave) => {
              if (err) reject(err);
              else resolve(leave ? true : false);
          });
        }),
        
        // 3. Check if there are daily breaks
        new Promise((resolve, reject) => {
          db.all('SELECT start_time, end_time FROM daily_breaks WHERE doctorId = ?', 
            [doctorId], (err, dailyBreaks) => {
              if (err) reject(err);
              else resolve(dailyBreaks || []);
          });
        }),
        
        // 4. Check if there are exception breaks for this date
        new Promise((resolve, reject) => {
          db.all('SELECT start_time, end_time FROM exception_breaks WHERE doctorId = ? AND date = ?', 
            [doctorId, date], (err, exceptionBreaks) => {
              if (err) reject(err);
              else resolve(exceptionBreaks || []);
          });
        }),
        
        // 5. Check if it's a public holiday
        new Promise((resolve, reject) => {
          db.get(`SELECT h.id 
                  FROM holidays h 
                  LEFT JOIN doctor_holiday_exemptions e 
                    ON h.id = e.holiday_id AND e.doctorId = ? 
                  WHERE h.date = ? AND e.id IS NULL`, 
            [doctorId, date], (err, holiday) => {
              if (err) reject(err);
              else resolve(holiday ? true : false);
          });
        }),
        
        // 6. Check if it's a doctor-specific holiday
        new Promise((resolve, reject) => {
          db.get('SELECT 1 FROM doctor_specific_holidays WHERE doctorId = ? AND date = ?', 
            [doctorId, date], (err, doctorHoliday) => {
              if (err) reject(err);
              else resolve(doctorHoliday ? true : false);
          });
        }),
        
        // 7. Check if it's the doctor's weekly day off
        new Promise((resolve, reject) => {
          db.get(`SELECT 1 
                  FROM doctor_weekly_off 
                  WHERE doctorId = ? 
                  AND day_of_week = ? 
                  AND start_date <= ? 
                  AND (end_date IS NULL OR end_date >= ?)`, 
            [doctorId, dayOfWeek, date, date], (err, weeklyOff) => {
              if (err) reject(err);
              else resolve(weeklyOff ? true : false);
          });
        }),
        
        // 8. Check if there's an exception to the weekly day off
        new Promise((resolve, reject) => {
          db.get('SELECT 1 FROM doctor_weekly_off_exceptions WHERE doctorId = ? AND date = ?', 
            [doctorId, date], (err, weeklyOffException) => {
              if (err) reject(err);
              else resolve(weeklyOffException ? true : false);
          });
        })
      ])
      .then(([
        appointments, 
        isOnLeave, 
        dailyBreaks, 
        exceptionBreaks, 
        isHoliday, 
        isDoctorHoliday, 
        isWeeklyOff, 
        hasWeeklyOffException
      ]) => {
        if (isOnLeave || isHoliday || isDoctorHoliday || (isWeeklyOff && !hasWeeklyOffException)) {
          return res.json({ 
            doctorId, 
            date, 
            availability: "Not available", 
            availableSlots: [] 
          });
        }
        
        const workStartMinutes = convertTimeStringToMinutes(doctor.start_time);
        const workEndMinutes = convertTimeStringToMinutes(doctor.end_time);
        
        let unavailableTimes = [
          ...appointments.map(a => ({ 
            start: convertTimeStringToMinutes(a.start_time), 
            end: convertTimeStringToMinutes(a.end_time),
            type: 'appointment'
          })),
          ...dailyBreaks.map(b => ({ 
            start: convertTimeStringToMinutes(b.start_time), 
            end: convertTimeStringToMinutes(b.end_time),
            type: 'daily_break'
          })),
          ...exceptionBreaks.map(b => ({ 
            start: convertTimeStringToMinutes(b.start_time), 
            end: convertTimeStringToMinutes(b.end_time),
            type: 'exception_break'
          }))
        ];
        
        console.log('Unavailable times:', JSON.stringify(unavailableTimes, null, 2));
        
        unavailableTimes.sort((a, b) => a.start - b.start);
        
        let availableBlocks = [];
        let currentStart = workStartMinutes;
        
        // Minimum slot duration in minutes
        const minSlotDuration = 20;
        
        for (const unavailable of unavailableTimes) {
          // If current start is already past or at the end of the unavailable time, skip
          if (currentStart >= unavailable.end) {
            continue;
          }
          
          // If there's a gap between current position and start of unavailable time
          // and the gap is at least the minimum slot duration
          if (unavailable.start > currentStart && (unavailable.start - currentStart) >= minSlotDuration) {
            availableBlocks.push({
              start_time: convertMinutesToTimeString(currentStart),
              end_time: convertMinutesToTimeString(unavailable.start)
            });
          }
          
          // Move current position to the end of this unavailable block
          currentStart = Math.max(currentStart, unavailable.end);
        }
        
        // Add the final block if there's still time available after the last unavailable block
        if (currentStart < workEndMinutes && (workEndMinutes - currentStart) >= minSlotDuration) {
          availableBlocks.push({
            start_time: convertMinutesToTimeString(currentStart),
            end_time: convertMinutesToTimeString(workEndMinutes)
          });
        }
        
        // If preferred slot duration is specified, split blocks into slots
        const preferredSlotDuration = 60;
        let availableSlots = [];
        
        availableBlocks.forEach(block => {
          const blockStart = convertTimeStringToMinutes(block.start_time);
          const blockEnd = convertTimeStringToMinutes(block.end_time);
          const blockDuration = blockEnd - blockStart;
          
          if (blockDuration < preferredSlotDuration && blockDuration >= minSlotDuration) {
            availableSlots.push(block);
          } 

          else if (blockDuration >= preferredSlotDuration) {
            for (let slotStart = blockStart; slotStart + preferredSlotDuration <= blockEnd; slotStart += preferredSlotDuration) {
              availableSlots.push({
                start_time: convertMinutesToTimeString(slotStart),
                end_time: convertMinutesToTimeString(slotStart + preferredSlotDuration)
              });
            }
            
            const remainingStart = blockStart + (Math.floor((blockEnd - blockStart) / preferredSlotDuration) * preferredSlotDuration);
            const remainingDuration = blockEnd - remainingStart;
            
            if (remainingDuration >= minSlotDuration && remainingStart < blockEnd) {
              availableSlots.push({
                start_time: convertMinutesToTimeString(remainingStart),
                end_time: convertMinutesToTimeString(blockEnd)
              });
            }
          }
        });
        
        return res.json({
          doctorId,
          date,
          availability: availableSlots.length > 0 ? "Available" : "Fully booked",
          availableSlots
        });
      })
      .catch(error => {
        res.status(500).json({ error: error.message });
      });
    });
  });
  
  function convertTimeStringToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  function convertMinutesToTimeString(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

module.exports = router;