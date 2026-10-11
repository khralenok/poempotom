// Static hosts serve these as HTML, with a refresh and a fallback link for old bookmarks.
export function redirectPage(destination: string, lang: 'en' | 'ru' = 'en') {
  const href = destination.replace(/[&"<>]/g, (char) => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' })[char]!);
  const title = lang === 'ru' ? 'Страница переехала' : 'Page moved';
  const label = lang === 'ru' ? 'Перейти к странице' : 'Continue to the page';
  return new Response(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh" content="0;url=${href}"><link rel="canonical" href="${href}"><title>${title}</title></head><body><a href="${href}">${label}</a></body></html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
