import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import fs from "fs";

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
You are an AI that adapts information from a CV to the job application. Everything in JSON format, tailored exclusively to the position, maintaining:

✔ All your original objects (role, company, years, etc.)
✔ I only rewrite the tasks to fit the position
✔ Skills filtered according to the position (only those you actually have)
✔ Achievements and Certifications only if they are technically relevant
✔ Description in Spanish and English adapted to the role
✔ Absolutely nothing invented

1) Read the following job description that will be sent to you: "${jobDescription}"

2) Read this user profile (JSON) ${JSON.stringify(profileData)} 
  
  that contains all the CV information

3) Generate a professional Description in Spanish tailored to the position (field: summary.es).

4) Generate the same Description in English (field: summary.en).

5) Select only the candidate's relevant skills.

6) Select relevant achievements (if none are relevant, return empty [].

7) Select relevant certifications (if none are relevant, return empty [].

8) Adapt the tasks of the work experience to fit the job description

9) Respond **only in valid JSON** with this structure:
${{
  description: { es: "", en: "" },
  skills: [{ name: "", level: 0 }],
  certifications: [
    {
      name: { es: "", en: "" },
      issuer: { es: "", en: "" },
      year: { es: "", en: "" },
      hours: { es: "", en: "" },
    },
  ],
  achievements: [
    {
      title: {
        es: "",
        en: "",
      },
      company: {
        es: "",
        en: "",
      },
      year: { en: "", es: "" },
    },
  ],
  experience: [
    {
      role: {
        es: "",
        en: "",
      },
      company: {
        es: "",
        en: "",
      },
      years: { es: "", en: "" },
      tasks: {
        es: [""],
        en: [""],
      },
    },
  ],
}}

Don't explain anything. Just return the JSON.
`;

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

app.post("/create-theme", (req, res) => {
  const { esName, enName, primary, secondary, image } = req.body;
  const themeClass = enName.toLowerCase().replace(/\s+/g, "");

  const newThemeStyle = `
    .theme-${themeClass} {
      --color-primary: ${primary};
      --color-secondary: ${secondary};
    }
    `;

  fs.appendFileSync("./../cv-ia-frontend/src/styles.scss", newThemeStyle);

  const newThemeInCV = `
    .theme-card.${themeClass} {
      background: ${primary};
    }
    .span-color.${themeClass} {
      background: ${secondary} !important;
      color: white !important;
      width: 80px;
    }
    `;

  fs.appendFileSync("./../cv-ia-frontend/src/app/pages/cv/cv.scss", newThemeInCV);

  const key = enName.toUpperCase().replace(/\s+/g, "_");
  addTranslation("es", key, esName);
  addTranslation("en", key, enName);

  const cvPath = "./../cv-ia-frontend/src/app/pages/cv/cv.html";
  let html = fs.readFileSync(cvPath, "utf-8");

  const block = `
    <div class="theme-card ${themeClass}" (click)="changeTheme('theme-${themeClass}'); showThemeSelector = false">
      <h4>{{ '${key}' | translate }}</h4>
      <div class="tags">
        <span class="span-color ${themeClass}">Energy</span>
        <span style="background-color: white; color: ${secondary}; font-weight: bold">Passion</span>
        <span class="span-color ${themeClass}">Danger</span>
      </div>
    </div>
`;

  if (!html.includes(`theme-card ${themeClass}`)) {
    html = html.replace(
      `<div class="theme-grid">`,
      `<div class="theme-grid">${block}`
    );

    fs.writeFileSync(cvPath, html, "utf-8");
  }

  res.json({ status: "ok" });
});

function addTranslation(lang, key, value) {
  const path = `./../cv-ia-frontend/public/assets/i18n/${lang}.json`;
  const file = JSON.parse(fs.readFileSync(path, "utf8"));
  file[key.toUpperCase()] = value;
  fs.writeFileSync(path, JSON.stringify(file, null, 2));
}
