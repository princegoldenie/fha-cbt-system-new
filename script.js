// ================= GLOBAL STATE =================
let examQuestions = [];
let currentQuestion = 0;
let studentAnswers = [];
let time = 1800; // 30 mins
let timerInterval = null;
let isSubmitting = false;

// ================= START EXAM =================
function startExam() {
    const name = document.getElementById("studentName")?.value.trim();
    const classLevel = document.getElementById("classLevel")?.value;
    const subject = document.getElementById("subject")?.value;

    if (!name || !classLevel || !subject) {
        alert("Please fill all fields");
        return;
    }

    const student = { name, class: classLevel, subject };

    localStorage.setItem("currentStudent", JSON.stringify(student));

    window.location.href = "exam.html";
}

// ================= SAFE GET =================
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

// ================= INIT AFTER DOM =================
document.addEventListener("DOMContentLoaded", () => {

    if (!window.location.pathname.includes("exam.html")) return;

    initExam();

    document.getElementById("nextBtn")?.addEventListener("click", () => {
        if (currentQuestion < examQuestions.length - 1) {
            currentQuestion++;
            loadQuestion();
        }
    });

    document.getElementById("submitBtn")?.addEventListener("click", () => {
        submitExam(false);
    });
});

// ================= INIT EXAM =================
function initExam() {
    const student = getStudent();

    if (!student) {
        alert("Session expired. Restart exam.");
        window.location.href = "index.html";
        return;
    }

    if (typeof questionBank === "undefined") {
        alert("Question bank not loaded.");
        return;
    }

    if (!questionBank[student.class] || !questionBank[student.class][student.subject]) {
        alert("No questions found.");
        return;
    }

    examQuestions = shuffle([...questionBank[student.class][student.subject]]).slice(0, 50);

    // fallback safety (never empty)
    if (examQuestions.length === 0) {
        examQuestions = [{
            question: "Demo Question: 2 + 2 = ?",
            a: "3", b: "4", c: "5", d: "6",
            correct: "b"
        }];
    }

    studentAnswers = new Array(examQuestions.length).fill(null);

    createNavigator();
    loadQuestion();
    startTimer();
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

function goToQuestion(i) {
    currentQuestion = i;
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

// ================= PROGRESS =================
function updateProgressBar() {
    const percent = ((currentQuestion + 1) / examQuestions.length) * 100;
    document.getElementById("progressBar").style.width = percent + "%";
}

// ================= TIMER =================
function startTimer() {
    timerInterval = setInterval(() => {
        time--;

        const m = Math.floor(time / 60);
        const s = time % 60;

        document.getElementById("timer").innerText =
            `${m}:${s < 10 ? "0" : ""}${s}`;

        if (time <= 0) {
            clearInterval(timerInterval);
            submitExam(true); // auto submit
        }
    }, 1000);
}

// ================= SUBMIT =================
async function submitExam(auto = false) {
    if (isSubmitting) return; // prevent double click
    isSubmitting = true;

    console.log("Submitting exam...");

    const student = getStudent();

    if (!student) {
        alert("Student data missing.");
        isSubmitting = false;
        return;
    }

    // calculate score safely
    let score = 0;

    examQuestions.forEach((q, i) => {
        if (studentAnswers[i] === q.correct) score++;
    });

    const examData = {
        name: student.name || "Unknown",
        class: student.class || "Unknown",
        subject: student.subject || "Unknown",
        score: score || 0,
        total: examQuestions.length || 1,
        date: new Date().toISOString(),
        answers: studentAnswers || []
    };

    console.log("Sending:", examData);

    try {
        const res = await fetch("/results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(examData)
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Submission failed");

        clearInterval(timerInterval);
        localStorage.removeItem("currentStudent");

        document.body.innerHTML = `
            <h1>✅ Exam Completed</h1>
            <h2>Score: ${score} / ${examQuestions.length}</h2>
            <p>${auto ? "Auto-submitted (time ended)" : "Submitted successfully"}</p>
        `;

    } catch (err) {
        console.error(err);

        // fallback (NEVER lose submission)
        document.body.innerHTML = `
            <h1>⚠️ Submission Saved Locally</h1>
            <p>Server issue. Data stored on device.</p>
        `;

        localStorage.setItem("backupSubmission", JSON.stringify(examData));
    }

    isSubmitting = false;
}