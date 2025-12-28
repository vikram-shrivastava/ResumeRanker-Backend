import mongoose, { Schema } from "mongoose";

const atsScoreSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    resume: {
        type: Schema.Types.ObjectId,
        ref: 'Resume',
        required: true,
    },

    jobDescription: {
        type: String,
    },

    jobTitle: {
        type: String,
    },
    atsMode:{
        type:String,
    },
    roleDetected: {
        type: String,
    },

    summary: {
        type: String,
    },

    keywordsFound: {
        type: [String],
    },

    keywordsMissing: {
        type: [String],
    },

    totalATSScore: {
        type: Number,
        default: 0
    },
    improvements:{
        type:[String],
    }

}, { timestamps: true });

const ATSScore = mongoose.model('ATSScore', atsScoreSchema);
export default ATSScore;
