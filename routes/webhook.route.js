import { handleWebhook } from '../service/stripe.service.js'
import  {Router} from "express"
const router = Router();

router.post('/', async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        const result = await handleWebhook(req.body, sig);
        res.json(result);
    } catch (err) {
        console.error('[Webhook Error]', err.message);
        res.status(400).json({ error: err.message });
    }
});

export default router;