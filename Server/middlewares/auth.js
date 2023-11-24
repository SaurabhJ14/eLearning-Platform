const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const user = require("../models/User");

dotenv.config();

// This function is used as middleware to authenticate user requests
exports.auth = async (req, res, next) => {
    try {
        // extract token from req cookie,body or header
        const token = req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ", "");

        // if token missing, return response
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token is missing",
            });
        }

        // verify the token
        try {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decodedToken);
            req.user = decodedToken;
        }
        catch (err) {
            // verification issue
            return res.status(401).json({
                success: false,
                message: "Token is Invalid"
            });
        }
        next();
    }
    catch (err) {
        return res.status(401).json({
            success: false,
            message: "Something went wrong while validating the token",
        });
    }
}

// isStudent
exports.isStudent = async (req, res, next) => {
    try {
        const userDetails = await user.findOne({ email: req.user.email });

        if (userDetails.accountType !== "Student") {
            return res.status(401).json({
                success: false,
                message: "This is a protected route for Student only"
            });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "User role can not be verified, please try again",
        })
    }
}

// isInstructor
exports.isInstructor = async (req, res, next) => {
    try {
        const userDetails = await user.findOne({ email: req.user.email });

        if (userDetails.accountType !== "Instructor") {
            return res.status(401).json({
                success: false,
                message: "This is a protected route for Instructors only"
            });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "User role can not be verified, please try again",
        })
    }
}


// isAdmin
exports.isAdmin = async (req, res, next) => {
    try {
        const userDetails = await user.findOne({ email: req.user.email });

        if (userDetails.accountType !== "Admin") {
            return res.status(401).json({
                success: false,
                message: "This is a protected route for Admins only"
            });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "User role can not be verified, please try again",
        })
    }
}