import axios from 'axios'
const getATSScore=async (resumeText, jobDescription, jobTitle)=>{
    try{
        const response=await axios.post(`${process.env.AI_SERVICE_URL}/analyze_resume`,{
            resume_text: resumeText,
            job_description: jobDescription,
            job_title: jobTitle
        });
        if(response.status!==200){
            console.log("Failed to get ATS Score from AI service:", response.statusText, response.data, response);
            throw new Error("Failed to get ATS Score from AI service");
        }
        const data=response.data;
        console.log("ATS Score data received:", response);
        return {
            totalATSScore: data.ats_score,
            roleDetected: data.role_detected,
            summary: data.summary,
            keywordsFound: data.keywords_matched,
            keywordsMissing: data.keywords_missing,
            improvements: data.improvements
        };
    }catch(error){
        console.log("Error in getATSScore:", error);
        throw error;
    }
}

export default getATSScore;