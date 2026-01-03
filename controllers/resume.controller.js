import { asynchandler } from "../utils/asynchandler.js";
import { handleerror } from "../utils/apierror.js";
import { handleresponse } from "../utils/apiresponse.js";
import Resume from "../models/resume.model.js";
import axios from "axios";
import {PDFParse}  from "pdf-parse";

// ========================
// Resume Controllers
// ========================

// saveResume(url) : save in DB with parsedText and url and return the resumeId
const saveResume = asynchandler(async (req, res) => {
    try {
        const { resumelink, originalFilename } = req.body;
        const userId = req.user._id;

        if (!userId) return next(new handleerror(403, "Access blocked"));
        if (!resumelink) return next(new handleerror(404, "resumelink is required"));
        console.log("Resume Link: ",resumelink,"filename: ",originalFilename)
        const pdfResponse = await axios.get(resumelink, {
            responseType: "arraybuffer",
            timeout: 15000,
        });
        const parsed = await new PDFParse(pdfResponse.data);
        if(!parsed.text){
            return next(new handleerror(404,"parser"))
        }
        console.log("Parsed text length:", response.text);
        // Save resume to DB
        const resume = new Resume({
            user: userId,
            resumelink,
            fileType: "pdf",
            originalFilename: originalFilename || "Untitled",
            parsedText:  parsed.text,
            softDelete: false,
        });

        await resume.save();

        return res.status(201).json(
            new handleresponse( 201, resume, "Resume saved successfully")
        );

    } catch (error) {
        console.log("Error while saving:",error);
        throw new handleerror(500, "Something went wrong while saving resume");
    }
});

// getResume(resumeid): get resume by id
const getResume = asynchandler(async (req, res) => {
    try {
        const { resumeid } = req.params;
        const userId = req.user._id;

        if (!userId) return next(new handleerror(403, "Access blocked"));
        if (!resumeid) return next(new handleerror(400, "Resume ID is required"));

        const resume = await Resume.findOne({ _id: resumeid, user: userId, softDelete: false });
        if (!resume) return next(new handleerror(404, "Resume not found"));

        const resumeLink = resume.resumelink;
        if (!resumeLink) return next(new handleerror(404, "Resume link not found"));

        return res.status(200).json(
            new handleresponse(resumeLink, 200, true, "Resume fetched successfully", resume)
        );

    } catch (error) {
        console.log(error);
        throw new handleerror(500, "Something went wrong while fetching resume");
    }
});

// getAllUsersResumes: get all resumes of a user
const getAllUsersResumes = asynchandler(async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return next(new handleerror(403,"Access blocked"))
        }

        const resumes = await Resume.find({ user: userId, softDelete: false }).sort({ createdAt: -1 });
        console.log("Resume",resumes)
        return res.status(200).json(
            new handleresponse( 200, resumes || [], "Resumes fetched successfully")
        );

    } catch (error) {
        console.log(error);
        throw new handleerror(500, "Something went wrong while fetching resumes");
    }
});

// deleteResume: soft delete a resume
const deleteResume = asynchandler(async (req, res) => {
    try {
        const { resumeid } = req.params;
        const userId = req.user._id;

        if (!userId) return next(new handleerror(403, "Access Blocked"));
        if (!resumeid) return next(new handleerror(404, "Resume ID is required"));

        const resume = await Resume.findOneAndUpdate(
            { _id: resumeid, user: userId },
            { softDelete: true },
            { new: true }
        );

        if (!resume) return next(new handleerror(404, "Resume not found"));
        return res.status(200).json(
            new handleresponse(resume, 200, true, "Resume deleted successfully", resume)
        );

    } catch (error) {
        console.log(error);
        throw new handleerror(500, "Something went wrong while deleting resume");
    }
});

export { saveResume, getResume, getAllUsersResumes, deleteResume };
