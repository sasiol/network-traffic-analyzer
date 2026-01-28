 
 import { getTextFromUrl  } from './openOffscreen.js';
 

//helper to get base domain
//doesnt account for public suffixes like .co.uk or .gov.in at the moment
function getBaseDomain(hostname) {
  const parts = hostname.split('.');

  if (parts.length <= 2) {
    return hostname; 
  }

  return parts.slice(-2).join('.'); 
}

 // Track last scanned domain for each tab
const lastDomainByTab = new Map();


 //wait for page to load fully
chrome.webNavigation.onCompleted.addListener(details => {
  if (details.frameId === 0) {
    // if current domain === new domain -> dont proceed.
    // check if the web page domain changes ( so that if user moves around the website)
    
    try {
    const url = new URL(details.url);
    const baseDomain = getBaseDomain(url.hostname);

    const lastDomain = lastDomainByTab.get(details.tabId);

    if (lastDomain === baseDomain) {
      // Same domain as last scan for this tab — skip scanning
      console.log(`Skipping scan for ${baseDomain} — already scanned in this tab.`);
      return;
    }

    // Store the domain so we don't rescan on same site
  lastDomainByTab.set(details.tabId, baseDomain);
    //send message to content script find-privacyLinks to start working
  chrome.tabs.sendMessage(details.tabId, { type: 'scanPrivacyLinks' }, (response) => {
    if (chrome.runtime.lastError) {
     console.warn("Could not send message to content script:", chrome.runtime.lastError.message);
    return;
  }
 //check that some links were found
  if (response?.links?.length > 0) {
    console.log(" Privacy-related links found:", response.links);
    
    getTextFromUrl(response.links) // call function from openOffscreen to handle getting the text
  } else {
    console.log(" No privacy links found.");
    //for popup
    chrome.windows.create({
      url: chrome.runtime.getURL('linkPrompt.html'),
      type: 'popup',
      width: 400,
      height: 200
    });
  }
 });
  }catch (err) {
    console.error("Invalid URL:", details.url, err);
  }
}});     

// Cleanup when a tab is closed
chrome.tabs.onRemoved.addListener(tabId => {
  lastDomainByTab.delete(tabId);
});

 //listener for getting manual link
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'manualPrivacyLink' && message.url) {
    console.log("User provided manual privacy link:", message.url);
    
    
    getTextFromUrl([{ href: message.url }]);  

  }
});
