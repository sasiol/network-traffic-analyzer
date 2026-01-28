
//gets the text from given url
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getTextFromUrl" && message.url) {

    (async () => {
      try {
        const url=message.url;
        const res = await fetch( url);
        
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const backupDoc = doc.cloneNode(true); // used for backup 
        backupDoc.querySelectorAll("script, style, header, footer").forEach(el => el.remove());//for backup
       //more agressive removal
        doc.querySelectorAll(`
            script, style, header, footer, nav,
            [class*="menu"], [id*="menu"],
            [class*="side-nav"],
            [id*="publications-modal"]
          `).forEach(el => el.remove());

          
          
        // Try to target only <main> content
        let main = doc.querySelector('main');

        let text;
        //if main found and it has inner text
        if (main && main.innerText) {
          text = main.innerText;
          //if no main fallback to using doc
        } else if (doc.body && doc.body.innerText){
          text = doc.body.innerText;
          //if even doc fails, use less cleaned backupDoc
        } else {
          text = backupDoc.body.innerText;
        }

        //clean the text some more (see the helper bellow)
        text = cleanText(text);
        console.log(`Extracted from ${url}:\n`, text);

        //send text back
        sendResponse({ success: true, text });
      } catch (error) {
        console.error("Failed to fetch page:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; 
  }
});

//helper for cleaning the text more
  function cleanText(text) {
  return text
    .replace(/\n{3,}/g, '\n\n')  // Collapse 3+ line breaks into 2
    .replace(/[ \t]{2,}/g, ' ')  // Collapse multiple spaces
    .replace(/\s+\n/g, '\n')     // Remove space before line breaks
    .replace(/\n\s+/g, '\n')     // Remove space after line breaks
    .trim();                     // Remove leading/trailing whitespace
}