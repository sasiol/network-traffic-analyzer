
export function getTextFromUrl(links) {
  ensureOffscreenDocument().then(() => {
    const results = [];
    let responses = 0;

    links.forEach(link => {
      chrome.runtime.sendMessage({ type: 'getTextFromUrl', url: link.href }, response => {
        results.push({
          href: link.href,
          text: response?.text || null,
          error: response?.error || null
        });

        responses++;
        if (responses === links.length) {
          const texts = results
            .filter(r => r.text && !r.error)
            .map(r => ({ href: r.href, text: r.text }));

          // Send to server
          fetch("http://127.0.0.1:5000/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pages: texts })
          }).then(() => {
            console.log("Texts sent to LLM server");
          }).catch(err => {
            console.error("LLM server error:", err);
          });
        }
      });
    });
  }).catch(err => {
    console.error('Offscreen error:', err);
  });
}


//helpers
async function ensureOffscreenDocument() {
  const existing = await chrome.offscreen.hasDocument();
  if (existing) {
    return;
  }
  await chrome.offscreen.createDocument({
    url: 'offscreen/offscreen.html',
    reasons: ['DOM_PARSER', 'DOM_SCRAPING'],
    justification: 'Need to fetch page contents in background',
  });
}
