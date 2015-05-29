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

var currentKeyRecording = new Object(); //Object holding key recording data

///////////
//METHODS//
///////////

function pushKeyUpdate(key)
{
	if(!isPaused)
	{
		currentKeyRecording['keys'].push(key);
		currentKeyRecording['timeStampKey'].push(currentTime);
	}
}

function startKeyRecording()
{
	//Reset currentMouseRecording object.
	currentKeyRecording['keys'] = new Array();
	currentKeyRecording['timeStampKey'] = new Array();
}

function stopKeyRecording()
{	
	manageMessage(27, JSON.stringify(currentKeyRecording));
}
