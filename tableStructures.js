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
      {
        doctorId: "DOC001",
        name: "Dr. John Smith",
        start_time: "09:00",
        end_time: "17:00",
      },
      {
        doctorId: "DOC002",
        name: "Dr. Sarah Johnson",
        start_time: "08:00",
        end_time: "16:00",
      },
      {
        doctorId: "DOC003",
        name: "Dr. Michael Lee",
        start_time: "10:00",
        end_time: "18:00",
      },
    ],
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
        )`,
    sampleData: [
      {
        doctorId: "DOC001",
        date: "2025-03-06",
        start_time: "10:00",
        end_time: "11:00"
      },
      {
        doctorId: "DOC001",
        date: "2025-03-06",
        start_time: "14:00",
        end_time: "15:00"
      },
      {
        doctorId: "DOC002",
        date: "2025-03-06",
        start_time: "09:00",
        end_time: "10:00"
      }
    ]
  },

  leave_types: {
    name: "leave_types",
    sql: `CREATE TABLE IF NOT EXISTS leave_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      leave_name TEXT NOT NULL,
      max_days INTEGER NOT NULL
    )`,
    sampleData: [
      { token: "earned_leave", leave_name: "Earned Leave", max_days: 12 },
      { token: "sick_leave", leave_name: "Sick Leave", max_days: 5 },
      { token: "casual_leave", leave_name: "Casual Leave", max_days: 6 }
    ]
  },

  leaves: {
    name: "leaves",
    sql: `CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctorId TEXT NOT NULL,
      leave_type_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (doctorId) REFERENCES doctors (doctorId) ON DELETE CASCADE,
      FOREIGN KEY (leave_type_id) REFERENCES leave_types (id) ON DELETE CASCADE
    )`,
    sampleData: [
      {
        doctorId: "DOC001",
        leave_type_id: 2,
        date: "2025-03-07"
      },
      {
        doctorId: "DOC002",
        leave_type_id: 1,
        date: "2025-03-10"
      }
    ]
  },

  break_types: {
    name: "break_types",
    sql: `CREATE TABLE IF NOT EXISTS break_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    )`,
    sampleData: [
      { name: "Lunch", description: "Lunch break" },
      { name: "Meeting", description: "Team or department meeting" },
      { name: "Personal", description: "Personal time" }
    ]
  },

  daily_breaks: {
    name: "daily_breaks",
    sql: `CREATE TABLE IF NOT EXISTS daily_breaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctorId TEXT NOT NULL,
      break_type_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      FOREIGN KEY (doctorId) REFERENCES doctors (doctorId) ON DELETE CASCADE,
      FOREIGN KEY (break_type_id) REFERENCES break_types (id) ON DELETE CASCADE
    )`,
    comment: "These are standard daily breaks that apply every working day. Times can be as precise as needed (HH:MM).",
    sampleData: [
      {
        doctorId: "DOC001",
        break_type_id: 1,
        start_time: "12:00",
        end_time: "13:00"
      },
      {
        doctorId: "DOC001",
        break_type_id: 3,
        start_time: "15:00",
        end_time: "15:10" 
      },
      {
        doctorId: "DOC002",
        break_type_id: 1,
        start_time: "12:30",
        end_time: "13:30"
      },
      {
        doctorId: "DOC002",
        break_type_id: 2,
        start_time: "09:00",
        end_time: "09:30"
      }
    ]
  },

  exception_breaks: {
    name: "exception_breaks",
    sql: `CREATE TABLE IF NOT EXISTS exception_breaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctorId TEXT NOT NULL,
      date TEXT NOT NULL,
      break_type_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      FOREIGN KEY (doctorId) REFERENCES doctors (doctorId) ON DELETE CASCADE,
      FOREIGN KEY (break_type_id) REFERENCES break_types (id) ON DELETE CASCADE
    )`,
    comment: "Special case breaks for specific dates",
    sampleData: [
      {
        doctorId: "DOC001",
        date: "2025-03-08",
        break_type_id: 2, 
        start_time: "10:00",
        end_time: "12:00"
      },
      {
        doctorId: "DOC002",
        date: "2025-03-06",
        break_type_id: 3, 
        start_time: "14:50",
        end_time: "15:00"
      }
    ]
  },

  holidays: {
    name: "holidays",
    sql: `CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      UNIQUE(date)
    )`,
    comment: "Standard holidays that apply to all doctors by default",
    sampleData: [
      {
        name: "New Year's Day",
        date: "2025-01-01",
        description: "New Year's Day holiday"
      },
      {
        name: "Memorial Day",
        date: "2025-05-26", 
        description: "Memorial Day holiday"
      },
      {
        name: "Independence Day",
        date: "2025-07-04",
        description: "Independence Day holiday"
      },
      {
        name: "Labor Day",
        date: "2025-09-01",
        description: "Labor Day holiday"
      },
      {
        name: "Thanksgiving",
        date: "2025-11-27",
        description: "Thanksgiving holiday"
      },
      {
        name: "Christmas",
        date: "2025-12-25",
        description: "Christmas holiday"
      }
    ]
  },

  doctor_holiday_exemptions: {
    name: "doctor_holiday_exemptions",
    sql: `CREATE TABLE IF NOT EXISTS doctor_holiday_exemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctorId TEXT NOT NULL,
      holiday_id INTEGER NOT NULL,
      FOREIGN KEY (doctorId) REFERENCES doctors (doctorId) ON DELETE CASCADE,
      FOREIGN KEY (holiday_id) REFERENCES holidays (id) ON DELETE CASCADE,
      UNIQUE(doctorId, holiday_id)
    )`,
    comment: "Records cases where a doctor works on a standard holiday",
    sampleData: [
      {
        doctorId: "DOC001",
        holiday_id: 3
      },
      {
        doctorId: "DOC002",
        holiday_id: 5
      }
    ]
  },

  doctor_specific_holidays: {
    name: "doctor_specific_holidays",
    sql: `CREATE TABLE IF NOT EXISTS doctor_specific_holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctorId TEXT NOT NULL,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (doctorId) REFERENCES doctors (doctorId) ON DELETE CASCADE,
      UNIQUE(doctorId, date)
    )`,
    comment: "Special holidays that apply only to specific doctors",
    sampleData: [
      {
        doctorId: "DOC001",
        name: "Conference",
        date: "2025-04-15",
        description: "Attending medical conference"
      },
      {
        doctorId: "DOC002",
        name: "Religious Holiday",
        date: "2025-03-21",
        description: "Religious observance"
      }
    ]
  },

  doctor_weekly_off: {
    name: "doctor_weekly_off",
    sql: `CREATE TABLE IF NOT EXISTS doctor_weekly_off (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctorId TEXT NOT NULL,
      day_of_week INTEGER NOT NULL, 
      start_date TEXT NOT NULL,
      end_date TEXT,
      FOREIGN KEY (doctorId) REFERENCES doctors (doctorId) ON DELETE CASCADE,
      UNIQUE(doctorId, day_of_week, start_date)
    )`,
    comment: "Records weekly days off for doctors. day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday. start_date and end_date define when this recurring pattern is active; end_date can be NULL for indefinite recurrence",
    sampleData: [
      {
        doctorId: "DOC001",
        day_of_week: 0,
        start_date: "2025-01-01",
        end_date: null
      },
      {
        doctorId: "DOC001",
        day_of_week: 6,
        start_date: "2025-01-01",
        end_date: null
      },
      {
        doctorId: "DOC002",
        day_of_week: 2,
        start_date: "2025-02-01",
        end_date: "2025-05-31"
      },
      {
        doctorId: "DOC003",
        day_of_week: 5,
        start_date: "2025-01-01",
        end_date: null
      }
    ]
  },

  doctor_weekly_off_exceptions: {
    name: "doctor_weekly_off_exceptions",
    sql: `CREATE TABLE IF NOT EXISTS doctor_weekly_off_exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctorId TEXT NOT NULL,
      date TEXT NOT NULL,
      reason TEXT,
      FOREIGN KEY (doctorId) REFERENCES doctors (doctorId) ON DELETE CASCADE,
      UNIQUE(doctorId, date)
    )`,
    comment: "Records exceptions where a doctor works on their usual weekly off day",
    sampleData: [
      {
        doctorId: "DOC001",
        date: "2025-03-09",
        reason: "Covering for Dr. Lee"
      },
      {
        doctorId: "DOC002",
        date: "2025-02-04",
        reason: "Special clinic"
      },
      {
        doctorId: "DOC003",
        date: "2025-03-07",
        reason: "Emergency clinic coverage"
      }
    ]
  }
};

module.exports = tableStructures;