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

var displayTimer = null;
var displayError = "";

///////////
//METHODS//
///////////

//Inject scripts into the current tab
function injectDisplay()
{
	chrome.tabs.getSelected(null, function(i_tab)
	{ 
		chrome.tabs.executeScript(i_tab.id, {file: 'ext/heatmap/build/heatmap.js'});
	
		chrome.tabs.executeScript(i_tab.id, {file: 'js/tab/injecteddisplay.js'});
	});
}

//Check if the injected scripts are alive, if not
//try to inject them. Also handles errors like 
//permission denied or browser window not selected.
//This check is done every two seconds.
displayTimer = setInterval(function()
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
			catch(err1)
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
							if(displayError != "Error: Unable to contact content script (injecteddisplay.js) inside " + tabs[0].url + ", reinjecting!")
							{
								displayError = "Error: Unable to contact content script (injecteddisplay.js) inside " + tabs[0].url + ", reinjecting!";
								console.log(displayError);
							}
							
							injectDisplay();
						}
						else
						{	
							//Check if this was the last error message, if so, do not log again!
							if(displayError != "Error: Not allowed to inject injecteddisplay.js into " + tabs[0].url)
							{
								displayError = "Error: Not allowed to inject injecteddisplay.js into " + tabs[0].url;
								console.log(displayError);
							}
						}
					}
					catch(err2)
					{
						//Check if this was the last error message, if so, do not log again!
						if(displayError != "Error: No tab selected!")
						{
							displayError = "Error: No tab selected!";
							console.log(displayError);
						}	
					}
				});
			}
		});
	});
}, 2000);


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