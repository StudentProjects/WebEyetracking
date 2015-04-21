/////////////////////
//Daniel Lindgren////
//player.js///////////
/////////////////////
//
//Handles the functionality of the player tab in the extension popup.
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
		var eyeBox = document.getElementById("eye_playerbox");
		var mouseBox = document.getElementById("mouse_playerbox");
		if(eyeBox.checked || mouseBox.checked)
		{
			chrome.extension.sendRequest({ msg: "display::animate", eye: eyeBox.checked, mouse: mouseBox.checked });
		}
		else
		{
			renderInfo("Please use the checkboxes to select what to animate!", "Error");
		}
	});

	//Send show request to display.js
	document.getElementById('showdata_button').addEventListener("click", function()
	{
		var eyeBox = document.getElementById("eye_playerbox");
		var mouseBox = document.getElementById("mouse_playerbox");
		
		if(eyeBox.checked || mouseBox.checked)
		{
			chrome.extension.sendRequest({ msg: "display::show", eye: eyeBox.checked, mouse: mouseBox.checked });
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
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setPlayerEyeBox", box: document.getElementById("eye_playerbox").checked });
	});
	
	//If changed, send mouse_playerbox checked value
	document.getElementById("mouse_playerbox").addEventListener("change", function()
	{
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setPlayerMouseBox", box: document.getElementById("mouse_playerbox").checked });
	});
	
	console.log("player.js initialized!");
}

//Add a listener that listens for messages.
function addLoadMessageListener()
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
			renderInfo("Showing data...", "Alert");
		}
		//hideHeatmap
		else if(i_message.msg == "player::hideHeatmap")
		{
			renderInfo("Hiding data...", "Alert");
		}
	});
}