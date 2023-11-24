const express = require("express");
const app = express();

const PORT = process.env.PORT || 4000;

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const contactUsRoute = require("./routes/Contact");

const dotenv = require("dotenv");
dotenv.config();

const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const database = require("./config/database");

// database connect
database.connect();

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: "*",
        credentials: true,
    })
);

app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
    })
);

// cloudinary connection
cloudinaryConnect();

// Mount Routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

// Default Route
app.get("/", (req, res) => {
    return res.json({
        success: true,
        message: "Your server is up and running...",
    });
});

app.listen(PORT, () => {
    console.log(`App is running at Port : ${PORT}`)
})
