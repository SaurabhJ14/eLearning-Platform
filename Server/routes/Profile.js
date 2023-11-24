// Import the required modules
const express = require("express");
const router = express.Router();

const { auth, isStudent, isInstructor } = require("../middlewares/auth")

const {
    updateProfile,
    deleteAccount,
    getUsersAllDetail,
    getEnrolledCourses,
    updateDisplayPicture,
    instructorDashboard
} = require("../controllers/Profile")

// ************************************************************************************************************************
//                                              Profile Routes
// ************************************************************************************************************************

// Update users profile
router.put("/updateProfile", auth, updateProfile)
// Delete users account
router.delete("/deleteAccount", auth, deleteAccount)
// get user's all details
router.get("/getUserDetails", auth, getUsersAllDetail)

// updating display picture
router.put("/updateDisplayPicture", auth, updateDisplayPicture)

// Get Enrolled Courses
router.get("/getEnrolledCourses", auth, getEnrolledCourses)

// Get instructor courses
router.get("/instructorDashboard", auth, isInstructor, instructorDashboard)

module.exports = router;