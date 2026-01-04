import { asynchandler } from "../utils/asynchandler.js";
import User from "../models/user.model.js";
import { handleerror } from "../utils/apierror.js";
import { handleresponse } from "../utils/apiresponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { sendVerificationEmail } from "../utils/sendVerificationemail.js";
import bcrypt from "bcrypt"


const options={
    httpOnly:true,
    secure:false,
    sameSite: "lax",

}
const generateAccessandRefreshtoken=async(userid)=>{
    try {
        const user=await User.findById(userid);
        const accesstoken=user.generateaccesstoken();
        const refreshtoken=user.generaterefreshtoken();
        user.refreshtoken=refreshtoken;
        await user.save({validateBeforeSave:false});

        return {accesstoken,refreshtoken};
    } catch (error) {
        console.log("Error occured in generating tokens")
        throw new handleerror(500,"Something went wrong while generating access and refresh token")
    }
} 

const registerUser=asynchandler(async(req,res,next)=>{
    console.log("Register User called");
    const {username,email,password}=req.body;

    const userExists=await User.findOne({
         $or:[{email},{username}]
    });
    if(userExists){
        console.log("user already exist")
        return next(new handleerror(409,"User already exists"));
    }
    const verifyCode=Math.floor(100000+Math.random()*900000).toString();
    const oneHour = 60 * 60 * 1000; 

    const user=await User.create({
        username,
        email,
        password,
        verificationToken:verifyCode,
        verificationTokenExpires:new Date(Date.now() + oneHour),
    });
    await user.save();
    const{accesstoken,refreshtoken}= await generateAccessandRefreshtoken(user._id);
    const userToUpdate=await User.findById(user._id);
    userToUpdate.refreshtoken=refreshtoken;
    await userToUpdate.save();

    const emailResponse=sendVerificationEmail(email,username,verifyCode)
    if(!(await emailResponse).success)
    {
        console.log("Email verification failed")
        return next(new handleerror(503,"Email verification failed"))
    }
        
    const createdUser=await User.findById(user._id).select("-password -refreshtoken -verificationToken");
    return res
        .status(200)
        .cookie("accesstoken",accesstoken,options)
        .cookie("refreshtoken",refreshtoken,options)
        .json(new handleresponse(200,{createdUser,accesstoken},"User Registered Successfully"));
});

const verifytoken=asynchandler(async(req,res,next)=>{
try {
        const {verificationToken,username } = req.body;
        if (!verificationToken) {
            console.log("Verification token not found")
            return next(new handleerror(404,"Verification token not found"))
        }
        if(!username){
            return next(new handleerror(404,"username not found!"))
        }
        console.log("username in backend:",username)
        const user=await User.findOne(
            {username:username,
            verificationTokenExpires: {$gt: new Date()}
        })
    
        if (!user) {
            console.log("Cannot find user")
            return next(new handleerror(404,"User not found"))
        }
    
        // Ensure types match (string vs number)
        if (String(verificationToken) !== String(user.verificationToken)) {
            console.log("Failed in verification")
            console.log(verificationToken," ",user.verificationToken)
            return next(new handleerror(400,"Token verification failed"))
        }
    
        // Update verification status
        user.isVerified = true; // make sure your schema has this field
        user.verificationToken = undefined; // optional: clear token after verification
        user.verificationTokenExpires=undefined
        await user.save();
    
        return res.status(200).json(new handleresponse(200,user.isVerified,"user verified successfully"))
} catch (error) {
    console.log(error)
    return res.status(500).json(new handleerror(500,{message:"User cannot be verified"}));   
}
})

const loginUser=asynchandler(async(req,res,next)=>{
   try {
     const {email,username,password}=req.body;
      if( !(email || username))
     {
        return next(new handleerror(404,"Email and Password are required"))
     }
     const user=await User.findOne({
         $or:[{username},{email}]
     })
 
     if(!user)
     {
        return next(new handleerror(404,"User not found"))
     }
     if(user.isVerified === false)
     {
        return next(new handleerror(401,"user is not verified"))
     }
     const ispasswordcorrect=await user.matchPassword(password);
     if(!ispasswordcorrect)
     {
        return next(new handleerror(401,"Invalid Password"))
     }
 
     const{accesstoken,refreshtoken}= await generateAccessandRefreshtoken(user._id);
     const createdUser=await User.findById(user._id).select(
        "-password -refreshtoken -verificationToken")
    return res
        .status(200)
        .cookie("accesstoken",accesstoken,options)
        .cookie("refreshtoken",refreshtoken,options)
        .json(new handleresponse(200,{createdUser,accesstoken},"User Registered Successfully"));
   } catch (error) {
        console.log(error)
        throw new handleerror(500,"User login failed")
   }
})

const logoutuser=asynchandler(async(req,res,next)=>{
    //find user
    //remove cookies of the user
    //remove refresh token in usermodel
    
    await User.findByIdAndUpdate(req.user._id,{
        $unset:{
            refreshtoken:"",
        }
    },
    {
        new:true
    })
    return res
    .status(200)
    .clearCookie("accesstoken",options)
    .clearCookie("refreshtoken",options)
    .json(new handleresponse(200, {}, "User logged Out"))
})

const changepassword=asynchandler(async(req,res,next)=>{
    const {oldpassword,newpassword}=req.body
    const user=await User.findById(req.user?._id)
    const ispasswordcorrect=await user.ispasswordcorrect(oldpassword)
    if(!ispasswordcorrect)
    {
        return next(new handleerror(401,"Old Password is incorrect") )  
    }
    user.password=newpassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new handleresponse(200,{},"Password Changed Successfully")
    )
})

const getcurrentuser=asynchandler(async(req,res,next)=>{
    return res
    .status(200)
    .json(
        new handleresponse(200,req.user,"Current user set successfully")
    )
})

    
//refresh token controller
const refreshAccessToken = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return next(new handleerror(401,"Refresh Token not found"));
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // OPTIONAL but recommended: check token in DB
    const user = await User.findById(decoded._id);
    if (!user) {
      return next(new handleerror(401,"User not found"));
    }

    const newAccessToken = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      accessToken: newAccessToken,
    });

  } catch (err) {
    return res.status(401).json({ message: "Refresh token expired" });
  }
};


export {
    registerUser,
    loginUser,
    logoutuser,
    changepassword,
    getcurrentuser,
    refreshAccessToken,
    verifytoken
}