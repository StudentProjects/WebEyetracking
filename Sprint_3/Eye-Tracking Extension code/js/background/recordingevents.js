/////////////////////
//Daniel Lindgren////
//recordingevents.js///////
/////////////////////
//
//Handles recording events
//

/////////////
//Variables//
/////////////

///////////
//METHODS//
///////////


//Handle start recording request
function handleStartRecording()
{
	if(!isRecording)
	{
		//Scroll height
		chrome.tabs.getSelected(null, function(i_tab) 
		{
			chrome.tabs.sendMessage(i_tab.id, {msg: "injectedtabinfo::getScrollHeight"}, function(response) 
			{
				manageMessage(13, response.data);
				console.log("Scroll sent");
			});
		});
		
		//Document size
		chrome.tabs.getSelected(null, function(i_tab) 
		{
			chrome.tabs.sendMessage(i_tab.id, {msg: "injectedtabinfo::getDocumentSize"}, function(response) 
			{
				manageMessage(25, response.data);
				console.log("Size sent");
			});
		});
		
		//Send User Info
		var data = new Object();
		data.Application = userInfo[0];
		data.Name = userInfo[1];
		data.Age = userInfo[2];
		
		data.Gender = userInfo[3];
		if(!data.Gender)
		{
			data.Gender = "";
		}	
		
		data.Occupation = userInfo[4];
		data.Location = userInfo[5];
		
		data.ComputerUsage = userInfo[6];
		if(!data.ComputerUsage)
		{
			data.ComputerUsage = "";
		}		
		
		data.Other = userInfo[7];
		
		manageMessage(14, JSON.stringify(data));
		
		console.log("Info Sent");
		
		//Start recording is done at a 50ms delay
		//to make sure that this message is placed
		//behind the messages above in the queue.
		var timer = setTimeout(function()
		{	
			manageMessage(1, "StartRecordingRequest");
		
			console.log("Start sent");
		}, 50);
	}
}

function handleStartReceived()
{
	chrome.runtime.sendMessage({ msg: "recorder::startReceived" });
	
	manageMessage(35, 0);
	
	chrome.browserAction.setIcon({path: "../../img/pause-icon16.png"});
	
	clearCanvas();
	startMouseRecording();
	startKeyRecording();
	isRecording = true;
}

function handlePauseRecording()
{
	manageMessage(2, "PauseRecordingRequest");
}

function handlePauseReceived()
{
	pauseMouseRecording();
	chrome.runtime.sendMessage({ msg: "recorder::pauseReceived" });
	chrome.browserAction.setIcon({path: "../../img/rec-icon16.png"});
	isRecordingPaused = true;
}

function handleResumeRecording()
{
	manageMessage(3, "ResumeRecordingRequest");
}

function handleResumeReceived()
{
	resumeMouseRecording();
	chrome.runtime.sendMessage({ msg: "recorder::resumeReceived" });
	chrome.browserAction.setIcon({path: "../../img/pause-icon16.png"});
	isRecordingPaused = false;
}

function handleStopRecording()
{
	if(isRecording)
	{
		manageMessage(4, "StopRecordingRequest");
	}
}

function handleStopReceived()
{
	chrome.runtime.sendMessage({ msg: "recorder::stopReceived" });
	
	isRecording = false;
	isRecordingPaused = false;
	
	chrome.browserAction.setIcon({path: "../../img/eye-icon16.png"});

    stopKeyRecording();
	stopMouseRecording();
}
