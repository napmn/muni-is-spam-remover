chrome.runtime.onMessage.addListener((request) => {
  chrome.storage.sync.get({ paths: [] }, (data) => {
    let array = data.paths;
    array.unshift(request.patternToIgnore);
    chrome.storage.sync.set({paths: array});
  })
});
