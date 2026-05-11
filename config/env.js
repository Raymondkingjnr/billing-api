import  {config} from "dotenv"

const nodeEnv = process.env.NODE_ENV || "development";

if (nodeEnv === "development") {
    config({ path: `.env`, override: true });
}

export const  {PORT,  JWT_SECRET, JWT_EXPIRES_IN, DB_URL, SERVER_URL, STRIPE_SECRET_KEY, NODE_ENV, STRIPE_WEBHOOK_SECRET} = process.env;
