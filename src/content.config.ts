import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    type: z.enum(['font', 'script']),
    category: z.string(),
    price: z.number(),
    currency: z.string().default('USD'),
    description: z.string(),
    thumbnail: z.string(),
    preview_images: z.array(z.string()).default([]),
    file_url: z.string().optional(),
    license_type: z.enum(['serial', 'standard']).default('standard'),
    serial_key_config: z
      .object({
        prefix: z.string(),
        length: z.number(),
        segments: z.number(),
        charset: z.string(),
      })
      .optional(),
    featured: z.boolean().default(false),
    status: z.enum(['published', 'draft']).default('published'),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    compatibility: z.string().optional(),
    video_url: z.string().optional(),
    font_weights: z.array(z.string()).optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
  }),
});

export const collections = { products, pages };
