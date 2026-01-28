
export function trackArticleRequest(details) {
  try {
    const url = new URL(details.url);

    const urlParamsKeys = ["dl", "url", "g", "ref"];
    const titleParamsKeys = ["dt", "pageName", "action_name", "title"];

    let articleUrl = null;
    let articleTitle = null;

    // Check URL-like params
    for (const key of urlParamsKeys) {
      const value = url.searchParams.get(key);
      if (value) {
        articleUrl = decodeURIComponent(value);
        break;
      }
    }

    // Check title-like params
    for (const key of titleParamsKeys) {
      const value = url.searchParams.get(key);
      if (value) {
        articleTitle = decodeURIComponent(value);
        break;
      }
    }

    if (articleUrl || articleTitle) {
      console.log("Article-related leak:", {
        articleUrl,
        articleTitle,
        requestUrl: details.url,
      });

      // Return only the extracted info
      return { articleUrl, articleTitle };
    }
  } catch (e) {
    console.warn("Error in trackArticleRequest:", e);
  }

  return null;
}


