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
var isConnected = false; //Are we connected to the server?

//Check if the isConnected variable in persistantpopupvariables is 
var checkConnection = setInterval(function()
{
	if(!isConnected)
	{
		connectWebSocket();
	}
}, 15000);

///////////
//METHODS//
///////////

//Connect to local websocket server using port 5746.
//Setup callback functions for websocket
function connectWebSocket()
{	 
	//Connect WebSocket to server
	websocket = new WebSocket("ws://localhost:5746");

	console.log("Connecting!");
	chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Connecting...", type: "Alert"});		
	
	//Happens when a connection is established.
	websocket.onopen = function(event) 
	{
		isConnected = true;
		
		//Send message to popup.js, telling it that we have connected.
		chrome.runtime.sendMessage({msg: 'popup::connected'});
		
		//Get applications
		manageMessage(17, "GetAllApplicationsRequest");	
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
		isConnected = false;
	};
	
	//Happens when a message is received.
	websocket.onmessage = function(event) 
	{ 
		console.log("Message received!");
		
		//Called from messagehandler.js
		handleMessage(event.data); 
	}; 
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

function sendWebsocketMessage(i_message) 
{
	websocket.send(i_message);
}