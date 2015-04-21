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
	//Connect WebSocket to server
	websocket = new WebSocket("ws://localhost:5746");

	console.log("Connecting!");
	chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Connecting...", type: "Alert"});		
	
	//Happens when a connection is established.
	websocket.onopen = function(event) 
	{
		//Send message to popup.js, telling it that we have connected.
		chrome.runtime.sendMessage({msg: 'popup::connected'});
		injectTabInfo(); //tabinfo.js
		injectHeatmap(); //displayheatmap.js
		injectMouseRecorder(); //mouserecorder.js	
		sendMessage(17, "GetAllApplicationsRequest"); //Get all applications
	};
	
	//Happens when a connection is closed.
	websocket.onclose = function(event) 
	{
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
		handleMessage(event.data); 
	}; 
};

//Disconnect from websocket
var disconnectWebSocket = function()
{
	chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Disconnecting..."});
	sendMessage(11, "RequestDisconnect");
};

//Close websocket
var closeWebSocket = function()
{
	chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Closing WebSocket..."});
	websocket.close();
};

//Send a message to the server with type (integer) 
//i_messageType and content (string) i_messageContent.
function sendMessage(i_messageType, i_messageContent)
{
	//If message is of type 23, it has the possibility
	//of being to big for the server to handle as a single
	//message. Therefore, in case of messagetype 23, the 
	//message is being split up into smaller peices, which
	//is sent one by one, 0.025 seconds apart.
	if(i_messageType == 23)
	{
		//Set message size and calculate how many messages 
		//will be needed.
		var messageSize = 4096;
		var nrOfMessages = Math.ceil(i_messageContent.length / messageSize);
		var messageArray = new Array();
		
		//If more than one message is needed,
		if(nrOfMessages > 1)
		{
			for(i = 0; i < nrOfMessages; i++)
			{
				var message = new Object();
				var currentSubString; 
				
				//Opcode is 0 for the first message, 2 for the
				//last message, and 1 for all other.
				var currentOpcode;
				if(i == 0)
				{
					currentOpcode = 0;
					currentSubString = i_messageContent.substring(i * messageSize, (i + 1) * messageSize);
				}
				else if(i != nrOfMessages - 1)
				{
					currentOpcode = 1;
					currentSubString = i_messageContent.substring(i * messageSize, (i + 1) * messageSize);
				}
				else if(i == nrOfMessages - 1)
				{
					currentOpcode = 2;
					currentSubString = i_messageContent.substring(i * messageSize, i_messageContent.length);
				}
				
				//Set message info
				message['MessageType'] = 23;
				message['Opcode'] = currentOpcode;
				message['MessageContent'] = currentSubString;
				
				//Push message into array
				messageArray.push(JSON.stringify({MessageType: i_messageType, Opcode: currentOpcode, MessageContent: currentSubString}));
			}
			
			//Every 25th millisecond, send a message until
			//there is no more messages to send.
			var index = 0;
			var timer = setInterval(function()
			{
				if(index == nrOfMessages)
				{
					clearInterval(timer);
					return;
				}
				websocket.send(messageArray[index]);
				index++;	
			}, 25);
		}
		//If only one message is needed, set opcode to 3.
		else
		{
			websocket.send(JSON.stringify({MessageType: i_messageType, Opcode: 3, MessageContent: i_messageContent}));
		}
	}
	//For all other message types than 23.
	else
	{
		websocket.send(JSON.stringify({MessageType: i_messageType, MessageContent: i_messageContent}));
	}
}

//Takes an array of user info and creates a JSON string from it.
function makeJSONfromUserInfo(input)
{
	var result = new Object();
	result.Name = input[0];
	result.Age = input[1];
	result.Occupation = input[2];
	result.Location = input[3];
	result.ComputerUsage = input[4];
	result.Application = input[5];
	result.Other = input[6];
	
	return JSON.stringify(result);
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
			sendMessage(1, request.record);
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
		//SendUserInfo
		else if(request.msg == "websocket::sendUserInfo") 
		{
			sendMessage(14, makeJSONfromUserInfo(request.info));
		}
		//ApplicationRequest
		else if(request.msg == "websocket::applicationRequest") 
		{
			sendMessage(15, request.application);
			console.log(request.application);
		}
		else if(request.msg == "websocket::getAllApplicationsRequest")
		{
			sendMessage(17, "GetAllApplicationsRequest");
		}
		else if(request.msg == "websocket::getSpecificDataRequest")
		{
			sendMessage(19, request.info);
		}
	}
);