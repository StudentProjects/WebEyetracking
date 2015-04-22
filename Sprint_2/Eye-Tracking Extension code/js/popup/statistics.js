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
	addStatisticsMessageListener();
	
	console.log("statistics.js initialized!");
}

function setStatistics(data)
{
	console.log("Data: " + data);
	var statistics = data;
	
	//Time on page
	var time = statistics['timeOnPage'].split(",");
	document.getElementById("statistics_timeonpage").innerHTML = "Time on page: " + time[0];
	
	//percentageOfPageSeen
	document.getElementById("statistics_percentageofpageseen").innerHTML = "Percentage of page seen: " + statistics['percentageOfPageSeen'];

	//firstFixated
	if(statistics['firstFixated'])
	{
		var x = statistics['firstFixated']['X'];
		var y = statistics['firstFixated']['Y'];
		var time = statistics['firstFixated']['fixationTime'];
		document.getElementById("statistics_firstfixated").innerHTML = "First fixated: |X - " + x + "| Y - " + y + "|Time - " + time + "|";
	}	
	
	//mostFixated
	if(statistics['mostFixated'])
	{
		x = statistics['mostFixated']['X'];
		y = statistics['mostFixated']['Y'];
		time = statistics['mostFixated']['fixationTime'];
		document.getElementById("statistics_mostfixated").innerHTML = "Most fixated: |X - " + x + "| Y - " + y + "|Time - " + time + "|";
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

	});
}