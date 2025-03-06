const tableStructures = {
    doctors: {
        name: "doctors",
        sql: `CREATE TABLE IF NOT EXISTS doctors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          doctorId TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL
        )`,
        sampleData: [
          { doctorId: "DOC001", name: "Dr. John Smith", start_time: "09:00", end_time: "17:00" },
          { doctorId: "DOC002", name: "Dr. Sarah Johnson", start_time: "08:00", end_time: "16:00" },
          { doctorId: "DOC003", name: "Dr. Michael Lee", start_time: "10:00", end_time: "18:00" }
        ]
    },

    appointments: {
        name: "appointments",
        sql: `CREATE TABLE IF NOT EXISTS appointments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          doctorId TEXT NOT NULL,
          date TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          FOREIGN KEY (doctorId) REFERENCES doctors (doctorId) ON DELETE CASCADE
        )`
      },
    
  };
  
  module.exports = tableStructures;