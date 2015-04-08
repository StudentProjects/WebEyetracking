/////////////////////
//Daniel Lindgren////
//displayheatmap.js//
/////////////////////
//
//Injects a script into the browser and tells it to display 
//a heatmap using heatmap.js 2.0.
//

/////////////
//Variables//
/////////////

//None

///////////
//METHODS//
///////////

//Inject scripts into the current tab
function injectHeatmap()
{
	chrome.tabs.getSelected(null, function(i_tab)
	{ 
		chrome.tabs.executeScript(i_tab.id, {file: 'ext/heatmap/build/heatmap.js'});
	
		chrome.tabs.executeScript(i_tab.id, {file: 'js/injectedheatmap.js'});
	});
}

//Tell injectedheatmap.js to set new data.
function setHeatmapData(i_data)
{
	console.log("setHeatmapData");
	
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedheatmap::setData", data: i_data}, function(response) 
		{
			try
			{
				console.log(response.message);
			}
			catch(err)
			{	
				console.log("Error: " + err.message);
				chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Error: Unable to contact browser script.<br><br>Please reconnect to server"});
			}
		});
	});
}

//Tell injectedheatmap.js to show heatmap of data.
function animateHeatmap()
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedheatmap::animate"}, function(response) 
		{
			try
			{
				console.log(response.message);
				chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Animation complete."});
			}
			catch(err)
			{
				console.log("Error: " + err.message);
				chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Error: Unable to contact browser script.<br><br>Please reconnect to server"});
			}
		});
	});
}

//Tell injectedheatmap.js to show heatmap of data.
function showHeatmap()
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedheatmap::show"}, function(response) 
		{
			try
			{
				console.log(response.message);
				chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Showing heatmap."});
			}
			catch(err)
			{
				console.log("Error: " + err.message);
				chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Error: Unable to contact browser script.<br><br>Please reconnect to server"});
			}
		});
	});
}

//Tell injectedheatmap.js to hide heatmap.
function hideHeatmap()
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedheatmap::hide"}, function(response) 
		{
			try
			{
				console.log(response.message);
				chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Heatmap hidden."});
			}
			catch(err)
			{
				console.log("Error: " + err.message);
				chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Error: Unable to contact browser script.<br><br>Please reconnect to server"});
			}
		});
	});
}

//Create a listener that waits for a request. 
//Calls the requested function.
chrome.extension.onRequest.addListener
(
	function(request, sender, sendResponse)
	{
		//Animate
        if(request.msg == "displayheatmap::animate") 
		{
			animateHeatmap();
		}
		//Show
        else if(request.msg == "displayheatmap::show") 
		{
			showHeatmap();
		}
		//Hide
		else if(request.msg == "displayheatmap::hide") 
		{
			hideHeatmap();
		}
	}
);
