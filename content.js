//floating box
//is content scripts so should be moved accordingly tho /content (rename)

// Check if the box already exists to avoid duplication
if (!document.getElementById('third-party-box')) {
  const box = document.createElement('div');
  box.id = 'third-party-box';
  box.style.position = 'fixed';
  box.style.bottom = '20px';
  box.style.right = '20px';
  box.style.zIndex = '100000';
  box.style.backgroundColor = 'white';
  box.style.border = '1px solid #ccc';
  box.style.padding = '10px';
  box.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  box.style.fontFamily = 'sans-serif';
  box.style.fontSize = '12px';
  box.style.maxHeight = '500px';
  box.style.overflowY = 'auto';

  box.innerHTML = '<strong>Third-Party Domains</strong><ul id="third-party-list" style="margin-top: 5px;"></ul>';
  document.body.appendChild(box);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'thirdPartyUpdate') {
    const list = document.getElementById('third-party-list');
    if (!list) return;

    // Clear previous list
    list.innerHTML = '';

    const domains = message.domains || [];
    domains.forEach(domain => {
      const item = document.createElement('li');
      item.textContent = domain;
      list.appendChild(item);
    });
  }
});
