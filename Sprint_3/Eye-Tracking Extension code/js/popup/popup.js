/////////////////////
//Daniel Lindgren////
//popup.js///////////
/////////////////////
//
//Requests information from persistentpopupvariables.js when
//popup.html is created. Also imports html files for tabs and
//creates links for these.
//

/////////////
//Variables//
/////////////

//popup
var isConnected = false; //Are we connected to the server?
var debugQueue = new Array();
var isReady = false; //If extension is ready to handle input.

//player
var isRendering = false;
var isRenderingPaused = false;

//recorder
var isRecording = false; //Is the application recording or not?
var isRecordingPaused = false; //Is the recording paused?
var isFixationPointsDisplayed = false;
var isNavigationDisplayed = false;
var activeTab = null;

///////////
//METHODS//
///////////

initializePopup();

//Initialize popup.js
function initializePopup()
{
	addPopupMessageListener();

	initializeTabs();
	
	chrome.extension.sendRequest({ msg: "persistentpopupvariables::getVariables" });
	
	console.log("popup.js initialized!");
}

//Initializes tabs
function initializeTabs()
{
	//Initialize tabs
	document.getElementById('tab0').innerHTML = $("#tab0").load("recorder.html");
	document.getElementById('tab1').innerHTML = $("#tab1").load("load.html");
	document.getElementById('tab2').innerHTML = $("#tab2").load("player.html");
	document.getElementById('tab3').innerHTML = $("#tab3").load("statistics.html");

	var script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	script.setAttribute("src", "../js/popup/info.js");
	document.getElementById("main_body").appendChild(script);

	script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	script.setAttribute("src", "../js/popup/recorder.js");
	document.getElementById("main_body").appendChild(script);

	script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	script.setAttribute("src", "../js/popup/load.js");
	document.getElementById("main_body").appendChild(script);

	script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	script.setAttribute("src", "../js/popup/player.js");
	document.getElementById("main_body").appendChild(script);

	script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	script.setAttribute("src", "../js/popup/statistics.js");
	document.getElementById("main_body").appendChild(script);

	$('ul.nav-tabs').each(function()
	{
		// For each set of tabs, we want to keep track of
		// which tab is active and it's associated content
		var $active, $content, $links = $(this).find('a');

		// If the location.hash matches one of the links, use that as the active tab.
		// If no match is found, use the first link as the initial active tab.
		$active = $($links.filter('[href="'+location.hash+'"]')[0] || $links[0]);
		$active.addClass('active');

		$content = $($active[0].hash);

		// Hide the remaining content
		$links.not($active).each(function () 
		{
			$(this.hash).hide();
		});

		// Bind the click event handler
		$(this).on('click', 'a', function(e)
		{	
			//Workaround! Sometimes there are two items with class active.
			//Only the one that is a LI element should be selected. This
			//tab and its content is then hidden.
			var items = document.getElementsByClassName('active');
			var old = items[0];
			if(items.length > 1)
			{
				if(items[0].nodeName == 'LI')
				{
					old = items[0];
				}
				else
				{
					old = items[1];
				}
			}		
			$(old).removeClass('active');		
			var content = document.getElementById('tab' + $(old).val());	
			$(content).hide();

		    // Update the variables with the new link and content
		    $active = $(this);
		    $content = $(this.hash);
		  
		    // Make the tab active.
		    $active.parent().addClass('active');
		    $content.show();
		  
		    //Save active tab
		    activeTab = $active.parent().val();
		    chrome.extension.sendRequest({ msg: "persistentpopupvariables::setActiveTab", data: activeTab });

	  	    // Prevent the anchor's default click action
		    e.preventDefault();
		});
	});
	
	console.log("Created popup tabs!");
}

//Set new tab as active
function setActiveTab(newTab)
{
	//Workaround! Sometimes there are two items with class active.
	//Only the one that is a LI element should be selected. This
	//tab and its content is then hidden.
	var items = document.getElementsByClassName('active');
	old = items[0];
	if(items.length > 1)
	{
		if(items[0].nodeName == 'LI')
		{
			old = items[0];
		}
		else
		{
			old = items[1];
		}
	}		
	$(old).removeClass('active');		
	var content = document.getElementById('tab' + $(old).val());	
	$(content).hide();
	
	//Get new tab, set its classname to active and show its content
	var tab = document.getElementById('li_' + newTab);
	$(tab).addClass('active');
	content = document.getElementById('tab' + newTab);
	$(content).show();
	
	chrome.extension.sendRequest({ msg: "persistentpopupvariables::setActiveTab", data: newTab });
}

//Render or queue mesage
function renderInfo(info, type)
{
	if(isRendering)
	{
		placeInQueue(info, type);
	}
	else
	{
		renderQueue(info, type);
	}
}

//Render next message in queue
function renderQueue(info, type)
{
	isRendering = true;
	console.log("Rendering " + info);
	var element = document.getElementById("debug_paragraph");
	element.innerHTML = info;
	
	if(type == "Alert")
	{
		element.className = "debug_alert";
	}
	else if(type == "Error")
	{
		element.className = "debug_error";
	}
	else
	{
		element.className = "debug_other";
	}
	
	$(element).hide().fadeIn(1000);
	
	var fadeout = setTimeout(function() 
	{ 
		$(element).fadeOut(1000);
		if(debugQueue.length > 0)
		{
			var nextRender = setTimeout(function() 
			{  
				isRendering = false;
				renderQueue(debugQueue[0]['info'], debugQueue[0]['type']);
				debugQueue.splice(0, 1);
			}, 1000);
		}
		else
		{
			var nextRender = setTimeout(function() 
			{  
				isRendering = false;
				debugQueue.splice(0, 1);
			}, 1000);
		}
	}, 3000);
}

//Add message to queue
function placeInQueue(info, type)
{
	var debugMessage = new Object();
	debugMessage['info'] = info;
	debugMessage['type'] = type;
	
	var exists = false;
	for(i = 0; i < debugQueue.length; i++)
	{
		if(debugQueue[i]['info'] == info)
		{
			exists = true;
		}
	}
	
	if(!exists)
	{
		debugQueue[debugQueue.length] = debugMessage;
	}
}

function checkScrollbar()
{
    var b = $('body');
    var normalw = 0;
    var scrollw = 0;
    if(b.prop('scrollHeight')>b.height())
    {
        normalw = window.innerWidth;
        scrollw = normalw - b.width();
        $('#tab-container').css({marginRight:'-'+scrollw+'px'});
    }
}

//Create message listener for popup.js
function addPopupMessageListener()
{
	//This tells the script to listen
	//for messages from our extension.
	chrome.extension.onMessage.addListener(function(i_message, i_messageSender, i_sendResponse) 
	{
		//Connected
		if(i_message.msg == "popup::connected")
		{
			isConnected = true;
			var span = document.getElementById('extension_header');
			span.innerHTML = "Online";
			span.className = "h1-success";
			renderInfo("Successfully connected to server!", "Alert");
		}
		//Disconnected
		else if(i_message.msg == "popup::disconnected")
		{
			isConnected = false;
			var span = document.getElementById('extension_header');
			span.innerHTML = "Offline";
			span.className = "h1-fail";
			renderInfo("Disconnected from server!", "Error");
		}
		//isReady
		else if(i_message.msg == "popup::isReady")
		{
			if(i_message.data && !isReady)
			{
				console.log("Extension is in ready state!");
				isReady = true;
				document.getElementById("loading-screen").style.display = "none";
			}
		}
		//Set variables
		else if(i_message.msg == "popup::variables")
		{
			isRecording = i_message.content['isRecording'];
			isRecordingPaused = i_message.content['isRecordingPaused'];
			isConnected = i_message.content['isConnected'];
			isRendering = i_message.content['isRendering'];
			isRenderingPaused = i_message.content['isRenderingPaused'];
			isFixationPointsDisplayed = i_message.content['isFixationPointsDisplayed'];
			isNavigationDisplayed = i_message.content['isNavigationDisplayed'];
			
			
			//Set test info in player
			if(i_message.content['testInfo'])
			{
				setCurrentTestInfo(i_message.content['testInfo'].Name, i_message.content['testInfo'].Application, 
								   i_message.content['testInfo'].Date, i_message.content['testInfo'].Time);
			}
			
			//Mark selected boxes
			
			if(i_message.content['eyeTrackerActive'])
			{
				var span = document.getElementById('eyeRecorderStatus');
				span.innerHTML = "Online";
				span.className = "h1-success";
			}
			else
			{
				var span = document.getElementById('eyeRecorderStatus');
				span.innerHTML = "Offline";
				span.className = "h1-fail";
			}
			
			if(i_message.content['microphoneConnected'])
			{
				var span = document.getElementById('microphoneStatus');
				span.innerHTML = "Connected";
				span.className = "h1-success";
			}
			else
			{
				var span = document.getElementById('microphoneStatus');
				span.innerHTML = "Not connected";
				span.className = "h1-fail";	
			}
			
			document.getElementById("eye_playerbox").checked = i_message.content['playerEyeBox'];
			document.getElementById("eye_playerbox").disabled = i_message.content['playerEyeBoxDisabled'];
			document.getElementById("mouse_playerbox").checked = i_message.content['playerMouseBox'];
			document.getElementById("mouse_playerbox").disabled = i_message.content['playerMouseBoxDisabled'];
			document.getElementById("opacity").value = i_message.content['heatmapOpacity'];
			
			//Set statistics
			if(i_message.content['statistics'])
			{
				setStatistics(i_message.content['statistics']);
			}
			
			if(i_message.content['pageTimestamps'])
			{
				console.log("Här ska jag sättas");
				var selectedIndex = i_message.content['selectedPageIndex'];
				var content = i_message.content['pageTimestamps'];
				var size = content.length;
				
				var select = document.getElementById("starttime");
				select.innerHTML = "";
				for(i = 0; i < size; i++)
				{
					var option = document.createElement("option");
					option.text = startTimes[i];
					select.add(option);
				}
				select.options.selectedIndex = selectedIndex;
			}
			
			//Set active tab
			setActiveTab(i_message.content['activeTab']);
		
			if(!isRecording)
			{
				document.getElementById('start_button').innerHTML = "Start";
			}
			else if(isRecording && !isRecordingPaused)
			{
				document.getElementById('start_button').innerHTML = "Pause";
			}
			else if(isRecording && isRecordingPaused)
			{
				document.getElementById('start_button').innerHTML = "Resume";
			}
			
			if(!isRendering)
			{
				document.getElementById('animatedata_button').innerHTML = "Animate";
				document.getElementById('animatedata_button').title = "Press to animate";
			}
			else if(isRendering && !isRenderingPaused)
			{
				document.getElementById('animatedata_button').innerHTML = "Pause";
				document.getElementById('animatedata_button').title = "Press to pause";
				chrome.browserAction.setIcon({path: "../../img/pause-icon16.png"});
				chrome.extension.sendRequest({ msg: "display::animate" });
			}
			else
			{
				document.getElementById('animatedata_button').innerHTML = "Resume";
				document.getElementById('animatedata_button').title = "Press to resume";
				chrome.browserAction.setIcon({path: "../../img/play-icon16.png"});
				var toSend = new Object();
				toSend.Eye = document.getElementById("eye_playerbox").checked;
				toSend.Mouse = document.getElementById("mouse_playerbox").checked;	
				chrome.extension.sendRequest({ msg: "display::animate", data: toSend });
			}
			
			if(isFixationPointsDisplayed)
			{
				document.getElementById('fixation_button').innerHTML = "Hide fixation points";
			}
			else
			{
				document.getElementById('fixation_button').innerHTML = "Show fixation points";
			}
			
			if(!isConnected)
			{
				chrome.extension.sendRequest({ msg: "websocket::connectWebSocket" });
			}
			else
			{
				var span = document.getElementById('extension_header');
				span.innerHTML ="Online";
				span.className = "h1-success";
				chrome.extension.sendRequest({ msg: "websocket::getAllApplicationsRequest"});
			}
			
			if(isRecording)
			{
				chrome.extension.sendRequest({ msg: "websocket::pauseRecording" });
				chrome.browserAction.setIcon({path: "../../img/rec-icon16.png"});
			}
			else if(!isRendering)
			{
				//Setting default icon
				chrome.browserAction.setIcon({path: "../../img/eye-icon16.png"});	
			}
		}
		else if(i_message.msg == "popup::renderInfo")
		{
			renderInfo(i_message.info, i_message.type);
		}
	});
}

