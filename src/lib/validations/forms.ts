import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email is too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(255, 'Password is too long'),
});

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email is too long'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username is too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(255, 'Password is too long'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const checkoutSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email is too long'),
});

export const orderEmailSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email is too long'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message is too long'),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderEmailInput = z.infer<typeof orderEmailSchema>;
