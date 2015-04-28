/////////////////////
//Daniel Lindgren////
//command.js//
/////////////////////
//
//Handles keybaord commands
//

/////////////
//Variables//
/////////////

///////////
//METHODS//
///////////

//Add command listener
chrome.commands.onCommand.addListener(function(command) 
{
	//ToggleRendering
   	if(command === "togglerendering") 
	{
		if(isRendering)
		{
			hideHeatmap();
		}
		else
		{
			if(currentData)
			{
				animateHeatmap(playerEyeBox, playerMouseBox);
				chrome.browserAction.setIcon({path: "../../img/pause-icon16.png"});
			}
		}
    } 
    
    //ToggleRecording
    if(command === "togglerecording") 
	{
		if(isRecording)
		{
			handleStopRecording();
		}
		else
		{
			handleStartRecording();
		}
    }
    
    //TogglePauseRecording
    if(command === "togglepauserecording") 
	{
		if(isRecording)
		{
			if(!isRecordingPaused)
			{
				console.log("Pause?");
				handlePauseRecording();
			}
			else
			{
				console.log("Resume?");
				handleResumeRecording();
			}
		}
    } 
});
