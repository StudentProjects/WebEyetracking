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
	
		chrome.tabs.executeScript(i_tab.id, {file: 'js/tab/injecteddisplay.js'});
	});
}

//Tell injecteddisplay.js to set new data.
function setHeatmapData(i_data)
{
	console.log("setHeatmapData");
	
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injecteddisplay::setData", data: i_data}, function(response) 
		{
			try
			{
				console.log(response.message);
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Successfully loaded data!", type: "Alert"});
			}
			catch(err)
			{	
				console.log("Error: " + err.message);
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to contact browser script!", type: "Error"});
			}
		});
	});
}

//Tell injecteddisplay.js to animate heatmap of data.
function animateHeatmap(animateEye, animateMouse)
{	
	chrome.tabs.getSelected(null, function(i_tab) 
	{		
		chrome.tabs.sendMessage(i_tab.id, {msg: "injecteddisplay::animate", eye: animateEye, mouse: animateMouse}, function(response) 
		{
			try
			{
				console.log(response.message);
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Animating heatmap!", type: "Alert"});
			}
			catch(err)
			{
				console.log("Error: " + err.message);
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to contact browser script!", type: "Error"});
			}
		});
	});
}


//Tell injecteddisplay.js to show heatmap of data.
function showHeatmap(showEye, showMouse)
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injecteddisplay::show", eye: showEye, mouse: showMouse}, function(response) 
		{
			try
			{
				console.log(response.message);
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Showing heatmap!", type: "Alert"});
			}
			catch(err)
			{
				console.log("Error: " + err.message);
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to contact browser script!", type: "Error"});
			}
		});
	});
}

//Tell injecteddisplay.js to hide heatmap.
function hideHeatmap()
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injecteddisplay::hide"}, function(response) 
		{
			try
			{
				console.log(response.message);
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Hiding heatmap!", type: "Alert"});
			}
			catch(err)
			{
				console.log("Error: " + err.message);
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to contact browser script!", type: "Error"});
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
        if(request.msg == "display::animate") 
		{
			animateHeatmap(request.eye, request.mouse);
		}
		//Show
        else if(request.msg == "display::show") 
		{
			showHeatmap(request.eye, request.mouse);
		}
		//Hide
		else if(request.msg == "display::hide") 
		{
			hideHeatmap();
		}
	}
);
