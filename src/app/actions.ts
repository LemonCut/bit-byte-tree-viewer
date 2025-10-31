'use server';

import { z } from 'zod';
import { connections, getTrees, getPeople } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const FormSchema = z.object({
  big: z.string().min(1, 'Big name is required.'),
  little: z.string().min(1, 'Little name is required.'),
  treeName: z.string(),
  year: z.coerce
    .number()
    .min(1900, 'Invalid year.')
    .max(new Date().getFullYear() + 1, 'Invalid year.'),
});

export async function addConnection(prevState: any, formData: FormData) {
  const validatedFields = FormSchema.safeParse({
    big: formData.get('big'),
    little: formData.get('little'),
    treeName: formData.get('treeName'),
    year: formData.get('year'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Connection.',
    };
  }

  const { big, little, treeName, year } = validatedFields.data;

  // In a real app, you would have a more robust way to determine the default tree.
  const finalTreeName = treeName || getTrees()[0] || 'Default Tree';

  // Mock "database" push
  connections.push({ big, little, treeName: finalTreeName, year });
  
  revalidatePath('/');
  return { message: 'Successfully added connection.', errors: {} };
}
