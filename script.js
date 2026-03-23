// ================= GLOBAL VARIABLES =================
let examQuestions = [];
let currentQuestion = 0;
let studentAnswers = [];
let time = 1800;
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
        name,
        class: classLevel,
        subject
    };

    // Save properly
    localStorage.setItem("currentStudent", JSON.stringify(studentData));

    window.location.href = "exam.html";
}

// ================= GET STUDENT =================
function getCurrentStudent() {
    try {
        return JSON.parse(localStorage.getItem("currentStudent"));
    } catch {
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

    const classLevel = student.class;
    const subject = student.subject;

    if (!questionBank[classLevel] || !questionBank[classLevel][subject]) {
        alert("No questions available.");
        return;
    }

    examQuestions = shuffle([...questionBank[classLevel][subject]]).slice(0, 50);
    studentAnswers = new Array(examQuestions.length).fill(null);

    createNavigator();
    loadQuestion();
    startTimer();

    document.getElementById("submitBtn")?.addEventListener("click", submitExam);
}

// ================= LOAD QUESTION =================
function loadQuestion() {
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

// ================= NEXT =================
document.getElementById("nextBtn")?.addEventListener("click", () => {
    if (currentQuestion < examQuestions.length - 1) {
        currentQuestion++;
        loadQuestion();
    }
});

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

// ================= SUBMIT =================
async function submitExam() {
    console.log("Submitting exam...");

    const student = getCurrentStudent();

    if (!student) {
        alert("Student data missing. Restart exam.");
        window.location.href = "index.html";
        return;
    }

    let score = 0;
    examQuestions.forEach((q, i) => {
        if (studentAnswers[i] === q.correct) score++;
    });

    const examData = {
        student: student.name, // IMPORTANT
        class: student.class,
        subject: student.subject,
        score: score,
        total: examQuestions.length,
        date: new Date().toISOString(),
        answers: studentAnswers
    };

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

        clearInterval(timerInterval);
        localStorage.removeItem("currentStudent");

        document.body.innerHTML = `
            <h1>✅ Exam Completed</h1>
            <h2>Score: ${score} / ${examQuestions.length}</h2>
            <a href="index.html">Go Home</a>
        `;

    } catch (err) {
        console.error(err);
        alert("❌ Submission failed: " + err.message);
    }
}