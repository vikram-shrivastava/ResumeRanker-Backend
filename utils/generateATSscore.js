const getDynamicKeywords = (text) => {
  const stopwords = new Set([
    "the", "and", "with", "from", "that", "this", "your", "you",
    "for", "are", "have", "will", "shall", "their", "they",
    "role", "responsibilities", "about", "work", "able"
  ]);

  return text
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .map(w => w.toLowerCase())
    .filter(w =>
      w.length > 3 &&
      !stopwords.has(w) &&
      !/^\d+$/.test(w)
    );
};


/* =====================================================
   MAIN ATS ANALYSIS FUNCTION
===================================================== */

const analyzeResumeATS = (resumeText, jobDescription) => {

  resumeText = resumeText.toLowerCase();
  jobDescription = jobDescription.toLowerCase();

  /* --------------------------------------------------
     1. CLARITY SCORE
  -------------------------------------------------- */
  const importantSections = [
    "experience",
    "education",
    "projects",
    "skills",
    "certifications",
    "summary",
    "achievements"
  ];

  const sectionCount = importantSections.filter(sec =>
    resumeText.includes(sec)
  ).length;

  const sectionScore = (sectionCount / importantSections.length) * 15;

  const bulletCount = (resumeText.match(/[-•*]/g) || []).length;
  const bulletScore = Math.min(8, bulletCount);

  const clarityScore = Math.min(23, sectionScore + bulletScore);


  /* --------------------------------------------------
     2. NUMBERS / IMPACT SCORE
  -------------------------------------------------- */
  const numberMatches = resumeText.match(/\b\d+(\.\d+)?%?|\d+x\b/g) || [];
  const numbersScore = Math.min(25, numberMatches.length * 3);


  /* --------------------------------------------------
     3. REQUIREMENT MATCH SCORE
  -------------------------------------------------- */
  const jdWords = jobDescription
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 4);

  const matchedJDWords = jdWords.filter(word =>
    resumeText.includes(word)
  );

  const requirementScore = jdWords.length === 0
    ? 0
    : Math.min(25, (matchedJDWords.length / jdWords.length) * 25);


  /* --------------------------------------------------
     4. TECH / SKILL KEYWORD SCORE
  -------------------------------------------------- */
  const jdKeywords = getDynamicKeywords(jobDescription);
  const resumeKeywords = getDynamicKeywords(resumeText);

  const keywordOverlap = jdKeywords.filter(word =>
    resumeKeywords.includes(word)
  );

  const techKeywordScore = jdKeywords.length === 0
    ? 0
    : Math.min(25, (keywordOverlap.length / jdKeywords.length) * 25);


  /* --------------------------------------------------
     FINAL ATS SCORE (0–100)
  -------------------------------------------------- */
  const totalATSScore = Math.round(
    clarityScore +
    numbersScore +
    requirementScore +
    techKeywordScore
  );


  /* --------------------------------------------------
     ROLE DETECTION (Lightweight, heuristic-based)
  -------------------------------------------------- */
  const roleDetected = (() => {
    if (resumeText.includes("react") || resumeText.includes("frontend"))
      return "Frontend Developer";
    if (resumeText.includes("node") || resumeText.includes("backend"))
      return "Backend Developer";
    if (resumeText.includes("machine learning") || resumeText.includes("data"))
      return "Data / ML Engineer";
    return "Software Engineer";
  })();


  /* --------------------------------------------------
     SUMMARY (Human-like, non-AI sounding)
  -------------------------------------------------- */
  const summary = `Your resume shows a ${totalATSScore >= 70 ? "strong" : "moderate"} alignment with the job requirements. Key technical skills are ${
    keywordOverlap.length > 0 ? "partially" : "poorly"
  } matched, and the resume ${
    numbersScore > 10 ? "effectively demonstrates impact using metrics." : "would benefit from adding measurable achievements."
  }`;


  /* --------------------------------------------------
     KEYWORDS FOUND / MISSING
  -------------------------------------------------- */
  const keywordsFound = [...new Set(keywordOverlap)].slice(0, 15);
  const keywordsMissing = jdKeywords
    .filter(k => !resumeKeywords.includes(k))
    .slice(0, 15);


  /* --------------------------------------------------
     IMPROVEMENT SUGGESTIONS
  -------------------------------------------------- */
  const improvements = [];

  if (clarityScore < 15)
    improvements.push("Add clear section headings like Experience, Skills, and Projects.");

  if (numbersScore < 10)
    improvements.push("Include measurable results (percentages, numbers, impact).");

  if (keywordsMissing.length > 5)
    improvements.push("Incorporate missing job-specific keywords naturally into your resume.");

  if (sectionCount < 5)
    improvements.push("Add missing core sections to improve ATS readability.");

  if (improvements.length === 0)
    improvements.push("Your resume is ATS-friendly. Minor refinements can further boost relevance.");


  /* --------------------------------------------------
     FINAL RESPONSE (Frontend Contract)
  -------------------------------------------------- */
  return {
    totalATSScore,
    roleDetected,
    summary,
    keywordsFound,
    keywordsMissing,
    improvements
  };
};

export default analyzeResumeATS;
