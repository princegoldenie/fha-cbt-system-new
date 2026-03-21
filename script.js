// ================= GLOBAL VARIABLES =================
let examQuestions = [];
let currentQuestion = 0;
let studentAnswers = [];
let time = 1800; // 30 minutes
let timerInterval = null;

// ================= START EXAM =================
function startExam() {
    const name = document.getElementById("studentName").value.trim();
    const classLevel = document.getElementById("classLevel").value;
    const subject = document.getElementById("subject").value;

    if (!name || !classLevel || !subject) {
        alert("Please fill all fields");
        return;
    }

    const studentData = {
        name: name,
        class: classLevel,
        subject: subject
    };

    console.log("Saving student:", studentData);

    localStorage.setItem("currentStudent", JSON.stringify(studentData));
    function startExam() {
    let name = document.getElementById("studentName").value.trim();
    if (!name) {
        alert("Please enter your name");
        return;
    }

    let classLevel = document.getElementById("classLevel").value;
    let subject = document.getElementById("subject").value;

    const studentData = {
        name,
        class: classLevel,
        subject
    };

    // ✅ Save in TWO places (main + backup)
    localStorage.setItem("currentStudent", JSON.stringify(studentData));
    sessionStorage.setItem("currentStudentBackup", JSON.stringify(studentData));

    window.location.href = "exam.html";
}

    window.location.href = "exam.html";
}

// ================= SAFE GET STUDENT =================
function getCurrentStudent() {
    try {
        const data = JSON.parse(localStorage.getItem("currentStudent"));
        return data;
    } catch (e) {
        return null;
    }
}

// ================= SHUFFLE =================
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// ================= INIT EXAM =================
if (window.location.pathname.includes("exam.html")) {
    initExam();
}

function initExam() {
    const student = getCurrentStudent();

    if (!student) {
        alert("Session expired. Start again.");
        window.location.href = "index.html";
        return;
    }

    console.log("Loaded student:", student);

    const classLevel = student.class;
    const subject = student.subject;

    if (!questionBank[classLevel] || !questionBank[classLevel][subject]) {
        alert("No questions available for this selection.");
        return;
    }

    examQuestions = shuffle([...questionBank[classLevel][subject]]).slice(0, 50);
    studentAnswers = new Array(examQuestions.length).fill(null);

    createNavigator();
    loadQuestion();
    startTimer();

    // attach submit button safely
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
        submitBtn.addEventListener("click", submitExam);
    }
}

// ================= LOAD QUESTION =================
function loadQuestion() {
    if (!examQuestions.length) return;

    const q = examQuestions[currentQuestion];

    document.getElementById("question").innerText =
        `${currentQuestion + 1}. ${q.question}`;

    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";

    const options = shuffle([
        { key: "a", value: q.a },
        { key: "b", value: q.b },
        { key: "c", value: q.c },
        { key: "d", value: q.d }
    ]);

    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.innerText = opt.value;

        if (studentAnswers[currentQuestion] === opt.key) {
            btn.style.background = "green";
            btn.style.color = "#fff";
        }

        btn.onclick = () => {
            studentAnswers[currentQuestion] = opt.key;
            loadQuestion();
        };

        optionsDiv.appendChild(btn);
    });

    updateNavigator();
    updateProgressBar();
}

// ================= NAVIGATION =================
function createNavigator() {
    let html = "";
    for (let i = 0; i < examQuestions.length; i++) {
        html += `<button onclick="goToQuestion(${i})">${i + 1}</button>`;
    }
    document.getElementById("navigator").innerHTML = html;
}

function goToQuestion(index) {
    currentQuestion = index;
    loadQuestion();
}

function updateNavigator() {
    const buttons = document.querySelectorAll("#navigator button");

    buttons.forEach((btn, i) => {
        if (studentAnswers[i]) {
            btn.style.background = "green";
            btn.style.color = "#fff";
        } else {
            btn.style.background = "";
            btn.style.color = "";
        }
    });
}

// ================= NEXT BUTTON =================
const nextBtn = document.getElementById("nextBtn");
if (nextBtn) {
    nextBtn.addEventListener("click", () => {
        if (currentQuestion < examQuestions.length - 1) {
            currentQuestion++;
            loadQuestion();
        }
    });
}

// ================= PROGRESS =================
function updateProgressBar() {
    const percent = ((currentQuestion + 1) / examQuestions.length) * 100;
    document.getElementById("progressBar").style.width = percent + "%";
}

// ================= TIMER =================
function startTimer() {
    timerInterval = setInterval(() => {
        time--;

        const minutes = Math.floor(time / 60);
        const seconds = time % 60;

        document.getElementById("timer").innerText =
            `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

        if (time <= 0) {
            clearInterval(timerInterval);
            submitExam();
        }
    }, 1000);
}

// ================= SUBMIT EXAM =================
async function submitExam() {
    console.log("Submitting exam...");

    const student = getCurrentStudent();

    if (!student || !student.name || !student.class || !student.subject) {
        alert("Student data missing. Restart exam.");
        return;
    }

    // calculate score
    let score = 0;
    examQuestions.forEach((q, i) => {
        if (studentAnswers[i] === q.correct) score++;
    });

    const examData = {
        student: student.name, // ✅ MUST MATCH SERVER
        class: student.class,
        subject: student.subject,
        score: score,
        total: examQuestions.length,
        date: new Date().toISOString(),
        answers: studentAnswers
    };

    console.log("Sending to server:", examData);

    try {
        const res = await fetch("/results", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(examData)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Submission failed");
        }

        console.log("Server response:", data);

        clearInterval(timerInterval);
        localStorage.removeItem("currentStudent");

        document.body.innerHTML = `
            <h1>✅ Exam Completed</h1>
            <h2>Score: ${score} / ${examQuestions.length}</h2>
            <a href="index.html">Go Home</a>
        `;

    } catch (err) {
        console.error("Submit error:", err);
        alert("❌ Submission failed: " + err.message);
    }
}