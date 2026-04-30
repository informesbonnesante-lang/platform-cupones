'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGuard({ children }) {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('medcupon_role');
    if (!role) router.replace('/');
  }, [router]);

  return children;
}
