/////////////////////
//Daniel Lindgren////
//tabinfo.js//
/////////////////////
//
//Sends information about the current tab
//to the server during runtime, such as
//scroll height.
//

/////////////
//Variables//
/////////////

var tabInfoTimer = null;

///////////
//METHODS//
///////////

//Inject scripts into current tab.
function injectTabInfo()
{
	chrome.tabs.getSelected(null, function(i_tab)
	{ 
		chrome.tabs.executeScript(i_tab.id, {file: 'ext/jquery/jquery.js'});
	
		chrome.tabs.executeScript(i_tab.id, {file: 'js/tab/injectedtabinfo.js'});
	});	
}

tabInfoTimer = setInterval(function()
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{		
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedtabinfo::alive"}, function(response) 
		{
			try
			{
				response.message;
			}
			catch(err)
			{
				chrome.tabs.query({currentWindow: true, active: true}, function(tabs)
				{
					try
					{
						if(tabs[0].url != "chrome://extensions/")
						{
							console.log("Error: Unable to contact content script (injectedtabinfo.js), trying to reinject!");
							injectTabInfo();
						}
						else
						{	
							console.log("Error: Not allowed to inject injectedtabinfo.js into " + tabs[0].url);
						}
					}
					catch(e)
					{
						console.log("Error: No tab selected!");
					}
				});
			}
		});
	});
}, 2000);

//Add a listener on port: "tabinfo"
chrome.runtime.onConnect.addListener(function(port) 
{
	port.onMessage.addListener(function(msg) 
	{
		if(msg.message == "tabinfo::scrollHeight")
		{
			manageMessage(13, msg.scroll);
		}
	});
	
	port.onMessage.addListener(function(msg) 
	{
		if(msg.message == "tabinfo::mouseCoords")
		{
			//Update mouse position on mouserecorder.js
			updateMousePosition(msg.xCoord, msg.yCoord);
		}
	});
	
	port.onMessage.addListener(function(msg) 
	{
		if(msg.message == "tabinfo::httpRequest")
		{
			manageMessage(21, msg.address);
		}
	});
	port.onMessage.addListener(function(msg) 
	{
		if(msg.message == "tabinfo::stopRequest")
		{
			manageMessage(4, "StopRecordingRequest");
		}
	});
});