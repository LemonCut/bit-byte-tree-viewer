
'use server';

import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { revalidatePath } from 'next/cache';
import type { Connection } from '@/lib/types';

const passwordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export async function verifyAdminPassword(prevState: any, formData: FormData) {
  const parsed = passwordSchema.safeParse({
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { success: false, message: 'Password is required.' };
  }
  
  const adminPassword = process.env.ADMIN_PASSWORD || 'p';

  if (parsed.data.password === adminPassword) {
    return { success: true, message: 'Admin mode unlocked.' };
  }

  return { success: false, message: 'Incorrect password.' };
}


const connectionSchema = z.object({
    id: z.string().optional(),
    bit: z.string().min(1, 'Bit is required.'),
    byte: z.string().min(1, 'Byte is required.'),
    tree: z.string().min(1, 'Tree is required.'),
    year: z.coerce.number().min(1900, 'Year must be after 1900.'),
});

const csvPath = path.join(process.cwd(), 'src', 'data', 'connections.csv');

async function readConnections(): Promise<Connection[]> {
  try {
    const csvFile = await fs.readFile(csvPath, 'utf-8');
    const parsed = Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      transform: (value, header) => {
        if (header === 'year') {
          return Number(value);
        }
        return value;
      },
    });
    // Add a unique ID to each connection for client-side use
     return parsed.data.map((row: any, index: number) => ({
      ...row,
      id: `${row.tree}-${row.byte}-${row.bit}-${index}`,
    })) as Connection[];
  } catch (error) {
    // If file doesn't exist, return empty array
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeConnections(connections: Connection[]): Promise<void> {
  // We need to strip the ID before writing back to CSV
  const connectionsWithoutId = connections.map(({ id, ...rest }) => rest);
  const csvString = Papa.unparse(connectionsWithoutId, { header: true });
  await fs.writeFile(csvPath, csvString, 'utf-8');
}


export async function addConnection(prevState: any, formData: FormData) {
    const parsed = connectionSchema.safeParse({
        bit: formData.get('bit'),
        byte: formData.get('byte'),
        tree: formData.get('tree'),
        year: formData.get('year'),
    });

    if (!parsed.success) {
        return { success: false, message: 'Invalid data.', errors: parsed.error.flatten().fieldErrors };
    }

    try {
        const connections = await readConnections();
        
        // The ID is now only for client-side keying, not for the CSV.
        const newConnection: Connection = {
            id: `new-${Date.now()}`, // Temporary ID
            ...parsed.data,
        };

        connections.push(newConnection);
        await writeConnections(connections);

        revalidatePath('/');
        return { success: true, message: 'Connection added successfully.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to add connection.' };
    }
}

export async function updateConnection(prevState: any, formData: FormData) {
    const parsed = connectionSchema.safeParse({
        id: formData.get('id'),
        bit: formData.get('bit'),
        byte: formData.get('byte'),
        tree: formData.get('tree'),
        year: formData.get('year'),
    });

    if (!parsed.success) {
        return { success: false, message: 'Invalid data.', errors: parsed.error.flatten().fieldErrors };
    }
    
    if (!parsed.data.id) {
        return { success: false, message: 'Connection ID is missing.' };
    }

    try {
        const connections = await readConnections();
        const index = connections.findIndex(c => c.id === parsed.data.id);

        if (index === -1) {
            return { success: false, message: 'Connection not found.' };
        }

        // Create a new object for the updated connection, preserving the ID for this operation
        const updatedConnection = {
            id: parsed.data.id, // Keep original ID for this transaction
            bit: parsed.data.bit,
            byte: parsed.data.byte,
            tree: parsed.data.tree,
            year: parsed.data.year
        };

        connections[index] = updatedConnection;

        await writeConnections(connections);

        revalidatePath('/');
        return { success: true, message: 'Connection updated successfully.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to update connection.' };
    }
}

export async function deleteConnection(id: string) {
    if (!id) {
        return { success: false, message: 'Connection ID is missing.' };
    }

    try {
        const connections = await readConnections();
        const filteredConnections = connections.filter(c => c.id !== id);

        if (filteredConnections.length === connections.length) {
            return { success: false, message: 'Connection not found.' };
        }

        await writeConnections(filteredConnections);

        revalidatePath('/');
        return { success: true, message: 'Connection deleted successfully.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to delete connection.' };
    }
}
