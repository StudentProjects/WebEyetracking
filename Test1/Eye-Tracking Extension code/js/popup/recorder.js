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
			var interval = setInterval(function()
			{
				window.location.hash = "#div_app";
				clearInterval(interval);
			},400);
		}
		else
		{
			m_isCollapsed = true;
			document.getElementById('toggleinfo_button').innerHTML = "Hide optional info";
			var interval = setInterval(function()
			{
				window.location.hash = "#div_age";
				clearInterval(interval);
			},400);
		}
	});
	
	//If changed, send eye_recordbox checked value
	document.getElementById("eye_recordbox").addEventListener("change", function()
	{
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setRecorderEyeBox", data: document.getElementById("eye_recordbox").checked });
	});
	
	//If changed, send mouse_recordbox checked value
	document.getElementById("mouse_recordbox").addEventListener("change", function()
	{
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setRecorderMouseBox", data: document.getElementById("mouse_recordbox").checked });
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

