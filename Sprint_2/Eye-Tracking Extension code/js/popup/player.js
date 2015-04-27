/////////////////////
//Daniel Lindgren////
//load.js///////////
/////////////////////
//
//Handles the functionality of the load tab in the extension popup.
//

/////////////
//Variables//
/////////////

//None

///////////
//METHODS//
///////////

initPlayer();

//Initialize player.js
function initPlayer()
{
	//Send animate request to display.js
	document.getElementById('animatedata_button').addEventListener("click", function()
	{	
		var toSend = new Object();
		toSend.Eye = document.getElementById("eye_playerbox").checked;
		toSend.Mouse = document.getElementById("mouse_playerbox").checked;	
		if(toSend.Eye|| toSend.Mouse)
		{
			chrome.extension.sendRequest({ msg: "display::animate", data: toSend });
		} 
		else
		{
			renderInfo("Please use the checkboxes to select what to animate!", "Error");
		}	
	});

	//Send show request to display.js
	document.getElementById('showdata_button').addEventListener("click", function()
	{
		var toSend = new Object();
		toSend.Eye = document.getElementById("eye_playerbox").checked;
		toSend.Mouse = document.getElementById("mouse_playerbox").checked;
		
		if(toSend.Eye || toSend.Mouse)
		{
			chrome.extension.sendRequest({ msg: "display::show", data: toSend });
		}
		else
		{
			renderInfo("Please use the checkboxes to select what to show!", "Error");
		}
	});

	//Send hide request to display.js
	document.getElementById('hidedata_button').addEventListener("click", function()
	{
		chrome.extension.sendRequest({ msg: "display::hide" });
	});
	
	//If changed, send eye_playerbox checked value
	document.getElementById("eye_playerbox").addEventListener("change", function()
	{
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setPlayerEyeBox", data: document.getElementById("eye_playerbox").checked });
	});
	
	//If changed, send mouse_playerbox checked value
	document.getElementById("mouse_playerbox").addEventListener("change", function()
	{
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setPlayerMouseBox", data: document.getElementById("mouse_playerbox").checked });
	});
	
	addPlayerMessageListener();
	
	console.log("player.js initialized!");
}

//Show information inside the player about the 
//currently loaded test.
function setCurrentTestInfo(user, application, date, time)
{
	//Split users name and make upper case of first letter in
	//each part of the name.
	var userName = "";
	var userSplitArray = user.split(" ");
	console.log(userSplitArray);
	for(i = 0; i < userSplitArray.length; i++)
	{
		var first = userSplitArray[i].substring(0, 1);
		var rest = userSplitArray[i].substring(1);
		userSplitArray[i] = first.toUpperCase() + rest;
		
		if(i < (userSplitArray.length - 1))
		{
			userName += userSplitArray[i] + " ";
		}
		else
		{
			userName += userSplitArray[i];
		}
	}
	
	//Create link for application name that, when clicked,
	//sends the user back to the load tab, with that applications
	//dates listed.
	var appLink = document.createElement('a');
	appLink.innerHTML = '<a href="#">' + application + '</a>';

	appLink.addEventListener("click", (function(data)
	{
		return function()
		{
			currentApplication = data;
			chrome.extension.sendRequest({ msg: "websocket::applicationRequest", data: data});
			
			createNavigationLinks(1);
			
			setActiveTab(1);
		};
	}(application)));	
	
	document.getElementById("player_testheader").innerHTML = "Current test";
	document.getElementById("player_user").innerHTML = "Name: ";
	document.getElementById("player_user").appendChild(appLink);
	document.getElementById("player_application").innerHTML = "Application: " + application;
	document.getElementById("player_date").innerHTML = "Date: " + date;
	document.getElementById("player_time").innerHTML = "Time: " + time;
}

function resetCurrentTestInfo()
{
	document.getElementById("player_testheader").innerHTML = "No test loaded";
	document.getElementById("player_user").innerHTML = "";
	document.getElementById("player_application").innerHTML = "";
	document.getElementById("player_date").innerHTML = "";
	document.getElementById("player_time").innerHTML = "";
}

//Add a listener that listens for messages.
function addPlayerMessageListener()
{
	//This tells the script to listen
	//for messages from our extension.
	chrome.extension.onMessage.addListener(function(i_message, i_messageSender, i_sendResponse)
	{
		//animateHeatmap
		if(i_message.msg == "player::animateHeatmap")
		{
			renderInfo("Animating data...", "Alert");
		}
		//showHeatmap
		else if(i_message.msg == "player::showHeatmap")
		{
			document.getElementById("player_testheader").innerHTML = "Displaying data";
			renderInfo("Showing data...", "Alert");
		}
		//hideHeatmap
		else if(i_message.msg == "player::hideHeatmap")
		{
			document.getElementById("player_testheader").innerHTML = "Current test";
			renderInfo("Hiding data...", "Alert");
		}
		else if(i_message.msg == "player::animationStarted")
		{
			document.getElementById("animatedata_button").innerHTML="Pause";
			document.getElementById("player_testheader").innerHTML = "Animating data..";
			chrome.browserAction.setIcon({path: "../../img/pause-icon16.png"});		
			var timer = setTimeout(function()
			{
				window.close();
				clearTimeout(timer);
			}, 15);
		}
		else if(i_message.msg == "player::animationFinished")
		{
			document.getElementById("player_testheader").innerHTML = "Finished animating";
			document.getElementById('animatedata_button').innerHTML = "Animate";
			document.getElementById('animatedata_button').title = "Press to animate";
		}
		else if(i_message.msg == "player::displayingData")
		{
			document.getElementById("player_testheader").innerHTML = "Displaying data";
		}
		else if(i_message.msg == "player::setHeaderToDefault")
		{
			document.getElementById("player_testheader").innerHTML = "Current test";
		}
		else if(i_message.msg == "player::noEyeData")
		{
			document.getElementById("eye_playerbox").checked = false;
			document.getElementById("eye_playerbox").disabled = true;
		}
		else if(i_message.msg == "player::noMouseData")
		{
			document.getElementById("mouse_playerbox").checked = false;
			document.getElementById("mouse_playerbox").disabled = true;
		}
	});
}