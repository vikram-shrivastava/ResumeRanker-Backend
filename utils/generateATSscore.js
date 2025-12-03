
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
            w.length > 3 &&                   // long enough
            !stopwords.has(w) &&              // not a stopword
            !/^\d+$/.test(w)                 // not numbers
        );
};


const getATSScore = (resumeText, jobDescription) => {

    resumeText = resumeText.toLowerCase();
    jobDescription = jobDescription.toLowerCase();

    // ---------------------------
    // 1. CLARITY SCORE (Updated)
    // ---------------------------
    const importantSections = [
        "experience",
        "education",
        "projects",
        "skills",
        "certifications",
        "summary",
        "achievements"
    ];

    // Count number of sections present
    let sectionCount = importantSections.filter(sec =>
        resumeText.includes(sec)
    ).length;

    // NEW: Section score is proportional
    // If 5/7 sections → ~20
    // If 7/7 sections → ~22 (never 23)
    let sectionScore = (sectionCount / importantSections.length) * 15;

    // Bullet points add up to 8 max
    const bulletCount = (resumeText.match(/[-•*]/g) || []).length;
    let bulletScore = Math.min(8, bulletCount);

    // Final clarity score, max 23
    let clarityScore = Math.min(23, sectionScore + bulletScore);

    // round
    clarityScore = Math.round(clarityScore);



    // ---------------------------
    // 2. NUMBERS SCORE
    // ---------------------------
    const numberMatches = resumeText.match(/\b\d+(\.\d+)?%?|\d+x\b/g) || [];

    let numbersScore = Math.min(25, numberMatches.length * 3); // max 25



    // ---------------------------
    // 3. REQUIREMENT SCORE
    // ---------------------------

    // extract words from JD
    const jdWords = jobDescription
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 4); // remove stopwords like "and", "with"

    let matchedJDWords = jdWords.filter(word =>
        resumeText.includes(word)
    );

    let requirementScore = Math.min(
        25,
        (matchedJDWords.length / jdWords.length) * 25
    );



    // ---------------------------
    // 4. TECH / SKILL KEYWORD SCORE (dynamic, works for ALL roles)
    // ---------------------------
    const jdKeywords = getDynamicKeywords(jobDescription);
    const resumeKeywords = getDynamicKeywords(resumeText);

    // find overlap
    const keywordOverlap = jdKeywords.filter(word =>
        resumeKeywords.includes(word)
    );

    // score proportional to overlap
    const techKeywordScore = Math.min(
        25,
        (keywordOverlap.length / jdKeywords.length) * 25
    );


    // ---------------------------
    // Final Response
    // ---------------------------

    return {
        clarityScore: Math.round(clarityScore),
        numbersScore: Math.round(numbersScore),
        requirementScore: Math.round(requirementScore),
        techKeywordScore: Math.round(techKeywordScore)
    };
};

export default getATSScore;