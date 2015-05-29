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

var m_isCollapsed = false;

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
			//If not recording, send start message with type depending on which checkboxes are checked
			if(!isRecording)
			{			
				chrome.extension.sendRequest({ msg: "websocket::startRecording"});
			}
			//If recording and not paused, send message to pause recording.
			else if(isRecording && !isRecordingPaused)
			{	
				chrome.extension.sendRequest({ msg: "websocket::pauseRecording" });		
			}
			//If recording and paused, send resume message
			else if(isRecording && isRecordingPaused)
			{
				chrome.extension.sendRequest({ msg: "websocket::resumeRecording" });
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
	
	document.getElementById('toggleinfo_button').addEventListener("click", function()
	{
		if(m_isCollapsed)
		{
			m_isCollapsed = false;
			document.getElementById('toggleinfo_button').innerHTML = "Show optional info";
		}
		else
		{
			m_isCollapsed = true;
			document.getElementById('toggleinfo_button').innerHTML = "Hide optional info";
		}
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
		if(i_message.msg == "recorder::startReceived")
		{
			if(!isRecording)
			{
				document.getElementById('start_button').innerHTML = "Pause";
				isRecording = true;
				
				var timer = setTimeout(function()
				{
					window.close();
					clearTimeout(timer);
				}, 10);
			}
		}
		//Pause received
		else if(i_message.msg == "recorder::pauseReceived")
		{
			if(!isRecordingPaused)
			{
				document.getElementById('start_button').innerHTML = "Resume";
				isRecordingPaused = true;

				renderInfo("Recording paused!", "Alert");
			}
		}
		//Resume received
		else if(i_message.msg == "recorder::resumeReceived")
		{
			if(isRecordingPaused)
			{
				document.getElementById('start_button').innerHTML = "Pause";
				isRecordingPaused = false;
				
				var timer = setTimeout(function()
				{
					window.close();
					clearTimeout(timer);
				}, 10);
			}
		}
		//Set text showing that the eye tracker is online
		else if(i_message.msg == "recorder::setEyeTrackerOnline")
		{
			document.getElementById('eyeRecorderStatus').innerHTML = "Online";
			document.getElementById('eyeRecorderStatus').className = "h1-success";
		}
		//Set text showing that the eye tracker is offline
		else if(i_message.msg == "recorder::setEyeTrackerOffline")
		{
			document.getElementById('eyeRecorderStatus').innerHTML = "Offline";
			document.getElementById('eyeRecorderStatus').className = "h1-fail";
		}
		//Set text showing that the microphone is connected
		else if(i_message.msg == "recorder::setMicrophoneConnected")
		{
			document.getElementById('microphoneStatus').innerHTML = "Connected";
			document.getElementById('microphoneStatus').className = "h1-success";
		}
		//Set text showing that the microphone is disconnected
		else if(i_message.msg == "recorder::setMicrophoneDisconnected")
		{
			document.getElementById('microphoneStatus').innerHTML = "Not connected";
			document.getElementById('microphoneStatus').className = "h1-fail";
		}
		//Stop received
		else if(i_message.msg == "recorder::stopReceived")
		{
			document.getElementById('start_button').innerHTML = "Start";
			isRecording = false;
			isRecordingPaused = false;

			renderInfo("Recording Stopped!", "Alert");
		}
	});
}

