const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const tableStructures = require('./tableStructures');


const dbPath = path.resolve(__dirname, 'hospital.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    createTables();
  }
});


function createTables() {
  Object.values(tableStructures).forEach(table => {
    if (table.enabled === false) return;
    
    db.run(table.sql, (err) => {
      if (err) {
        console.error(`Error creating ${table.name} table`, err.message);
      } else {
        console.log(`${table.name} table ready`);
        if (table.sampleData && table.name === 'doctors') {
          insertSampleDoctors(table.sampleData);
        }
      }
    });
  });
}

function insertSampleDoctors() {
    if (tableStructures.doctors.sampleData) {
      tableStructures.doctors.sampleData.forEach(doctor => {
        db.run(
          'INSERT OR IGNORE INTO doctors (doctorId, name, start_time, end_time) VALUES (?, ?, ?, ?)',
          [doctor.doctorId, doctor.name, doctor.start_time, doctor.end_time],
          function(err) {
            if (err) {
              console.error('Error inserting doctor', err.message);
            } else if (this.changes > 0) {
              console.log(`Doctor added with ID ${this.lastID}`);
            }
          }
        );
      });
    }
}  

module.exports = db;