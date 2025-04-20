# Attendance Management System

A modern, web-based attendance management system created for Grameen Shramik Pratishthan (GSP) during my rural internship (May–July 2024). This project enables admins and teachers to efficiently manage student records, assign teachers, and track daily attendance for multiple courses.

---

## Features

- **Role-based Login:** Separate dashboards for Admin and Teacher roles.
- **Admin Dashboard:**
  - View and manage students by course.
  - View daily attendance records with present/absent counts.
  - Assign teachers to courses and create their login credentials.
  - View all assigned teachers.
    
- **Teacher Dashboard:**
  - View assigned course and its students.
  - Mark and submit daily attendance.
  - Add or remove students from the course.
    
- **Firebase Integration:** All data (students, teachers, attendance) is securely stored and managed using Firebase Firestore and Authentication.
- **Responsive UI:** Clean, modern interface with support for dark mode.
- **Security:** Password-protected access for both admin and teachers.

---

## Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend/Database:** Firebase Firestore, Firebase Authentication
- **Design:** Responsive, mobile-friendly layout with Roboto font

---

## Getting Started

1. **Clone the repository:**
   
2. **Firebase Setup:**
- Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
- Enable Firestore Database and Authentication (Email/Password).
- Add your Firebase configuration to `firebase-init.js`.

3. **Run the Project:**
- Open `index.html` in your browser.
- The app is fully client-side and requires no server to run.

---

## About

This project was developed as part of my rural internship at Grameen Shramik Pratishthan (24 May 2024 – 24 July 2024), an NGO dedicated to empowering marginalized communities. The system is tailored to their needs for managing student and teacher attendance efficiently.

## Acknowledgements

- Thanks to the GSP team for their support and feedback.




