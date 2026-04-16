'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Bell, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/lib/generated/prisma';
import axios from 'axios';

interface ProductRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export default function ProductRequestModal({
  isOpen,
  onClose,
  product,
}: ProductRequestModalProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isAuthenticated = status === 'authenticated';

  const handleClose = () => {
    setMessage('');
    setIsSuccess(false);
    onClose();
  };

  const handleLogin = (): void => {
    handleClose();
    router.push(`/auth/login?callbackUrl=/products/${product.slug}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !session?.user?.id) {
      toast.error('Please login first');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await axios.post('/api/product-requests', {
        productId: product.id,
        message: message.trim() || undefined,
      });

      if (res.data.success) {
        setIsSuccess(true);
        toast.success(
          "Product request submitted! We'll notify you when it's back in stock.",
        );
      } else {
        toast.error(res.data.error || 'Failed to submit request');
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        'Failed to submit request. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        {isSuccess ? (
          <div className='py-6 text-center'>
            <CheckCircle className='w-16 h-16 text-green-500 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              Request Submitted!
            </h3>
            <p className='text-gray-600 mb-6'>
              We&apos;ll notify you when{' '}
              <span className='font-medium text-gray-900'>{product.title}</span>{' '}
              is back in stock.
            </p>
            <Button
              onClick={handleClose}
              className='bg-green-600 hover:bg-green-700'
            >
              Got it
            </Button>
          </div>
        ) : !isAuthenticated ? (
          <>
            <DialogHeader>
              <div className='flex items-center gap-2 mb-2'>
                <Bell className='w-5 h-5 text-amber-500' />
                <DialogTitle>Login Required</DialogTitle>
              </div>
              <DialogDescription>
                Please login to request this product. We&apos;ll notify you when
                it&apos;s back in stock.
              </DialogDescription>
            </DialogHeader>
            <div className='py-4'>
              <div className='bg-gray-50 rounded-lg p-4 mb-4'>
                <p className='font-medium text-gray-900'>{product.title}</p>
                <p className='text-sm text-gray-500'>{product.brand}</p>
              </div>
            </div>
            <DialogFooter className='flex gap-2'>
              <Button variant='outline' onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleLogin}
                className='bg-green-600 hover:bg-green-700'
              >
                Login
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <div className='flex items-center gap-2 mb-2'>
                <Bell className='w-5 h-5 text-amber-500' />
                <DialogTitle>Request Product</DialogTitle>
              </div>
              <DialogDescription>
                Get notified when this product is back in stock.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4'>
              {/* Product Info */}
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='font-medium text-gray-900'>{product.title}</p>
                <p className='text-sm text-gray-500'>{product.brand}</p>
              </div>

              {/* User Info (Read-only) */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Name</Label>
                  <Input
                    id='name'
                    value={session?.user?.name || ''}
                    disabled
                    className='bg-gray-50'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    value={session?.user?.email || ''}
                    disabled
                    className='bg-gray-50'
                  />
                </div>
              </div>

              {/* Optional Message */}
              <div className='space-y-2'>
                <Label htmlFor='message'>Message (Optional)</Label>
                <Textarea
                  id='message'
                  placeholder='Any additional information about your request...'
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className='resize-none'
                />
              </div>
            </div>

            <DialogFooter className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='bg-green-600 hover:bg-green-700'
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Bell className='w-4 h-4 mr-2' />
                    Notify Me
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
