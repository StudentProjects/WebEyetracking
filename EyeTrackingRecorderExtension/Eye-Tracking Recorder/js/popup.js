/////////////////////
//Daniel Lindgren////
//popup.js///////////
/////////////////////
//
//Handles the functionality of the buttons in popup.html.
//Also handles messages received from the extension and
//transforms buttons depending on the current state.
//

/////////////
//Variables//
/////////////

var isRecording = false; //Is the application recording or not?
var isRecordingPaused = false; //Is the recording paused?
var isConnected = false; //Are we connected to the server?
var debugText = "Please connect to server!"; //Debug text currently being shown in debug_paragraph.

///////////
//METHODS//
///////////

chrome.extension.sendRequest({ msg: "persistentpopupvariables::getVariables" });

//Send connect/disconnect message to websocket.js depending on state.
document.getElementById('connect_button').addEventListener("click", function()
{
	//If already connected, send disconnect message.
	if(isConnected)
	{
		chrome.extension.sendRequest({ msg: "websocket::disconnectWebSocket" });
	}
	//If not connected (default state), send connect message.
	else
	{
		chrome.extension.sendRequest({ msg: "websocket::connectWebSocket" });
	}
});

//Send message to websockets.js and change start_button text depending on state. 
document.getElementById('start_button').addEventListener("click", function()
{
	//Execute only if connected
	if(isConnected)
	{
		//If not recording, send start message
		if(!isRecording)
		{
			chrome.extension.sendRequest({ msg: "tabinfo::getScrollHeight"});
			chrome.extension.sendRequest({ msg: "websocket::startRecording" });
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
		setDebugText("Error: Unable to start recording.<br><br>Please connect to server.");
	}
});

//Send stop message to websockets.js and change start_button text to "Start"
document.getElementById('stop_button').addEventListener("click", function()
{
	if(isConnected)
	{
		chrome.extension.sendRequest({ msg: "websocket::stopRecording" });
	}
	else
	{
		setDebugText("Error: Unable to stop recording.<br><br>Please connect to server.");
	}
});

//Send recordedDataRequest message to websockets.js
document.getElementById('getdata_button').addEventListener("click", function()
{
	if(isConnected)
	{
		chrome.extension.sendRequest({ msg: "websocket::recordedDataRequest" });
	}
	else
	{
		setDebugText("Error: Unable to get data.<br><br>Please connect to server.");
	}
});

//Send animate request to displayheatmap.js
document.getElementById('animatedata_button').addEventListener("click", function()
{	
	chrome.extension.sendRequest({ msg: "displayheatmap::animate" });
	setDebugText("Animating...");
});

//Send show request to displayheatmap.js
document.getElementById('showdata_button').addEventListener("click", function()
{
	chrome.extension.sendRequest({ msg: "displayheatmap::show" });
	setDebugText("Loading heatmap...");
});

//Send hide request to displayheatmap.js
document.getElementById('hidedata_button').addEventListener("click", function()
{
	chrome.extension.sendRequest({ msg: "displayheatmap::hide" });
});

//Set debugText, write it in the debug_paragraph and send request 
//to persistentpopupvariables.js to save the text.
function setDebugText(i_text)
{
	debugText = i_text;
	document.getElementById('debug_paragraph').innerHTML = debugText;
	chrome.extension.sendRequest({ msg: "persistentpopupvariables::setDebugText", text: debugText });
}

//This tells the script to listen
//for messages from our extension.
chrome.extension.onMessage.addListener(function(i_message, i_messageSender, i_sendResponse) 
{
	//Connected
	if(i_message.msg == "popup::connected")
	{
		document.getElementById('connect_button').innerHTML = "Disconnect";
		isConnected = true;
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsConnected", connected: isConnected });
		setDebugText("Connected to server, press start to begin recording.");
	}
	//Disconnected
	else if(i_message.msg == "popup::disconnected")
	{
		document.getElementById('connect_button').innerHTML = "Connect";
		isConnected = false;
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsConnected", connected: isConnected });
		setDebugText("Disconnected from server.");
	}
	//Start received
	else if(i_message.msg == "popup::startReceived")
	{
		document.getElementById('start_button').innerHTML = "Pause";
		isRecording = true;
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsRecording", recording: isRecording });
		setDebugText("Recording started.");
	}
	//Pause received
	else if(i_message.msg == "popup::pauseReceived")
	{
		document.getElementById('start_button').innerHTML = "Resume";
		isRecordingPaused = true;
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsRecordingPaused", paused: isRecordingPaused });
		setDebugText("Recording paused, press Resume to continue recording.");
	}
	//Resume received
	else if(i_message.msg == "popup::resumeReceived")
	{
		document.getElementById('start_button').innerHTML = "Start";
		isRecordingPaused = false;
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsRecordingPaused", paused: isRecordingPaused });
		setDebugText("Recording resumed.");
	}
	//Stop received
	else if(i_message.msg == "popup::stopReceived")
	{
		document.getElementById('start_button').innerHTML = "Start";
		isRecording = false;
		isRecordingPaused = false;
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsRecording", recording: isRecording });
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setIsRecordingPaused", paused: isRecordingPaused });
		setDebugText("Recording finished. Press Start to record again, or press Get Data to get the recorded data.");
	}
	//Update debug text
	else if(i_message.msg == "popup::updateDebugText")
	{
		setDebugText(i_message.text);
	}
	//Set variables
	else if(i_message.msg == "popup::variables")
	{
		isRecording = i_message.recording;
		isRecordingPaused = i_message.paused;
		isConnected = i_message.connected;
		debugText = i_message.text;
		
		if(isConnected)
		{
			document.getElementById('connect_button').innerHTML = "Disconnect";
			
			if(!isRecording)
			{
				document.getElementById('start_button').innerHTML = "Start";
			}
			else if(isRecording && !isRecordingPaused)
			{
				document.getElementById('start_button').innerHTML = "Pause";
			}
			else if(isRecording && isRecordingPaused)
			{
				document.getElementById('start_button').innerHTML = "Resume";
			}
		}
		else
		{
			document.getElementById('connect_button').innerHTML = "Connect";
			document.getElementById('start_button').innerHTML = "Start";
		}
		
		document.getElementById('stop_button').innerHTML = "Stop";
		document.getElementById('debug_paragraph').innerHTML = debugText;
	}
});

