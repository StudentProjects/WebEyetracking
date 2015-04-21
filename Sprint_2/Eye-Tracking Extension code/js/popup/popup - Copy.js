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

var isConnected = false; //Are we connected to the server?
var checkConnection = setInterval(function()
{
	if(!isConnected)
	{
		renderInfo("No server connection, please restart server!", "Error");
		chrome.extension.sendRequest({ msg: "websocket::connectWebSocket" });
	}
}, 15000);

var debugQueue = new Array();
var isRendering = false;

///////////
//METHODS//
///////////

initializePopup();

//Initialize popup.js
function initializePopup()
{
	chrome.extension.sendRequest({ msg: "websocket::getAllApplicationsRequest" });
	
	chrome.extension.sendRequest({ msg: "persistentpopupvariables::getVariables" });
	
	addPopupMessageListener();
	
	console.log("popup.js initialized!");

	initializeTabs();
}

//Initializes tabs
function initializeTabs()
{
	//Initialize tabs
	document.getElementById('tab1').innerHTML = $("#tab1").load("info.html");
	document.getElementById('tab2').innerHTML = $("#tab2").load("load.html");
	document.getElementById('tab3').innerHTML = $("#tab3").load("recorder.html");
	document.getElementById('tab4').innerHTML = $("#tab4").load("player.html");
	document.getElementById('tab5').innerHTML = $("#tab5").load("statistics.html");

	var script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	script.setAttribute("src", "../js/popup/info.js");
	document.getElementById("main_body").appendChild(script);

	script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	script.setAttribute("src", "../js/popup/load.js");
	document.getElementById("main_body").appendChild(script);

	script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	script.setAttribute("src", "../js/popup/recorder.js");
	document.getElementById("main_body").appendChild(script);

	script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	script.setAttribute("src", "../js/popup/player.js");
	document.getElementById("main_body").appendChild(script);

	script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	script.setAttribute("src", "../js/popup/statistics.js");
	document.getElementById("main_body").appendChild(script);

	$('ul.tabs').each(function()
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
			  // Make the old tab inactive.
			  $active.removeClass('active');
			  $content.hide();

			  // Update the variables with the new link and content
			  $active = $(this);
			  $content = $(this.hash);

			  // Make the tab active.
			  $active.addClass('active');
			  $content.show();

			  // Prevent the anchor's default click action
			  e.preventDefault();
		});
	});
	
	console.log("Created popup tabs!");
}

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

function placeInQueue(info, type)
{
	var debugMessage = new Object();
	debugMessage['info'] = info;
	debugMessage['type'] = type;
	
	console.log(debugQueue.length);
	
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
			chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsConnected", connected: isConnected });
			document.getElementById('extension_header').innerHTML = "Eye-Tracking Extension: Online";
			renderInfo("Successfully connected to server!", "Alert");
		}
		//Disconnected
		else if(i_message.msg == "popup::disconnected")
		{
			isConnected = false;
			chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsConnected", connected: isConnected });
			document.getElementById('extension_header').innerHTML = "Eye-Tracking Extension: Offline";
			renderInfo("Disconnected from server!", "Error");
		}
		//Set variables
		else if(i_message.msg == "popup::variables")
		{
			isRecording = i_message.recording;
			isRecordingPaused = i_message.paused;
			isConnected = i_message.connected;
		
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
			
			if(!isConnected)
			{
				chrome.extension.sendRequest({ msg: "websocket::connectWebSocket" });
			}
			else
			{
				document.getElementById('extension_header').innerHTML = "Eye-Tracking Extension: Online";
			}
		}
		else if(i_message.msg == "popup::renderInfo")
		{
			renderInfo(i_message.info, i_message.type);
		}
	});
}

