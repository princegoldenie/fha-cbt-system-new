// === Admin Access Password Protection ===
const adminPassword = "FHA123";

document.addEventListener("DOMContentLoaded", async function() {
    let entered = prompt("Enter admin password to access the dashboard:");

    if (entered !== adminPassword) {
        alert("❌ Incorrect password! Redirecting to main page.");
        window.location.href = "index.html";
        return;
    }

    // Load results from server
    await loadResults();
});

// Map class name to level (optional for filtering)
function getLevel(className) {
    if (className.startsWith("Pry")) return "Pry";
    if (className.startsWith("JSS")) return "JSS";
    if (className.startsWith("SS")) return "SSS";
    return "";
}

// Load results from server JSON
async function loadResults() {
    try {
        const response = await fetch("/results");
        const allResults = await response.json();
        displayResults(allResults);
    } catch (err) {
        console.error("Error loading results:", err);
        alert("Failed to load results from server.");
    }
}

// Display results in table
function displayResults(results) {
    const tbody = document.getElementById("resultsTable").querySelector("tbody");
    tbody.innerHTML = "";

    results.forEach((r, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td onclick="viewStudent(${index})" style="cursor:pointer;color:#8b5e3c;font-weight:bold">
                ${r.name}
            </td>
            <td>${r.class}</td>
            <td>${r.subject}</td>
            <td>${r.score}</td>
            <td>${r.total}</td>
            <td>${r.date}</td>
        `;
        tbody.appendChild(row);
    });
}

// View student answers
async function viewStudent(index) {
    try {
        const res = await fetch("/results");
        const allResults = await res.json();
        const student = allResults[index];

        let reviewHTML = `
            <h2>${student.name}</h2>
            <p>Class: ${student.class}</p>
            <p>Subject: ${student.subject}</p>
            <hr>
        `;

        if (student.questions && student.answers) {
            student.questions.forEach((q, i) => {
                const studentAnswer = student.answers[i];
                const correct = q.correct;
                const isCorrect = studentAnswer === correct;

                reviewHTML += `
                    <p><b>Q${i + 1}:</b> ${q.question}</p>
                    <p>Student Answer: ${q[studentAnswer]}</p>
                    <p>Correct Answer: ${q[correct]} ${isCorrect ? "✅" : "❌"}</p>
                    <hr>
                `;
            });
        }

        document.body.innerHTML = reviewHTML;
    } catch (err) {
        console.error("Error viewing student:", err);
        alert("Failed to load student data.");
    }
}

// Export results as CSV
async function exportCSV() {
    try {
        const res = await fetch("/results");
        const allResults = await res.json();

        if (allResults.length === 0) {
            alert("No results available!");
            return;
        }

        let csv = "Name,Class,Subject,Score,Total,Date\n";
        allResults.forEach(r => {
            csv += `${r.name},${r.class},${r.subject},${r.score},${r.total},${r.date}\n`;
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "exam_results.csv";
        a.click();
        URL.revokeObjectURL(a.href);

    } catch (err) {
        console.error("Error exporting CSV:", err);
        alert("Failed to export CSV.");
    }
}

// Export results as PDF
async function exportPDF() {
    try {
        const res = await fetch("/results");
        const allResults = await res.json();

        if (allResults.length === 0) {
            alert("No results available!");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text("Exam Results", 14, 20);

        const headers = [["Name", "Class", "Subject", "Score", "Total", "Date"]];
        const rows = allResults.map(r => [r.name, r.class, r.subject, r.score, r.total, r.date]);

        doc.autoTable({ startY: 30, head: headers, body: rows });
        doc.save("exam_results.pdf");

    } catch (err) {
        console.error("Error exporting PDF:", err);
        alert("Failed to export PDF.");
    }
}