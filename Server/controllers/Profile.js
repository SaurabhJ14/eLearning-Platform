const Course = require("../models/Course");
const Profile = require("../models/Profile");
const User = require("../models/User");
const CourseProgress = require("../models/CourseProgress");

const mongoose = require("mongoose")
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration")

// handler to update user profile
exports.updateProfile = async (req, res) => {
    try {
        // get data
        const {
            firstName = "",
            lastName = "",
            dateOfBirth = "",
            about = "",
            contactNumber = "",
            gender = ""
        } = req.body;

        // get userid
        const id = req.user.id;

        // find profile by id
        const userDetails = await User.findById(id);
        const profile = await Profile.findById(userDetails.additionalDetails)

        const user = await User.findByIdAndUpdate(id, {
            firstName,
            lastName,
        })
        await user.save()

        // update the profile fields
        profile.dateOfBirth = dateOfBirth
        profile.about = about
        profile.contactNumber = contactNumber
        profile.gender = gender

        // save updated profile
        await profile.save()

        const updatedUserDetails = await User.findById(id)
            .populate("additionalDetails")
            .exec()

        // return response
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            updatedUserDetails,
        });
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Error in updating profile",
            error: error.message,
        });
    }
};


// handler to delete account
exports.deleteAccount = async (req, res) => {
    try {
        // get user id 
        const id = req.user.id;
        console.log(id)

        // validation
        const user = await User.findById({ _id: id });
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // delete associated profile with the user
        await Profile.findByIdAndDelete({
            _id: new mongoose.Types.ObjectId(user.additionalDetails)
        });

        for (const courseId of user.courses) {
            await Course.findByIdAndUpdate(
                courseId,
                { $pull: { studentsEnrolled: id } },
                { new: true }
            )
        }

        // now delete user
        await User.findByIdAndDelete({ _id: id })

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        })

        await CourseProgress.deleteMany({ userId: id })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error in deleting user's profile",
            error: error.message,
        });
    }
};


// handler to get all user details
exports.getUsersAllDetail = async (req, res) => {
    try {
        var id = req.user.id;
        console.log(id)

        const userDetails = await User.findById(id).populate("additionalDetails").exec();
        console.log(userDetails);

        return res.status(200).json({
            success: true,
            message: "User data fetched successfully",
            data: userDetails,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// handler to update display picture
exports.updateDisplayPicture = async (req, res) => {
    try {
        const displayPicture = req.files.displayPicture;
        const userId = req.user.id;

        const image = await uploadImageToCloudinary(
            displayPicture,
            process.env.FOLDER_NAME,
            1000,
            1000
        )

        console.log(image);

        const updatedProfile = await User.findByIdAndUpdate(
            { _id: userId },
            { image: image.secure_url },
            { new: true },
        )
        res.send({
            success: true,
            message: "Image Updated Successfully",
            data: updatedProfile,
        })
    }

    catch (error) {
        console.log("nahi hora")
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// handler to get all enrolled courses by a user
exports.getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id
        let userDetails = await User.findById({
            _id: userId,
        })
            .populate({
                path: "courses",
                populate: {
                    path: "courseContent",
                    populate: {
                        path: "subSection",
                    },
                },
            })
            .exec()

        userDetails = userDetails.toObject()
        var SubsectionLength = 0

        for (var i = 0; i < userDetails.courses.length; i++) {
            let totalDurationInSeconds = 0
            SubsectionLength = 0
            for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
                totalDurationInSeconds += userDetails.courses[i].courseContent[
                    j
                ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
                userDetails.courses[i].totalDuration = convertSecondsToDuration(
                    totalDurationInSeconds
                )
                SubsectionLength +=
                    userDetails.courses[i].courseContent[j].subSection.length
            }

            let courseProgressCount = await CourseProgress.findOne({
                courseID: userDetails.courses[i]._id,
                userId: userId,
            })

            courseProgressCount = courseProgressCount?.completedVideos.length
            if (SubsectionLength === 0) {
                userDetails.courses[i].progressPercentage = 100
            }

            else {
                // To make it up to 2 decimal point
                const multiplier = Math.pow(10, 2)
                userDetails.courses[i].progressPercentage =
                    Math.round(
                        (courseProgressCount / SubsectionLength) * 100 * multiplier
                    ) / multiplier
            }
        }

        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find user with id: ${userDetails}`,
            })
        }
        return res.status(200).json({
            success: true,
            data: userDetails.courses,
        })
    }

    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.instructorDashboard = async (req, res) => {
    try {
        const courseDetails = await Course.find({ instructor: req.user.id })

        const courseData = courseDetails.map((course) => {
            const totalStudentsEnrolled = course.studentsEnrolled.length
            const totalAmountGenerated = totalStudentsEnrolled * course.price

            // Create a new object with the additional fields
            const courseDataWithStats = {
                _id: course._id,
                courseName: course.courseName,
                courseDescription: course.courseDescription,
                // Include other course properties as needed
                totalStudentsEnrolled,
                totalAmountGenerated,
            }

            return courseDataWithStats
        })

        res.status(200).json({ courses: courseData })
    }

    catch (error) {
        console.error(error)
        return res.status(500).json({
            message: "Server Error",
            error: error
        })
    }
}

