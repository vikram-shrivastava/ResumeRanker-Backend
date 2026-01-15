import {Router} from "express";
import {registerUser,
    loginUser,
    logoutuser,
    changepassword,
    getcurrentuser,
    refreshAccessToken,
    verifytoken,
    forgotPassword,
    resetPassword
} from "../controllers/user.controller.js"

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()
router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/refreshtoken").post(refreshAccessToken)
router.route("/changepassword").post(verifyJWT,changepassword)
router.route("/logout").post(verifyJWT,logoutuser)
router.route("/user").get(verifyJWT,getcurrentuser)
router.route("/verifytoken").post(verifytoken)
router.route("/forgotpassword").post(forgotPassword)
router.route("/resetpassword/:token").post(resetPassword)
export default router;