let cheatAttempts = 0;
const maxCheatAttempts = 3;

let examQuestions = [];
let currentQuestion = 0;
let score = 0;
let time = 1800;
let extraUsed = false;

let studentAnswers = [];

// ================== START EXAM ==================
function startExam() {
    const name = document.getElementById("studentName").value.trim();
    const classLevel = document.getElementById("classLevel").value;
    const subject = document.getElementById("subject").value;

    if (!name || !classLevel || !subject) {
        alert("Fill all fields!");
        return;
    }

    const studentData = {
        name: name,
        class: classLevel,
        subject: subject
    };

    console.log("Saving:", studentData); // ✅ DEBUG

    localStorage.setItem("currentStudent", JSON.stringify(studentData));

    window.location.href = "exam.html";
}

// ================== SHUFFLE ==================
function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

// ================== EXAM INIT ==================
if (window.location.pathname.includes("exam.html")) {
    initExam();
}

function initExam() {
    const currentStudent = JSON.parse(localStorage.getItem("currentStudent"));

    if (!currentStudent) {
        alert("No student info");
        return window.location.href = "index.html";
    }

    const { class: classLevel, subject } = currentStudent;

    if (!questionBank[classLevel] || !questionBank[classLevel][subject]) {
        alert("No questions available");
        examQuestions = [];
        return;
    }

    examQuestions = shuffle([...questionBank[classLevel][subject]]).slice(0, 50);
    studentAnswers = new Array(examQuestions.length).fill(null);

    createNavigator();
    loadQuestion();
    startTimer();

    document.getElementById("submitBtn")?.addEventListener("click", submitExam);
}

// ================== LOAD QUESTION ==================
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

// ================== NAVIGATION ==================
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
    document.querySelectorAll("#navigator button").forEach((btn, i) => {
        if (studentAnswers[i]) {
            btn.style.background = "green";
            btn.style.color = "#fff";
        } else {
            btn.style.background = "";
            btn.style.color = "";
        }
    });
}

// ================== PROGRESS ==================
function updateProgressBar() {
    const percent = ((currentQuestion + 1) / examQuestions.length) * 100;
    document.getElementById("progressBar").style.width = percent + "%";
}

// ================== TIMER ==================
function startTimer() {
    const interval = setInterval(() => {
        time--;

        const m = Math.floor(time / 60);
        const s = time % 60;

        document.getElementById("timer").innerText =
            `${m}:${s < 10 ? "0" : ""}${s}`;

        if (time <= 0) {
            clearInterval(interval);
            submitExam();
        }
    }, 1000);
}

console.log("Student Data:", currentStudent);

const examData = {
    student: currentStudent?.name,
    class: currentStudent?.class,
    subject: currentStudent?.subject,
    score: finalScore,
    total: examQuestions.length,
    date: new Date().toISOString(),
    answers: studentAnswers
};

console.log("Sending Data:", examData);
