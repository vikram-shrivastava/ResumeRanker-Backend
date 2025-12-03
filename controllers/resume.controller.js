import { asynchandler } from "../utils/asynchandler";
import { handleerror } from "../utils/apierror.js";
import { handleresponse } from "../utils/apiresponse.js";
import Resume from "../models/resume.model.js";
import axios from "axios";
import pdf from "pdf-parse";
//resume controllers:
//saveResume(url) :save in DB with parsedtext and url and return the resumeid
const saveResume=asynchandler(async(req,res)=>{
    try {
        const {resumelink,originalFilename}=req.body;
        const userId=req.user._id;
        if(!userId){
            throw new handleerror(400,"User not found");
        }
        if (!resumelink){
            throw new handleerror(400,"resumelink is required");
        }
        const resumeFile=await axios.get(resumelink,{responseType:'arraybuffer'});

        const parsedText=await pdf(resumeFile); 
        const resume=new Resume({
            user:userId,
            resumelink,
            fileType:'pdf',
            originalFilename:originalFilename || 'Untitled',
            parsedText,
            softDelete:false,
        });
        await resume.save();
        return res.status(201).json(
            handleresponse(resume,201,true,"Resume saved successfully",resume)
        );
    } catch (error) {
        console.log(error);
        throw new handleerror(500,"Something went wrong while saving resume");
    }
});

//getResume(resumeid): get resume by id
const getResume=asynchandler(async(req,res)=>{
    try {
        const {resumeid}=req.params;
        const userId=req.user._id;
        if(!userId){
            throw new handleerror(400,"User not found");
        }
        if(!resumeid){
            throw new handleerror(400,"Resume ID is required");
        }
        const resume=await Resume.findOne({_id:resumeid,user:userId,softDelete:false});
        if(!resume){
            throw new handleerror(404,"Resume not found");
        }
        const resumeLink=resume.resumelink;
        if(!resumeLink){
            throw new handleerror(404,"Resume link not found");
        }
        return res.status(200).json(
            handleresponse(resumeLink,200,true,"Resume fetched successfully",resume)
        );
    } catch (error) {
        console.log(error);
        throw new handleerror(500,"Something went wrong while fetching resume");
    }
});

const getAllUsersResumes=asynchandler(async(req,res)=>{
    try{
        const userId=req.user._id;
        if(!userId){
            throw new handleerror(400,"User not found");
        }
        const resumes=await Resume.find({user:userId,softDelete:false}).sort({createdAt:-1});
        if(!resumes){
            throw new handleerror(404,"No resumes found for this user");
        }
        return res.status(200).json(
            handleresponse(resumes,200,true,"Resumes fetched successfully",resumes)
        );
    } catch (error) {
        console.log(error);
        throw new handleerror(500,"Something went wrong while fetching resumes");
    }
});

const deleteResume=asynchandler(async(req,res)=>{
    try {
        const {resumeid}=req.params;
        const userId=req.user._id;
        if(!userId){
            throw new handleerror(400,"User not found");
        }
        if(!resumeid){
            throw new handleerror(400,"Resume ID is required");
        }
        const resume=await Resume.findOneAndUpdate({_id:resumeid,user:userId},{softDelete:true},{new:true});
        if(!resume){
            throw new handleerror(404,"Resume not found");
        }
        return res.status(200).json(
            handleresponse(resume,200,true,"Resume deleted successfully",resume)
        );
    } catch (error) {
        console.log(error);
        throw new handleerror(500,"Something went wrong while deleting resume");
    }
});
export {saveResume,getResume,getAllUsersResumes,deleteResume};