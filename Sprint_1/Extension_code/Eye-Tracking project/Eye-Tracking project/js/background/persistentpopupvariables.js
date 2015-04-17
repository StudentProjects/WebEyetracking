///////////////////////////////
//Daniel Lindgren//////////////
//persistentpopupvariables.js//
///////////////////////////////
//
//Handles variables from popup.js that needs to be kept, event
//if the popup.html is destroyed (closed).
//

/////////////
//Variables//
/////////////

var isRecording = false; //Is the application recording or not?
var isRecordingPaused = false; //Is the recording paused?
var isConnected = false; //Are we connected to the server?
var debugText = "Please connect to server."; //Debug text currently being shown in debug_paragraph.
var userInfo = null; //Information about the user

///////////
//METHODS//
///////////

//Send variables to popup.js
function sendPopupVariables()
{
	chrome.runtime.sendMessage({msg: 'popup::variables', recording: isRecording, paused: isRecordingPaused, connected: isConnected, text: debugText, info: userInfo});
}

function sendUserInfo()
{
	chrome.runtime.sendMessage({msg: 'info::setUserInfo', info: userInfo});
}

//Create a listener that waits for a requests. 
//Calls the requested functionality.
chrome.extension.onRequest.addListener
(
	function(request, sender, sendResponse)
	{
		//getVariables
        if(request.msg == "persistentpopupvariables::getVariables") 
		{
			sendPopupVariables();
		}
		//setIsRecording
        else if(request.msg == "persistentpopupvariables::setIsRecording") 
		{
			isRecording = request.recording;
		}
		//setIsRecordingPaused
        else if(request.msg == "persistentpopupvariables::setIsRecordingPaused") 
		{
			isRecordingPaused = request.paused;
		}
		//setIsConnected
        else if(request.msg == "persistentpopupvariables::setIsConnected") 
		{
			isConnected = request.connected;
		}
		//setDebugText
        else if(request.msg == "persistentpopupvariables::setDebugText") 
		{
			debugText = request.text;
		}
		//setUserInfo
        else if(request.msg == "persistentpopupvariables::setUserInfo") 
		{
			userInfo = request.info;
		}
		//getUserInfo
		else if(request.msg == "persistentpopupvariables::getUserInfo") 
		{
			sendUserInfo();
		}
	}
);