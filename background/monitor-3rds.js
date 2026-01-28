
//monitors network traffic
//shows what third parties data is going (per tab)
//uses keywords to try to capture relevant traffic to be send to LLM (accross tabs)
import { trackCartRequest } from './monitor-cart.js';
import { trackLocationRequest } from './monitor-location.js';
import { trackArticleRequest } from './monitor-article.js';


//used for testing at the moment (prop unc)
function buildLeakEvent(type, details, tabDomain, requestDomain, extraData = {}) {
  return {
    type,                          // "cart" | "url", etc
    method: details.method,        
    url: details.url,              
    tabDomain,                     // the base domain of the site
    requestDomain,                 // the 3rd-party domain
    initiator: details.initiator,
    tabId: details.tabId,
    data: extraData                
  };
}

let cartLeak;
let articleLeak;

let thirdnum=0;

//helper to get base domain
//doesnt account for public suffixes like .co.uk or .gov.in at the moment
function getBaseDomain(hostname) {
  const parts = hostname.split('.');

  if (parts.length <= 2) {
    return hostname; 
  }

  return parts.slice(-2).join('.'); 
}
let requestBuffer= []; //store relevant requests  across all tabs
let batchSent = false; //check if batch has been sent

//for keeping track of third parties per tab
const thirdPartyRequestsPerTab = {};
const baseDomainsPerTab = {};

//values for sending requests to llm
const FLUSH_INTERVAL_MS = 5000; // send every 5s
const MAX_BATCH_SIZE = 20; //


//when new navigation is commited, initialize lists for third parties
chrome.webNavigation.onCommitted.addListener(details => {
  if (details.frameId === 0) { // Only main frame
    chrome.tabs.get(details.tabId, tab => {
      if (chrome.runtime.lastError || !tab.url?.startsWith('http')) return;

        const tabDomain = getBaseDomain(new URL(tab.url).hostname);
        //const tabDomain = new URL(tab.url).hostname;//testing

      // if this tab is new, initialize thirdPartyRequestsPerTab[]
      if (!(details.tabId in thirdPartyRequestsPerTab)) {
        thirdPartyRequestsPerTab[details.tabId] = new Set();
        console.log("Initialized tracking for tab", details.tabId);
      }

      // Always update the base domain for this tab
      baseDomainsPerTab[details.tabId] = tabDomain;
      console.log("Set/updated base domain for tab", details.tabId, ":", tabDomain);
    });
  }
});


// fires for each relevant requests (filtered by type bellow)
// try to capture relevant requests using keywords
chrome.webRequest.onBeforeRequest.addListener(
  
  function(details) {
   
      const tabId = details.tabId; // keep track of the tab
      // Ignore non-tab requests (e.g., service workers, extensions)
      if (tabId < 0) return;


      try {
        //get  domain from the request url
        const requestUrl = new URL(details.url);
        const requestDomain = getBaseDomain(requestUrl.hostname);
       //const requestDomain = requestUrl.hostname; //testing
        const tabDomain = baseDomainsPerTab[tabId];

          if (!tabDomain) {
            console.log("Tab domain not set yet for tab", tabId);
            return; // Skip until tabDomain is known
          }
       
          //check if it is third party by comparing tab domain and request domain
          //could be other better more reliable way to do this 
        if (tabDomain  !== requestDomain) {
          thirdnum++;
           //console.log("Tab domain:", tabDomain, "Request domain:", requestDomain);

           //double check that thirparty list for this tab has been created
             if (!thirdPartyRequestsPerTab[tabId]) {
               thirdPartyRequestsPerTab[tabId] = new Set();
             }

          thirdPartyRequestsPerTab[tabId].add(requestDomain);
          console.log("Third-party request to:", requestDomain, "Details:", details);

          //check requests for keywords
          //const cartLeak = trackCartRequest(details);
          const articleLeak = trackArticleRequest(details);

          if (articleLeak) {
            const leakEvent = buildLeakEvent("article", details, tabDomain, requestDomain, articleLeak);
            requestBuffer.push(leakEvent);
            //console.log("Article leak event:", leakEvent);
            console.log("leak requestBuffer added", requestBuffer)
            }
        
          //send message to popups to display the info //not in use atm
             chrome.tabs.sendMessage(tabId, {
                type: "thirdPartyUpdate",
                domains: Array.from(thirdPartyRequestsPerTab[tabId] || [])
             });
         }

         //set max lenght for buffer 
          const BATCH_SIZE = 30;

          while (requestBuffer.length >= BATCH_SIZE) {
            const batchToSend = requestBuffer.splice(0, BATCH_SIZE);

            console.log("Sending batch:", batchToSend);

          //send them to llm
          fetch("http://127.0.0.1:5000/analyze_requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requests: batchToSend })
          }).then(() => {
            console.log("Batch sent to LLM server");
          }).catch(err => {
            console.error("LLM server error:", err);
          });

          batchSent = true; // don’t send more
        }
         console.log("number of third party requests: ", thirdnum);

      } catch (e) {
      console.warn("Invalid request URL:", details.url);
    }
  },

  //filter out unnecessary request types
  {  urls: ["<all_urls>"],
     types: ["script", "xmlhttprequest", "websocket", "ping", "main_frame", "sub_frame", "image"]
  },
  ["requestBody"]
 
);

    
  

//  Listen for messages from popup to send live third-party list
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getThirdParties" && message.tabId != null) {
    const domains = thirdPartyRequestsPerTab[message.tabId];
    sendResponse({ thirdParties: domains ? Array.from(domains) : [] });
  }
});

//cleanup: when tab is closed clean the info
chrome.tabs.onRemoved.addListener(tabId => {
    delete thirdPartyRequestsPerTab[tabId];
    delete baseDomainsPerTab[tabId];
});