import prisma from '@/lib/prisma';
import Razorpay from 'razorpay';

export async function getRazorpayKeys(): Promise<{ keyId: string; keySecret: string }> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'global' },
    select: { razorpayKeyId: true, razorpayKeySecret: true },
  });

  const keyId = settings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '';
  const keySecret = settings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '';

  return { keyId, keySecret };
}

export async function createRazorpayInstance(): Promise<Razorpay> {
  const { keyId, keySecret } = await getRazorpayKeys();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
