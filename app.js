import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/error.middleware.js';
import rateLimit from 'express-rate-limit'
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin:"https://resumeranker.vikramshrivastav.app",
    credentials:true
}));

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(globalLimiter);
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.json({ limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())
// Sample route
app.get('/', (req, res) => {
    res.send('Welcome to the backend server!');
});

//import routes here
import userrouter from "./routes/user.route.js"
import resumerouter from "./routes/resume.route.js"
import atsrouter from "./routes/ats.route.js"
// Declare routes here
app.use("/api/v1/users", userrouter)
app.use("/api/v1/resume",resumerouter)
app.use("/api/v1/ats",atsrouter)
app.use(errorHandler);

export {app}