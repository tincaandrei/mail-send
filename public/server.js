const express = require("express");
const path = require("path");

const { sendMail, sendEmail } = require("./emailService");

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/submit", (req, res) => {
  try {
    const data = req.body || {};
    sendEmail(data);
    res.status(200).json({ message: "Email sent succesfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  // console.log(formData);
});

app.listen(port, () => {
  console.log(`App listening to port ${port}...`);
});
