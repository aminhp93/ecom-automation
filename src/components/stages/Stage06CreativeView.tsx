'use client';

import type { Product } from '@/lib/db/store';
import { SceneBuilder } from '@/components/creative/SceneBuilder';

interface Stage06CreativeViewProps {
  product: Product | null;
}

export function Stage06CreativeView({ product }: Stage06CreativeViewProps) {
  return <SceneBuilder productName={product?.name} />;
}
