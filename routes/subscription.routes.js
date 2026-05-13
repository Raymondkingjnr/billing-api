import {Router} from 'express';
import authorise from "../middleware/auth.middleware.js";
import {subscriptionCheckout, cancelSubscription, getUserCurrentSubscription, billingHistory} from "../controllers/subscription.controllers.js";

const subRoute = Router();

subRoute.get('/checkout/:planId', authorise, subscriptionCheckout)
subRoute.post('/cancel', authorise, cancelSubscription)
subRoute.get('/current-subscription', authorise, getUserCurrentSubscription)
subRoute.get('/billingHistory', authorise, billingHistory)


export default subRoute;