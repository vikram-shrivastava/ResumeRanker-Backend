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
    softDelete:{
        type:Boolean,
        default:false,
    },
    atsScore:{
        type:Number,
        default :0
    },
    tailored:{
        type:Boolean,
        default:false
    }
}, { timestamps: true });

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;
