let cheatAttempts = 0;
const maxCheatAttempts = 3;

let examQuestions = [];
let currentQuestion = 0;
let score = 0;
let time = 1800; // 30 minutes
let extraUsed = false;

let studentAnswers = [];

// ================== START EXAM ==================
function startExam() {
    let name = document.getElementById("studentName").value.trim();
    if (!name) {
        alert("Please enter your name");
        return;
    }

    let classLevel = document.getElementById("classLevel").value;
    let subject = document.getElementById("subject").value;

    localStorage.setItem("currentStudent", JSON.stringify({
        name,
        class: classLevel,
        subject
    }));

    window.location.href = "exam.html";
}

// ================== SHUFFLE ==================
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ================== EXAM SETUP ==================
if (window.location.pathname.includes("exam.html")) {
    let currentStudent = JSON.parse(localStorage.getItem("currentStudent"));
    if (!currentStudent) {
        alert("No student info found. Redirecting to start page.");
        window.location.href = "index.html";
    }

    let classLevel = currentStudent.class;
    let subject = currentStudent.subject;

    if (!questionBank[classLevel] || !questionBank[classLevel][subject]) {
        alert("No questions available for this class and subject yet!");
        examQuestions = [];
    } else {
        let subjectQuestions = shuffle([...questionBank[classLevel][subject]]);
        examQuestions = subjectQuestions.slice(0, 50);
    }

    studentAnswers = new Array(examQuestions.length).fill(null);

    createNavigator();
    loadQuestion();
    startTimer();

    // ✅ Connect submit button
    document.getElementById("submitBtn")?.addEventListener("click", submitExam);
}

// ================== LOAD QUESTION ==================
function loadQuestion() {
    if (examQuestions.length === 0) {
        document.getElementById("question").innerText = "No questions available!";
        document.getElementById("options").innerHTML = "";
        return;
    }

    let q = examQuestions[currentQuestion];
    document.getElementById("question").innerText = `${currentQuestion + 1}. ${q.question}`;

    let options = shuffle([
        { key: "a", value: q.a },
        { key: "b", value: q.b },
        { key: "c", value: q.c },
        { key: "d", value: q.d }
    ]);

    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";
    options.forEach(o => {
        let btn = document.createElement("button");
        btn.innerText = o.value;
        btn.onclick = (e) => selectAnswer(o.key, e);
        if (studentAnswers[currentQuestion] === o.key) {
            btn.style.backgroundColor = "green";
            btn.style.color = "#fff";
        }
        optionsDiv.appendChild(btn);
    });

    updateNavigator();
    updateProgressBar();
}

// ================== SELECT ANSWER ==================
function selectAnswer(answer, event) {
    studentAnswers[currentQuestion] = answer;

    document.querySelectorAll("#options button").forEach(btn => {
        btn.style.backgroundColor = "";
        btn.style.color = "";
    });

    event.target.style.backgroundColor = "green";
    event.target.style.color = "#fff";

    updateNavigator();
}

// ================== PROGRESS BAR ==================
function updateProgressBar() {
    let progress = ((currentQuestion + 1) / examQuestions.length) * 100;
    document.getElementById("progressBar").style.width = progress + "%";
}

// ================== NAVIGATOR ==================
function createNavigator() {
    let navHTML = "";
    for (let i = 0; i < examQuestions.length; i++) {
        navHTML += `<button class="navBtn" onclick="goToQuestion(${i})">${i + 1}</button>`;
    }
    document.getElementById("navigator").innerHTML = navHTML;
}

function goToQuestion(index) {
    currentQuestion = index;
    loadQuestion();
}

function updateNavigator() {
    document.querySelectorAll(".navBtn").forEach((btn, i) => {
        if (studentAnswers[i]) {
            btn.style.backgroundColor = "green";
            btn.style.color = "#fff";
        } else {
            btn.style.backgroundColor = "";
            btn.style.color = "";
        }
    });
}

// ================== NEXT QUESTION ==================
document.getElementById("nextBtn")?.addEventListener("click", () => {
    if (currentQuestion < examQuestions.length - 1) currentQuestion++;
    loadQuestion();
});

// ================== TIMER ==================
function startTimer() {
    let timerInterval = setInterval(() => {
        time--;
        let minutes = Math.floor(time / 60);
        let seconds = time % 60;
        document.getElementById("timer").innerText = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
        if (time <= 0) {
            clearInterval(timerInterval);
            submitExam();
        }
    }, 1000);
}

// ================== ADD EXTRA TIME ==================
document.getElementById("addTimeBtn")?.addEventListener("click", () => {
    if (!extraUsed) {
        time += 300; // 5 minutes
        extraUsed = true;
        alert("Extra time added. Score will reduce by 5%");
    }
});

// ================== ANTI-CHEAT ==================
const warningDiv = document.createElement("div");
warningDiv.style.cssText = "position:fixed;top:10px;right:10px;background:red;color:white;padding:10px;display:none;z-index:9999;";
warningDiv.innerText = "⚠️ You switched tabs!";
document.body.appendChild(warningDiv);

function handleCheating() {
    cheatAttempts++;
    warningDiv.style.display = "block";
    setTimeout(() => warningDiv.style.display = "none", 3000);

    if (cheatAttempts >= maxCheatAttempts) {
        alert("❌ Maximum warnings reached. Exam will be submitted automatically.");
        submitExam();
    }
}

document.addEventListener("visibilitychange", () => { if (document.hidden) handleCheating(); });
window.addEventListener("blur", handleCheating);

// ================== SUBMIT EXAM ==================
async function submitExam() {
    console.log("Submitting exam..."); // ✅ Debug log
    score = 0;
    examQuestions.forEach((q, i) => {
        if (studentAnswers[i] === q.correct) score++;
    });

    let finalScore = extraUsed ? Math.floor(score * 0.95) : score;

    const currentStudent = JSON.parse(localStorage.getItem("currentStudent"));
    if (!currentStudent) return alert("Student info missing.");

    const examData = {
        name: currentStudent.name,
        class: currentStudent.class,
        subject: currentStudent.subject,
        score: finalScore,
        total: examQuestions.length,
        date: new Date().toLocaleString(),
        answers: studentAnswers,
        questions: examQuestions
    };

    try {
        const res = await fetch("/results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(examData)
        });
        const data = await res.json();
        if (data.success) {
            localStorage.removeItem("currentStudent");
            localStorage.removeItem("studentExamQuestions");
            document.body.innerHTML = `
                <h1>Exam Completed</h1>
                <h2>Your Score: ${finalScore} / ${examQuestions.length}</h2>
                <a href='admin.html'>Go to Admin Dashboard</a>
            `;
        } else {
            alert("Error submitting exam: " + (data.error || "Unknown error"));
        }
    } catch (err) {
        console.error(err);
        alert("Could not connect to server. Make sure the server is running.");
    }
}