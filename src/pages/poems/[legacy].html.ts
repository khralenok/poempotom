import type { APIRoute } from 'astro';
import { getPoems, poemUrl } from '../../lib/poems';
import { redirectPage } from '../../lib/redirect';

export async function getStaticPaths() {
  return (await getPoems('ru')).map((poem) => ({
    params: { legacy: poem.data.legacySlug },
    props: { destination: poemUrl(poem) },
  }));
}

export const GET: APIRoute = ({ props }) => redirectPage(props.destination, 'ru');
