const cloudinary = require("cloudinary").v2;  //cloudinary is being imported

exports.cloudinaryConnect = () => {
    try {
        cloudinary.config({
            //      ########    configuring the Cloudinary to upload MEDIA ########
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET,
        });
    }
    catch (error) {
        console.log(error);
    }
};