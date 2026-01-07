import { asynchandler } from "../utils/asynchandler.js";
import { handleerror } from "../utils/apierror.js";
import { handleresponse } from "../utils/apiresponse.js";
import ATSScore from "../models/atsscore.model.js";
import Resume from "../models/resume.model.js";
import getATSScore from "../utils/generateATSscore.js";
import generateTailoredResume from "../utils/generateTailoredResume.js";
import {generatePDFfromLatex} from "../utils/generatePDF.js";
//ATS Score Controllers:
//createATSScore: create ATS score for a resume and job description
const createATSScore=asynchandler(async(req,res,next)=>{
    try {
        const {resumeId,jobDescription,jobRole,atsMode}=req.body;
        const userId=req.user._id;
        console.log("Creating ATS Score for user:", userId, "resumeId:", resumeId);
        if(!userId){
            return next(new handleerror(403,"Access blocked"));
        }
        if(!resumeId){
            return next(new handleerror(404,"Resume ID is required"));
        }
        if(!atsMode){
            return next(new handleerror(404, "ATS Mode is required"));
        }
        if(atsMode=='jd' && !jobDescription){
            return next(new handleerror(404,"Job Description is required for current ATS mode"));
        }
        else if(atsMode=='role'&& !jobRole){
            return next(new handleerror(404,"Job Role is required for current ATS mode"));
        }
        const resume=await Resume.findOne({_id:resumeId,user:userId,softDelete:false});
        console.log("Resume fetched for ATS Score:", resume);
        if(!resume){
            return next(new handleerror(404,"Resume not found"));
        }
        //ATS score calculation logic
        const { totalATSScore,roleDetected,summary,keywordsFound,keywordsMissing, improvements}=getATSScore(resume.parsedText,jobDescription || jobRole);
        const atsScore=new ATSScore({
            user:userId,
            resume:resumeId,
            jobDescription,
            jobRole,
            atsMode,
            roleDetected,
            summary,
            keywordsFound,
            keywordsMissing,
            improvements,
            totalATSScore
        });
        await atsScore.save();
        resume.atsScore=totalATSScore;
        await resume.save();
        return res.status(201).json(
            new handleresponse(201,atsScore,"ATS Score created successfully")
        );
    } catch (error) {
        console.log(error);
        throw new handleerror(500,"Something went wrong while creating ATS Score");
    }
})

const getATSScoreById=asynchandler(async(req,res,next)=>{
    try {
        const {resumeid}=req.params;
        const userId=req.user._id;
        if(!userId){
            return next(new handleerror(403,"Access blocked"));
        }
        if(!resumeid){
            return next(new handleerror(404,"Resume ID is required"));
        }
        const atsScore=await ATSScore.findOne({resume:resumeid,user:userId});
        if(!atsScore){
            return next(new handleerror(404,"ATS Score not found for this resume"));
        }
        return res.status(200).json(
            new handleresponse(atsScore,200,true,"ATS Score fetched successfully",atsScore.totalATSScore)
        );

    } catch (error) {
        console.log(error);
        throw new handleerror(500,"Something went wrong while fetching ATS Score");
    }
});

const tailorResumeForJob = asynchandler(async (req, res, next) => {
  try {
    const { resumeId, jobDescription, dataforresume={} } = req.body;
    const userId = req.user._id;

    if (!userId) return next(new handleerror(403, "Access blocked"));
    if (!resumeId) return next(new handleerror(404, "Resume ID is required"));
    if (!jobDescription) return next(new handleerror(404, "Job Description is required"));

    const resume = await Resume.findOne({ _id: resumeId, user: userId, softDelete: false });
    if (!resume) return next(new handleerror(404, "Resume not found"));

    // 1️⃣ Generate LaTeX code from helper
    const latexCode = await generateTailoredResume(resume.parsedText, jobDescription, dataforresume);
    console.log("Generated LaTeX code length:", latexCode);
    const updatedLatexCode = latexCode
        .replace(/^```(?:latex)?\s*/, "") // removes ``` or ```latex from the start
        .replace(/\s*```$/, "");           // removes ``` from the end
    if(!updatedLatexCode || updatedLatexCode.length === 0){
        return next(new handleerror(503, "Failed to generate tailored LaTeX resume"));
    }
    console.log("Updated LaTeX code length:", updatedLatexCode);
    // 2️⃣ Convert LaTeX to PDF
    const pdfBuffer = await generatePDFfromLatex(updatedLatexCode); // use node-latex
    if(!pdfBuffer || pdfBuffer.length === 0){
        return next(new handleerror(503, "Failed to generate PDF from LaTeX"));
    }

    resume.tailored=true;
    await resume.save();
    // 3️⃣ Send PDF to frontend
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=tailored_resume.pdf`);
    res.send(pdfBuffer);
    return res.status(200).json(
        new handleresponse(pdfBuffer,"Resume tailored successfully")
    )
  } catch (error) {
    console.log(error);
    throw new handleerror(500, "Something went wrong while tailoring resume");
  }
});


const getAllUserATSScore=asynchandler(async(req,res,next)=>{
    try {
        const userId=req.user._id;
        if(!userId){
            return next(new handleerror(403,"Access blocked"))
        }
        const atsData=await ATSScore.find({user:userId}).sort({createdAt:-1})
        return res.status(200).json(new handleresponse(200,atsData,"Ats Data Fetched Successfully"))
    } catch (error) {
        console.log(error)
        throw new handleerror(500,"Internal Server Error")
    }
})
export { createATSScore, getATSScoreById, tailorResumeForJob,getAllUserATSScore };