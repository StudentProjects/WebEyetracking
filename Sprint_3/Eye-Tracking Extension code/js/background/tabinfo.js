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
		chrome.tabs.executeScript(i_tab.id, {file: 'js/tab/injectedtabinfo.js'});
	});	
}

//Check if document in tab has been loaded.
chrome.tabs.onUpdated.addListener(function(tabId , info) 
{
    if (info.status == "complete")
    {
    	console.log("Page finished loading!");
    	
		if(isRecording)
		{
	    	manageMessage(3, "ResumeRecordingRequest");
	    	
	    	var time = new Date();
			var resumeTimestamp = currentTime + (time.getTime() - lastTime);
	    	
	    	manageMessage(35, resumeTimestamp);
	    	console.log("Resumed recording at " + resumeTimestamp);
		}
    }
});

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
			if(isRecording)
			{
				manageMessage(2, "PauseRecordingRequest");
			}
			else if(isRendering)
			{
				manageMessage(32, "PauseRendering");
			}
			
			noResponseCounter = 0; //from display.js
			console.log("Page is being loaded!");
		}
	});
	
	port.onMessage.addListener(function(msg) 
	{
		if(msg.message == "tabinfo::keyEvent")
		{
			pushKeyUpdate(msg.data);
		}
	});
});