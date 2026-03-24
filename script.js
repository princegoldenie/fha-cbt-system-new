// ================= GLOBAL =================
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

    const studentData = { name, class: classLevel, subject };

    console.log("Saving student:", studentData);

    localStorage.setItem("currentStudent", JSON.stringify(studentData));
    window.location.href = "exam.html";
}

// ================= GET STUDENT =================
function getStudent() {
    try {
        return JSON.parse(localStorage.getItem("currentStudent"));
    } catch {
        return null;
    }
}

// ================= SHUFFLE =================
function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

// ================= INIT =================
if (window.location.pathname.includes("exam.html")) {
    initExam();
}

function initExam() {
    const student = getStudent();

    if (!student) {
        alert("Session expired. Restart exam.");
        window.location.href = "index.html";
        return;
    }

    console.log("Loaded student:", student);

    if (!questionBank[student.class] || !questionBank[student.class][student.subject]) {
        alert("No questions available.");
        return;
    }

    examQuestions = shuffle([...questionBank[student.class][student.subject]]).slice(0, 50);

    // 🔥 SAVE QUESTIONS (CRITICAL FIX)
    localStorage.setItem("examQuestions", JSON.stringify(examQuestions));

    studentAnswers = new Array(examQuestions.length).fill(null);

    createNavigator();
    loadQuestion();
    startTimer();

    document.getElementById("submitBtn")?.addEventListener("click", submitExam);
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
    updateProgress();
}

// ================= NAV =================
function createNavigator() {
    let html = "";
    for (let i = 0; i < examQuestions.length; i++) {
        html += `<button onclick="goToQuestion(${i})">${i + 1}</button>`;
    }
    document.getElementById("navigator").innerHTML = html;
}

function goToQuestion(i) {
    currentQuestion = i;
    loadQuestion();
}

function updateNavigator() {
    const btns = document.querySelectorAll("#navigator button");

    btns.forEach((btn, i) => {
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
function updateProgress() {
    const percent = ((currentQuestion + 1) / examQuestions.length) * 100;
    document.getElementById("progressBar").style.width = percent + "%";
}

// ================= TIMER =================
function startTimer() {
    timerInterval = setInterval(() => {
        time--;

        const min = Math.floor(time / 60);
        const sec = time % 60;

        document.getElementById("timer").innerText =
            `${min}:${sec < 10 ? "0" : ""}${sec}`;

        if (time <= 0) {
            clearInterval(timerInterval);
            submitExam();
        }
    }, 1000);
}

// ================= SUBMIT =================
async function submitExam() {
    console.log("Submitting exam...");

    const student = getStudent();

    // 🔥 RECOVER QUESTIONS (CRITICAL FIX)
    if (!examQuestions.length) {
        examQuestions = JSON.parse(localStorage.getItem("examQuestions")) || [];
    }

    if (!student || !examQuestions.length) {
        alert("Data missing. Restart exam.");
        window.location.href = "index.html";
        return;
    }

    let score = 0;
    examQuestions.forEach((q, i) => {
        if (studentAnswers[i] === q.correct) score++;
    });

    const examData = {
        student: student.name,
        class: student.class,
        subject: student.subject,
        score: score,
        total: examQuestions.length,
        date: new Date().toISOString(),
        answers: studentAnswers,
        questions: examQuestions
    };

    console.log("Sending:", examData);

    try {
        const res = await fetch("/results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(examData)
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        clearInterval(timerInterval);
        localStorage.removeItem("currentStudent");
        localStorage.removeItem("examQuestions");

        document.body.innerHTML = `
            <h1>✅ Exam Completed</h1>
            <h2>Score: ${score} / ${examQuestions.length}</h2>
            <a href="index.html">Go Home</a>
        `;
    } catch (err) {
        console.error(err);
        alert("Submission failed: " + err.message);
    }
}