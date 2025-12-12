import { Router } from "express";
import {saveResume,getResume,getAllUsersResumes,deleteResume} from "../controllers/resume.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()
router.route("/save-resume").post(verifyJWT,saveResume)
router.route("/get-resume/:resumeid").get(verifyJWT,getResume)
router.route("/get-all-resume").get(verifyJWT,getAllUsersResumes)
router.route("/delete-resume/:resumeid").patch(verifyJWT,deleteResume)

export default router