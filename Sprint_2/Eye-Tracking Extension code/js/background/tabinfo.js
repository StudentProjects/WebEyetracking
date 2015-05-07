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
var tabInfoError = "";
var responseAfterPageLoad = false;

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
		if(msg.message == "tabinfo::mouseClick")
		{
			//Tell mouserecorder.js that a click happened, and where.
			mouseClickEvent(msg.xCoord, msg.yCoord);
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
	
	port.onMessage.addListener(function(msg) 
	{
		if(msg.message == "tabinfo::pagebeforeload")
		{
			noResponseCounter = 1; //from display.js
			console.log("Page is being loaded!");
		}
	});
});

//Check if the injected scripts are alive, if not
//try to inject them. Also handles errors like 
//permission denied or browser window not selected.
//This check is done every two seconds.
/*tabInfoTimer = setInterval(function()
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{		
		//Send message to tab.
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedtabinfo::alive"}, function(response) 
		{
			try
			{
				response.message;
			}
			catch(err)
			{
				//If there is no response, check if we have persmission to inject 
				//a script. If so, do it.
				chrome.tabs.query({currentWindow: true, active: true}, function(tabs)
				{
					try
					{
						var URLstart = tabs[0].url.split("/");
						if(URLstart[0] != "chrome:")
						{
							//Check if this was the last error message, if so, do not log again!
							if(tabInfoError != "Error: Unable to contact content script (injectedtabinfo.js) inside " + tabs[0].url + ", reinjecting!")
							{
								tabInfoError = "Error: Unable to contact content script (injectedtabinfo.js) inside " + tabs[0].url + ", reinjecting!";
								console.log(tabInfoError);
							}
							noResponseCounter++;
						}
						else
						{	
							//Check if this was the last error message, if so, do not log again!
							if(tabInfoError != "Error: Not allowed to inject injectedtabinfo.js into " + tabs[0].url)
							{
								tabInfoError = "Error: Not allowed to inject injectedtabinfo.js into " + tabs[0].url;
								console.log(tabInfoError);
							}		
						}
					}
					catch(e)
					{
						//Check if this was the last error message, if so, do not log again!
						if(tabInfoError != "Error: No tab selected!")
						{
							tabInfoError = "Error: No tab selected!";
							console.log(tabInfoError);
						}
					}
				});
			}
		});
	});
}, 1000);*/