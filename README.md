# Hospital Management System - Doctor Scheduling API

A Node.js REST API for managing doctor schedules and availability in a hospital setting. Built with Express and SQLite.

## 🏥 Features

- Doctor information management
- Appointment scheduling
- Comprehensive availability calculation considering:
  - Regular working hours
  - Scheduled appointments
  - Breaks (daily and exceptional)
  - Leaves
  - Holidays
  - Weekly days off
- Available time slot generation

## 📊 Database Schema

The system uses SQLite with the following main tables:
- `doctors` - Doctor information with working hours
- `appointments` - Scheduled patient consultations
- `leaves` & `leave_types` - Leave management
- `daily_breaks` & `exception_breaks` - Break tracking
- `holidays` & `doctor_holiday_exemptions` - Holiday management
- `doctor_weekly_off` & `doctor_weekly_off_exceptions` - Weekly off schedule

## 🚀 Getting Started

### Prerequisites

- Node.js v14+ 
- npm v6+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/hospital-management-system.git
cd hospital-management-system

# Install dependencies
npm install

# Start the development server
npm run dev
```

The server will start on port 3000 by default (http://localhost:3000).

## 📘 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctors` | Get all doctors |
| GET | `/doctors/:id` | Get a specific doctor |
| GET | `/doctors/:doctorId/appointments` | Get a doctor's appointments |
| GET | `/doctors/:doctorId/available-slots/:date` | Get available time slots for a specific date |

## 🧪 Sample Request

```
GET /doctors/DOC001/available-slots/2025-03-07
```

Sample Response:
```json
{
  "doctorId": "DOC001",
  "date": "2025-03-07",
  "availability": "Available",
  "availableSlots": [
    {
      "start_time": "09:00",
      "end_time": "10:00"
    },
    {
      "start_time": "11:00",
      "end_time": "12:00"
    }
  ]
}
```

## 🛠️ Technology Stack

- **Backend**: Node.js, Express
- **Database**: SQLite3
- **Development**: Nodemon
