/////////////////////
//Daniel Lindgren////
//recorder.js///////////
/////////////////////
//
//Handles the functionality of the recorder tab in the extension popup.
//

/////////////
//Variables//
/////////////

///////////
//METHODS//
///////////

initRecorder();

//Initialize recorder.js
function initRecorder()
{
	//Send message to websockets.js depending on recording state
	document.getElementById('start_button').addEventListener("click", function()
	{
		//Execute only if connected
		if(isConnected)
		{
			//Get checkbox values
			var recordEye = document.getElementById("eye_recordbox").checked;
			var recordMouse = document.getElementById("mouse_recordbox").checked;
			
			//If not recording, send start message with type depending on which checkboxes are checked
			if(!isRecording)
			{
				//Get current scroll height
				chrome.extension.sendRequest({ msg: "tabinfo::getScrollHeight"});

				//Decide what to record depending on the checkboxes in the recorder tab.
				if(recordEye && recordMouse)
				{
					chrome.extension.sendRequest({ msg: "websocket::startRecording", record: 2});
				}
				else if(recordEye)
				{
					chrome.extension.sendRequest({ msg: "websocket::startRecording", record: 0});
				}
				else if(recordMouse)
				{
					chrome.extension.sendRequest({ msg: "websocket::startRecording", record: 1});
				}
				else
				{
					renderInfo("Please choose what to record in the checkboxes!", "Error");
				}
			}
			//If recording and not paused, send message to pause recording.
			else if(isRecording && !isRecordingPaused)
			{	
				if(recordEye)
				{
					chrome.extension.sendRequest({ msg: "websocket::pauseRecording" });
				}
				if(recordMouse)
				{
					chrome.extension.sendRequest({ msg: "mouserecorder::pauseRecording" });
				}
			}
			//If recording and paused, send resume message
			else if(isRecording && isRecordingPaused)
			{
				if(recordEye)
				{
					chrome.extension.sendRequest({ msg: "websocket::resumeRecording" });
				}
				if(recordMouse)
				{
					chrome.extension.sendRequest({ msg: "mouserecorder::resumeRecording" });
				}		
			}
			//This should not be possible, but just in case.
			else
			{
				console.log("Internal Error: Unknown recording state!");
			}
		}
		//If not connected
		else
		{
			console.log("Not connected!");
			renderInfo("Cannot start recording, not connected to server!", "Error");
		}
	});

	//Send stop message to websockets.js
	document.getElementById('stop_button').addEventListener("click", function()
	{
		if(isConnected)
		{
			if(isRecording)
			{
				chrome.extension.sendRequest({ msg: "websocket::stopRecording" });
			}
			else
			{
				renderInfo("Recorder is not recording!", "Error");
			}
		}
		else
		{
			renderInfo("Cannot stop recording, not connected to server!", "Error");
		}
	});
	
	//If changed, send eye_recordbox checked value
	document.getElementById("eye_recordbox").addEventListener("change", function()
	{
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setRecorderEyeBox", box: document.getElementById("eye_recordbox").checked });
	});
	
	//If changed, send mouse_recordbox checked value
	document.getElementById("mouse_recordbox").addEventListener("change", function()
	{
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setRecorderMouseBox", box: document.getElementById("mouse_recordbox").checked });
	});
	
	//Add listener.
	addRecorderMessageListener();
	
	console.log("recorder.js initialized!");
}

//Add a listener that listens for messages.
function addRecorderMessageListener()
{
	//This tells the script to listen
	//for messages from our extension.
	chrome.extension.onMessage.addListener(function(i_message, i_messageSender, i_sendResponse) 
	{
		//Start received
		if(i_message.msg == "popup::startReceived")
		{
			document.getElementById('start_button').innerHTML = "Pause";
			isRecording = true;
			chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsRecording", recording: isRecording });
			//renderInfo("Recording started!", "Alert");
			window.close();
		}
		//Pause received
		else if(i_message.msg == "popup::pauseReceived")
		{
			if(!isRecordingPaused)
			{
				document.getElementById('start_button').innerHTML = "Resume";
				isRecordingPaused = true;
				chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsRecordingPaused", paused: isRecordingPaused });
				renderInfo("Recording paused!", "Alert");
			}
		}
		//Resume received
		else if(i_message.msg == "popup::resumeReceived")
		{
			if(isRecordingPaused)
			{
				document.getElementById('start_button').innerHTML = "Pause";
				isRecordingPaused = false;
				chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsRecordingPaused", paused: isRecordingPaused });
				renderInfo("Recording resumed!", "Alert");
			}
		}
		//Stop received
		else if(i_message.msg == "popup::stopReceived")
		{
			document.getElementById('start_button').innerHTML = "Start";
			isRecording = false;
			isRecordingPaused = false;
			chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsRecording", recording: isRecording });
			chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsRecordingPaused", paused: isRecordingPaused });
			renderInfo("Recording Stopped!", "Alert");
		}
	});
}

