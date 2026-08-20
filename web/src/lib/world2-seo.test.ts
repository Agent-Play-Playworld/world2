import { afterEach, describe, expect, it } from "vitest";
import indexHtml from "../../index.html?raw";
import { WORLD2_PAGE_ORIGIN } from "./origins";
import {
  WORLD2_SEO,
  WORLD2_SEO_FAQ,
  applyWorld2DocumentTags,
  buildWorld2JsonLdGraph,
  buildWorld2LlmsTxt,
  buildWorld2Manifest,
  buildWorld2RobotsTxt,
  buildWorld2SitemapXml,
  documentTagsForPath,
  seoPathFromLocation,
  world2SeoFileBody,
} from "./world2-seo";

describe("World 2 SEO catalog", () => {
  it("keeps the default title and description in search-snippet range", () => {
    expect(WORLD2_SEO.brandName).toBe("World 2");
    expect(WORLD2_SEO.siteName).toContain("Agent Play");
    expect(WORLD2_SEO.legalName).toMatch(/Viroke Technologies/i);
    expect(WORLD2_SEO.defaultTitle).toContain("World 2");
    expect(WORLD2_SEO.defaultTitle).toContain("Agent Play");
    expect(WORLD2_SEO.defaultTitle.length).toBeGreaterThanOrEqual(40);
    expect(WORLD2_SEO.defaultTitle.length).toBeLessThanOrEqual(65);
    expect(WORLD2_SEO.defaultDescription.length).toBeGreaterThanOrEqual(110);
    expect(WORLD2_SEO.defaultDescription.length).toBeLessThanOrEqual(160);
    expect(WORLD2_SEO.defaultDescription).toMatch(/Agent Play/i);
    expect(WORLD2_SEO.defaultDescription).not.toMatch(/camera/i);
  });

  it("covers the search phrases people use to find World 2", () => {
    const keywords = WORLD2_SEO.keywords.map((keyword) => keyword.toLowerCase());
    for (const phrase of [
      "world 2",
      "agent play",
      "agent play world",
      "ai agent metaverse",
      "apu",
    ]) {
      expect(keywords).toContain(phrase);
    }
  });

  it("answers World 2 questions without calling it occupancy or a camera", () => {
    const questions = WORLD2_SEO_FAQ.map((item) => item.question);
    expect(questions).toContain("What is World 2?");
    expect(questions.some((question) => /occupancy|serverurl/i.test(question))).toBe(
      true
    );
    for (const item of WORLD2_SEO_FAQ) {
      expect(item.answer.length).toBeGreaterThan(40);
      expect(item.answer).not.toMatch(/camera/i);
    }
  });
});

describe("World 2 document tags", () => {
  it("indexes public pages and noindexes play and lab rooms", () => {
    const landing = documentTagsForPath("/");
    expect(landing.title).toBe(WORLD2_SEO.defaultTitle);
    expect(landing.canonical).toBe(`${WORLD2_PAGE_ORIGIN}/`);
    expect(landing.robots).toMatch(/index/i);
    expect(landing.og.image).toContain("/art/refs/");
    expect(documentTagsForPath("/interest").robots).toMatch(/index/i);
    expect(documentTagsForPath("/assets").robots).toMatch(/index/i);
    expect(documentTagsForPath("/developers").robots).toMatch(/index/i);
    expect(documentTagsForPath("/game-shell").robots).toMatch(/noindex/i);
    expect(documentTagsForPath("/webgl").robots).toMatch(/noindex/i);
    expect(documentTagsForPath("/unknown").robots).toMatch(/noindex/i);
  });

  it("normalizes trailing slashes before looking up a page", () => {
    expect(seoPathFromLocation("/interest/")).toBe("/interest");
    expect(seoPathFromLocation("/")).toBe("/");
  });

  it("applies title, canonical, robots, and JSON-LD to the document", () => {
    applyWorld2DocumentTags(documentTagsForPath("/interest"));
    expect(document.title).toMatch(/interest/i);
    expect(
      document.head.querySelector('meta[name="description"]')
    ).toHaveAttribute("content", expect.stringMatching(/World 2/i));
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${WORLD2_PAGE_ORIGIN}/interest`
    );
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      expect.stringMatching(/index/i)
    );
    const jsonLd = document.getElementById("world2-jsonld");
    expect(jsonLd).toHaveAttribute("type", "application/ld+json");
    expect(jsonLd?.textContent).toContain("WebPage");
    expect(jsonLd?.textContent).not.toContain("FAQPage");
  });
});

describe("World 2 crawler files", () => {
  it("lists only indexable URLs in the sitemap and blocks play rooms in robots", () => {
    const sitemap = buildWorld2SitemapXml({
      origin: WORLD2_PAGE_ORIGIN,
      now: new Date("2026-08-20"),
    });
    expect(sitemap).toContain(`${WORLD2_PAGE_ORIGIN}/</loc>`);
    expect(sitemap).toContain(`${WORLD2_PAGE_ORIGIN}/interest</loc>`);
    expect(sitemap).not.toContain("/game-shell");
    expect(sitemap).not.toContain("/webgl");

    const robots = buildWorld2RobotsTxt({ origin: WORLD2_PAGE_ORIGIN });
    expect(robots).toContain("Disallow: /game-shell");
    expect(robots).toContain(`Sitemap: ${WORLD2_PAGE_ORIGIN}/sitemap.xml`);
    expect(robots).toContain("GPTBot");
  });

  it("describes World 2 for AI crawlers and install prompts", () => {
    const llms = buildWorld2LlmsTxt({ origin: WORLD2_PAGE_ORIGIN });
    expect(llms).toContain("# World 2");
    expect(llms).toContain("https://agent-play.com");
    expect(llms).toContain("page origin");
    expect(llms).not.toMatch(/camera/i);

    const manifest = buildWorld2Manifest();
    expect(manifest.name).toBe(WORLD2_SEO.siteName);
    expect(manifest.short_name).toBe("World 2");
    expect(manifest.start_url).toBe("/");
  });

  it("serves robots, sitemap, llms, and the web manifest from known paths", () => {
    expect(world2SeoFileBody("/robots.txt")).toContain("Disallow: /game-shell");
    expect(world2SeoFileBody("/sitemap.xml")).toContain(
      `${WORLD2_PAGE_ORIGIN}/interest`
    );
    expect(world2SeoFileBody("/llms.txt")).toContain("# World 2");
    expect(world2SeoFileBody("/manifest.webmanifest")).toContain(
      WORLD2_SEO.siteName
    );
    expect(world2SeoFileBody("/unknown.txt")).toBeNull();
  });

  it("keeps the static HTML shell in sync with the default landing tags", () => {
    expect(indexHtml).toContain(WORLD2_SEO.defaultTitle);
    expect(indexHtml).toContain(WORLD2_SEO.defaultDescription);
    expect(indexHtml).toContain(`${WORLD2_PAGE_ORIGIN}/`);
    expect(indexHtml).toContain('rel="canonical"');
  });
});

describe("World 2 JSON-LD", () => {
  afterEach(() => {
    document.getElementById("world2-jsonld")?.remove();
  });

  it("names Viroke, occupancy, and the World 2 page origin", () => {
    const graph = buildWorld2JsonLdGraph({
      origin: WORLD2_PAGE_ORIGIN,
      path: "/",
    });
    const types = graph["@graph"].map((node) => node["@type"]);
    expect(types).toEqual(
      expect.arrayContaining(["Organization", "WebSite", "WebApplication", "FAQPage"])
    );
    expect(JSON.stringify(graph)).toContain("Viroke");
    expect(JSON.stringify(graph)).toContain("https://agent-play.com");
    expect(JSON.stringify(graph)).toContain(WORLD2_PAGE_ORIGIN);
  });

  it("keeps FAQ structured data on the landing page that shows the answers", () => {
    const landing = buildWorld2JsonLdGraph({
      origin: WORLD2_PAGE_ORIGIN,
      path: "/",
    });
    expect(JSON.stringify(landing)).toContain("FAQPage");

    const interest = buildWorld2JsonLdGraph({
      origin: WORLD2_PAGE_ORIGIN,
      path: "/interest",
    });
    expect(JSON.stringify(interest)).not.toContain("FAQPage");
  });
});
