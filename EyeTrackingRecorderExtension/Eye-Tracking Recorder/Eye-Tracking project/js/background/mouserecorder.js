/////////////////////
//Daniel Lindgren////
//mouserecorder.js//
/////////////////////
//
//Sends information about the current tab
//to the server during runtime, such as
//scroll height.
//

/////////////
//Variables//
/////////////

var currentMouseRecording = new Object();
var timer = null; //Variable for interval timer.
var isRecording = false;
var isPaused = false;
var mouseX = -1;
var mouseY = -1;
var lastTime = 0;
var currentTime = 0;

///////////
//METHODS//
///////////

//Inject scripts into current tab.
function injectMouseRecorder()
{
	chrome.tabs.getSelected(null, function(i_tab)
	{ 
		//chrome.tabs.executeScript(i_tab.id, {file: 'ext/jquery/jquery.js'});
	
		//chrome.tabs.executeScript(i_tab.id, {file: 'js/tab/injectedmouserecorder.js'});
	});	
}

//Update mouse position
function updateMousePosition(newX, newY)
{
	mouseX = newX;
	mouseY = newY;
}

//Push mouse position and timestamp to currentMouseRecording array.
function pushMousePosition()
{
	if(!isPaused)
	{
		var time = new Date();
		currentTime += time.getTime() - lastTime;
		lastTime = time.getTime();
		
		currentMouseRecording['mouseX'].push(mouseX);
		currentMouseRecording['mouseY'].push(mouseY);	
		currentMouseRecording['timeStampMouse'].push(currentTime);	
	}
}

//Start recording mouse movement
function startMouseRecording()
{
	//Reset currentMouseRecording object.
	currentMouseRecording['mouseX'] = new Array();
	currentMouseRecording['mouseY'] = new Array();
	currentMouseRecording['timeStampMouse'] = new Array();
		
	var time = new Date();
	currentTime = 0;
	lastTime = time.getTime();
	
	//Run once before interval starts
	pushMousePosition();
	
	//Push at 60fps
	timer = setInterval(function()
	{
		if(mouseX > 0 && mouseY > 0)
		{
			pushMousePosition();
		}

	}, 16.67);		
}

function pauseMouseRecording()
{
	chrome.runtime.sendMessage({msg: 'popup::pauseReceived'});
	isPaused = true;
}

function resumeMouseRecording()
{
	chrome.runtime.sendMessage({msg: 'popup::resumeReceived'});
	isPaused = false;
}

//Stop mouse recording
function stopMouseRecording()
{
	clearInterval(timer);
	isPaused = false;
	
	sendMessage(23, JSON.stringify(currentMouseRecording));
}

//Create a listener that waits for a request. 
chrome.extension.onRequest.addListener
(
	function(request, sender, sendResponse)
		//startRecording		
	{	
        if(request.msg == "mouserecorder::startRecording") 
		{
			startMouseRecording();
		}
		//startRecording		
        else if(request.msg == "mouserecorder::pauseRecording") 
		{
			pauseMouseRecording();
		}
		//startRecording		
        else if(request.msg == "mouserecorder::resumeRecording") 
		{
			resumeMouseRecording();
		}
		//stopRecording
        else if(request.msg == "mouserecorder::stopRecording") 
		{
			stopMouseRecording();
		}
	}
);