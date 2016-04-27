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
var statistics = null;
var activeTab = 0;
var playerEyeBox = true;
var playerMouseBox = true;
var playerEyeBoxDisabled = false;
var playerMouseBoxDisabled = false;
var isRendering = false;
var isRenderingPaused = false;
var isFixationPointsDisplayed = false;
var isNavigationDisplayed = false;
var isFPConnectorsDisplayed = false; //Linus edits

var isConnected = false;
var isJQueryLoaded = false;

var isReadyInterval = null;

var eyeTrackerActive = false;
var microphoneConnected = false;

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
	variables.statistics = statistics;
	variables.activeTab = activeTab;
	variables.playerEyeBox = playerEyeBox;
	variables.playerMouseBox = playerMouseBox;
	variables.playerEyeBoxDisabled = playerEyeBoxDisabled;
	variables.playerMouseBoxDisabled = playerMouseBoxDisabled;
	variables.isRendering = isRendering;
	variables.isRenderingPaused = isRenderingPaused;
	variables.isFixationPointsDisplayed = isFixationPointsDisplayed;
	variables.isFPConnectorsDisplayed = isFPConnectorsDisplayed; //Linus edits
	variables.isNavigationDisplayed = isNavigationDisplayed;
	variables.isJQueryLoaded = isJQueryLoaded;
	variables.eyeTrackerActive = eyeTrackerActive;
	variables.microphoneConnected = microphoneConnected;
	
	chrome.runtime.sendMessage({msg: 'popup::variables', content: variables});
}

function setMicrophone(status)
{
	microphoneConnected = status;
}
function setEyeTrackerActive(status)
{
	eyeTrackerActive = status;
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
	console.log("Rendering set in persistant: " + status);
	isRendering = status;
}

function setIsRenderingPaused(status)
{
	isRenderingPaused = status;
}

function setIsJQueryLoaded(status)
{
	isJQueryLoaded = status;
}

function setIsConnected(status)
{
	isConnected = status;
}

function setIsFixationPointsDisplayed(status)
{
	isFixationPointsDisplayed = status;
}
function setIsFPConnectorsDisplayed(status) //Linus edits
{
	isFPConnectorsDisplayed = status;
}

function setIsNavigationDisplayed(status)
{
	isNavigationDisplayed = status;
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

function setStatistics(newStatistics)
{
	statistics = newStatistics;
}

function setActiveTab(newTab)
{
	activeTab = newTab;
}

function setPlayerEyeBox(status)
{
	playerEyeBox = status;
}

function setPlayerMouseBox(status)
{
	playerMouseBox = status;
}

function setPlayerEyeBoxDisabled(status)
{
	playerEyeBoxDisabled = status;
}

function setPlayerMouseBoxDisabled(status)
{
	playerMouseBoxDisabled = status;
}

//Check if client is connected to server
//and if jQuery is initialized.
isReadyInterval = setInterval(function()
{
	chrome.runtime.sendMessage({msg: 'popup::isReady', data: isJQueryLoaded});
}, 1000);
