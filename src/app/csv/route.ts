import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const csvPath = path.join(process.cwd(), 'src', 'data', 'connections.csv');
  
  try {
    const csvFile = await fs.readFile(csvPath, 'utf-8');
    
    return new NextResponse(csvFile, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="connections.csv"',
      },
    });
  } catch (error) {
     if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      // If file doesn't exist, return an empty CSV with headers.
      const headers = 'bit,byte,tree,year\n';
       return new NextResponse(headers, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="connections.csv"',
        },
      });
    }
    console.error('Failed to read CSV file for download:', error);
    return new NextResponse('Failed to download file.', { status: 500 });
  }
}
