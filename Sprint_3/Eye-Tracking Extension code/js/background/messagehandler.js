/////////////////////
//Daniel Lindgren////
//messagehandler.js//
/////////////////////
//
//Handles messages received by the extension and
//execute functionality depending on the message
//type and the message content.
//

/////////////
//Variables//
/////////////

var currentMessage = null; //Current message being handled

///////////
//METHODS//
///////////

//Unpack message and distribute content

function handleMessage(i_message)
{	
	try
	{
	 	currentMessage = JSON.parse(i_message);
	
	    //Handle message depending on MessageType
		switch(currentMessage['MessageType'])
		{
		//RecordedDataResponse
		case 6:
			chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Data received."});	
			resetTestInfo();
			setData(currentMessage['MessageContent'], false);	
			break;
		//StartRecordingResponse
		case 7:
			if(currentMessage['MessageContent'] == "Succeeded")
			{
				handleStartReceived();
				console.log("Recording started!");
			}
			else if(currentMessage['MessageContent'] == "Failed")
			{
				console.log("Unable to start recording!");
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to start recording, please try again!", type: "Error"});
			}
			else
			{
				console.log("Error: Unknown content: " + currentMessage['MessageContent'] + "!");
			}
			break;
		//PauseRecordingResponse
		case 8:
			if(currentMessage['MessageContent'] == "Succeeded")
			{
				handlePauseReceived();
				console.log("Recording paused!");
			}
			else if(currentMessage['MessageContent'] == "Failed")
			{
				console.log("Unable to pause recording!");
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to pause recording, please try again!", type: "Error"});
			}
			else
			{
				console.log("Error: Unknown content: " + currentMessage['MessageContent'] + "!");
			}
			break;
		//ResumeRecordingResponse
		case 9:
			if(currentMessage['MessageContent'] == "Succeeded")
			{
				handleResumeReceived();
				console.log("Recording resumed!");
			}
			else if(currentMessage['MessageContent'] == "Failed")
			{
				console.log("Unable to resume recording!");
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to resume recording, please try again!", type: "Error"});
			}
			else
			{
				console.log("Error: Unknown content: " + currentMessage['MessageContent'] + "!");
			}
			break;
		//StopRecordingResponse
		case 10:
			if(currentMessage['MessageContent'] == "Succeeded")
			{
				handleStopReceived();
				console.log("Recording stopped!");
			}
			else if(currentMessage['MessageContent'] == "Failed")
			{
				console.log("Unable to stop recording!");
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to stop recording, please try again!", type: "Error"});
			}
			else
			{
				console.log("Error: Unknown content: " + currentMessage['MessageContent'] + "!");
			}
			break;
		//DisconnectResponse
		case 12:
			closeWebSocket();
			break;
		//ApplicationResponse
		case 16:
			chrome.runtime.sendMessage({msg: 'load::createDateTable', data: currentMessage['MessageContent']});
			break;
		//GetAllApplicationsResponse
		case 18:
			chrome.runtime.sendMessage({msg: 'load::createApplicationTable', data: currentMessage['MessageContent']});
			break;
		//LoadData
		case 20:
			if(currentMessage['MessageContent'] == "NoData")
			{
				chrome.runtime.sendMessage({msg: 'load::loadFailed'});
			}
			else
			{
				chrome.runtime.sendMessage({msg: 'load::loadSucceeded', data: currentMessage['MessageContent'] });
				resetTestInfo();
				setData(currentMessage['MessageContent'],false);
			}
			break;
		//SubTestResponse
		case 22:
			//Do stuff
			break;
		//RecordedMouseDataResponse
		case 24:
			if(currentMessage['MessageContent'] == "Succeeded")
			{
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Successfully sent mouse data!", type: "Alert"});
			}
			else if(currentMessage['MessageContent'] == "Failed")
			{
				chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Failed to send mouse data!", type: "Error"});
			}
			break;
		//EyeTrackerStatus
		case 26:
			var msgData = currentMessage['MessageContent'];
			console.log(msgData);
			if(msgData == "True")
			{
				console.log("Eye tracker online");
				setEyeTrackerActive(true);
				chrome.runtime.sendMessage({msg: 'recorder::setEyeTrackerOnline'});
			}
			else
			{
				console.log("Eye tracker offline");
				setEyeTrackerActive(false);
				chrome.runtime.sendMessage({msg: 'recorder::setEyeTrackerOffline'});
			}
			break;
		//keyDataResponse
		case 28:
			if(currentMessage['MessageContent'] == "Succeeded")
			{
				console.log("Successfully send key data!");
			}
			else
			{
				console.log("Failed to send key data!");
			}
			break;
		case 30:
			var msgData = currentMessage['MessageContent'];
			console.log(msgData);
			if(msgData == "True")
			{
				console.log("Mouse connected");
				setMicrophone(true);
				chrome.runtime.sendMessage({msg: 'recorder::setMicrophoneConnected'});
			}
			else
			{
				console.log("Mouse not connected");
				setMicrophone(false);
				chrome.runtime.sendMessage({msg: 'recorder::setMicrophoneDisconnected'});
			}
			break;
		//Error message
		case 99:
			console.log("Error: " + currentMessage['MessageContent']);
			chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Error: " + currentMessage['MessageContent']});
			break;
		}	
	}
	catch(err) // Error occurred when parsing received message
	{
		console.log("Unable to parse string to JSON when receiving message "+err.message);
		chrome.runtime.sendMessage({msg: 'popup::renderInfo', info: "Unable to parse message from server!", type: "Error"});
	}
}

function handleLargeMessage(data,type)
{
		//Set message size and calculate how many messages 
		//will be needed.
		var messageSize = 4096;
		var nrOfMessages = Math.ceil(data.length / messageSize);
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
					currentSubString = data.substring(i * messageSize, (i + 1) * messageSize);
				}
				else if(i != nrOfMessages - 1)
				{
					currentOpcode = 1;
					currentSubString = data.substring(i * messageSize, (i + 1) * messageSize);
				}
				else if(i == nrOfMessages - 1)
				{
					currentOpcode = 2;
					currentSubString = data.substring(i * messageSize, data.length);
				}
				
				//Set message info
				message['MessageType'] = 23;
				message['Opcode'] = currentOpcode;
				message['MessageContent'] = currentSubString;
				
				//Push message into array
				messageArray.push(JSON.stringify({MessageType: type, Opcode: currentOpcode, MessageContent: currentSubString}));
			}
			
			//Every 25th millisecond, send a message until
			//there is no more messages to send.
			for(var i=0;i<nrOfMessages;i++)
			{
				sendWebsocketMessage(messageArray[i]);
			}
		}
		//If only one message is needed, set opcode to 3.
		else
		{
			sendWebsocketMessage(JSON.stringify({MessageType: type, Opcode: 3, MessageContent: data}));
		}
}

//Send a message to the server with type (integer) 
//i_messageType and content (string) i_messageContent.
function manageMessage(i_messageType, i_messageContent)
{
	//If the message type is a send mouse coordinates message (type 23)
	// Handle message as large message
	if(i_messageType == 23)
	{
		handleLargeMessage(i_messageContent,i_messageType);
	}
	//For all other message types than 23.
	else
	{
		sendWebsocketMessage(JSON.stringify({MessageType: i_messageType, MessageContent: i_messageContent}));
	}
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
			//Handled in websocket.js
			connectWebSocket();
		}
		//Disconnect
		else if(request.msg == "websocket::disconnectWebSocket") 
		{
			//Handled in websocket.js
			disconnectWebSocket();
		}
		//Close websocket
		else if(request.msg == "websocket::closeWebSocket") 
		{
			//Handled in websocket.js
			closeWebSocket();
		}
		//Start
		else if(request.msg == "websocket::startRecording") 
		{
			handleStartRecording();
		}
		//Pause
		else if(request.msg == "websocket::pauseRecording") 
		{
			handlePauseRecording();
		}
		//Resume
		else if(request.msg == "websocket::resumeRecording") 
		{
			handleResumeRecording();
		}
		//Stop
		else if(request.msg == "websocket::stopRecording") 
		{
			handleStopRecording();
		}
		//RecordedDataRequest
		else if(request.msg == "websocket::recordedDataRequest") 
		{
			manageMessage(5, "RecordedDataRequest");
		}
		//SendUserInfo
		else if(request.msg == "websocket::sendUserInfo") 
		{
			manageMessage(14, request.data);
		}
		//ApplicationRequest
		else if(request.msg == "websocket::applicationRequest") 
		{
			manageMessage(15, request.data);
		}
		else if(request.msg == "websocket::getAllApplicationsRequest")
		{
			manageMessage(17, "GetAllApplicationsRequest");
		}
		else if(request.msg == "websocket::getSpecificDataRequest")
		{
			manageMessage(19, request.data);
		}
		//Handled in display.js
        else if(request.msg == "display::animate") 
		{
			if(!isRendering)
			{
				var data = request.data;
				manageMessage(31, "StartRendering");
				animateData(data.Eye, data.Mouse);	
			}
			else if(isRendering && !isRenderingPaused)
			{
				chrome.runtime.sendMessage({msg: 'player::pauseRendering'});
				manageMessage(32, "PauseRendering");
				setIsRenderingPaused(true);
				pauseRendering();
			}
			else if(isRendering && isRenderingPaused)
			{
				chrome.runtime.sendMessage({msg: 'player::resumeRendering'});
				manageMessage(33, "ResumeRendering");
				setIsRenderingPaused(false);
				resumeRendering();
				var data = request.data;
				console.log(data);
				animateData(data.Eye, data.Mouse);	
			}
		}
        else if(request.msg == "display::show") 
		{
			var data = request.data;
			showHeatmap(data.Eye, data.Mouse);
		}
		else if(request.msg == "display::hide") 
		{
			hideHeatmap();
		}
		else if(request.msg == "display::handleFixationPoints")
		{
			handleFixationPoints();
		}
		//Handled in mouserecorder.js
		else if(request.msg == "mouserecorder::startRecording") 
		{
			startMouseRecording();
		}
		//startRecording		
        else if(request.msg == "mouserecorder::pauseRecording") 
		{
			pauseMouseRecording();
		}
		//startRecording		
        else if(request.msg == "mouserecorder::resumeRecording") 
		{
			resumeMouseRecording();
		}
		//stopRecording
        else if(request.msg == "mouserecorder::stopRecording") 
		{
			stopMouseRecording();
		}
		//Handled in persistentpopupvariables.js
		else if(request.msg == "persistentpopupvariables::getVariables") 
		{
			sendPopupVariables();
		}
		//setIsRecording
        else if(request.msg == "persistentpopupvariables::setIsRecording") 
		{
			setIsRecording(request.data);
		}
		//setIsRecordingPaused
        else if(request.msg == "persistentpopupvariables::setIsRecordingPaused") 
		{
			setIsRecordingPaused(request.data);
		}
		//setIsConnected
        else if(request.msg == "persistentpopupvariables::setIsConnected") 
		{
			setIsConnected(request.data);
		}
		//setDebugText
        else if(request.msg == "persistentpopupvariables::setDebugText") 
		{
			setDebugText(request.data);
		}
		//setUserInfo
        else if(request.msg == "persistentpopupvariables::setUserInfo") 
		{
			setUserInfo(request.data);
		}
		//setTestInfo
		else if(request.msg == "persistentpopupvariables::setTestInfo") 
		{
			setTestInfo(request.data);
		}
		//setStatistics
		else if(request.msg == "persistentpopupvariables::setStatistics") 
		{
			setStatistics(request.data);
		}
		//setCurrentTab
		else if(request.msg == "persistentpopupvariables::setActiveTab")
		{	
			setActiveTab(request.data);
		}
		//setPlayerEyeBox
		else if(request.msg == "persistentpopupvariables::setPlayerEyeBox")
		{
			setPlayerEyeBox(request.data);
		}
		//setPlayerMouseBox
		else if(request.msg == "persistentpopupvariables::setPlayerMouseBox")
		{
			setPlayerMouseBox(request.data);
		}
		//setPlayerEyeBoxDisabled
		else if(request.msg == "persistentpopupvariables::setPlayerEyeBoxDisabled")
		{
			setPlayerEyeBoxDisabled(request.data);
		}
		//setPlayerMouseBoxDisabled
		else if(request.msg == "persistentpopupvariables::setPlayerMouseBoxDisabled")
		{
			setPlayerMouseBoxDisabled(request.data);
		}
		//getUserInfo
		else if(request.msg == "persistentpopupvariables::getUserInfo") 
		{
			sendUserInfo();
		}
		else if(request.msg == "persistentpopupvariables::setPageTimestamps") 
		{
			setPageTimestamps(request.data);
		}
		else if(request.msg == "persistentpopupvariables::setSelectedTimeIndex") 
		{
			setSelectedTimeIndex(request.data);
		}
		// set heatmap opacity
		else if(request.msg == "persistentpopupvariables::setHeatmapOpacity")
		{
			setHeatmapOpacity(request.data);
		}
		//Handled in tabinfo.js
		//getScrollHeight
        else if(request.msg == "tabinfo::getScrollHeight") 
		{
			chrome.tabs.getSelected(null, function(i_tab) 
			{
				chrome.tabs.sendMessage(i_tab.id, {msg: "injectedtabinfo::getScrollHeight"}, function(response) 
				{
					manageMessage(13, response.data);
				});
			});
		}
		//getDocumentSize
	    else if(request.msg == "tabinfo::getDocumentSize") 
		{
			chrome.tabs.getSelected(null, function(i_tab) 
			{
				chrome.tabs.sendMessage(i_tab.id, {msg: "injectedtabinfo::getDocumentSize"}, function(response) 
				{
					manageMessage(25, response.data);
				});
			});
		}
	}
);