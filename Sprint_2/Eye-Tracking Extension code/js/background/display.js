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
var currentData = null;
var lastFrameTime = 0;
var lastAnimateEye = false;
var lastAnimateMouse = false;
var contentScriptReady = false;

///////////
//METHODS//
///////////

//Add a listener on port: "tabinfo"
chrome.runtime.onConnect.addListener(function(port) 
{
	port.onMessage.addListener(function(msg) 
	{
		if(msg.message == "display::animationStarted")
		{
			setIsRendering(true);
			chrome.browserAction.setIcon({path: "../../img/pause-icon16.png"});	
			chrome.runtime.sendMessage({msg: 'player::animationStarted'});
		}
		else if(msg.message == "display::animationFinished")
		{
			lastFrameTime = 0;
			lastAnimateEye = false;
			lastAnimateMouse = false;
			setIsRendering(false);
			setIsRenderingPaused(false);
			chrome.browserAction.setIcon({path: "../../img/play-icon16.png"});
			chrome.runtime.sendMessage({msg: 'player::animationFinished'});
		}
		else if(msg.message == "display::displayingData")
		{
			chrome.runtime.sendMessage({msg: 'player::displayingData'});
		}
		else if(msg.message == "display::setLastFrameTime")
		{
			lastFrameTime = msg.data;
		}
		else if(msg.message == "display::injectedDisplayReady")
		{
			console.log("Content script ready!");
			contentScriptReady = true;
			executeBootstrap();
			if(isRendering && !isRenderingPaused)
			{
				console.log("Trying to resume animation!");
				setHeatmapData(currentData, true);
			}
		}
		else if(msg.message == "display::setHeaderToDefault")
		{
			chrome.runtime.sendMessage({msg: 'player::setHeaderToDefault'});
		}
		else if(msg.message == "display::hasEyeData")
		{
			chrome.runtime.sendMessage({msg: 'player::hasEyeData', data: msg.data});
		}
		else if(msg.message == "display::hasMouseData")
		{
			chrome.runtime.sendMessage({msg: 'player::hasMouseData', data: msg.data});
		}
	});
});

function handleFixationPoints()
{
	if(isFixationPointsDisplayed)
	{
		chrome.tabs.getSelected(null, function(i_tab) 
		{
			chrome.tabs.sendMessage(i_tab.id, {msg: "injecteddisplay::hideFixationPoints"}, function(response) 
			{
				try
				{
					chrome.runtime.sendMessage({msg: 'statistics::hidingFixationPoints'});
					setIsFixationPointsDisplayed(false);
					console.log(response.message);
				}
				catch(err)
				{	
					console.log("Error: " + err.message);
				}
			});
		});
	}
	else
	{
		chrome.tabs.getSelected(null, function(i_tab) 
		{
			chrome.tabs.sendMessage(i_tab.id, {msg: "injecteddisplay::showFixationPoints"}, function(response) 
			{
				try
				{
					chrome.runtime.sendMessage({msg: 'statistics::showingFixationPoints'});
					setIsFixationPointsDisplayed(true);
					console.log(response.message);
				}
				catch(err)
				{	
					console.log("Error: " + err.message);
				}
			});
		});
	}
}

function pauseRendering()
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injecteddisplay::pauseRendering"}, function(response) 
		{
			try
			{
				setIsRenderingPaused(true);
				console.log(response.message);
			}
			catch(err)
			{	
				console.log("Error: " + err.message);
			}
		});
	});
}

function resumeRendering()
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injecteddisplay::resumeRendering"}, function(response) 
		{
			try
			{
				setIsRenderingPaused(false);
				console.log(response.message);
			}
			catch(err)
			{	
				console.log("Error: " + err.message);
			}
		});
	});
}

//Inject scripts into the current tab
function injectDisplay()
{
	chrome.tabs.getSelected(null, function(i_tab)
	{ 
		chrome.tabs.executeScript(i_tab.id, {file: 'ext/heatmap/build/heatmap.js'});
		
		chrome.tabs.executeScript(i_tab.id, {file: 'ext/jquery/jquery.js'});
		
		chrome.tabs.executeScript(i_tab.id, {file: 'js/tab/injecteddisplay.js'});
		
		/*var timer = setTimeout(function()
		{
			chrome.tabs.executeScript(i_tab.id, {file: 'ext/bootstrap/bootstrap.js'});
			chrome.tabs.executeScript(i_tab.id, {file: 'ext/bootstrap/bootstrap.min.js'});
			console.log("Injecting bootstrap");
			clearTimeout(timer);
		}, 2000);*/
	});
}

function executeBootstrap()
{
	chrome.tabs.getSelected(null, function(i_tab)
	{ 
		chrome.tabs.sendMessage(i_tab.id, {msg: "injecteddisplay::jquery"}, function(response) 
		{
			try
			{
				if(response.message == "ready")
				{
					chrome.tabs.executeScript(i_tab.id, {file: 'ext/bootstrap/bootstrap.js'});
					chrome.tabs.executeScript(i_tab.id, {file: 'ext/bootstrap/bootstrap.min.js'});
					console.log("Injecting bootstrap"); 	
				}
				else
				{
					console.log("Try again!");
					executeBootstrap();
				}
			}
			catch(err)
			{
				console.log("Error: " + err.message);
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to contact browser script!", type: "Error"});
			}
		});
	});
}

function resumeRenderingAfterLoad(tab_id)
{
	var tempData = new Object();
	tempData.lastFrameTime = lastFrameTime;
	tempData.lastAnimateEye = lastAnimateEye;
	tempData.lastAnimateMouse = lastAnimateMouse;
	chrome.tabs.sendMessage(tab_id, {msg: "injecteddisplay::resumeRenderingAfterLoad", data: tempData}, function(response) 
	{
		try
		{
			console.log(response.message);
			chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Successfully resumed animation after page load!", type: "Alert"});
		}
		catch(err)
		{	
			console.log("Error: " + err.message);
			chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to contact browser script!", type: "Error"});
		}
	});
}

//Tell injecteddisplay.js to set new data.
function setHeatmapData(i_data, i_resume)
{
	console.log("setHeatmapData");
	currentData = i_data;
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injecteddisplay::setData", data: i_data, resume: i_resume}, function(response) 
		{
			try
			{
				if(response.message == "resume")
				{
					resumeRenderingAfterLoad(i_tab.id);
				}
				else
				{
					console.log(response.message);
				}
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Successfully loaded data!", type: "Alert"});
			}
			catch(err)
			{	
				if(err.message = "Cannot read property 'message' of undefined")
				{
					console.log("Set data again!");
					setHeatmapData(i_data, i_resume);
				}
				console.log("Error: " + err.message);
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to contact browser script!", type: "Error"});
			}
		});
	});
}

//Tell injecteddisplay.js to animate heatmap of data.
function animateHeatmap(animateEye, animateMouse)
{	
	console.log(contentScriptReady);
	if(contentScriptReady)
	{
		lastAnimateEye = animateEye;
		lastAnimateMouse = animateMouse;
		
		chrome.tabs.getSelected(null, function(i_tab) 
		{		
			chrome.tabs.sendMessage(i_tab.id, {msg: "injecteddisplay::animate", eye: animateEye, mouse: animateMouse}, function(response) 
			{
				try
				{
					if(response.message != "Failedstart")
					{
						console.log(response.message);
						chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Animating heatmap!", type: "Alert"});	
					}
					else
					{
						if(currentData != null)
						{	
							console.log(response.message);
							setHeatmapData(currentData, false);	
							animateHeatmap(animateEye,animateMouse);
						}
					}
				}
				catch(err)
				{
					console.log("Error: " + err.message);
					chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to contact browser script!", type: "Error"});
				}
			});
		});
	}
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
								contentScriptReady = false;
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
								contentScriptReady = false;
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