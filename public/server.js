const express = require("express");
const path = require("path");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const { sendEmail } = require("./emailService");

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/submit", upload.array("attachments"), async (req, res) => {
  try {
    const data = req.body;
    const files = req.files;

    const emailData = {
      ...data,
      attachments: files
        ? files.map((file) => ({
            filename: file.originalname,
            path: file.path,
            contentType: file.mimetype,
          }))
        : [],
    };
    // console.log(emailData);
    const result = await sendEmail(emailData);
    if (result.success) {
      return res.status(200).json({
        ok: true,
        message: result.message,
      });
    } else {
      return res.status(result.status || 500).json({
        ok: false,
        error: {
          description: result.description || "Failed to send email.",
          code: result.code,
          traceId: result.traceId,
          correlationId: result.correlationId,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`App listening to port ${port}...`);
});
