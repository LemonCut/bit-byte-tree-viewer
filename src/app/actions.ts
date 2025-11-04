'use server';

import { z } from 'zod';

const schema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export async function verifyAdminPassword(prevState: any, formData: FormData) {
  const parsed = schema.safeParse({
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { success: false, message: 'Password is required.' };
  }
  
  // Securely check against the environment variable, with a fallback to the old password.
  const adminPassword = process.env.ADMIN_PASSWORD || 'p';

  if (parsed.data.password === adminPassword) {
    return { success: true, message: 'Admin mode unlocked.' };
  }

  return { success: false, message: 'Incorrect password.' };
}
