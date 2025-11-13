import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/process-job", async (req, res) => {
  try {
    const { profileData, jobDescription } = req.body;

    if (!profileData || !jobDescription) {
      return res
        .status(400)
        .json({ error: "Missing data: profileData or jobDescription" });
    }

    const promptText = `
You are an AI that adapts information from a CV to the job application.
Your task is:

1) Read the following job description that will be sent to you: "${jobDescription}"

2) Read this user profile (JSON) ${JSON.stringify(
      profileData
    )} that contains all the CV information
3) Select and return only the information relevant to the position:
- Only relevant skills
- Only relevant certifications
- Only relevant achievements
4) Based on the summary I will send you, generate a new summary based on the job description in English and Spanish

5) Adapt the tasks of the work experience to fit the job description

6) Respond **only in valid JSON** with this structure:
{
  "summary": { "es": "", "en": "" },
  "skills": [
    { "name": "", "level": 0 }
  ],
  "certifications": [
    {
      "name": { "es": "", "en": "" },
      "issuer": { "es": "", "en": "" },
      "year": { "es": "", "en": "" },
      "hours": { "es": "", "en": "" }
    }
  ],
  "achievements": [
    {
      "title": {
        "es": "",
        "en": ""
      },
      "company": {
        "es": "",
        "en": ""
      },
      "year": { "en": "", "es": "" }
    }
  ],
  "experience": [
    {
      "role": {
        "es": "",
        "en": ""
      },
      "company": {
        "es": "",
        "en": ""
      },
      "years": { "es": "", "en": "" },
      "tasks": {
        "es": [
          ""
        ],
        "en": [
          ""
        ]
      }
    }
  ]
}

Don't explain anything. Just return the JSON.
`;
    console.log("Prompt sending to Ollama:", promptText);

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: promptText,
        stream: false,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Error in Ollama API response:",
        response.status,
        errorText
      );
      return res.status(response.status).json({
        error: `Ollama API error: ${response.statusText}`,
        details: errorText,
      });
    }
    console.log("Raw AI result:", result);
    if (!result || !result.response) {
      return res.json({ error: "The AI did not return a response" });
    }

    let text = result.response.trim();
    const jsonStart = text.indexOf("{");
    if (jsonStart > 0) text = text.substring(jsonStart);

    let aiData;
    try {
      aiData = JSON.parse(text);
    } catch {
      console.log("⚠️ Could not parse exact JSON, returning raw text");
      return res.json({ rawText: text });
    }

    return res.json(aiData);
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "Error processing request" });
  }
});

app.listen(4000, () => {
  console.log("✅ Server ready at http://localhost:4000");
});
