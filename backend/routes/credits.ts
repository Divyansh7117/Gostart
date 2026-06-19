// ====================================================================
// Credits Routes — balance, buy credits (Razorpay mocked)
//
// PAYMENT FLOW:
//  1. POST /initiate-payment  → creates a mock Razorpay order.
//     (Real: call Razorpay SDK, get a real orderId)
//  2. Frontend opens Razorpay checkout sheet with that orderId.
//  3. POST /confirm-payment   → verify signature + add credits in MongoDB.
//     (Real: HMAC-SHA256 verify before touching the DB)
// ====================================================================

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

const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'pack_5', credits: 5, priceINR: 2000, label: '5 Credits', description: 'One-time · Carry forward forever' },
];

// GET /api/credits
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

// POST /api/credits/initiate-payment
router.post('/initiate-payment', authMiddleware, (req: Request, res: Response): void => {
  const { packageId } = req.body as { packageId: string };
  const pack = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pack) { res.status(400).json({ success: false, message: 'Invalid credit package.' }); return; }

  // Production: const order = await razorpay.orders.create({ amount: pack.priceINR * 100, currency: 'INR' });
  res.json({
    success: true,
    orderId: `mock_order_${Date.now()}`,
    amount: pack.priceINR * 100, // Razorpay expects paise (1 INR = 100 paise)
    currency: 'INR',
    packageId: pack.id,
    credits: pack.credits,
    keyId: 'rzp_test_YOUR_KEY_HERE',
  });
});

// POST /api/credits/confirm-payment
router.post('/confirm-payment', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageId, paymentId, orderId } = req.body as {
      packageId: string; paymentId: string; orderId: string;
    };

    const pack = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!pack) { res.status(400).json({ success: false, message: 'Invalid package.' }); return; }

    const { userId } = (req as AuthenticatedRequest).user;

    // Production: verify Razorpay HMAC-SHA256 before this line
    console.log(`[Credits] Payment confirmed — orderId: ${orderId}, paymentId: ${paymentId}`);

    // Atomic credit update using $inc — no race condition if two requests come in
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
