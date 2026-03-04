# Attendance Tracker

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Header with title "Attendance Tracker" and subtitle
- Add Student Form with: student name input, status dropdown (Present/Absent/Late), date picker, and "Add Record" button
- Attendance Table with columns: Student Name | Date | Status | Actions (delete + edit)
- Color-coded status badges: green (Present), red (Absent), orange (Late)
- Summary cards showing: Total Students, Total Present, Total Absent, Total Late
- Search/filter by student name
- localStorage persistence for all records
- Smooth hover effects and responsive layout

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend: Store attendance records with fields: id, studentName, date, status. Expose CRUD operations (add, list, delete, update).
2. Frontend: Dashboard-style layout with card-based components, form, filterable table, and summary stats cards.
3. Data flow: Frontend reads/writes to backend; also mirrors to localStorage for offline resilience.
