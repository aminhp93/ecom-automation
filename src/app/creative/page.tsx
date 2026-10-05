import Link from 'next/link';
import { SceneBuilder } from '@/components/creative/SceneBuilder';

export const metadata = { title: 'Creative Studio — Ghép video theo scene' };

export default function CreativeStudioPage() {
  return <div className="min-h-screen bg-zinc-50 px-5 py-6 text-zinc-900"><div className="mx-auto max-w-7xl space-y-5"><Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">← Ecom OS</Link><SceneBuilder /></div></div>;
}
