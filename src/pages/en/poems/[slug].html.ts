import type { APIRoute } from 'astro';
import { getPoems, poemUrl } from '../../../lib/poems';
import { redirectPage } from '../../../lib/redirect';

export async function getStaticPaths() {
  return (await getPoems('en')).map((poem) => ({
    params: { slug: poem.data.slug },
    props: { destination: poemUrl(poem) },
  }));
}

export const GET: APIRoute = ({ props }) => redirectPage(props.destination);
