import { Router } from "express";
import {createATSScore, getATSScoreById, tailorResumeForJob,getAllUserATSScore} from "../controllers/ats.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()
router.route("/create-ats-score").post(verifyJWT,createATSScore)
router.route("/get-ats-score/:atsid").get(verifyJWT,getATSScoreById)
router.route("/tailor-resume-for-job").post(verifyJWT,tailorResumeForJob)
router.route("/get-all-atsscore").get(verifyJWT,getAllUserATSScore)

export default router;