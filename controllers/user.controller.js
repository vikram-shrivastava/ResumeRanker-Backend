import { asynchandler } from "../utils/asynchandler";
import User from "../models/user.model.js";
import { handleerror } from "../utils/apierror.js";
import { handleresponse } from "../utils/apiresponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessandRefreshtoken=async(userid)=>{
    try {
        const user=await User.findById(userid);
        const accesstoken=user.generateaccesstoken();
        const refreshtoken=user.generaterefreshtoken();
        user.refreshtoken=refreshtoken;
        await user.save({validateBeforeSave:false});

        return {accesstoken,refreshtoken};
    } catch (error) {
        throw new handleerror("Something went wrong while generating access and refresh token")
    }
} 

const registerUser=asynchandler(async(req,res)=>{
    const {username,email,password}=req.body;

    const userExists=await User.findOne({
         $or:[{email},{username}]
    });
    if(userExists){
        return next(new handleerror(400,"User already exists with this email"))
    }
    const user=await User.create({
        username,
        email,
        password
    });
    await user.save();

    //send verification email here
            const emailResponse=sendVerificationEmail(email,username,verifyCode)
        if(!(await emailResponse).success){
            return Response.json(
                {
                    success:false,
                    message:(await emailResponse).message,

                },
                {
                    status:400
                }
            )
        }
        
    const createdUser=await User.findById(user._id).select("-password -refreshtoken -verificationToken");
    return res.status(200).json(handleresponse(createdUser,201,true,"User registered successfully",createdUser));

});

const loginUser=asynchandler(async(req,res)=>{
    const {email,username,password}=req.body;
     if( !(email || username))
    {
        throw new handleerror(400,"username or email is required");
    }
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user)
    {
        throw new handleerror(404,"User does not exist");
    }
    const ispasswordcorrect=await user.matchPassword(password);
    if(!ispasswordcorrect)
    {
        throw new handleerror(401,"Password invalid");
    }

    const{accesstoken,refreshtoken}= await generateAccessandRefreshtoken(user._id);
    const loggedinuser=await User.findOne(user._id).select(
        "-password -refreshtoken -verificationToken")
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accesstoken",accesstoken,options)
    .cookie("refreshtoken",refreshtoken,options)
    .json(
        new handleresponse(
            200,
            {
                user:loggedinuser,accesstoken,refreshtoken
            },
            "User Logged in Successfully"
        )
    )
})

const logoutuser=asynchandler(async(req,res)=>{
    //find user
    //remove cookies of the user
    //remove refresh token in usermodel
    
    await User.findByIdAndUpdate(req.user._id,{
        $unset:{
            refreshtoken:1,

        }
    },
    {
        new:true
    })
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accesstoken",options)
    .clearCookie("refreshtoken",options)
    .json(new handleresponse(200, {}, "User logged Out"))
})
