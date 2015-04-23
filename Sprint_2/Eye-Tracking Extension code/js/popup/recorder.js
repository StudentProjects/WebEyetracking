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
			//Get checkbox values
			var recordEye = document.getElementById("eye_recordbox").checked;
			var recordMouse = document.getElementById("mouse_recordbox").checked;
			
			//If not recording, send start message with type depending on which checkboxes are checked
			if(!isRecording)
			{
				//Send messages with 25 milliseconds delay, so that the servers buffer 
				//won't get corrupted
				var index = 0;
				var interval = setInterval(function()
				{
					if(index == 0)
					{
						chrome.extension.sendRequest({ msg: "tabinfo::getScrollHeight"});
					}
					else if(index == 1)
					{
						chrome.extension.sendRequest({ msg: "tabinfo::getDocumentSize"});
					}
					else if(index == 2)
					{
						//Decide what to record depending on the checkboxes in the recorder tab.
						if(recordEye && recordMouse)
						{
							chrome.extension.sendRequest({ msg: "websocket::startRecording", data: 2});
						}
						else if(recordEye)
						{
							chrome.extension.sendRequest({ msg: "websocket::startRecording", data: 0});
						}
						else if(recordMouse)
						{
							chrome.extension.sendRequest({ msg: "websocket::startRecording", data: 1});
						}
						else
						{
							renderInfo("Please choose what to record in the checkboxes!", "Error");
						}
					}
					else
					{
						clearInterval(interval);
					}
					
					index++;
				}, 50);
			}
			//If recording and not paused, send message to pause recording.
			else if(isRecording && !isRecordingPaused)
			{	
				if(recordEye && recordMouse)
				{
					chrome.extension.sendRequest({ msg: "websocket::pauseRecording" });
					chrome.extension.sendRequest({ msg: "mouserecorder::pauseRecording" });
				}
				else if(recordEye)
				{
					chrome.extension.sendRequest({ msg: "websocket::pauseRecording" });
				}
				else if(recordMouse)
				{
					chrome.extension.sendRequest({ msg: "mouserecorder::pauseRecording" });
				}
			}
			//If recording and paused, send resume message
			else if(isRecording && isRecordingPaused)
			{
				if(recordEye && recordMouse)
				{
					chrome.extension.sendRequest({ msg: "websocket::resumeRecording" });
					chrome.extension.sendRequest({ msg: "mouserecorder::resumeRecording" });
				}
				else if(recordEye)
				{
					chrome.extension.sendRequest({ msg: "websocket::resumeRecording" });
				}
				else if(recordMouse)
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
		if(i_message.msg == "popup::startReceived")
		{
			if(!isRecording)
			{
				if(document.getElementById("mouse_recordbox").checked)
				{
					chrome.extension.sendRequest({ msg: "mouserecorder::startRecording" });
				}
				
				document.getElementById('start_button').innerHTML = "Pause";
				isRecording = true;
				chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsRecording", data: isRecording });
				chrome.browserAction.setIcon({path: "../../img/rec-icon16.png"});
				
				var timer = setTimeout(function()
				{
					window.close();
					clearTimeout(timer);
				}, 10);
			}
		}
		//Pause received
		else if(i_message.msg == "popup::pauseReceived")
		{
			if(!isRecordingPaused)
			{
				document.getElementById('start_button').innerHTML = "Resume";
				isRecordingPaused = true;
				chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsRecordingPaused", data: isRecordingPaused });
				renderInfo("Recording paused!", "Alert");
				chrome.browserAction.setIcon({path: "../../img/eye-icon16.png"});
			}
		}
		//Resume received
		else if(i_message.msg == "popup::resumeReceived")
		{
			if(isRecordingPaused)
			{
				document.getElementById('start_button').innerHTML = "Pause";
				isRecordingPaused = false;
				chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsRecordingPaused", data: isRecordingPaused });
				chrome.browserAction.setIcon({path: "../../img/rec-icon16.png"});
				
				var timer = setTimeout(function()
				{
					window.close();
					clearTimeout(timer);
				}, 10);
			}
		}
		//Stop received
		else if(i_message.msg == "popup::stopReceived")
		{
			document.getElementById('start_button').innerHTML = "Start";
			isRecording = false;
			isRecordingPaused = false;
			chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsRecording", data: isRecording });
			chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsRecordingPaused", data: isRecordingPaused });
			renderInfo("Recording Stopped!", "Alert");
			chrome.browserAction.setIcon({path: "../../img/eye-icon16.png"});
		
			if(document.getElementById("mouse_recordbox").checked)
			{
				chrome.extension.sendRequest({ msg: "mouserecorder::stopRecording" });
			}
		}
	});
}

