import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const poems = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/poems',
    generateId: ({ data }) => `${data.lang}/${data.poemId}`,
  }),
  schema: z.object({
    poemId: z.string().regex(/^\d{2}$/),
    title: z.string(),
    listTitle: z.string().optional(),
    lang: z.enum(['ru', 'en']),
    order: z.number().int().positive(),
    slug: z.string(),
    legacySlug: z.string().optional(),
    illustration: z.string(),
  }).refine((data) => data.lang !== 'ru' || Boolean(data.legacySlug), {
    message: 'Russian poems must retain their original URL slug.',
  }),
});

export const collections = { poems };
