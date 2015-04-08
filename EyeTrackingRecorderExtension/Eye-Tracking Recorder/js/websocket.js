/////////////////////
//Daniel Lindgren////
//websocket.js///////
/////////////////////
//
//Handles communication with the websocket server.
//

/////////////
//Variables//
/////////////

var websocket = null; //WebSocket variable

///////////
//METHODS//
///////////

//Connect to local websocket server using port 5746.
//Setup callback functions for websocket
var connectWebSocket = function()
{	 
	chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Connecting..."});		
	
	//Connect WebSocket to server
	websocket = new WebSocket("ws://localhost:5746");
	
	//Happens when a connection is established.
	websocket.onopen = function(event) 
	{
		//Send message to popup.js, telling it that we have connected.
		chrome.runtime.sendMessage({msg: 'popup::connected'});
		injectTabInfo(); //tabinfo.js
		injectHeatmap(); //displayheatmap.js
	};
	
	//Happens when a connection is closed.
	websocket.onclose = function(event) 
	{
		//Send message to popup.js, telling it that we have disconnected.
		chrome.runtime.sendMessage({msg: 'popup::disconnected'});
		if(event.code > 1000)
		{
			console.log("ERROR: Could not connect to server.");
			chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Error: Could not connect to server."});
		}
	};
	
	//Happens when a message is received.
	websocket.onmessage = function(event) 
	{ 
		console.log("Message received!")
		
		//Called from messagehandler.js
		handleMessage(event.data); 
	}; 
}

//Disconnect from websocket
var disconnectWebSocket = function()
{
	chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Disconnecting..."});
	sendMessage(11, "RequestDisconnect");
}

//Close websocket
var closeWebSocket = function()
{
	chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Closing WebSocket..."});
	websocket.close();
}

//Send a message to the server with type (integer) 
//i_messageType and content (string) i_messageContent.
function sendMessage(i_messageType, i_messageContent)
{
	websocket.send(JSON.stringify({MessageType: i_messageType, MessageContent: i_messageContent}));
}

//Create a listener that waits for a request. 
//Calls the requested function.
chrome.extension.onRequest.addListener
(
	function(request, sender, sendResponse)
	{
		//Connect
        if(request.msg == "websocket::connectWebSocket") 
		{
			connectWebSocket();
		}
		//Disconnect
		else if(request.msg == "websocket::disconnectWebSocket") 
		{
			disconnectWebSocket();
		}
		//Close websocket
		else if(request.msg == "websocket::closeWebSocket") 
		{
			closeWebSocket();
		}
		//Start
		else if(request.msg == "websocket::startRecording") 
		{
			sendMessage(1, "StartRecordingRequest");
		}
		//Pause
		else if(request.msg == "websocket::pauseRecording") 
		{
			sendMessage(2, "PauseRecordingRequest");
		}
		//Resume
		else if(request.msg == "websocket::resumeRecording") 
		{
			sendMessage(3, "ResumeRecordingRequest");
		}
		//Stop
		else if(request.msg == "websocket::stopRecording") 
		{
			sendMessage(4, "StopRecordingRequest");
		}
		//RecordedDataRequest
		else if(request.msg == "websocket::recordedDataRequest") 
		{
			sendMessage(5, "RecordedDataRequest");
		}
	}
);