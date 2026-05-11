import {Router} from 'express';
import {signUp, login, me} from "../controllers/auth.controllers.js";
import authorise from "../middleware/auth.middleware.js";
import {requireRole} from "../middleware/rbac.middleware.js";

const authRouter = Router();
authRouter.post('/register', signUp);
authRouter.post('/login', login);
authRouter.get('/me', authorise, me);
authRouter.get('/admin/me', authorise, requireRole('admin'), me);

export default authRouter;
