import { asynchandler } from "../utils/asynchandler.js";
import User from "../models/user.model.js";
import { handleerror } from "../utils/apierror.js";
import { handleresponse } from "../utils/apiresponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { sendVerificationEmail } from "../utils/sendVerificationemail.js";
import bcrypt from "bcrypt"

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
        throw new handleerror(400,"User already exist with this credentials")
    }
    const verifyCode=Math.floor(100000+Math.random()*900000).toString();
    const oneHour = 60 * 60 * 1000; // milliseconds
    const user=await User.create({
        username,
        email,
        password,
        verificationToken:verifyCode,
        verificationTokenExpires:new Date(Date.now() + oneHour)
    });
    await user.save();

    //send verification email here
    const emailResponse=sendVerificationEmail(email,username,verifyCode)
    if(!(await emailResponse).success){
        return res.json(
                new handleresponse({
                    success:false,
                    message:(await emailResponse).message,

                },
                {
                    status:400
                }
            )
        )
        }
        
    const createdUser=await User.findById(user._id).select("-password -refreshtoken -verificationToken");
    return res.status(200).json(new handleresponse(createdUser,201,true,"User registered successfully",createdUser));

});

const verifytoken=asynchandler(async(req,res)=>{
try {
        const { username, verificationToken } = req.body; // rename for clarity
        if (!verificationToken || !username) {
            throw new handleerror(400, "Verification token or username is required");
        }
    
        const user=await User.findOne(
            {username:username,
            verificationTokenExpires: {$gt: new Date()}
        })
    
        if (!user) {
            throw new handleerror(404, "User not found");
        }
    
        // Ensure types match (string vs number)
        if (String(verificationToken) !== String(user.verificationToken)) {
            throw new handleerror(400, "Invalid verification token");
        }
    
        // Update verification status
        user.isVerified = true; // make sure your schema has this field
        user.verificationToken = undefined; // optional: clear token after verification
        user.verificationTokenExpires=undefined
        await user.save();
    
        return res.status(200).json(new handleresponse(200,"user verified successfully"))
} catch (error) {
    console.log(error)
    throw new handleerror(500,"User cannot be verified")   
}
})

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
    if(user.isVerified === false)
    {
        throw new handleerror(400,"User not Verified")
    }
    const ispasswordcorrect=await user.matchPassword(password);
    if(!ispasswordcorrect)
    {
        throw new handleerror(401,"Password invalid");
    }

    const{accesstoken,refreshtoken}= await generateAccessandRefreshtoken(user._id);
    const loggedinuser=await User.findById(user._id).select(
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

const changepassword=asynchandler(async(req,res)=>{
    const {oldpassword,newpassword}=req.body
    const user=await User.findById(req.user?._id)
    const ispasswordcorrect=await user.ispasswordcorrect(oldpassword)
    if(!ispasswordcorrect)
    {
        throw new handleerror(400,"Invalid Password")   
    }
    user.password=newpassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new handleresponse(200,{},"Password Changed Successfully")
    )
})

const getcurrentuser=asynchandler(async(req,res)=>{
    return res
    .status(200)
    .json(
        new handleresponse(200,req.user,"Current user set successfully")
    )
})


//refresh token controller
const refreshAccessToken=asynchandler(async(req,res)=>{
    const incomingrefreshtoken= req.cookies.refreshtoken || req.body.refreshtoken
    
    const ans= await req.cookies.refreshtoken;
    console.log(ans);
    if(!incomingrefreshtoken)
    {
        throw new handleerror(401,"Unauthorized request");
    }

    try {
        const verifyingtoken=jwt.verify(incomingrefreshtoken,process.env.REFRESH_TOKEN_SECRET)
        const user=await User.findById(verifyingtoken?._id)
        if(!user)
        {
            throw new handleerror(401,"Invalid refresh token");
        }
        if(incomingrefreshtoken!==user?.RefreshToken){
            throw new handleerror(401,"Refresh Token Expired or used")
        }
        const options={
            httpOnly:true,
            secure:true
        }
        const {accesstoken,newrefreshtoken}=await generateAccessandRefreshtoken(user._id)
        return res
        .status(200)
        .cookie("accesstoken",accesstoken,options)
        .cookie("refreshtoken",newrefreshtoken,options)
        .json(
            new handleresponse(
                200,
                {accesstoken,refreshtoken:newrefreshtoken},
                "Access Token Refreshed"
                
            )
        )
    } 
    catch (error) {
        throw new handleerror(401,error?.message ||"Invalid Refresh Token")
        // console.log('invalid refresh token');
        
    }
})

export {
    registerUser,
    loginUser,
    logoutuser,
    changepassword,
    getcurrentuser,
    refreshAccessToken,
    verifytoken
}