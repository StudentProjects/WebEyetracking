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
var mouseTimer = null; //Variable for interval timer.
var isRecording = false;
var isPaused = false;
var mouseX = -1;
var mouseY = -1;
var mouseClickX = -1;
var mouseClickY = -1;
var mouseClicks = 0;

var lastTime = 0;
var currentTime = 0;

var pauseOffset = 0;
///////////
//METHODS//
///////////

//Update mouse position
function updateMousePosition(newX, newY)
{
	mouseX = newX;
	mouseY = newY;
}

//Update mouse position
function mouseClickEvent(atX, atY)
{
	mouseClickX = atX;
	mouseClickY = atY;
	mouseClicks += 1;
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
		currentMouseRecording['timeStampMouse'].push(currentTime - pauseOffset);
		
		if(mouseClicks > currentMouseRecording['mouseClickTimeStamp'].length)
		{
			currentMouseRecording['mouseClickX'].push(mouseClickX);
			currentMouseRecording['mouseClickY'].push(mouseClickY);	
			currentMouseRecording['mouseClickTimeStamp'].push(currentTime - pauseOffset);
		}	
	}
	else
	{
		var time = new Date();
		lastTime = time.getTime();
	}
}

//Start recording mouse movement
function startMouseRecording()
{
	chrome.runtime.sendMessage({msg: 'recorder::startReceived'});
	
	//Reset currentMouseRecording object.
	currentMouseRecording['mouseX'] = new Array();
	currentMouseRecording['mouseY'] = new Array();
	currentMouseRecording['timeStampMouse'] = new Array();
	currentMouseRecording['mouseClickX'] = new Array();
	currentMouseRecording['mouseClickY'] = new Array();
	currentMouseRecording['mouseClickTimeStamp'] = new Array();
		
	mouseClicks = 0;
	var time = new Date();
	currentTime = 0;
	lastTime = time.getTime();
	
	//Run once before interval starts
	pushMousePosition();
	
	//Push at 60fps
	mouseTimer = setInterval(function()
	{
		if(mouseX > 0 && mouseY > 0)
		{
			pushMousePosition();
		}

	}, 16.67);		
}

function pauseMouseRecording()
{
	chrome.runtime.sendMessage({msg: 'recorder::pauseReceived'});
	isPaused = true;
}

function resumeMouseRecording()
{
	chrome.runtime.sendMessage({msg: 'recorder::resumeReceived'});
	isPaused = false;
}

//Stop mouse recording
function stopMouseRecording()
{
	clearInterval(mouseTimer);
	isPaused = false;
	
	manageMessage(23, JSON.stringify(currentMouseRecording));
}
