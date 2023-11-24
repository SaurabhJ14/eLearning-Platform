const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const Profile = require("../models/Profile");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
require("dotenv").config();


// SignUp controller for registering Users
exports.signUp = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        // validations
        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(403).json({
                success: false,
                message: "All fields are required",
            })
        }

        // match the password and confirmpassword
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and Confirm Password values does not match, Please try again"
            });
        }

        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status().json({
                success: false,
                message: "User already exists, Please login to continue"
            });
        }

        // find most recent otp stored for user
        const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
        console.log(response);

        // validate OTP
        if (response.length === 0) {
            // otp not found for email
            return res.status(400).json({
                success: false,
                message: "OTP not found",
            });
        }
        else if (otp !== response[0].otp) {
            return res.status(400).json({
                success: false,
                message: "The OTP is not valid",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create the user
        let approved = "";
        approved === "Instructor" ? (approved = false) : (approved = true);

        // create entry in DB
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        });

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType: accountType,
            approved: approved,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })

        // return res
        return res.status(200).json({
            success: true,
            message: "User has been successfully registered",
            user,
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "User can not be registered. Please try again",
        })
    }
};


// Login controller for authenticating users
exports.login = async (req, res) => {
    try {
        // get data from req body
        const { email, password } = req.body;

        // validate data
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please Fill up All Required Fields",
            });
        }

        // check if user exist or not
        const user = await User.findOne({ email }).populate("additionalDetails");
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User is not Registered with us, Please SignUp to Continue",
            });
        }

        // generate JWT, after password matches
        if (await bcrypt.compare(password, user.password)) {
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }

            const token = jwt.sign(payload,
                process.env.JWT_SECRET,
                {
                    expiresIn: "24h",
                }
            );

            // Save token to user document in database
            user.token = token;
            user.password = undefined;

            // create cookie and send response
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: "User Logged in successfully",
            })
        }

        else {
            return res.status(401).json({
                success: false,
                message: "Password is Incorrect",
            });
        }
    }

    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Login failure, please try again after some time",
        })
    }
};


// Handler to send OTP for email verification
exports.sendotp = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user is already present
        // Find user with provided email
        const checkUserPresent = await User.findOne({ email });

        // If user found with provided mail
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: "User is already Registered",
            });
        }

        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        const result = await OTP.findOne({ otp: otp });
        console.log("Result is OTP Generate func.");
        console.log("OTP ", otp);
        console.log("Result", result);

        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
        }
        const otpPayload = { email, otp };
        const otpBody = await OTP.create(otpPayload);

        await otpBody.save();

        console.log("OTP Body", otpBody);
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            otp,
        });
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// controller for changing Password
exports.changePassword = async (req, res) => {
    try {
        // get data from req body
        const userDetails = await User.findById(req.user.id);

        // get oldPassword, newPassword, confirmPassword
        const { oldPassword, newPassword } = req.body;

        // validation
        if (!oldPassword || !newPassword ) {
            return res.status(403).json({
                success: false,
                message: "Please enter all required fields",
            });
        }

        // match newpassword and confirmpassword
        // if (newPassword !== confirmPassword) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "New Password and Confirm New Password does not match",
        //     });
        // }

        // match oldPassword from DB
        const oldPasswordMatch = await bcrypt.compare(
            oldPassword,
            userDetails.password
        );

        if (!oldPasswordMatch) {
            // If old pasword does not match, return 401 (unauthorised) error
            return res.status(401).json({
                success: false,
                message: "Old password value does not match",
            });
        }

        // update password in DB
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            { password: encryptedPassword },
            { new: true },
        );

        // send mail - password updated
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            );
            console.log("Email sent successfully:", emailResponse.response);
        }
        catch (error) {
            console.log("Error occured while sending emails:", error);
            return res.status(500).josn({
                succes: false,
                message: "Error occured while sending emails",
                error: error.message,
            });
        }

        // Return success response
        return res.status(200).json({
            success: true,
            messgae: "Password updated successfully",
        });
    }

    catch (error) {
        console.log("Error occured while updating password");
        return res.status(500).json({
            success: false,
            message: "Error occured while updateing the password",
            error: error.message,
        });
    }
};