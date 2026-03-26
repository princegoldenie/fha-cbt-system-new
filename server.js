// ================= SERVER SETUP =================
const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔗 YOUR MONGODB CONNECTION (you can later move to env)
const MONGO_URL = "mongodb+srv://princegoldenie_db_user:admin123@cluster0.gjdwbdd.mongodb.net/?retryWrites=true&w=majority";

let db;

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.static(__dirname));

// ================= START SERVER ONLY AFTER DB =================
async function startServer() {
    try {
        const client = new MongoClient(MONGO_URL);

        await client.connect();
        console.log("✅ MongoDB Connected");

        db = client.db("cbtSystem");

        // ================= ROUTES =================

        // 🔹 SAVE RESULT
        app.post("/results", async (req, res) => {
            try {
                const data = req.body;

                console.log("📥 Incoming:", data);

                const studentName = data.name || data.student;

                // ✅ VALIDATION
                if (
                    !studentName ||
                    !data.class ||
                    !data.subject ||
                    typeof data.score !== "number"
                ) {
                    return res.status(400).json({
                        error: "Incomplete result data",
                        received: data
                    });
                }

                const newResult = {
                    name: studentName,
                    class: data.class,
                    subject: data.subject,
                    score: data.score,
                    total: data.total || 0,
                    date: data.date || new Date().toISOString(),
                    answers: data.answers || []
                };

                await db.collection("results").insertOne(newResult);

                console.log("✅ Result saved");

                res.json({
                    success: true,
                    message: "Result saved successfully"
                });

            } catch (err) {
                console.error("❌ SAVE ERROR:", err);
                res.status(500).json({ error: "Server error" });
            }
        });

        // 🔹 GET RESULTS
        app.get("/results", async (req, res) => {
            try {
                const results = await db.collection("results").find().toArray();
                res.json(results);
            } catch (err) {
                console.error("❌ FETCH ERROR:", err);
                res.status(500).json({ error: "Cannot fetch results" });
            }
        });

        // 🔹 HOME
        app.get("/", (req, res) => {
            res.sendFile(path.join(__dirname, "index.html"));
        });

        // 🚀 START SERVER (ONLY AFTER DB IS READY)
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });

    } catch (err) {
        console.error("❌ MongoDB Connection Failed:", err);
    }
}

// ================= RUN =================
startServer();