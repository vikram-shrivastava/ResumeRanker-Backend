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

    clarityScore: {
        type: Number,
        default: 0
    },

    numbersScore: {
        type: Number,
        default: 0
    },

    requirementScore: {
        type: Number,
        default: 0
    },

    techKeywordScore: {
        type: Number,
        default: 0
    },

    totalATSScore: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

const ATSScore = mongoose.model('ATSScore', atsScoreSchema);
export default ATSScore;
