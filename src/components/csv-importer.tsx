'use client';

import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import type { Connection } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface CsvImporterProps {
  onDataLoaded: (data: Connection[]) => void;
}

export function CsvImporter({ onDataLoaded }: CsvImporterProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Dynamically import papaparse only when needed
    import('papaparse').then(Papa => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Basic validation
          if (!results.meta.fields || !results.meta.fields.includes('byte_name') || !results.meta.fields.includes('bit_name')) {
            toast({
              variant: 'destructive',
              title: 'Invalid CSV format',
              description: 'CSV must have "byte_name" and "bit_name" columns.',
            });
            return;
          }
          
          const connectionsData = results.data.map((row: any) => ({
            byte: row.byte_name,
            bit: row.bit_name,
            treeName: row.tree || 'Default Tree',
            year: row.year ? parseInt(row.year, 10) : new Date().getFullYear(),
          })).filter(c => c.byte && c.bit);

          onDataLoaded(connectionsData as Connection[]);
          toast({
            title: 'CSV Imported',
            description: `${connectionsData.length} connections loaded successfully.`,
          });
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          toast({
            variant: 'destructive',
            title: 'CSV Import Failed',
            description: error.message,
          });
        },
      });
    });

    // Reset file input to allow re-uploading the same file
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
     <Card className="bg-transparent border-none shadow-none">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg">Import Data</CardTitle>
        <CardDescription>Load connections from a CSV file.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
        />
        <Button onClick={handleButtonClick} className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
        </Button>
       </CardContent>
    </Card>
  );
}
