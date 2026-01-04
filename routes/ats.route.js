import { Router } from "express";
import {createATSScore, getATSScoreById, tailorResumeForJob,getAllUserATSScore} from "../controllers/ats.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import rateLimit from 'express-rate-limit'

const atsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "RATE_LIMIT_EXCEEDED",
      message: "You have reached the generation limit. Please try again later."
    });
  }
});

const router=Router()
router.route("/create-ats-score").post(verifyJWT,atsLimiter,createATSScore)
router.route("/get-ats-score/:atsid").get(verifyJWT,getATSScoreById)
router.route("/tailor-resume-for-job").post(verifyJWT,atsLimiter,tailorResumeForJob)
router.route("/get-all-atsscore").get(verifyJWT,getAllUserATSScore)

export default router;