'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormState } from 'react-dom';
import { useEffect, useTransition } from 'react';
import { Loader2, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { addConnection, getSuggestedNamesAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

const FormSchema = z.object({
  big: z.string().min(1, 'Big name is required.'),
  little: z.string().min(1, 'Little name is required.'),
  treeName: z.string(), // can be empty
  year: z.coerce
    .number()
    .min(1900, 'Please enter a valid year.')
    .max(
      new Date().getFullYear() + 1,
      'Year cannot be in the distant future.'
    ),
});

type ConnectionFormProps = {
  currentTree: string;
};

export function ConnectionForm({ currentTree }: ConnectionFormProps) {
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const { toast } = useToast();

  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(addConnection, initialState);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      big: '',
      little: '',
      treeName: '',
      year: new Date().getFullYear(),
    },
    context: state.errors,
  });

  useEffect(() => {
    if (state?.message && !Object.keys(state.errors ?? {}).length) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      form.reset();
    } else if (state?.message) {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: state.message,
      });
    }
  }, [state, toast, form]);

  const handleSuggestNames = () => {
    startSuggestionTransition(async () => {
      const result = await getSuggestedNamesAction(currentTree);
      if (result.success && result.data) {
        form.setValue('big', result.data.suggestedBigName);
        form.setValue('little', result.data.suggestedLittleName);
        toast({
          title: 'Suggestions Applied!',
          description: `AI suggested "${result.data.suggestedBigName}" and "${result.data.suggestedLittleName}".`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Suggestion Failed',
          description: result.error || 'Could not get AI suggestions.',
        });
      }
    });
  };

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg">New Connection</CardTitle>
        <CardDescription>Add a new big/little relationship.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Form {...form}>
          <form action={dispatch} className="space-y-4">
            <FormField
              control={form.control}
              name="big"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Big's Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="little"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Little's Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="treeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tree Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder={currentTree} {...field} />
                  </FormControl>
                  <FormDescription>Defaults to the current tree if left blank.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year of Pickup</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="button"
              onClick={handleSuggestNames}
              disabled={isSuggesting}
              variant="outline"
              className="w-full"
            >
              {isSuggesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Suggest Names with AI
            </Button>
            <Button type="submit" className="w-full">
              Add Connection
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
