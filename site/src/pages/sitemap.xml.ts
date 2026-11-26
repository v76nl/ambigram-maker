import type { APIRoute } from "astro";

// 1ページだけのサイトなので、トップページの URL を1つだけ載せる
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const url = new URL(base, site).href;
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${url}</loc></url>
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
