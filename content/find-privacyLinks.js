
//go through the links in the page and check them for keywords
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'scanPrivacyLinks') {
    const keywords = ['privacy', 'dataskydd','personuppgiftspolicy', 'henkilotietojen-kasittely','Kakor på webbplatsen', 'cookie', 'tietosuojakaytanto','evaste', 'tietosuoja'];
    

    (async () => {
      const footerElements = document.querySelectorAll('footer, [class*="footer"], [id*="footer"]');//get footer elements

     let links = []
      //go though the footer elements and get the links
      footerElements.forEach(footer => {
        links.push(...footer.querySelectorAll('a'));
      });
      

     
      const matches = new Set();

      //loop through the found links
      for (const link of links) {
        const text = link.textContent?.toLowerCase().trim() || '';
        const href = link.href?.toLowerCase() || '';

        if (!href) continue;

        try {
          const linkUrl = new URL(href);
         // const linkDomain = linkUrl.hostname.replace(/^www\./, '');

         //check text and href for keywords
          if (keywords.some(k => href.includes(k))) {
            //"normalize" url to lessen chance of urls leading to same page
            const normalized = normalizeUrl(href); //see helper bellow for normalizeURL
            matches.add(normalized);

            console.log("text: ", text, "href:", href)
          }
        } catch(e) {
          continue;
        }
      }
      //change from set to array for sending
      const linksArray = Array.from(matches).map(href => ({ href }));
    
      sendResponse({ links: linksArray }); // goes to backgroundscript monitor-privacyLinks
    })();

    return true;
  }
});

//helper
 function normalizeUrl(url) {
        try {
          const u = new URL(url);
           u.hash = '';       // Remove fragment identifiers (#...)
          u.search = '';     // Remove query parameters (?...)
          if (u.pathname.endsWith('/')) {
            u.pathname = u.pathname.slice(0, -1); 
          }
          return u.toString();
        } catch (e) {
          return url; //  return original if parsing fails

        }
      }
