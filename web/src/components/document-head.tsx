import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { applyWorld2DocumentTags, documentTagsForPath } from "../lib/world2-seo";

export const DocumentHead = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    applyWorld2DocumentTags(documentTagsForPath(pathname));
  }, [pathname]);

  return null;
};
