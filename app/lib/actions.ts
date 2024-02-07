'use server'

import {z} from 'zod';
import { Invoice } from './definitions';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';


const CreateInvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string()
})

const CreateInvoiceFormSchema = CreateInvoiceSchema.omit({
    id:true,
    date:true
})

export async function createInvoice(formData: FormData){
    const {customerId, amount, status} = CreateInvoiceFormSchema.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })
    
    const amountInCents = amount * 100

    const [date] = new Date().toISOString().split('T')
  
    await sql`
        INSERT INTO INVOICES (customer_id, amount, status, date )
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `
   revalidatePath('/dashboard/invoices')
   redirect('/dashboard/invoices')
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  }