
document.getElementById('submitLink').addEventListener('click', () => {
  const url = document.getElementById('manualLink').value.trim();
  if (url) {
    console.log("Popup sending manualPrivacyLink:", url); // <-- add this for debug
    chrome.runtime.sendMessage({ type: 'manualPrivacyLink', url }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError.message);
      }
      window.close();
    });
  } else {
    alert('Please enter a URL');
  }
});
