import  express from 'express';
import  {PORT} from "./config/env.js"
import authRoute from "./routes/auth.route.js";
import planRoute from "./routes/plan.route.js";
import cookieParser from "cookie-parser";
import connectMongoDB from "./config/db.js";
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

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
