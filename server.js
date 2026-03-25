
// ================= SERVER SETUP =================
const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔗 Replace with YOUR MongoDB URL
const MONGO_URL = "mongodb+srv://princegoldenie_db_user:<db_password>@cluster0.gjdwbdd.mongodb.net/?appName=Cluster0ERE";

let db;

// ================= CONNECT TO MONGODB =================
MongoClient.connect(MONGO_URL)
    .then(client => {
        console.log("✅ Connected to MongoDB");
        db = client.db("cbtSystem"); // database name
    })
    .catch(err => console.error("❌ MongoDB connection error:", err));

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.static(__dirname));

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
            typeof data.score === "undefined"
        ) {
            return res.status(400).json({
                error: "Incomplete result data",
                received: data
            });
        }

        const newResult = new Result({
            name: studentName,
            class: data.class,
            subject: data.subject,
            score: data.score,
            total: data.total || 0,
            date: data.date || new Date().toLocaleString(),
            answers: data.answers || [],
            questions: data.questions || []
        });

        await newResult.save();

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
// 🔹 GET ALL RESULTS
app.get("/results", async (req, res) => {
    try {
        const results = await db.collection("results").find().toArray();
        res.json(results);
    } catch (err) {
        console.error("❌ Fetch error:", err);
        res.status(500).json({ error: "Cannot fetch results" });
    }
});

// 🔹 HOME
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ================= START SERVER =================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
