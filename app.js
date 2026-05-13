import express from 'express';
import { PORT } from "./config/env.js"
import authRoute from "./routes/auth.route.js";
import planRoute from "./routes/plan.route.js";
import cookieParser from "cookie-parser";
import connectMongoDB from "./config/db.js";
import errorMiddleware from "./middleware/error.middleware.js";
import cors from "cors";
import webhookRouter from './routes/webhook.route.js';
import subRoute from "./routes/subscription.routes.js";

const app = express();

const corsOptions = {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

app.use(
    '/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    webhookRouter
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


app.get('/', (req, res) => {
    res.send('Welcome To stripe subscription api')
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/plans", planRoute);
app.use("/api/v1/subscription", subRoute);

app.use(errorMiddleware);

app.listen(PORT, async () => {
    console.log(`Listening on http://localhost:${PORT}`);
    await connectMongoDB();
});