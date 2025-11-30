import mongoose, { Schema } from "mongoose";

const resumeSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    resumelink: {
        type: String,
        required: true,
    },

    fileType: {
        type: String,
        enum: ["pdf", "doc", "docx"],
    },

    originalFilename: {
        type: String,
    },

    parsedText: {
        type: String,
    },

    // Latest ATS score
    atsScore: {
        type: Schema.Types.ObjectId,
        ref: 'ATSScore',
    }

}, { timestamps: true });

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;
