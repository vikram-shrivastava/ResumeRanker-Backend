import { Router } from "express";
import {saveResume,getResume,getAllUsersResumes,deleteResume,getAllUsersResumespagination} from "../controllers/resume.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import rateLimit from "express-rate-limit";

const resumeLimiter = rateLimit({
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
router.route("/save-resume").post(verifyJWT,resumeLimiter,saveResume)
router.route("/get-resume/:resumeid").get(verifyJWT,getResume)
router.route("/get-all-resume").get(verifyJWT,getAllUsersResumes)
router.route("/delete-resume/:resumeid").patch(verifyJWT,deleteResume)
router.route("/get-all-resume-pagination").get(verifyJWT,getAllUsersResumespagination)

export default router