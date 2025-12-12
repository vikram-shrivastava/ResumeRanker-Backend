import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
// Load your LaTeX template from file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const latexTemplate = fs.readFileSync(
  path.join(__dirname, "../templates/resume-template.tex"),
  "utf-8"
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateTailoredResume = async (resumeText, jobDescription, dataForResume = {}) => {
  try {
    // Build prompt for OpenAI
    const prompt = `
You are an expert ATS-friendly resume writer and LaTeX formatter.

### TASK:
Tailor the resume based on:
- User's existing resume: ${resumeText}
- Job description: ${jobDescription}
- Additional user-provided data: ${JSON.stringify(dataForResume, null, 2)}

### RULES:
1. Use only factual content from the inputs. Do NOT invent any jobs, degrees, dates, or metrics.
2. Rewrite the summary, experience bullets, projects, and skills to align with the job description.
3. Include additional projects, skills, or achievements from the dataForResume if provided.
4. Return ONLY LaTeX code, using the template below.
5. Keep formatting consistent with the template.
6. Ensure the resume is ATS-friendly and readable.
7. Keep the length to 1 page maximum.
8. Use the section heading only those which are present in the resume content of ${resumeText}.
Don't include any sections that are not present in the original resume or in the additional user-provided data.

example: If the template has a "Certifications" section but the resume text and additional data do not mention any certifications, do NOT include that section in the final LaTeX output.

Follow this LaTeX template structure but include only the sections that have content based on the above rules.

### LATEX TEMPLATE:
this is the latex template:
${latexTemplate}

### OUTPUT:
Return the final tailored LaTeX resume code. DO NOT include explanations or extra text.
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: "You are an expert LaTeX resume writer." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    // Extract LaTeX code from response
    const latexCode = response.choices[0].message.content;

    return latexCode;
  } catch (err) {
    console.error("Error generating tailored resume:", err);
    throw new Error("Failed to generate tailored resume");
  }
};

export default generateTailoredResume;
