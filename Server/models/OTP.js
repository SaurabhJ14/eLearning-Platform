const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 60 * 5,    //The OTP will automatically expires after 5 mins of its creation time
    },
});


// a function -> to send otp email
async function sendVerificationEmail(email, otp) {
    try {
        const mailResponse = await mailSender(
            email,
            "Verification Email",
            emailTemplate(otp),
        );

        console.log("Email sent successfully", mailResponse.response);
    }
    catch (error) {
        console.log("Error occured while sending verification email", error);
        throw error;
    }
}

// Define a post save hook (middleware) to send email after saving doc in DB 
OTPSchema.pre("save", async function (next) {
    console.log("New document saved to database");

    // only send email when a new document is created
    if (this.isNew) {
        await sendVerificationEmail(this.email, this.otp);
    }
    next();
});

module.exports = mongoose.model("OTP", OTPSchema);
