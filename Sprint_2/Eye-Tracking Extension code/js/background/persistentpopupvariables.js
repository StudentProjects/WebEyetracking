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
var testInfo = null;
var activeTab = 0;
var recorderEyeBox = true;
var recorderMouseBox = true;
var playerEyeBox = true;
var playerMouseBox = true;
var isRendering = false;

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
	variables.testInfo = testInfo;
	variables.activeTab = activeTab;
	variables.recorderEyeBox = recorderEyeBox;
	variables.recorderMouseBox = recorderMouseBox;
	variables.playerEyeBox = playerEyeBox;
	variables.playerMouseBox = playerMouseBox;
	variables.isRendering = isRendering;
	
	chrome.runtime.sendMessage({msg: 'popup::variables', content: variables});
}

function sendUserInfo()
{
	chrome.runtime.sendMessage({msg: 'info::setUserInfo', info: userInfo});
}

function sendTestInfo()
{
	chrome.runtime.sendMessage({msg: 'player::setTestInfo', info: testInfo});
}

function setIsRecording(status)
{
	isRecording = status;
}

function setIsRendering(status)
{
	isRendering = status;
}

function setIsRecordingPaused(status)
{
	isRecordingPaused = status;
}

function setIsConnected(connectionStatus)
{
	isConnected = connectionStatus;
}

function setDebugText(newDebugText)
{
	debugText = newDebugText;
}

function setUserInfo(newUserInfo)
{
	userInfo = newUserInfo;
}

function setTestInfo(newTestInfo)
{
	testInfo = newTestInfo;
}

function setActiveTab(newTab)
{
	activeTab = newTab;
}

function setRecorderEyeBox(status)
{
	recorderEyeBox = status;
}

function setRecorderMouseBox(status)
{
	recorderMouseBox = status;
}

function setPlayerEyeBox(status)
{
	playerEyeBox = status;
}

function setPlayerMouseBox(status)
{
	playerMouseBox = status;
}