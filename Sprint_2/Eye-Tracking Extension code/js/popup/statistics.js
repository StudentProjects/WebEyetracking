/////////////////////
//Daniel Lindgren////
//statistics.js///////////
/////////////////////
//
//Handles the functionality of the statistics tab in the extension popup.
//

/////////////
//Variables//
/////////////

//None

///////////
//METHODS//
///////////

initStatistics();

//Initialize player.js
function initStatistics()
{
	//Send animate request to display.js
	document.getElementById('fixation_button').addEventListener("click", function()
	{	
		console.log("Anax");
		chrome.extension.sendRequest({ msg:"display::handleFixationPoints"});	
	});
	
	addStatisticsMessageListener();
	
	console.log("statistics.js initialized!");
}

function setStatistics(data)
{
	var statistics = data;
	chrome.extension.sendRequest({ msg: "persistentpopupvariables::setStatistics", data: statistics });
	
	//Time on page
	if(statistics['timeOnPage'])
	{
		var time = statistics['timeOnPage'].split(",");
		document.getElementById("statistics_timeonpage").innerHTML = "Time on page: " + time[0];	
	}
	
	//percentageOfPageSeen
	document.getElementById("statistics_percentageofpageseen").innerHTML = "Percentage of page seen: " + statistics['percentageOfPageSeen'] + "%";

	//firstFixated
	if(statistics['firstFixation'])
	{
		var x = statistics['firstFixation']['X'];
		var y = statistics['firstFixation']['Y'];
		var time = statistics['firstFixation']['fixationTime'];
		document.getElementById("statistics_firstfixation").innerHTML = "First fixation: | X - " + x + " | Y - " + y + " | Time - " + time + " ms |";
	}	
	
	//mostFixated
	if(statistics['mostFixated'])
	{
		x = statistics['mostFixated']['X'];
		y = statistics['mostFixated']['Y'];
		time = statistics['mostFixated']['fixationTime'];
		document.getElementById("statistics_mostfixated").innerHTML = "Most fixated: | X - " + x + " | Y - " + y + " | Time - " + time + " ms |";
	}
	
	//nrOfFixations
	if(statistics['allFixations'])
	{
		var nr = statistics['allFixations'];
		document.getElementById("statistics_nroffixations").innerHTML = "Number of fixations: " + nr.length;		
	}
}

//Add a listener that listens for messages.
function addStatisticsMessageListener()
{
	//This tells the script to listen
	//for messages from our extension.
	chrome.extension.onMessage.addListener(function(i_message, i_messageSender, i_sendResponse)
	{
		if(i_message.msg == "statistics::showingFixationPoints")
		{
			document.getElementById("fixation_button").innerHTML = "Hide fixation points";
		}
		else if(i_message.msg == "statistics::hidingFixationPoints")
		{
			document.getElementById("fixation_button").innerHTML = "Show fixation points";
		}
	});
}