import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SignupPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/tenants'); }, []);
  return null;
}