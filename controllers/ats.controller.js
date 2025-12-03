import { asynchandler } from "../utils/asynchandler";
import { handleerror } from "../utils/apierror.js";
import { handleresponse } from "../utils/apiresponse.js";
import ATSScore from "../models/atsscore.model.js";
import Resume from "../models/resume.model.js";
import {getATSScore} from "../utils/generateATSscore.js";
//ATS Score Controllers:
//createATSScore: create ATS score for a resume and job description
const createATSScore=asynchandler(async(req,res)=>{
    try {
        const {resumeId,jobDescription,jobTitle}=req.body;
        const userId=req.user._id;
        if(!userId){
            throw new handleerror(400,"User not found");
        }
        if(!resumeId){
            throw new handleerror(400,"Resume ID is required");
        }
        const resume=await Resume.findOne({_id:resumeId,user:userId,softDelete:false});
        if(!resume){
            throw new handleerror(404,"Resume not found");
        }
        //ATS score calculation logic
        const {clarityScore,numbersScore,requirementScore,techKeywordScore}=getATSScore(resume.parsedText,jobDescription);
        const totalATSScore=Math.floor((clarityScore+numbersScore+requirementScore+techKeywordScore)/4);
        const atsScore=new ATSScore({
            user:userId,
            resume:resumeId,
            jobDescription,
            jobTitle,
            clarityScore,
            numbersScore,
            requirementScore,
            techKeywordScore,
            totalATSScore
        });
        await atsScore.save();
        return res.status(201).json(
            handleresponse(atsScore,201,true,"ATS Score created successfully",atsScore)
        );
    } catch (error) {
        console.log(error);
        throw new handleerror(500,"Something went wrong while creating ATS Score");
    }
})

const getATSScoreById=asynchandler(async(req,res)=>{
    try {
        const {resumeid}=req.params;
        const userId=req.user._id;
        if(!userId){
            throw new handleerror(400,"User not found");
        }
        if(!resumeid){
            throw new handleerror(400,"Resume ID is required");
        }
        const atsScore=await ATSScore.findOne({resume:resumeid,user:userId});
        if(!atsScore){
            throw new handleerror(404,"ATS Score not found for this resume");
        }
        return res.status(200).json(
            handleresponse(atsScore,200,true,"ATS Score fetched successfully",atsScore.totalATSScore)
        );

    } catch (error) {
        console.log(error);
        throw new handleerror(500,"Something went wrong while fetching ATS Score");
    }
});

const tailorResumeForJob = asynchandler(async (req, res) => {
  try {
    const { resumeId, jobDescription, dataforresume={} } = req.body;
    const userId = req.user._id;

    if (!userId) throw new handleerror(400, "User not found");
    if (!resumeId) throw new handleerror(400, "Resume ID is required");
    if (!jobDescription) throw new handleerror(400, "Job Description is required");

    const resume = await Resume.findOne({ _id: resumeId, user: userId, softDelete: false });
    if (!resume) throw new handleerror(404, "Resume not found");

    // 1️⃣ Generate LaTeX code from helper
    const latexCode = await generateTailoredResume(resume.parsedText, jobDescription, dataforresume);

    // 2️⃣ Convert LaTeX to PDF
    const pdfBuffer = await generatePDFfromLatex(latexCode); // use node-latex

    // 3️⃣ Send PDF to frontend
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=tailored_resume.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.log(error);
    throw new handleerror(500, "Something went wrong while tailoring resume");
  }
});

export { createATSScore, getATSScoreById, tailorResumeForJob };