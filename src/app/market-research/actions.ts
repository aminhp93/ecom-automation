'use server';

import { updateTag } from 'next/cache';
import { RESEARCH_CACHE_TAG } from '@/lib/research/db';

/** Xoá cache dữ liệu research để lần render sau đọc thẳng Supabase (sau khi Claude vừa ghi số liệu mới). */
export async function refreshResearchData() {
  updateTag(RESEARCH_CACHE_TAG);
}
