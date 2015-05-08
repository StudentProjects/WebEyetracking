/////////////////////
//Daniel Lindgren////
//keyrecorder.js//
/////////////////////
//
//Records key input received from content script.
//

/////////////
//Variables//
/////////////

var currentKeyRecording = new Object();
var keyLastTime = 0;
var keyCurrentTime = 0;

///////////
//METHODS//
///////////

function pushKeyUpdate(key)
{
	var time = new Date();
	keyCurrentTime += time.getTime() - keyLastTime;
	keyLastTime = time.getTime();
	console.log(keyCurrentTime);
	
	currentKeyRecording['key'].push(key);
	currentKeyRecording['timeStampKey'].push(keyCurrentTime);
}

function startKeyRecording()
{
	//Reset currentMouseRecording object.
	currentKeyRecording['key'] = new Array();
	currentKeyRecording['timeStampKey'] = new Array();
		
	var time = new Date();
	keyCurrentTime = 0;
	keyLastTime = time.getTime();
}

function stopKeyRecording()
{	
	manageMessage(27, JSON.stringify(currentKeyRecording));
}
