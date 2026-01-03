import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/error.middleware.js';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin:"http://localhost:3000",
    credentials:true
}));

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