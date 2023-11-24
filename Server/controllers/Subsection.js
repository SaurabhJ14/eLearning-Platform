const SubSection = require("../models/Subsection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// handler to create subsection
exports.createSubSection = async (req, res) => {
    try {
        // fetch data from req body
        const { sectionId, title, description, timeDuration } = req.body;

        // extract file video
        const video = req.files.video;

        // validation
        if (!sectionId || !title || !description || !video) {
            return res.status(404).json({
                success: false,
                message: "All fields are required",
            });
        }

        // console.log(sectionId, title, description, timeDuration)
        console.log(video);

        // upload video to cloudinary - get a secure url
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
        console.log(uploadDetails);

        // create a sub-section
        const subSectionDetails = await SubSection.create({
            title: title,
            timeDuration: `${uploadDetails.duration}`,
            description: description,
            video: uploadDetails.secure_url,
        })

        // update section with this subsection object id
        const updatedSection = await Section.findByIdAndUpdate(
            { _id: sectionId },
            {
                $push: { subSection: subSectionDetails._id }
            },
            { new: true },
        ).populate("subSection")

        // return the updated section in response
        return res.status(200).json({
            success: true,
            message: "Sub Section Created successfully",
            data: updatedSection,
        });
    }
    catch (error) {
        console.log("Error in creating sub section", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error while creating subSection",
            error: error.message,
        });
    }
}


// handler to update subsection
exports.updateSubSection = async (req, res) => {
    try {
        // input data
        const { sectionId, subSectionId, title, description } = req.body;
        const subSection = await SubSection.findById(subSectionId);

        if (!sectionId || !subSectionId) {
            return res.status(404).json({
                success: false,
                message: "Section or SubSection not found"
            });
        }

        if (title !== undefined) {
            subSection.title = title
        }

        if (description !== undefined) {
            subSection.description = description
        }

        if (req.files && req.files.video !== undefined) {
            const video = req.files.video;
            const uploadDetails = await uploadImageToCloudinary(
                video,
                process.env.FOLDER_NAME,
            )
            subSection.videoUrl = uploadDetails.secure_url;
            subSection.timeDuration = `${uploadDetails.duration}`
        }

        await subSection.save();

        const updatedSection = await Section.findById(sectionId).populate("subSection")

        console.log("updated section", updatedSection)

        return res.status(200).json({
            success: true,
            message: "Section updated successfully",
            data: updatedSection,
        })
    }
    catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error while updating subSection",
            error: error.message,
        });
    }
};


// handler to delete subsection
exports.deleteSubSection = async (req, res) => {
    try {
        const { subSectionId, sectionId } = req.body;

        await Section.findByIdAndUpdate(
            { _id: sectionId },
            {
                $pull: {
                    subSection: subSectionId,
                },
            }
        )

        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            })
        }

        const updatedSection = await Section.findById(sectionId).populate("subSection")

        // return response
        return res.status(200).json({
            success: true,
            message: "Sub-Section Deleted Successfully",
            data: updatedSection,
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Unable to delete sub-section, error occured. Please try again",
        });
    }
}