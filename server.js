// ================= SERVER SETUP =================
const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔗 PUT YOUR REAL PASSWORD HERE
const MONGO_URL = "mongodb+srv://princegoldenie_db_user:admin123@cluster0.gjdwbdd.mongodb.net/?retryWrites=true&w=majority";

let db;

// ================= CONNECT TO MONGODB =================
MongoClient.connect(MONGO_URL)
    .then(client => {
        console.log("✅ Connected to MongoDB");
        db = client.db("cbtSystem");
    })
    .catch(err => {
        console.error("❌ MongoDB connection error:", err);
    });

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.static(__dirname));

// ================= SAVE RESULT =================
app.post("/results", async (req, res) => {
    try {
        const data = req.body;

        console.log("📥 Incoming:", data);

        const studentName = data.name || data.student;

        // ✅ STRONG VALIDATION
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

        // ✅ CLEAN OBJECT
        const newResult = {
            name: studentName,
            class: data.class,
            subject: data.subject,
            score: data.score,
            total: data.total || 0,
            date: data.date || new Date().toISOString(),
            answers: data.answers || []
        };

        // ✅ SAVE TO MONGODB
        await db.collection("results").insertOne(newResult);

        console.log("✅ Saved to MongoDB");

        res.json({
            success: true,
            message: "Result saved successfully"
        });

    } catch (err) {
        console.error("❌ SAVE ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ================= GET RESULTS =================
app.get("/results", async (req, res) => {
    try {
        const results = await db.collection("results").find().toArray();
        res.json(results);
    } catch (err) {
        console.error("❌ FETCH ERROR:", err);
        res.status(500).json({ error: "Cannot fetch results" });
    }
});

// ================= HOME =================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ================= START SERVER =================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});