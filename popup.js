
//for popup when user click the extension icon

document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("domainList");
  const clearBtn = document.getElementById("clear");

  // get active tab id
   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;

    //ask monitor-3rds for the 3rd party domain list
  chrome.runtime.sendMessage({type: "getThirdParties", tabId},(response)=>
  {
    const domains = response?.thirdParties || [];
    list.innerHTML= ""; //clear existing list

    domains.forEach(domain => {
      const li=document.createElement("li");
      li.textContent=domain;
      list.appendChild(li);

    });

  });
  

  // Clear button
 if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "clearThirdParties", tabId }, () => {
          list.innerHTML = "<li>Cleared!</li>";
        });
      });
    }
  });
});
