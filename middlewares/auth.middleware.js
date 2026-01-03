import { handleerror } from "../utils/apierror.js";
import { asynchandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"
import User from "../models/user.model.js";
export const verifyJWT=asynchandler(async(req,_,next)=>{
    try {
        const token=req.cookies?.accesstoken|| req.header("Authorization")?.replace("Bearer ","")
        console.log(req.cookies?.accesstoken)
        if(!token)
        {
            return next(new handleerror(401, "Unauthorized"));
        }
        const decodedtoken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        if(!decodedtoken){
            return next(new handleerror(401,"Invalid Access Token"));
        }
        
        const user=await User.findById(decodedtoken?._id).select("-password -RefreshToken")
        if(!user)
        {
            return next(new handleerror(401,"Invalid Access Token"));
        }
        req.user=user;
        next()
    } catch (error) {
        console.log("Error",error)
        throw new handleerror(401,error,"Already Logged out")
    }
})