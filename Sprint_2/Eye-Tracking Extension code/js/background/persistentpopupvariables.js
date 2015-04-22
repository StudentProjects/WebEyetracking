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
var userInfo = null; //Information about the user
var activeTab = 0;
var recorderEyeBox = false;
var recorderMouseBox = false;
var playerEyeBox = false;
var playerMouseBox = false;

///////////
//METHODS//
///////////

//Send variables to popup.js
function sendPopupVariables()
{
	var variables = new Object();
	variables.isRecording = isRecording;
	variables.isRecordingPaused = isRecordingPaused;
	variables.isConnected = isConnected;
	variables.userInfo = userInfo;
	variables.activeTab = activeTab;
	variables.recorderEyeBox = recorderEyeBox;
	variables.recorderMouseBox = recorderMouseBox;
	variables.playerEyeBox = playerEyeBox;
	variables.playerMouseBox = playerMouseBox;
	
	chrome.runtime.sendMessage({msg: 'popup::variables', content: variables});
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
		//setCurrentTab
		else if(request.msg == "persistentpopupvariables::setActiveTab")
		{	
			activeTab = request.tab;
			console.log("To set " + request.tab);
			console.log("Set tab " + activeTab);
		}
		//setRecorderEyeBox
		else if(request.msg == "persistentpopupvariables::setRecorderEyeBox")
		{
			recorderEyeBox = request.box;
		}
		//setRecorderMouseBox
		else if(request.msg == "persistentpopupvariables::setRecorderMouseBox")
		{
			recorderMouseBox = request.box;
		}
		//setPlayerEyeBox
		else if(request.msg == "persistentpopupvariables::setPlayerEyeBox")
		{
			playerEyeBox = request.box;
		}
		//setPlayerMouseBox
		else if(request.msg == "persistentpopupvariables::setPlayerMouseBox")
		{
			playerMouseBox = request.box;
		}
		//getUserInfo
		else if(request.msg == "persistentpopupvariables::getUserInfo") 
		{
			sendUserInfo();
		}
	}
);