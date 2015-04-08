/////////////////////
//Daniel Lindgren////
//tabinfo.js//
/////////////////////
//
//Sends information about the current tab
//to the server during runtime. This includes
//scroll height.
//

/////////////
//Variables//
/////////////

//None

///////////
//METHODS//
///////////

//Inject scripts into current tab.
function injectTabInfo(i_tab)
{
	chrome.tabs.getSelected(null, function(i_tab)
	{ 
		chrome.tabs.executeScript(i_tab.id, {file: 'ext/jquery/jquery.js'});
	
		chrome.tabs.executeScript(i_tab.id, {file: 'js/injectedtabinfo.js'});
	});	
}

//Add a listener on port: "tabinfo"
chrome.runtime.onConnect.addListener(function(port) 
{
	port.onMessage.addListener(function(msg) 
	{
		if(msg.message == "tabinfo::scrollHeight")
		{
			sendMessage(13, msg.scroll);
		}
	});
});

//Create a listener that waits for a request. 
chrome.extension.onRequest.addListener
(
	function(request, sender, sendResponse)
	{
		//getScrollHeight
        if(request.msg == "tabinfo::getScrollHeight") 
		{
			chrome.tabs.getSelected(null, function(i_tab) 
			{
				chrome.tabs.sendMessage(i_tab.id, {msg: "injectedtabinfo::getScrollHeight"}, function(response) 
				{
					sendMessage(13, response.message);
				});
			});
		}
	}
);