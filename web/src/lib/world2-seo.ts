import {
  World2SeoFaqItemSchema,
  World2SeoPageSchema,
  World2SeoSchema,
  type World2SeoPage,
} from "../schemas/world2-seo";
import { artRefPublicPath } from "./art-reel";
import {
  CANONICAL_OCCUPANCY_ORIGIN,
  ECONEXT_HREF,
  WORLD2_PAGE_ORIGIN,
} from "./origins";

export const WORLD2_SEO = World2SeoSchema.parse({
  brandName: "World 2",
  siteName: "World 2 — Agent Play",
  legalName: "Viroke Technologies Inc (a Delaware US corporation)",
  defaultTitle: "World 2 — Agent Play Human and Agent Metaverse",
  defaultDescription:
    "World 2 is the next AI agent and human interaction metaverse from Agent Play. Come out, earn, and take APU home on streets they already share.",
  keywords: [
    "World 2",
    "Agent Play",
    "Agent Play World",
    "AI agent metaverse",
    "human and agent interaction",
    "APU",
    "APW",
    "v0peer",
    "citizenship",
    "Viroke Technologies",
    "Maple Ave",
    "spatial AI",
  ],
  locale: "en_US",
  themeColor: "#f3eee4",
  ogImagePath: artRefPublicPath("agent-play-community-world-plaza.png"),
  ogImageAlt: "The World 2 plaza on Agent Play",
});

export const WORLD2_SEO_FAQ = [
  World2SeoFaqItemSchema.parse({
    question: "What is World 2?",
    answer:
      "World 2 is Agent Play's next human and agent interaction metaverse. Open this page to come out, earn, and take APU home while occupancy stays on agent-play.com.",
  }),
  World2SeoFaqItemSchema.parse({
    question: "Is World 2 the occupancy host or serverUrl?",
    answer:
      "No. Occupancy, wallets, and credentials.json serverUrl stay at https://agent-play.com. World 2 is a page origin, never the occupancy host.",
  }),
  World2SeoFaqItemSchema.parse({
    question: "How do I become a World 2 citizen?",
    answer:
      "Open Play, start citizenship or restore the credentials.json Agent Play issued, then enter the streets. Keep the ten-word recovery key.",
  }),
  World2SeoFaqItemSchema.parse({
    question: "What do I take home from World 2?",
    answer:
      "APU is what you take home. Banking and cash-out run through Econext. This page does not take card numbers or chain checkout.",
  }),
];

const SEARCH_CRAWLERS = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot",
  "DuckDuckBot",
] as const;

const RAW_PAGES: readonly World2SeoPage[] = [
  {
    path: "/",
    title: WORLD2_SEO.defaultTitle,
    description: WORLD2_SEO.defaultDescription,
    indexable: true,
    changeFrequency: "daily",
    priority: 1,
  },
  {
    path: "/interest",
    title: "Register World 2 Launch Interest | Agent Play",
    description:
      "Leave your name for the World 2 launch show. Agent Play already has humans and agents on the streets. We will tell you when this page becomes play.",
    indexable: true,
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/assets",
    title: "World 2 Citizen Shop and Assets | Agent Play",
    description:
      "Buy World 2 avatar sets and ink with Agent Play citizenship. Upload credentials.json, reserve an asset, and settle money movement through Econext.",
    indexable: true,
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: "/developers",
    title: "World 2 Developers | Agent Play",
    description:
      "World 2 is a Vite TypeScript WebGL client of Agent Play occupancy. Occupancy stays at agent-play.com. Use this page to pick a room and build.",
    indexable: true,
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/game-shell",
    title: "Play World 2 Citizenship | Agent Play",
    description:
      "Start or restore Agent Play citizenship, then enter the World 2 streets. This play desk is a live session, not a listing for search engines.",
    indexable: false,
    changeFrequency: "monthly",
    priority: 0.1,
  },
  {
    path: "/webgl",
    title: "World 2 WebGL Lab | Agent Play",
    description:
      "A World 2 engineering room for WebGL work against Agent Play occupancy. This lab is for builders, not a public search destination.",
    indexable: false,
    changeFrequency: "monthly",
    priority: 0.1,
  },
  {
    path: "/rust",
    title: "World 2 Native Rust Lab | Agent Play",
    description:
      "A World 2 engineering room for Rust work against Agent Play occupancy. This lab is for builders, not a public search destination.",
    indexable: false,
    changeFrequency: "monthly",
    priority: 0.1,
  },
  {
    path: "/c",
    title: "World 2 Native C Lab | Agent Play",
    description:
      "A World 2 engineering room for native C work against Agent Play occupancy. This lab is for builders, not a public search destination.",
    indexable: false,
    changeFrequency: "monthly",
    priority: 0.1,
  },
  {
    path: "/visage",
    title: "World 2 Visage Avatar Lab | Agent Play",
    description:
      "A World 2 engineering room for Ready Player Me Visage avatars. This lab is for builders, not a public search destination.",
    indexable: false,
    changeFrequency: "monthly",
    priority: 0.1,
  },
].map((page) => World2SeoPageSchema.parse(page));

export const WORLD2_SEO_PAGES: readonly World2SeoPage[] = RAW_PAGES;

export type World2JsonLdNode = {
  "@type": string;
  [key: string]: unknown;
};

export type World2JsonLdGraph = {
  "@context": "https://schema.org";
  "@graph": World2JsonLdNode[];
};

export type World2DocumentTags = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  keywords: string;
  themeColor: string;
  og: {
    type: "website";
    locale: "en_US";
    siteName: string;
    title: string;
    description: string;
    url: string;
    image: string;
    imageAlt: string;
  };
  twitter: {
    card: "summary_large_image";
    title: string;
    description: string;
    image: string;
  };
  jsonLd: World2JsonLdGraph;
};

export type World2WebManifest = {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: "standalone";
  background_color: string;
  theme_color: string;
  lang: "en";
  icons: readonly { src: string; type: string; purpose: string }[];
};

export const seoPathFromLocation = (pathname: string): string => {
  if (pathname.length === 0) {
    return "/";
  }
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
};

const pageForPath = (pathname: string): World2SeoPage | undefined => {
  const path = seoPathFromLocation(pathname);
  return WORLD2_SEO_PAGES.find((page) => page.path === path);
};

const absoluteUrl = (origin: string, path: string): string => {
  if (path === "/") {
    return `${origin}/`;
  }
  return `${origin}${path}`;
};

export const buildWorld2JsonLdGraph = (options: {
  origin: string;
  path: string;
}): World2JsonLdGraph => {
  const origin = options.origin;
  const path = seoPathFromLocation(options.path);
  const page = pageForPath(path);
  const organizationId = `${origin}/#organization`;
  const websiteId = `${origin}/#website`;
  const canonical = absoluteUrl(origin, path);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Agent Play",
        legalName: WORLD2_SEO.legalName,
        url: CANONICAL_OCCUPANCY_ORIGIN,
        sameAs: [origin, ECONEXT_HREF],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: WORLD2_SEO.siteName,
        url: origin,
        description: WORLD2_SEO.defaultDescription,
        inLanguage: "en",
        isPartOf: { "@id": `${CANONICAL_OCCUPANCY_ORIGIN}/#website` },
        publisher: { "@id": organizationId },
      },
      {
        "@type": "WebApplication",
        name: WORLD2_SEO.siteName,
        url: origin,
        applicationCategory: "GameApplication",
        operatingSystem: "Web",
        description: WORLD2_SEO.defaultDescription,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        publisher: { "@id": organizationId },
      },
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: page?.title ?? WORLD2_SEO.defaultTitle,
        description: page?.description ?? WORLD2_SEO.defaultDescription,
        isPartOf: { "@id": websiteId },
        inLanguage: "en",
      },
      ...(path === "/"
        ? [
            {
              "@type": "FAQPage",
              mainEntity: WORLD2_SEO_FAQ.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };
};

export const documentTagsForPath = (
  pathname: string,
  origin = WORLD2_PAGE_ORIGIN
): World2DocumentTags => {
  const path = seoPathFromLocation(pathname);
  const page = pageForPath(path);
  const title = page?.title ?? WORLD2_SEO.defaultTitle;
  const description = page?.description ?? WORLD2_SEO.defaultDescription;
  const indexable = page?.indexable === true;
  const canonical = absoluteUrl(origin, page?.path ?? path);
  const image = `${origin}${WORLD2_SEO.ogImagePath}`;
  const robots = indexable
    ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    : "noindex, nofollow";

  return {
    title,
    description,
    canonical,
    robots,
    keywords: WORLD2_SEO.keywords.join(", "),
    themeColor: WORLD2_SEO.themeColor,
    og: {
      type: "website",
      locale: WORLD2_SEO.locale,
      siteName: WORLD2_SEO.siteName,
      title,
      description,
      url: canonical,
      image,
      imageAlt: WORLD2_SEO.ogImageAlt,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      image,
    },
    jsonLd: buildWorld2JsonLdGraph({ origin, path }),
  };
};

const upsertMeta = (
  attr: "name" | "property",
  key: string,
  content: string
): void => {
  const existing = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (existing instanceof HTMLMetaElement) {
    existing.content = content;
    return;
  }
  const meta = document.createElement("meta");
  meta.setAttribute(attr, key);
  meta.content = content;
  document.head.appendChild(meta);
};

const upsertLink = (rel: string, href: string, extra?: Record<string, string>): void => {
  const existing = document.head.querySelector(`link[rel="${rel}"]${extra?.hreflang ? `[hreflang="${extra.hreflang}"]` : ""}`);
  if (existing instanceof HTMLLinkElement && extra === undefined) {
    existing.href = href;
    return;
  }
  if (existing instanceof HTMLLinkElement && extra !== undefined) {
    existing.href = href;
    return;
  }
  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  if (extra !== undefined) {
    for (const [name, value] of Object.entries(extra)) {
      link.setAttribute(name, value);
    }
  }
  document.head.appendChild(link);
};

export const applyWorld2DocumentTags = (tags: World2DocumentTags): void => {
  document.title = tags.title;
  document.documentElement.lang = "en";
  upsertMeta("name", "description", tags.description);
  upsertMeta("name", "robots", tags.robots);
  upsertMeta("name", "keywords", tags.keywords);
  upsertMeta("name", "author", WORLD2_SEO.legalName);
  upsertMeta("name", "application-name", WORLD2_SEO.siteName);
  upsertMeta("name", "theme-color", tags.themeColor);
  upsertMeta("property", "og:type", tags.og.type);
  upsertMeta("property", "og:locale", tags.og.locale);
  upsertMeta("property", "og:site_name", tags.og.siteName);
  upsertMeta("property", "og:title", tags.og.title);
  upsertMeta("property", "og:description", tags.og.description);
  upsertMeta("property", "og:url", tags.og.url);
  upsertMeta("property", "og:image", tags.og.image);
  upsertMeta("property", "og:image:alt", tags.og.imageAlt);
  upsertMeta("name", "twitter:card", tags.twitter.card);
  upsertMeta("name", "twitter:title", tags.twitter.title);
  upsertMeta("name", "twitter:description", tags.twitter.description);
  upsertMeta("name", "twitter:image", tags.twitter.image);
  upsertMeta("name", "twitter:image:alt", tags.og.imageAlt);
  upsertLink("canonical", tags.canonical);
  upsertLink("alternate", tags.canonical, { hreflang: "en" });
  upsertLink("alternate", tags.canonical, { hreflang: "x-default" });
  upsertLink("manifest", "/manifest.webmanifest");

  const existing = document.getElementById("world2-jsonld");
  const script =
    existing instanceof HTMLScriptElement
      ? existing
      : document.createElement("script");
  script.id = "world2-jsonld";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(tags.jsonLd);
  if (existing === null) {
    document.head.appendChild(script);
  }
};

type World2SeoFileOptions = {
  origin?: string;
  now?: Date;
};

export const buildWorld2SitemapXml = (
  options: World2SeoFileOptions = {}
): string => {
  const origin = options.origin ?? WORLD2_PAGE_ORIGIN;
  const lastmod = (options.now ?? new Date()).toISOString().slice(0, 10);
  const body = WORLD2_SEO_PAGES.filter((page) => page.indexable)
    .map((page) => {
      const loc = absoluteUrl(origin, page.path);
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${page.changeFrequency}</changefreq>\n    <priority>${page.priority.toFixed(1)}</priority>\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
};

export const buildWorld2RobotsTxt = (
  options: World2SeoFileOptions = {}
): string => {
  const origin = options.origin ?? WORLD2_PAGE_ORIGIN;
  const disallowed = WORLD2_SEO_PAGES.filter((page) => !page.indexable).map(
    (page) => `Disallow: ${page.path}`
  );
  const crawlerBlocks = SEARCH_CRAWLERS.map(
    (agent) => `User-agent: ${agent}\nAllow: /`
  );
  return [
    "User-agent: *",
    "Allow: /",
    ...disallowed,
    "",
    ...crawlerBlocks,
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    `Host: ${origin}`,
    "",
  ].join("\n");
};

export const buildWorld2LlmsTxt = (
  options: World2SeoFileOptions = {}
): string => {
  const origin = options.origin ?? WORLD2_PAGE_ORIGIN;
  const publicPages = WORLD2_SEO_PAGES.filter((page) => page.indexable)
    .map((page) => `- [${page.title}](${absoluteUrl(origin, page.path)}): ${page.description}`)
    .join("\n");
  return [
    `# ${WORLD2_SEO.brandName}`,
    "",
    `> ${WORLD2_SEO.defaultDescription}`,
    "",
    `${WORLD2_SEO.siteName} is operated by ${WORLD2_SEO.legalName}. Occupancy stays at ${CANONICAL_OCCUPANCY_ORIGIN}. ${origin} is a page origin.`,
    "",
    "## Pages",
    "",
    publicPages,
    "",
    "## Optional",
    "",
    `- [Agent Play occupancy](${CANONICAL_OCCUPANCY_ORIGIN})`,
    `- [Econext](${ECONEXT_HREF})`,
    "",
  ].join("\n");
};

export const buildWorld2Manifest = (): World2WebManifest => {
  return {
    name: WORLD2_SEO.siteName,
    short_name: WORLD2_SEO.brandName,
    description: WORLD2_SEO.defaultDescription,
    start_url: "/",
    display: "standalone",
    background_color: WORLD2_SEO.themeColor,
    theme_color: WORLD2_SEO.themeColor,
    lang: "en",
    icons: [
      {
        src: WORLD2_SEO.ogImagePath,
        type: "image/png",
        purpose: "any",
      },
    ],
  };
};

export const WORLD2_SEO_STATIC_FILES: Record<string, string> = {
  "/robots.txt": "text/plain; charset=utf-8",
  "/sitemap.xml": "application/xml; charset=utf-8",
  "/llms.txt": "text/plain; charset=utf-8",
  "/manifest.webmanifest": "application/manifest+json; charset=utf-8",
};

export const world2SeoFileBody = (pathname: string): string | null => {
  if (pathname === "/robots.txt") {
    return buildWorld2RobotsTxt();
  }
  if (pathname === "/sitemap.xml") {
    return buildWorld2SitemapXml();
  }
  if (pathname === "/llms.txt") {
    return buildWorld2LlmsTxt();
  }
  if (pathname === "/manifest.webmanifest") {
    return `${JSON.stringify(buildWorld2Manifest(), null, 2)}\n`;
  }
  return null;
};
