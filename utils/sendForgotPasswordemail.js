import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
export const sendForgotPasswordEmail = async ( email,username,resetUrl) => {
    try {
    const transport = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      port: 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `Resume Ranker <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Resume Ranker || Password Reset",
      html: `
      <section style="font-family: Arial, sans-serif; color: #333;">
        <h2>Hello ${username},</h2>
        <p>You requested to reset your password. Please use the following link to reset it:</p>
        <p style="font-weight: italic; font-size: 1em; color: #007BFF;">${resetUrl}</p>
        <p>If you did not request this, please ignore this email.</p>
      </section>
      `,
    };
    console.log("here");
    
    const mailResponse = await transport.sendMail(mailOptions);
    console.log("here2");
    console.log("Email sent successfully:", mailResponse);

    return {
      success: true,
      message: "Password reset email sent successfully",
    };
  } catch (error) {
    console.error("Error in sending password reset email:", error.message || error);
    console.log(email, username, verifycode);
    
    return {
      success: false,
      message: "Cannot send password reset email",
    };
  }
}