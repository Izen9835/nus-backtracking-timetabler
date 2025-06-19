const express = require('express');

const app = express();
app.use(express.json());


app.get("/status", (request, response) => {
    const status = {
        "Status": "Running"
    };

    response.send(status);
});


app.post("/add", (req, res) => {
    const { a, b } = req.body;
    if (typeof a !== "number" || typeof b !== "number") {
        return res.status(400).json({ error: "Both 'a' and 'b' must be numbers." });
    }
    res.json({ answer: a + b });
});



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server listening on port: ", PORT);
});