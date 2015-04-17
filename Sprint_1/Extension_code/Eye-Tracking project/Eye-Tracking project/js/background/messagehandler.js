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
	currentMessage = JSON.parse(i_message);
	
	//Handle message depending on MessageType
	switch(currentMessage['MessageType'])
	{
	//RecordedDataResponse
	case 6:
		chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Data received."});	
		setHeatmapData(currentMessage['MessageContent']);	
		break;
	//StartRecordingResponse
	case 7:
		if(currentMessage['MessageContent'] == "Succeeded")
		{
			chrome.runtime.sendMessage({ msg: "popup::startReceived" });
			startMouseRecording();
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
			chrome.runtime.sendMessage({ msg: "popup::pauseReceived" });
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
			chrome.runtime.sendMessage({ msg: "popup::resumeReceived" });
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
			chrome.runtime.sendMessage({ msg: "popup::stopReceived" });
			stopMouseRecording();
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
		chrome.runtime.sendMessage({msg: 'load::createLinkTable', data: currentMessage['MessageContent']});
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
			chrome.runtime.sendMessage({msg: 'load::loadSucceeded'});
			setHeatmapData(currentMessage['MessageContent']);	
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
	//Error message
	case 99:
		console.log("Error: " + currentMessage['MessageContent']);
		chrome.runtime.sendMessage({msg: 'popup::updateDebugText', text: "Error: " + currentMessage['MessageContent']});
		break;
	}
};