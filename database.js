const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const tableStructures = require('./tableStructures');

const dbPath = path.resolve(__dirname, 'hospital.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.error('Error enabling foreign keys:', err.message);
      } else {
        initializeDatabase();
      }
    });
  }
});

function initializeDatabase() {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
      console.error('Error checking existing tables:', err.message);
      return;
    }
    
    const existingTables = tables.map(t => t.name);
    createTablesSequentially(Object.values(tableStructures), existingTables, () => {
      insertSampleData();
    });
  });
}

function createTablesSequentially(tables, existingTables, callback, index = 0) {
  if (index >= tables.length) {
    callback();
    return;
  }
  
  const table = tables[index];
  if (table.enabled === false || existingTables.includes(table.name)) {
    createTablesSequentially(tables, existingTables, callback, index + 1);
  } else {
    db.run(table.sql, (err) => {
      if (err) {
        console.error(`Error creating ${table.name} table:`, err.message);
      } else {
        existingTables.push(table.name);
      }
      createTablesSequentially(tables, existingTables, callback, index + 1);
    });
  }
}

function insertSampleData() {
  const insertionOrder = [
    'doctors',
    'break_types',
    'leave_types',
    'holidays',
    'daily_breaks',
    'leaves',
    'appointments',
    'exception_breaks',
    'doctor_holiday_exemptions',
    'doctor_specific_holidays',
    'doctor_weekly_off',
    'doctor_weekly_off_exceptions'
  ];

  // First check if any table already has data
  const promises = insertionOrder.map(tableName => {
    return new Promise((resolve) => {
      if (!tableStructures[tableName]) {
        resolve({ tableName, hasData: false });
        return;
      }
      
      db.get(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, result) => {
        if (err) {
          console.error(`Error checking ${tableName} for data:`, err.message);
          resolve({ tableName, hasData: false });
        } else {
          resolve({ tableName, hasData: result.count > 0 });
        }
      });
    });
  });
  
  Promise.all(promises).then(results => {
    // Create a map of tables and whether they have data
    const tableDataMap = {};
    results.forEach(result => {
      if (tableStructures[result.tableName]) {
        tableDataMap[result.tableName] = result.hasData;
      }
    });
    
    // Only insert data for tables that don't already have data
    const tablesToInsert = insertionOrder.filter(tableName => 
      tableStructures[tableName] && 
      tableStructures[tableName].sampleData && 
      !tableDataMap[tableName]
    );
    
    if (tablesToInsert.length === 0) {
      return;
    }
    
    insertTablesSequentially(tablesToInsert, 0);
  });
}

function insertTablesSequentially(tableNames, index) {
  if (index >= tableNames.length) {
    return;
  }
  
  const tableName = tableNames[index];
  const table = tableStructures[tableName];
  
  if (!table || !table.sampleData || !table.sampleData.length) {
    insertTablesSequentially(tableNames, index + 1);
    return;
  }
  
  // Check if table already has data
  db.get(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, result) => {
    if (err) {
      console.error(`Error checking ${tableName} for data:`, err.message);
      // Continue to next table on error
      insertTablesSequentially(tableNames, index + 1);
      return;
    }
    
    if (result.count > 0) {
      insertTablesSequentially(tableNames, index + 1);
      return;
    }
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      const columns = Object.keys(table.sampleData[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      const stmt = db.prepare(sql);
      
      table.sampleData.forEach(data => {
        const values = columns.map(col => data[col]);
        stmt.run(values, function(err) {
          if (err) {
            console.error(`Error inserting into ${tableName}:`, err.message);
          }
        });
      });
      
      stmt.finalize();
      db.run('COMMIT', (err) => {
        if (err) {
          console.error(`Error committing ${tableName} transaction:`, err.message);
        }
        
        insertTablesSequentially(tableNames, index + 1);
      });
    });
  });
}

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    }
    process.exit(0);
  });
});

module.exports = db;