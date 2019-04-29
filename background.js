// Copyright by fencing

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  lastTabId = tabs[0].id;
  chrome.pageAction.show(lastTabId);
});

// Called when the user clicks on the page action.
chrome.pageAction.onClicked.addListener(function(tab) {
  var clicks = tab_clicks[tab.id] || 0;
  chrome.pageAction.setIcon({path: "icon" + (clicks + 1) + ".png",
                             tabId: tab.id});
  if (clicks % 2) {
    chrome.pageAction.show(tab.id);
  } else {
    chrome.pageAction.hide(tab.id);
    setTimeout(function() { chrome.pageAction.show(tab.id); }, 200);
  }
  chrome.pageAction.setTitle({title: "click:" + clicks, tabId: tab.id});

  // We only have 2 icons, but cycle through 3 icons to test the
  // out-of-bounds index bug.
  clicks++;
  if (clicks > 3)
    clicks = 0;
  tab_clicks[tab.id] = clicks;
});


var typeMap = {
    "txt"   : "text/plain",
    "html"  : "text/html",
    "css"   : "text/css",
    "js"    : "text/javascript",
    "json"  : "text/json",
    "xml"   : "text/xml",
    "jpg"   : "image/jpeg",
    "gif"   : "image/gif",
    "png"   : "image/png",
    "webp"  : "image/webp"
}

function isJSON(str) {
    if (typeof str == 'string') {
        try {
            JSON.parse(str);
            return true;
        } catch(e) {
            //console.log(e);
            return false;
        }
    }
}
function getLocalFileUrl(url) {
    var arr = url.split('.');
    var type = arr[arr.length-1];
    var xhr = new XMLHttpRequest();
    xhr.open('get', url, false);
    xhr.send(null);
    var content = xhr.responseText || xhr.responseXML;
    if (!content) {
        return false;
    }
    content = encodeURIComponent(
        type === 'js' ?
        content.replace(/[\u0080-\uffff]/g, function($0) {
            var str = $0.charCodeAt(0).toString(16);
            return "\\u" + '00000'.substr(0, 4 - str.length) + str;
        }) : content
    );
    //return ("data:" + (typeMap[type] || typeMap.txt) + ";charset=utf-8," + content);
    return (unescape(content));
}
// chrome.contextMenus.create({
//     title: "测试右键菜单",
//     onclick: function(){alert('您点击了右键菜单！');}
// });

chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    for (var i = 0; i < details.requestHeaders.length; ++i) {
      exists = false;
      if (details.requestHeaders[i].name.toLowerCase() == 'origin') {
      	exists = true;
      	details.requestHeaders[i].value = 'http://evil.aaa163.com';
        //details.requestHeaders.splice(i, 1);
        break;
      }
    }
    if (!exists) {
    	details.requestHeaders.push({ name: 'Origin', value: 'http://evil.aaa163.com'});
    }
    return {requestHeaders: details.requestHeaders};
  },
  {urls: ["<all_urls>"]},
  ["blocking", "requestHeaders"]);

chrome.notifications.onButtonClicked.addListener(function(id){
	chrome.tabs.create({
		url: id
		})
	chrome.notifications.clear(id);

});

function createNotification(url){
chrome.notifications.create(
 
  url,  // id
 
  {
 
    type: 'basic',

	iconUrl: 'icon.png',
 
    title: '通知',
 
 	message: '发现一处CORS',
 
	buttons: [{title:url,iconUrl:''}],
 
    eventTime: Date.now() + 2000
 
  },
 
  (id)=>{
    //console.log(id);
 
  }    
);

}




chrome.webRequest.onResponseStarted.addListener(function(details){
	 flag1 = 0;
	 flag2 = 0;
     for (var i = 0; i < details.responseHeaders.length; ++i) {
    	if (details.statusCode == 200 && details.responseHeaders[i].name.toLowerCase() === 'access-control-allow-origin' && details.responseHeaders[i].value == 'http://evil.aaa163.com') {
    		if (isJSON(getLocalFileUrl(details.url)))
    		{
    			console.log(details.url);
    			console.log(getLocalFileUrl(details.url));
    			createNotification(details.url);
    			break;
    		}
    	}
/*    	if (details.statusCode == 200 && details.responseHeaders[i].name.toLowerCase() === 'access-control-allow-origin' && details.responseHeaders[i].value == '*') {
    		flag1 = 1;
    	}
    	if (details.statusCode == 200 && details.responseHeaders[i].name.toLowerCase() === 'access-control-allow-credentials' && details.responseHeaders[i].value != 'true') {
    		flag2 = 1;
    	}
    	if (flag2 == 1 && flag2 == 1)
    	{
    		if (isJSON(getLocalFileUrl(details.url)))
    		{
    			console.log(details);
    			console.log(getLocalFileUrl(details.url));
    			createNotification(details.url);
    			break;
    		}    		

    	}*/
    }
},
{
 urls: ["<all_urls>"]
},
["responseHeaders"]);