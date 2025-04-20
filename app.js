import { db } from './firebase-init.js';
import { collection, addDoc, deleteDoc, doc, getDocs, setDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const auth = getAuth();

window.addEventListener("DOMContentLoaded", () => {
    // Add event listeners for buttons
    document.getElementById("viewStudentsBtn").addEventListener("click", viewStudents);
    document.getElementById("viewAttendanceBtn").addEventListener("click", viewAttendance);
    document.getElementById("assignTeacherBtn").addEventListener("click", assignTeacher);
    document.getElementById("viewTeacherStudentsBtn").addEventListener("click", viewTeacherStudents);
    document.getElementById("submitTeacherAttendanceBtn").addEventListener("click", submitTeacherAttendance);
    document.getElementById("viewTeachersBtn").addEventListener("click", viewTeachers);
    document.getElementById("addStudentBtn").addEventListener("click", addStudent);
    document.getElementById("removeStudentBtn").addEventListener("click", removeStudent);

    // Login functionality
    document.getElementById("loginBtn").addEventListener("click", function() {
        const role = document.getElementById("roleSelect").value;
        const email = document.getElementById("emailInput").value.trim();
        const password = document.getElementById("passwordInput").value.trim();
        const loginResult = document.getElementById("loginResult");

        if (role === "admin") {
            if (password === "GSP1981") {
                // Show admin dashboard
                document.getElementById("loginScreen").style.display = "none";
                document.getElementById("adminDashboard").style.display = "block";
            } else {
                loginResult.innerText = "Incorrect admin password.";
            }
        } else if (role === "teacher") {
            // Verify teacher's email and password
            verifyTeacherCredentials(email, password);
        }
    });

    // Toggle sidebar visibility
    document.getElementById("menuIcon").addEventListener("click", function() {
        const sidebar = document.getElementById("sidebar");
        sidebar.classList.toggle("active");
    });

    // Close sidebar
    document.getElementById("closeIcon").addEventListener("click", function() {
        const sidebar = document.getElementById("sidebar");
        sidebar.classList.remove("active");
    });
});

// Admin Dashboard Functions
async function viewStudents() {
    const adminContent = document.getElementById("adminContent");
    const selectedCourse = document.getElementById("adminCourseSelect").value;
    adminContent.innerHTML = '';
    try {
        const studentsSnapshot = await getDocs(query(collection(db, "students"), where("course", "==", selectedCourse)));
        studentsSnapshot.forEach((doc) => {
            const studentInfo = `
                <div class="student-info">
                    <h3>${doc.data().name}</h3>
                    <p>Course: ${doc.data().course}</p>
                </div>
            `;
            adminContent.innerHTML += studentInfo;
        });
    } catch (error) {
        console.error("Error fetching students: ", error);
    }
}

async function viewAttendance() {
    const attendanceContent = document.getElementById("attendanceContent");
    const selectedCourse = document.getElementById("attendanceCourseSelect").value;
    const selectedDate = document.getElementById("attendanceDate").value;
    attendanceContent.innerHTML = '';

    if (!selectedDate) {
        alert("Please select a date.");
        return;
    }

    try {
        const docRef = doc(db, "attendance", `${selectedCourse}_${selectedDate}`);
        const docSnap = await getDoc(docRef);
        let presentCount = 0;
        let absentCount = 0;

        if (docSnap.exists()) {
            const attendanceData = docSnap.data();
            const totalStudentsSnapshot = await getDocs(query(collection(db, "students"), where("course", "==", selectedCourse)));
            const totalStudents = totalStudentsSnapshot.size; // Total students in the course

            for (const studentId in attendanceData) {
                const status = attendanceData[studentId]?.present ? "Present" : "Absent";
                const studentDoc = await getDoc(doc(db, "students", studentId));
                const studentName = studentDoc.exists() ? studentDoc.data().name : "Unknown Student";
                attendanceContent.innerHTML += `${studentName}: ${status}<br>`;
                
                // Count present students
                if (attendanceData[studentId]?.present) {
                    presentCount++;
                }
            }

            // Calculate absent students
            absentCount = totalStudents - presentCount;

        } else {
            attendanceContent.innerHTML = "No attendance record found for this date.";
        }

        // Update counts in the admin dashboard
        document.getElementById("presentCount").innerText = `Present Students: ${presentCount}`;
        document.getElementById("absentCount").innerText = `Absent Students: ${absentCount}`;

    } catch (error) {
        console.error("Error fetching attendance: ", error);
    }
}

async function assignTeacher() {
    const assignTeacherResult = document.getElementById("assignTeacherResult");
    const selectedCourse = document.getElementById("assignTeacherCourseSelect").value;
    const teacherEmail = document.getElementById("teacherEmail").value.trim();
    const teacherPassword = document.getElementById("teacherPassword").value.trim(); // Get password

    if (!teacherEmail || !teacherPassword) {
        alert("Please enter a teacher's email and password.");
        return;
    }

    try {
        // Create a new user with email and password
        await createUserWithEmailAndPassword(auth, teacherEmail, teacherPassword);
        
        // Assign the teacher to the course in Firestore
        await setDoc(doc(db, "teachers", teacherEmail), {
            course: selectedCourse,
            password: teacherPassword // Store the password in plain text
        });
        
        assignTeacherResult.innerHTML = `Teacher ${teacherEmail} assigned to ${selectedCourse} successfully!`;
    } catch (error) {
        console.error("Error assigning teacher: ", error.message); // Log the specific error message
        assignTeacherResult.innerHTML = `Error assigning teacher: ${error.message}`; // Display the error message
    }
}

// Teacher Dashboard Functions
async function loadTeacherCourses(email) {
    const teacherDoc = await getDoc(doc(db, "teachers", email));

    if (teacherDoc.exists()) {
        const assignedCourse = teacherDoc.data().course;
        document.getElementById("teacherCourseSelect").value = assignedCourse;
        document.getElementById("teacherCourseSelect").disabled = true; // Disable selection
        document.getElementById("viewTeacherAttendanceBtn").disabled = false;
    } else {
        document.getElementById("teacherCourseSelect").value = "";
        document.getElementById("teacherCourseSelect").disabled = true;
        document.getElementById("viewTeacherAttendanceBtn").disabled = true;
        alert("No teacher found with this email.");
    }
}

// Verify teacher's credentials and load dashboard
async function verifyTeacherCredentials(email, password) {
    const teacherDoc = await getDoc(doc(db, "teachers", email));
    if (teacherDoc.exists()) {
        const storedPassword = teacherDoc.data().password;
        if (password === storedPassword) {
            // Show teacher dashboard
            document.getElementById("loginScreen").style.display = "none";
            document.getElementById("teacherDashboard").style.display = "block";
            loadTeacherCourses(email); // Load assigned courses for the teacher
        } else {
            document.getElementById("loginResult").innerText = "Incorrect password.";
        }
    } else {
        document.getElementById("loginResult").innerText = "No teacher found with this email.";
    }
}

async function viewTeacherStudents() {
    const teacherContent = document.getElementById("teacherContent");
    teacherContent.innerHTML = '';
    const selectedCourse = document.getElementById("teacherCourseSelect").value;
    try {
        const studentsSnapshot = await getDocs(query(collection(db, "students"), where("course", "==", selectedCourse)));
        studentsSnapshot.forEach((doc) => {
            const studentInfo = `
                <div class="student-info">
                    <input type="checkbox" value="${doc.id}"> ${doc.data().name}
                </div>
            `;
            teacherContent.innerHTML += studentInfo;
        });
    } catch (error) {
        console.error("Error fetching students: ", error);
    }
}

async function submitTeacherAttendance() {
    const teacherContent = document.getElementById("teacherContent");
    const selectedCourse = document.getElementById("teacherCourseSelect").value;
    const selectedDate = document.getElementById("teacherAttendanceDate").value;

    if (!selectedDate) {
        alert("Please select a date.");
        return;
    }

    const attendanceData = {};
    const checkboxes = teacherContent.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach((checkbox) => {
        attendanceData[checkbox.value] = { present: true };
    });

    try {
        await setDoc(doc(db, "attendance", `${selectedCourse}_${selectedDate}`), attendanceData);
        alert("Attendance submitted successfully!");
    } catch (error) {
        console.error("Error submitting attendance: ", error);
    }
}

// Function to view teachers
async function viewTeachers() {
    const teachersContent = document.getElementById("teachersContent");
    teachersContent.innerHTML = '';
    try {
        const teachersSnapshot = await getDocs(collection(db, "teachers"));
        teachersSnapshot.forEach((doc) => {
            const teacherInfo = `
                <div class="teacher-info">
                    <h3>${doc.id}</h3>
                    <p>Assigned Course: ${doc.data().course}</p>
                </div>
            `;
            teachersContent.innerHTML += teacherInfo;
        });
    } catch (error) {
        console.error("Error fetching teachers: ", error);
    }
}

// Add Student Function
async function addStudent() {
    const studentName = document.getElementById("studentName").value.trim();
    const course = document.getElementById("teacherCourseSelect").value;

    if (!studentName || !course) {
        alert("Please enter a student name and select a course.");
        return;
    }

    try {
        const studentRef = await addDoc(collection(db, "students"), {
            name: studentName,
            course: course
        });
        alert(`Student ${studentName} added successfully!`);
        document.getElementById("studentName").value = ""; // Clear input
    } catch (error) {
        console.error("Error adding student: ", error);
    }
}

// Remove Student Function
async function removeStudent() {
    const studentName = document.getElementById("studentName").value.trim();
    const course = document.getElementById("teacherCourseSelect").value;

    if (!studentName || !course) {
        alert("Please enter a student name and select a course.");
        return;
    }

    try {
        const studentsSnapshot = await getDocs(query(collection(db, "students"), where("name", "==", studentName), where("course", "==", course)));
        studentsSnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
            alert(`Student ${studentName} removed successfully!`);
        });
        document.getElementById("studentName").value = ""; // Clear input
    } catch (error) {
        console.error("Error removing student: ", error);
    }
}
