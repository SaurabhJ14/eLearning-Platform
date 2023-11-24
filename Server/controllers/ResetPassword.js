const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto")


// resetPassword token 
exports.resetPasswordToken = async (req, res) => {
    try {
        // get email from req body
        const email = req.body.email;

        // email validation
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.json({
                success: false,
                message: `This Email: ${email} is not Registered With Us Enter a Valid Email`,
            });
        }

        // generate token
        const token = crypto.randomBytes(20).toString("hex")

        // update user by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate(
            { email: email },
            {
                token: token,
                resetPasswordExpires: Date.now() + 3600000,
            },
            { new: true }
        );

        console.log("DETAILS", updatedDetails)

        // create URL to send link
        const url = `http://localhost:3000/update-password/${token}`

        // send mail containing url
        await mailSender(email,
            "Password Reset Link",
            `Your Link for email verification is ${url}. Please click this url to reset your password.`
        )

        // return response
        return res.json({
            success: true,
            message: `Email send successfully, Please check email and change your password.`,
        });
    }
    
    catch (error) {
        conole.log(error);
        return res.status(500).json({
            error: error.message,
            success: false,
            message: "Something went wrong while resetting password",
        })
    }
}


// reset password
exports.resetPassword = async (req, res) => {
    try {
        // fetch data
        const { password, confirmPassword, token } = req.body;

        // validation
        if (password !== confirmPassword) {
            return res.json({
                success: true,
                message: "Password and Confirm Password Does not Match",
            });
        }

        // get userdetails from db using token
        const userDetails = await User.findOne({ token: token });

        // if no entry - invalid token
        if (!userDetails) {
            return res.json({
                success: false,
                message: "Token is not found",
            });
        }

        // token time check
        if (userDetails.resetPasswordExpires < Date.now()) {
            return res.json({
                success: false,
                message: "Token is expired, please regenerate your token",
            });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // password update
        await User.findOneAndUpdate(
            { token: token },
            { password: hashedPassword },
            { new: true },
        );

        // return response
        return res.status(200).json({
            success: true,
            message: "Password has been changed successfully",
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Password Reset Failed. Please try again later",
        })
    }
}