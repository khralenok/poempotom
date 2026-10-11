import { redirectPage } from '../lib/redirect';
import { homeUrl } from '../lib/poems';

export const GET = () => redirectPage(homeUrl('en'));
