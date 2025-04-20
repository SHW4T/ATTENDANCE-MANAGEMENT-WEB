import { db } from './firebase-init.js';
import { collection, addDoc, deleteDoc, doc, getDocs, setDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.getElementById("addStudentBtn").addEventListener("click", addStudent);
document.getElementById("removeStudentBtn").addEventListener("click", removeStudent);
document.getElementById("submitAttendanceBtn").addEventListener("click", submitAttendance);
document.getElementById("viewAttendanceBtn").addEventListener("click", viewAttendance);
document.getElementById("attendanceCourseSelect").addEventListener("change", loadStudents);
document.getElementById("countAttendanceBtn").addEventListener("click", countAttendance);
document.getElementById("generateReportBtn").addEventListener("click", generateReport);

// Add Student
async function addStudent() {
    const name = document.getElementById("studentName").value.trim();
    const course = document.getElementById("courseSelect").value;
    if (name) {
        try {
            await addDoc(collection(db, "students"), { name: name, course: course });
            alert("Student added successfully!");
            document.getElementById("studentName").value = '';
            loadStudents();
        } catch (error) {
            console.error("Error adding student: ", error);
        }
    } else {
        alert("Please enter a student name.");
    }
}

// Remove Student
async function removeStudent() {
    const studentId = document.getElementById("studentName").value.trim();
    if (studentId) {
        try {
            await deleteDoc(doc(db, "students", studentId));
            alert("Student removed successfully!");
            document.getElementById("studentName").value = '';
            loadStudents();
        } catch (error) {
            console.error("Error removing student: ", error);
        }
    } else {
        alert("Please enter a student ID to remove.");
    }
}

// Load Students for the selected course
async function loadStudents() {
    const attendanceList = document.getElementById("attendanceList");
    attendanceList.innerHTML = '';
    const selectedCourse = document.getElementById("attendanceCourseSelect").value;
    try {
        const q = query(collection(db, "students"), where("course", "==", selectedCourse));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const checkbox = `<input type="checkbox" value="${doc.id}">${doc.data().name}</input><br>`;
            attendanceList.innerHTML += checkbox;
        });
    } catch (error) {
        console.error("Error loading students: ", error);
    }
}

// Submit Attendance
async function submitAttendance() {
    const date = document.getElementById("attendanceDate").value;
    const course = document.getElementById("attendanceCourseSelect").value;
    if (!date) {
        alert("Please select a date.");
        return;
    }
    const attendanceData = {};
    document.querySelectorAll('input[type="checkbox"]:checked').forEach((checkbox) => {
        attendanceData[checkbox.value] = { present: true };
    });
    try {
        await setDoc(doc(db, "attendance", `${course}_${date}`), attendanceData);
        alert("Attendance submitted successfully!");
    } catch (error) {
        console.error("Error submitting attendance: ", error);
    }
}

// View Attendance
async function viewAttendance() {
    const date = document.getElementById("viewAttendanceDate").value;
    const course = document.getElementById("attendanceCourseSelect").value;
    if (!date) {
        alert("Please select a date.");
        return;
    }
    const reportDiv = document.getElementById("attendanceReport");
    reportDiv.innerHTML = '';
    try {
        const docRef = doc(db, "attendance", `${course}_${date}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const attendanceData = docSnap.data();
            const studentsSnapshot = await getDocs(collection(db, "students"));
            const students = {};
            studentsSnapshot.forEach((doc) => {
                students[doc.id] = { name: doc.data().name, course: doc.data().course };
            });

            for (const studentId in attendanceData) {
                const status = attendanceData[studentId]?.present ? "Present" : "Absent";
                const studentName = students[studentId]?.name || "Unknown Student";
                reportDiv.innerHTML += `${studentName} (${studentId} - ${students[studentId]?.course}): ${status}<br>`;
            }
        } else {
            reportDiv.innerHTML = "No attendance record found for this date.";
        }
    } catch (error) {
        console.error("Error fetching attendance: ", error);
    }
}

// Count Attendance for a specific date
async function countAttendance() {
    const date = document.getElementById("attendanceCountDate").value;
    const course = document.getElementById("attendanceCourseSelect").value;
    if (!date) {
        alert("Please select a date.");
        return;
    }

    try {
        const docRef = doc(db, "attendance", `${course}_${date}`);
        const docSnap = await getDoc(docRef);
        
        const attendanceCountsReport = document.getElementById("attendanceCountsReport");
        attendanceCountsReport.innerHTML = '';

        if (docSnap.exists()) {
            const attendanceData = docSnap.data();
            const presentCount = Object.keys(attendanceData).length;
            const totalStudents = await getTotalStudents(course);
            const absentCount = totalStudents - presentCount;

            attendanceCountsReport.innerHTML = `
                <p>Present Students: ${presentCount}</p>
                <p>Absent Students: ${absentCount}</p>
            `;
        } else {
            attendanceCountsReport.innerHTML = "No attendance record found for this date.";
        }
    } catch (error) {
        console.error("Error counting attendance: ", error);
    }
}

// Generate Attendance Report
async function generateReport() {
    const course = document.getElementById("reportCourseSelect").value;
    const month = document.getElementById("reportMonthSelect").value;

    if (!month) {
        alert("Please select a month.");
        return;
    }

    const reportData = [];
    const daysInMonth = new Date(month.split('-')[0], month.split('-')[1], 0).getDate(); // Get the number of days in the month

    // Create header row with dates
    const headerRow = ["Student Name"];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${month.split('-')[0]}-${month.split('-')[1]}-${String(day).padStart(2, '0')}`;
        headerRow.push(date);
    }
    reportData.push(headerRow);

    // Fetch all students in the selected course
    const studentsSnapshot = await getDocs(query(collection(db, "students"), where("course", "==", course)));
    const students = {};
    studentsSnapshot.forEach((doc) => {
        students[doc.id] = doc.data().name; // Store student names by ID
    });

    // Create a row for each student
    for (const studentId in students) {
        const studentRow = [students[studentId]];
        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${month.split('-')[0]}-${month.split('-')[1]}-${String(day).padStart(2, '0')}`;
            const docRef = doc(db, "attendance", `${course}_${date}`);
            const docSnap = await getDoc(docRef);
            const attendanceData = docSnap.exists() ? docSnap.data() : {};
            const status = attendanceData[studentId]?.present ? "P" : "A"; // "P" for present, "A" for absent
            studentRow.push(status);
        }
        reportData.push(studentRow);
    }

    // Create a new workbook and add the data
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, `${course} Attendance`);

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `${course} Attendance Report ${month}.xlsx`);
}

// Helper function to get total students in a course
async function getTotalStudents(course) {
    const q = query(collection(db, "students"), where("course", "==", course));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
}

// Load students on page load
window.onload = loadStudents;
