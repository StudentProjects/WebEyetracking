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
var messageQueue = null;
var messageSendInterval = null;

//Check if the isConnected variable in persistantpopupvariables is 
var checkConnection = setInterval(function()
{
	/*console.log("isConnected: " + isConnected);
	try
	{
		console.log("websocket.readystate: " + websocket.readyState);
	}
	catch(err)
	{
		console.log("No websocket connection");
	}*/
	
	
	if(!isConnected)
	{
		connectWebSocket();
	}
	if(websocket)
	{
		if(websocket.readyState == 1 && !isConnected)
		{
			afterConnection();
		}
	}
}, 5000);

///////////
//METHODS//
///////////

//Connect to local websocket server using port 5746.
//Setup callback functions for websocket
function connectWebSocket()
{	 
	//Connect WebSocket to server
	websocket = new WebSocket("ws://localhost:5746");

	console.log("Looking for server...");
	chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Connecting...", type: "Alert"});		
	
	//Happens when a connection is established.
	websocket.onopen = function(event) 
	{
		afterConnection();
	};
	
	//Happens when a connection is closed.
	websocket.onclose = function(event)
	{
		setIsConnected(false);
		clearInterval(messageSendInterval);
		messageSendInterval = null;
		messageQueue = null;
		
		console.log("Close code: " + event.code);
		
		//Send message to popup.js, telling it that we have disconnected.
		chrome.runtime.sendMessage({msg: 'popup::disconnected'});
		if(event.code > 1000)
		{
			console.log("ERROR: Could not connect to server.");
		}
	};
	
	//Happens when a message is received.
	websocket.onmessage = function(event) 
	{ 
		console.log("Message received!");
		
		//Called from messagehandler.js
		console.log("Message length: " + event.data.length);
		handleMessage(event.data); 
	}; 
}

function afterConnection()
{
	setIsConnected(true);
	messageQueue = new Array();
	
	messageSendInterval = setInterval(function()
	{
		sendMessage();
	},50);
	
	//Send message to popup.js, telling it that we have connected.
	chrome.runtime.sendMessage({msg: 'popup::connected'});
}

//Disconnect from websocket
function disconnectWebSocket()
{
	chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Disconnecting..."});
	manageMessage(11, "RequestDisconnect");
}

//Close websocket
function closeWebSocket()
{
	chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Closing WebSocket..."});
	websocket.close();
}

function sendMessage()
{
	if(websocket.readyState == 1)
	{
		if(messageQueue != null)
		{
			if(messageQueue.length > 0)
			{
				//Send first element
				websocket.send(messageQueue[0]);	
				//removes first element
				messageQueue.shift();	
			}
		}
	}
}

function sendWebsocketMessage(i_message) 
{
	if(messageQueue != null)
	{
		messageQueue.push(i_message);
	}
}

//Handle start recording request
function handleStartRecording()
{
	console.log("Handle recording");
	
	if(!isRecording)
	{
		//Scroll height
		chrome.tabs.query({
		    active: true,
            currentWindow:true
		}, function(tabs) {
		    var activeTab = tabs[0];
		    chrome.tabs.sendMessage(activeTab.id, { msg: "injectedtabinfo::getScrollHeight" }, function (response)
			{
				manageMessage(13, response.data);
				console.log("Scroll sent");
			});
		});
		
		//Document size
		chrome.tabs.query({
		    active: true,
            currentWindow:true
		}, function(tabs) {
		    var activeTab = tabs[0];
		    chrome.tabs.sendMessage(activeTab.id, { msg: "injectedtabinfo::getDocumentSize" }, function (response)
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
		
		var timer = setTimeout(function()
		{	
			//Request start recording
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
	console.log("Pause");
	
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
	console.log("Resume");

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
