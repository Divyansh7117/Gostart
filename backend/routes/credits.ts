import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

interface CreditPackage {
  id: string;
  credits: number;
  priceINR: number;
  label: string;
  description: string;
}

// only one package for now — easy to add more later
const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'pack_5', credits: 5, priceINR: 2000, label: '5 Credits', description: 'One-time · Carry forward forever' },
];

// GET /api/credits — return current balance and available packages
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const user = await User.findById(userId).select('credits');
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
    res.json({ success: true, credits: user.credits, packages: CREDIT_PACKAGES });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

// POST /api/credits/initiate-payment — creates a mock razorpay order (swap for real sdk in prod)
router.post('/initiate-payment', authMiddleware, (req: Request, res: Response): void => {
  const { packageId } = req.body as { packageId: string };
  const pack = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pack) { res.status(400).json({ success: false, message: 'Invalid credit package.' }); return; }

  res.json({
    success: true,
    orderId: `mock_order_${Date.now()}`,
    amount: pack.priceINR * 100, // razorpay takes paise not rupees
    currency: 'INR',
    packageId: pack.id,
    credits: pack.credits,
    keyId: 'rzp_test_YOUR_KEY_HERE',
  });
});

// POST /api/credits/confirm-payment — verify payment then add credits to the user's account
router.post('/confirm-payment', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageId, paymentId, orderId } = req.body as {
      packageId: string; paymentId: string; orderId: string;
    };

    const pack = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!pack) { res.status(400).json({ success: false, message: 'Invalid package.' }); return; }

    const { userId } = (req as AuthenticatedRequest).user;

    // in prod we'd do hmac-sha256 signature verification here before touching the db
    console.log(`[Credits] Payment confirmed — orderId: ${orderId}, paymentId: ${paymentId}`);

    // using $inc so concurrent requests can't accidentally set the wrong value
    const updated = await User.findByIdAndUpdate(
      userId,
      { $inc: { credits: pack.credits } },
      { new: true },
    ).select('credits');

    if (!updated) { res.status(404).json({ success: false, message: 'User not found.' }); return; }

    res.json({
      success: true,
      message: `${pack.credits} credits added to your account!`,
      credits: updated.credits,
      paymentId,
    });
  } catch (err) {
    console.error('Confirm payment error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

export default router;
