// Import the required modules
const express = require("express");
const router = express.Router();

// Import the required controllers and middleware functions
const {
    signUp, 
    login,
    sendotp, 
    changePassword
} = require("../controllers/Auth")

const {
    resetPassword, 
    resetPasswordToken
} = require("../controllers/ResetPassword")

const {auth} = require("../middlewares/auth")

// Route for Login, SignUp and Authentication

// ************************************************************************************************************************
//                                              Authentication Routes
// ************************************************************************************************************************

// Route for user login
router.post("/login", login)

// Route for user signup
router.post("/signup", signUp)

// Route for sending OTP to user's email
router.post("/sendotp", sendotp)

// Route for changing the password
router.post("/changepassword", auth, changePassword)

// ************************************************************************************************************************
//                                              Reset Password Routes
// ************************************************************************************************************************

// Route for generating a reset password token
router.post("/reset-password-token", resetPasswordToken)

// Route for resetting user's password after verification
router.post("/reset-password", resetPassword)

module.exports = router