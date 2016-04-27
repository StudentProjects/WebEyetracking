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
var currentData = null; //The latest data loaded into the content scripts
var previousFrameTimestamp = 0; //Holds the last rendered frames timestamp, used for resuming 
					   //rendering after page load.
var noResponseCounter = 0; //For each failed try to communicate with the content scripts, this 
						   //variable is increased by one. Variable is set to 0 when content
						   //script is initialized.
var injecting = false; //Is the script already trying to inject content scripts?
var hasPermission = false; //Does the script have permission to inject scripts into this tab?

var isRenderingEye = false;
var isRenderingMouse = false;

var isSimulatingBothMouseAndClicksKeys = false;

var currentPage = 0;

///////////
//METHODS//
///////////

startAliveCheck();

//Add a listener on port: "tabinfo"
chrome.runtime.onConnect.addListener(function(port) 
{
	port.onMessage.addListener(function(msg) 
	{
		if(msg.message == "display::eyeAnimationStarted")
		{
			isRenderingEye = true;
			setIsRendering(true);
			chrome.browserAction.setIcon({path: "../../img/pause-icon16.png"});	
			chrome.runtime.sendMessage({msg: 'player::animationStarted'});
		}
		else if(msg.message == "display::mouseAnimationStarted")
		{
			isRenderingMouse = true;
			setIsRendering(true);
			chrome.browserAction.setIcon({path: "../../img/pause-icon16.png"});	
			chrome.runtime.sendMessage({msg: 'player::animationStarted'});
		}
		else if(msg.message == "display::eyeAnimationFinished")
		{
			previousFrameTimestamp = 0;			
			isRenderingEye = false;
			
			if(!isRenderingMouse)
			{
				//Tell the server to 
				manageMessage(34, "StopRendering");
				setIsRendering(false);
				setIsRenderingPaused(false);
				chrome.browserAction.setIcon({path: "../../img/eye-icon16.png"});
				chrome.runtime.sendMessage({msg: 'player::animationFinished'});	
			}
		}
		else if(msg.message == "display::mouseAnimationFinished")
		{
			previousFrameTimestamp = 0;			
			isRenderingMouse = false;
			isSimulatingBothMouseAndClicksKeys = false;
			
			if(!isRenderingEye)
			{
				manageMessage(34, "StopRendering");
				setIsRendering(false);
				setIsRenderingPaused(false);
				chrome.browserAction.setIcon({path: "../../img/eye-icon16.png"});
				chrome.runtime.sendMessage({msg: 'player::animationFinished'});	
			}
		}
		else if(msg.message == "display::displayingData")
		{
			chrome.runtime.sendMessage({msg: 'player::displayingData'});
		}
		else if(msg.message == "display::setLastFrameTime")
		{
			previousFrameTimestamp = msg.data;
		}
		else if(msg.message == "display::injectedContentReady")
		{
			console.log("Content script ready!");
			PerformJQueryVersionCheck();
			noResponseCounter = 0;
			injecting = false;
		}
		else if(msg.message == "display::showFixationPoints")
		{
			chrome.runtime.sendMessage({msg: 'statistics::showingFixationPoints'});
			setIsFixationPointsDisplayed(true);
		}
		else if(msg.message == "display::hideFixationPoints")
		{
			chrome.runtime.sendMessage({msg: 'statistics::hidingFixationPoints'});
			setIsFixationPointsDisplayed(false);
		}

		/*Linus edits---------------------------------------------------------*/
		/*--------------------------------------------------------------------*/
		else if(msg.message == "display::showFPConnectors")
		{
			chrome.runtime.sendMessage({msg: 'statistics::showingFPConnectors'});
			setIsFPConnectorsDisplayed(true);
		}
		else if(msg.message == "display::hideFPConnectors")
		{
			chrome.runtime.sendMessage({msg: 'statistics::hidingFPConnectors'});
			setIsFPConnectorsDisplayed(false);
		}
		/*Linus edits---------------------------------------------------------*/
		/*--------------------------------------------------------------------*/
	});
});

//Reset all test info and stop rendering
function resetTestInfo()
{
	currentPage = 0;
	previousFrameTimestamp = 0;
	isRenderingEye = false;
	isRenderingMouse = false;
	console.log("Rendering set to false in display.js by resetTestInfo");
	setIsRendering(false);
	setIsRenderingPaused(false);
	chrome.browserAction.setIcon({path: "../../img/eye-icon16.png"});
	chrome.runtime.sendMessage({msg: 'player::animationFinished'});
	
	manageMessage(34,"StopRendering");
	
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedeyedisplay::removeDataFromPreviousTest"}, function(response) 
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
	
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedmousedisplay::removeDataFromPreviousTest"}, function(response) 
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
	
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedfixationdisplay::clearPrevious"}, function(response) 
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

//Send messages to content scripts to show/hide fixation points
function handleFixationPoints()
{
	if(isFixationPointsDisplayed)
	{
		chrome.tabs.getSelected(null, function(i_tab) 
		{
			chrome.tabs.sendMessage(i_tab.id, {msg: "injectedfixationdisplay::hideFixationPoints"}, function(response) 
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
	else
	{
		chrome.tabs.getSelected(null, function(i_tab) 
		{
			chrome.tabs.sendMessage(i_tab.id, {msg: "injectedfixationdisplay::showFixationPoints"}, function(response) 
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
}

/*Linus edits---------------------------------------------------------*/
/*--------------------------------------------------------------------*/
//Send messages to content scripts to show/hide FPConnectors
function handleFPConnectors()
{
	if(isFPConnectorsDisplayed)
	{
		chrome.tabs.getSelected(null, function(i_tab) 
		{
			chrome.tabs.sendMessage(i_tab.id, {msg: "injectedfixationdisplay::hideFPConnectors"}, function(response) 
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
	else
	{	
		chrome.tabs.getSelected(null, function(i_tab) 
		{
			chrome.tabs.sendMessage(i_tab.id, {msg: "injectedfixationdisplay::showFPConnectors"}, function(response) 
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
}


/*Linus edits---------------------------------------------------------*/
/*--------------------------------------------------------------------*/

//Tell the content script to pause rendering.
function pauseRendering()
{
	if(isRenderingEye)
	{
		chrome.tabs.getSelected(null, function(i_tab) 
		{
			chrome.tabs.sendMessage(i_tab.id, {msg: "injectedeyedisplay::pauseRendering"}, function(response) 
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
	if(isRenderingMouse)
	{
		chrome.tabs.getSelected(null, function(i_tab) 
		{
			chrome.tabs.sendMessage(i_tab.id, {msg: "injectedmousedisplay::pauseRendering"}, function(response) 
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
}

//Tell the content script to resume rendering.
function resumeRendering()
{
	if(isRenderingEye)
	{
		chrome.tabs.getSelected(null, function(i_tab) 
		{
			chrome.tabs.sendMessage(i_tab.id, {msg: "injectedeyedisplay::resumeRendering"}, function(response) 
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
	if(isRenderingMouse)
	{
		chrome.tabs.getSelected(null, function(i_tab) 
		{
			chrome.tabs.sendMessage(i_tab.id, {msg: "injectedmousedisplay::resumeRendering"}, function(response) 
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
}

//Inject scripts into the current tab
function injectScripts()
{
	console.log("Injecting content scripts!");
	chrome.tabs.getSelected(null, function(i_tab)
	{ 		
		chrome.tabs.executeScript(i_tab.id, {file: 'ext/heatmap/build/heatmap.js'});
		
		chrome.tabs.executeScript(i_tab.id, {file: 'js/tab/injectedconfig.js'});
		
		chrome.tabs.executeScript(i_tab.id, {file: 'js/tab/injectedeyedisplay.js'});
		
		chrome.tabs.executeScript(i_tab.id, {file: 'js/tab/injectedfixationdisplay.js'});
		
		chrome.tabs.executeScript(i_tab.id, {file: 'js/tab/injectedmousedisplay.js'});
	});
}

//Check if the extension was rendering data when last page was unloaded.
//If so, set heat map data in content script.
function checkResumeRendering()
{
	console.log("Is rendering after load: " + isRendering);
	if(isRendering && !isRenderingPaused)
	{
		console.log("Trying to resume animation!");
		setData(currentData, true);
	}
}

//Injects jquery into the target tab
function executeJQuery() {
	chrome.tabs.getSelected(null, function(i_tab)
	{ 
		chrome.tabs.executeScript(i_tab.id, {file: 'ext/jquery/jquery.js'});
	});
	executeBootstrap();
}

//Injects bootstrap into the target tab
function executeBootstrap()
{
	chrome.tabs.getSelected(null, function(i_tab)
	{ 
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedconfig::jquery"}, function(response) 
		{
			try
			{
				console.log("Response jquery: " + response.message);
				if(response.message == "ready") {
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

//Tells the content script to resume eye rendering if
//the extension was rendering eye data before the
//previous page was unloaded.
function resumeEyeRenderingAfterLoad(tab_id)
{
	var tempData = new Object();
	tempData.previousFrameTimestamp = previousFrameTimestamp;
	
	//Tell the server to 
	if(isRenderingEye)
	{
		chrome.tabs.sendMessage(tab_id, {msg: "injectedeyedisplay::resumeRenderingAfterLoad", data: tempData}, function(response) 
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
}

//Tells the content script to resume mouse rendering if
//the extension was rendering mouse data before the
//previous page was unloaded.
function resumeMouseRenderingAfterLoad(tab_id)
{
	var tempData = new Object();
	tempData.previousFrameTimestamp = previousFrameTimestamp;
	tempData.isSimulatingBothMouseAndClicksKeys = isSimulatingBothMouseAndClicksKeys;
	
	console.log("Time when resuming mouse rendering after load: " + previousFrameTimestamp);
	manageMessage(33, "ResumeRendering");
	
	if(isRenderingMouse)
	{
		chrome.tabs.sendMessage(tab_id, {msg: "injectedmousedisplay::resumeRenderingAfterLoad", data: tempData}, function(response) 
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
	
	currentPage++;
	chrome.tabs.sendMessage(tab_id, {msg: "injectedfixationdisplay::resumeRenderingAfterLoad", data: currentPage}, function(response) 
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
function setData(i_data, i_resume)
{
	currentData = i_data;
	var t_data = JSON.parse(currentData);
	
	
	//Setting eye data if eye data exists
	if(t_data['timeStampEYE'])
	{
		setEyeGazeData(i_data, i_resume);
		chrome.runtime.sendMessage({msg: 'player::hasEyeData', data: true});
	}
	else
	{
		chrome.runtime.sendMessage({msg: 'player::hasEyeData', data: false});
	}
	
	if(t_data['timeStampMouse'])
	{
		setMouseData(i_data, i_resume);
		chrome.runtime.sendMessage({msg: 'player::hasMouseData', data: true});
	}
	else
	{
		chrome.runtime.sendMessage({msg: 'player::hasMouseData', data: false});
	}
	if(t_data['testStatistics']['allFixations'])
	{
		setEyeFixationData(i_data);
	}
}

//Load eye data to content scripts
function setEyeGazeData(i_eyeData, i_resumeEyeRendering)
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedeyedisplay::setEyeData", data: i_eyeData, resume: i_resumeEyeRendering}, function(response) 
		{
			try
			{
				if(response.message == "resume")
				{
					resumeEyeRenderingAfterLoad(i_tab.id);
				}
				else
				{
					console.log(response.message);
				}
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Successfully loaded eye data!", type: "Alert"});
			}
			catch(err)
			{	
				if(err.message = "Cannot read property 'message' of undefined")
				{
					console.log("Set eye data again!");
					setEyeGazeData(i_eyeData, i_resumeEyeRendering);
				}
				console.log("Error: " + err.message);
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to contact browser script!", type: "Error"});
			}
		});
	});
}

//Load fixation point data to content scripts
function setEyeFixationData(i_fixationData)
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedfixationdisplay::setFixationData", data: i_fixationData}, function(response) 
		{
			try
			{
				console.log(response.message);
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Successfully loaded fixation data!", type: "Alert"});
			}
			catch(err)
			{	
				if(err.message = "Cannot read property 'message' of undefined")
				{
					console.log("Set fixation data again!");
					setEyeFixationData(i_fixationData);
				}
				console.log("Error: " + err.message);
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to contact browser script!", type: "Error"});
			}
		});
	});
}

//Load mouse data to content scripts
function setMouseData(i_mouseData,i_resumeMouseRendering)
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedmousedisplay::setMouseData", data: i_mouseData, resume: i_resumeMouseRendering}, function(response) 
		{
			try
			{
				if(response.message == "resume")
				{
					//Tell the server to 
					resumeMouseRenderingAfterLoad(i_tab.id);
				}
				else
				{
					console.log(response.message);
				}
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Successfully loaded mouse data!", type: "Alert"});
			}
			catch(err)
			{	
				if(err.message = "Cannot read property 'message' of undefined")
				{
					console.log("Set mouse data again!");
					setMouseData(i_mouseData, i_resumeMouseRendering);
				}
				console.log("Error: " + err.message);
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to contact browser script!", type: "Error"});
			}
		});
	});
}

//Tell injecteddisplay.js to animate heatmap of data.
function animateData(requestAnimateEye, requestAnimateMouse)
{	
	console.log("jQuery: " + isJQueryLoaded);
	if(isJQueryLoaded)
	{
		//Sending message to injectedeyedisplay.js telling it to start eye animation
		if(requestAnimateEye)
		{
			if(!isRenderingEye)
			{
				chrome.tabs.getSelected(null, function(i_tab) 
				{		
					chrome.tabs.sendMessage(i_tab.id, {msg: "injectedeyedisplay::startAnimation"}, function(response) 
					{
						try
						{
							if(response.data)
							{
								console.log(response.message);
								chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Animating eye heatmap!", type: "Alert"});
							}
							else
							{
								if(currentData != null)
								{	
									console.log(response.message);
									setData(currentData, false);	
									animateData(requestAnimateEye, requestAnimateMouse);
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
		if(!isRenderingMouse)
		{
			currentPage = 0;
			chrome.tabs.getSelected(null, function(i_tab) 
			{		
			    chrome.tabs.sendMessage(i_tab.id, { msg: "injectedmousedisplay::startAnimation", data: requestAnimateMouse }, function (response) {
					try
					{
						if(response.data)
						{
							isSimulatingBothMouseAndClicksKeys = requestAnimateMouse;
							console.log(response.message);
							chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Animating mouse heatmap!", type: "Alert"});
						}
						else
						{
							if(currentData != null)
							{	
								console.log(response.message);
								setData(currentData, false);	
								animateData(requestAnimateEye, requestAnimateMouse);
							}
						}
					}
					catch(err)
					{
						console.log("Error: " + err.message);
						chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to contact browser script!", type: "Error"});
					}
				});
				
				chrome.tabs.sendMessage(i_tab.id, {msg: "injectedfixationdisplay::resetPage"}, function(response) 
				{
					try
					{
						console.log(response.message);
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
}

//Tell injecteddisplay.js to show heatmap of data.
function showHeatmap(requestShowEye, requestShowMouse)
{
	if(requestShowEye)
	{
		chrome.tabs.getSelected(null, function(i_tab) 
		{
			chrome.tabs.sendMessage(i_tab.id, {msg: "injectedeyedisplay::show"}, function(response) 
			{
				try
				{
					if(response.data)
					{
						console.log(response.message);
						chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Showing eye heatmap!", type: "Alert"});
					}
					else
					{
						chrome.runtime.sendMessage({msg: 'player::displayingData'});
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
	if(requestShowMouse)
	{
		chrome.tabs.getSelected(null, function(i_tab) 
		{
			chrome.tabs.sendMessage(i_tab.id, {msg: "injectedmousedisplay::show"}, function(response) 
			{
				try
				{
					if(response.data)
					{
						console.log(response.message);
						chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Showing mouse heatmap!", type: "Alert"});	
					}
					else
					{
						chrome.runtime.sendMessage({msg: 'player::displayingData'});
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

//Tell injecteddisplay.js to hide heatmap.
function hideHeatmap()
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedeyedisplay::hide"}, function(response) 
		{
			try
			{
				if(response.data)
				{
					console.log(response.message);
					chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Hiding eye heatmap!", type: "Alert"});	
				}
				else
				{
					console.log(response.message);
				}
			}
			catch(err)
			{
				console.log("Error: " + err.message);
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to contact browser script!", type: "Error"});
			}
		});
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedmousedisplay::hide"}, function(response) 
		{
			try
			{
				if(response.data)
				{
					console.log(response.message);
					chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Hiding mouse heatmap!", type: "Alert"});	
				}
				else
				{
					console.log(response.message);
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

//Tell injectedeyedisplay.js and injectedmousedisplay to hide heatmap.
function clearCanvas()
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedeyedisplay::clearCanvas"}, function(response) 
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
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedmousedisplay::clearCanvas"}, function(response) 
		{
			try
			{
				console.log("Canvas cleared for mouse!");
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

//Compares two jquery versions
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

//Performs a jquery version check
function PerformJQueryVersionCheck()
{
	chrome.tabs.getSelected(null, function(i_tab) 
	{
		chrome.tabs.sendMessage(i_tab.id, {msg: "injectedconfig::jqueryversion"}, function(response) 
		{
			try
			{
				if(response.message.trim() != "") {
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
//This check is done once every second.
function startAliveCheck()
{
	displayTimer = setInterval(function() {
		if(noResponseCounter > 0)
		{		
			if(!injecting)
			{
				checkPermission();
				if(hasPermission) {
					injecting = true;
					injectScripts();
					console.log("INJECTING AT THE OLD PALCE!!!");
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
}
