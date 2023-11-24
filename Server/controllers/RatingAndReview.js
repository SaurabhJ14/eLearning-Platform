const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const mongoose = require("mongoose");

// create Rating
exports.createRating = async (req, res) => {
    try {
        // get userid
        const userId = req.user.id;

        // fetch data from req body
        const { rating, review, courseId } = req.body;

        // check if user is enrolled or not
        const courseDetails = await Course.findOne(
            {
                _id: courseId,
                studentsEnrolled: { $elemMatch: { $eq: userId } },
            }
        );

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: "Student is not enrolled in the course",
            });
        }

        // check if user has not already reviewed the course
        const alreadyReviewed = await RatingAndReview.findOne({
            user: userId,
            course: courseId,
        });

        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                messgae: "Course is already reviewed by the user",
            });
        }

        // create a new rating and review
        const ratingReview = await RatingAndReview.create({
            rating, review,
            course: courseId,
            user: userId
        });

        // update course with this rating
        await Course.findByIdAndUpdate(courseId,
            {
                $push: { ratingAndReviews: ratingReview }
            },
            { new: true });

        await courseDetails.save()

        // return response
        return res.status(200).json({
            success: true,
            message: "Rating and Review created successfully",
            ratingReview,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// get Average rating for a course
exports.getAverageRating = async (req, res) => {
    try {
        const courseId = req.body.courseId;

        // calculate average rating
        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                }
            }
        ])

        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                message: result[0].averageRating,
            })
        }

        // if no rating exist
        return res.status(200).json({
            success: true,
            message: "Average rating is 0, no ratings given till now",
            averageRating: 0,
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve the rating for the course",
            error: error.message,
        });
    }
}

// get All Rating And Reviews
exports.getAllRatingReview = async (req, res) => {
    try {
        const allReviews = await RatingAndReview.find({})
            .sort({ rating: "desc" })
            .populate({
                path: "user",
                select: "firstName lastName email image",
            })
            .populate({
                path: "course",
                select: "courseName",
            })
            .exec();

        // return response
        return res.status(200).json({
            success: true,
            message: "All reviews fetched successfully",
            data: allReviews,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve the rating and review for the course",
            error: error.message,
        })
    }
}