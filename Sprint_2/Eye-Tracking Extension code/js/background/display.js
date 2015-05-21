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
var noResponseCounter = 0;
var injecting = false;
var hasPermission = false;
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
			console.log("Rendering set to true in display.js by message animationStarted");
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
			console.log("Received Anim finnished");
			setIsRenderingPaused(false);
			chrome.browserAction.setIcon({path: "../../img/eye-icon16.png"});
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
			PerformJQueryVersionCheck();
			noResponseCounter = 0;
			injecting = false;
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
		else if(msg.message == "display::hideFixationPoints")
		{
			chrome.runtime.sendMessage({msg: 'statistics::hidingFixationPoints'});
			setIsFixationPointsDisplayed(false);
			setIsNavigationDisplayed(false);
		}
	});
});

function resetTestInfo()
{
	lastFrameTime = 0;
	lastAnimateEye = false;
	lastAnimateMouse = false;
	console.log("Rendering set to false in display.js by resetTestInfo");
	setIsRendering(false);
	setIsRenderingPaused(false);
	chrome.browserAction.setIcon({path: "../../img/eye-icon16.png"});
	chrome.runtime.sendMessage({msg: 'player::animationFinished'});
	
	manageMessage(34,"StopRendering");
	
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injecteddisplay::clearPrevious"}, function(response) 
		{
			try
			{
				console.log(response.message);
			}
			catch(err)
			{	
				console.log("Error: " + err.message);
			}
		});
	});
}

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
					chrome.runtime.sendMessage({msg: 'statistics::hidingGrid'});
					setIsFixationPointsDisplayed(false);
					setIsNavigationDisplayed(false);
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
				chrome.browserAction.setIcon({path: "../../img/play-icon16.png"});
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
				chrome.browserAction.setIcon({path: "../../img/pause-icon16.png"});
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
	console.log("Injecting content scripts!");
	chrome.tabs.getSelected(null, function(i_tab)
	{ 		
		chrome.tabs.executeScript(i_tab.id, {file: 'ext/heatmap/build/heatmap.js'});
		
		chrome.tabs.executeScript(i_tab.id, {file: 'js/tab/injecteddisplay.js'});
	});
}

function checkResumeRendering()
{
	console.log("Is rendering after load: " + isRendering);
	if(isRendering && !isRenderingPaused)
	{
		console.log("Trying to resume animation!");
		setHeatmapData(currentData, true);
	}
}

function executeJQuery()
{
	chrome.tabs.getSelected(null, function(i_tab)
	{ 
		chrome.tabs.executeScript(i_tab.id, {file: 'ext/jquery/jquery.js'});
	});
	executeBootstrap();
}

function executeBootstrap()
{
	chrome.tabs.getSelected(null, function(i_tab)
	{ 
		chrome.tabs.sendMessage(i_tab.id, {msg: "injecteddisplay::jquery"}, function(response) 
		{
			try
			{
				console.log("Response jquery: " + response.message);
				if(response.message == "ready")
				{
					injectTabInfo();
					chrome.tabs.executeScript(i_tab.id, {file: 'ext/bootstrap/bootstrap.js'});
					chrome.tabs.executeScript(i_tab.id, {file: 'ext/bootstrap/bootstrap.min.js'});
					console.log("Injected bootstrap"); 	
					setIsJQueryLoaded(true);
					checkResumeRendering();
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

//Tell the content script injecteddisplay.js to
//resume rendering from the specific timestamp.
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
//If i_resume is true, the injectionscript
//will send back a resume request.
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
	console.log("jQuery: " + isJQueryLoaded);
	if(isJQueryLoaded)
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

//Tell injecteddisplay.js to hide heatmap.
function clearCanvas()
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injecteddisplay::clearCanvas"}, function(response) 
		{
			try
			{
				console.log("Canvas cleared!");
			}
			catch(err)
			{
				console.log("Error: " + err.message);
			}
		});
	});
}

//If there is no response, check if we have persmission to inject 
//a script. If so, do it.
function checkPermission()
{
	chrome.tabs.query({currentWindow: true, active: true}, function(tabs)
	{
		try
		{
			var URLstart = tabs[0].url.split("/");
			if(URLstart[0] != "chrome:")
			{
				setIsJQueryLoaded(false);
				displayError = "Error: Unable to contact content scripts inside " + tabs[0].url;
				console.log(displayError);
				hasPermission = true;
			}
			else
			{	
				setIsJQueryLoaded(false);
				displayError = "Error: Not allowed to inject injecteddisplay.js into " + tabs[0].url;
				console.log(displayError);
				hasPermission = false;
			}
		}
		catch(err)
		{
			displayError = "Error: No tab selected!";
			console.log(displayError);
			hasPermission = false;
		}
	});
}

function compareJQueryVersions(version1,version2)
{
	if(version1 == version2)
	{
		return 0;	
	}

    var version1Parts = version1.split('.');
    var numVersion1Parts = version1Parts.length; 

    var version2Parts = version2.split('.');
    var numVersion2Parts = version2Parts.length; 

    for(var i = 0; i < numVersion1Parts && i < numVersion2Parts; i++)
    {
        var version1Part = parseInt(version1Parts[i], 10);
        var version2Part = parseInt(version2Parts[i], 10);
        if(version1Part > version2Part)
        {
            return 1;
        }
        else if(version1Part < version2Part)
        {
            return -1;
        }
    }

    return numVersion1Parts < numVersion2Parts ? -1 : 1;
}

function PerformJQueryVersionCheck()
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injecteddisplay::jqueryversion"}, function(response) 
		{
			try
			{
				if(response.message.trim() != "")
				{
					var result = compareJQueryVersions("1.11.2",response.message);	
					if(result == 1)
					{
						console.log("Injected version is to low! Injecting new!");
						executeJQuery();
					}
					else
					{
						console.log("Injected version is valid! Injecting bootstrap!");
						executeBootstrap();
					}
				}
				else
				{
					console.log("No JQuery version detected. Injecting!");
					executeJQuery();
				}
			
			}
			catch(err)
			{
				console.log("Error: " + err.message);
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
	if(noResponseCounter > 0)
	{		
		if(!injecting)
		{
			checkPermission();
			if(hasPermission)
			{
				injecting = true;
				injectDisplay();
				var resetInterval = setTimeout(function()
				{
					if(injecting)
					{
						injecting = false;	
					}
				}, 5000);
			}
		}
	}
	else
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
					noResponseCounter++;
				}
			});
		});
	}
}, 1000);
