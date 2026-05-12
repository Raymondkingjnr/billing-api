import  express from 'express';
import  {PORT} from "./config/env.js"
import authRoute from "./routes/auth.route.js";
import planRoute from "./routes/plan.route.js";
import cookieParser from "cookie-parser";
import connectMongoDB from "./config/db.js";
import errorMiddleware from "./middleware/error.middleware.js";
import cors from "cors";

const app = express();

const corsOptions = {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.send('Welcome To strip subscription api')
})


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser())

app.use("/api/v1/auth", authRoute)
app.use("/api/v1/plans", planRoute)

app.use(errorMiddleware);

app.listen(PORT, async () => {
    console.log(`Listening on  http://localhost:${PORT}`);
    await connectMongoDB()
})
