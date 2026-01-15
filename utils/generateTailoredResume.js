import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
    const prompt = `
You are an expert ATS-friendly resume writer and LaTeX formatter.

Tailor the resume based on:
- User's existing resume: ${resumeText}
- Job description: ${jobDescription}
- Additional user-provided data: ${JSON.stringify(dataForResume, null, 2)}

Rules:
- The Resume should follow Header, Profile Summary,Education, Experience (if any else skip), Projects, Achievements.
- Remember to format the resume strictly in LaTeX using the provided template.
- Focus on tailoring the content to match the job description.
- Don't include any explanations or notes, only provide the LaTeX code.
- Keep the length to 1 page maximum that is less than 500 words.

Guidelines:
- Use only factual content from the inputs.
- Don't add too much text in the profile summary; keep it concise and relevant to jd.
- Rewrite summary, experience bullets, projects, and skills to match the job description.
- Don't add irrelevant experience or skills.
- Include additional projects, skills, or achievements from dataForResume.
- Include only sections with content. Do NOT include empty sections.
- Keep formatting consistent with the provided LaTeX template.
- Keep the resume 1 page maximum that is less than 500 words.
- ATS-friendly and readable.
- **Do NOT add backticks, Markdown, JSON, or any extra text.**
- Start exactly with:

%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%-------------------------

- End exactly with:
\end{document}

LaTeX Template:
${latexTemplate}

Return the **pure LaTeX code** only. The output should be ready to compile with pdflatex.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: "You are an expert LaTeX resume writer." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const latexCode = response.choices[0].message.content;

    // Strip any accidental backticks (safety net)
    return latexCode.replace(/^```(?:latex)?\n/, "").replace(/```$/, "");
  } catch (err) {
    console.error("Error generating tailored resume:", err);
    throw new Error("Failed to generate tailored resume");
  }
};

export default generateTailoredResume;
