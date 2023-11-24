var flatMap = require('array.prototype.flatmap')
const Category = require("../models/Category");

function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

// handler for creating category
exports.createCategory = async (req, res) => {

    try {
        // fetch data
        const { name, description } = req.body;

        // validation
        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // create entry in DB
        const categoryDetails = await Category.create({
            name: name,
            description: description,
        });
        console.log(categoryDetails);

        // return response
        return res.status(200).json({
            success: true,
            message: "Category created successfully",
        })
    }

    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


// handler for getting all category
exports.showAllCategories = async (req, res) => {
    try {
        const allCategory = await Category.find();
        return res.status(200).json({
            success: true,
            message: "All category returned successfully",
            allCategory,
        });
    }

    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


// handler for category page details 
exports.categoryPageDetails = async (req, res) => {
    try {
        // get category id
        const { categoryId } = req.body;

        // get courses of specific categoryId
        const selectedCategory = await Category.findById(categoryId)
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: "ratingAndReviews",
            })
            .exec();

        console.log("SELECTED COURSE", selectedCategory)

        // validation
        if (!selectedCategory) {
            console.log("Category Not Found");
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // handle the case when there are no courses
        if (selectedCategory.courses.length === 0) {
            console.log("No courses found for the selected category.")
            return res.status(404).json({
                success: false,
                message: "No courses have been found for the selected category.",
            })
        }

        // console.log("length of selected category:",selectedCategory.courses.length)

        // get courses for different category
        const categoryExceptSelected = await Category.find({
            _id: { $ne: categoryId }
        })

        let differentCategory = await Category.findOne(
            categoryExceptSelected[getRandomInt(categoryExceptSelected.length)]._id
        )
            .populate({
                path: "courses",
                match: { status: "Published" },
            })
            .exec()


        // get top selling courses across all categories
        const allCategories = await Category.find()
            .populate({
                path: "courses",
                match: { status: "Published" },
            })
            .exec()

        const allCourses = allCategories.flatMap((category) => category.courses)
        const mostSellingCourses = allCourses
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 10)

        // return response
        return res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategory,
                mostSellingCourses
            },
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        })
    }
}
