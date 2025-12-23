'use client';

import { Button, ButtonProps } from '@/components/ui/button';

type ClientButtonProps = ButtonProps & {
  children: React.ReactNode;
};

export function ClientButton({ children, ...props }: ClientButtonProps) {
  return <Button {...props}>{children}</Button>;
}
