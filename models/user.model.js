import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },

    // All resumes user uploaded
    resumes: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Resume'
        }
    ],

    // Keep only the score, not ref
    bestResume: {
        type: Schema.Types.ObjectId,
        ref: 'Resume'
    },
    bestResumeScore: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const User = mongoose.model('User', userSchema);
export default User;
