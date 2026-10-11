import { getCollection, type CollectionEntry } from 'astro:content';
import { sitePath } from './urls';

export type Poem = CollectionEntry<'poems'>;

export async function getPoems(lang: Poem['data']['lang']) {
  const poems = await getCollection('poems', ({ data }) => data.lang === lang);
  return poems.sort((a, b) => a.data.order - b.data.order);
}

export function poemUrl(poem: Poem) {
  return sitePath(poem.data.lang === 'ru'
    ? `/ru/poems/${poem.data.slug}/`
    : `/poems/${poem.data.slug}/`);
}

export function homeUrl(lang: Poem['data']['lang']) {
  return sitePath(lang === 'ru' ? '/ru/' : '/');
}

export async function getCounterpart(poem: Poem) {
  const poems = await getPoems(poem.data.lang === 'ru' ? 'en' : 'ru');
  return poems.find((entry) => entry.data.poemId === poem.data.poemId);
}
