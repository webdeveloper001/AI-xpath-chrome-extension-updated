/*
 Apache License, Version 2.0.
*/
function handleRequest(a, b, c) {
    chrome.tabs.sendMessage(b.tab.id, a, c)
}
chrome.runtime.onMessage.addListener(handleRequest);
chrome.browserAction.onClicked.addListener(function(a) {
    chrome.tabs.sendMessage(a.id, {
        type: "toggleBar"
    })
});
var thisVersion = chrome.runtime.getManifest().version,
    _gaq = _gaq || [];
_gaq.push(["_setAccount", utilityFn.analyticsID]);
_gaq.push(["_trackEvent", "version", thisVersion]);
(function() {
    var a = document.createElement("script");
    a.type = "text/javascript";
    a.async = !0;
    a.src = "https://ssl.google-analytics.com/ga.js";
    var b = document.getElementsByTagName("script")[0];
    b.parentNode.insertBefore(a, b)
})();
