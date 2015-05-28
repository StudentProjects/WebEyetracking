//////////////////////
//Daniel Johansson////
//injectedeyedisplay.js//////////
//////////////////////
//
//Responsible for displaying fixation points
//

/////////////
//Variables//
/////////////

// Array variables
// Will contains necessary data
var xFixationPointCoords = null;
var yFixationPointCoords = null;
var timeStampFixation = null;
var timesMerged = null;
var timePoints = null;
var fixationOrders = null;
var individualFixationPage = null;
var individualFixationTimePerOrder = null;
var fixationDivsArray = null; //array of fixation point divs

var port = chrome.runtime.connect({name:"display"}); //Port to background script 'display.js'

var isDisplayingFixationPoints = false;
var currentPageOnPlayback = 0;
var mostFixatedIndex = 0;

var isTestCleared = true;

///////////
//METHODS//
///////////

//Update the xCoords and yCoords with the latest collected data.
function setFixationData(i_data)
{	
	var t_data = JSON.parse(i_data);
	
	if(t_data['testStatistics']['allFixations'])
	{
		console.log("Update statistics data");
		xFixationPointCoords = new Array();
		yFixationPointCoords = new Array();
		timeStampFixation = new Array();
		timesMerged = new Array();
		timePoints = new Array();
		fixationOrders = new Array();
		individualFixationTimePerOrder = new Array();
		individualFixationPage = new Array();
		
		var t_size = t_data['testStatistics']['allFixations'].length;
		for(var i=0;i<t_size;i++)
		{
			xFixationPointCoords[i] = t_data['testStatistics']['allFixations'][i]['X'];
			yFixationPointCoords[i] = t_data['testStatistics']['allFixations'][i]['Y'];
			timeStampFixation[i] = t_data['testStatistics']['allFixations'][i]['timeStampFixation'];
			timesMerged[i] = t_data['testStatistics']['allFixations'][i]['timesMerged'];
			timePoints[i] = t_data['testStatistics']['allFixations'][i]['fixationTimePoints'];
			fixationOrders[i] = t_data['testStatistics']['allFixations'][i]['fixationOrder'];
			individualFixationTimePerOrder[i] = t_data['testStatistics']['allFixations'][i]['fixationTime'];
			individualFixationPage[i] = t_data['testStatistics']['allFixations'][i]['page'];
		}
		console.log("Loaded " + t_size + " fixation points!");
	}
	
	// Find most fixated points index in the array
	if(t_data['testStatistics']['mostFixated'])
	{
		mostFixatedOrder = t_data['testStatistics']['mostFixated']['fixationOrder'][0];	
		var t_size = t_data['testStatistics']['allFixations'].length;
		var isMostFixatedFound = false;
		for(var i=0;i<t_size;i++)
		{
			if(isMostFixatedFound)
			{
				break;
			}
			var t_numberOfOrder = t_data['testStatistics']['allFixations'][i]['fixationOrder'].length;
			for(var j=0;j<t_numberOfOrder;j++)
			{
				if(t_data['testStatistics']['allFixations'][i]['fixationOrder'][j] == mostFixatedOrder)
				{
					mostFixatedIndex = i;
					isMostFixatedFound = true;
					break;
				}
			}
		}
	}
}

//Removing fixation points if they are drawn on the screen
function hideFixationPoints()
{
	var size = fixationDivsArray.length;
	
	for(i = 0; i < size; i++)
	{
		try
		{			
			document.body.removeChild(fixationDivsArray[i]);
		}
		catch(err)
		{
			//Not defined error. Prevents it from crashing.
		}
		
	}
	fixationDivsArray = null;
	port.postMessage({message: "display::hideFixationPoints"});	
}

function drawFixationPoints()
{
	if(xFixationPointCoords != null)
	{
		try
		{
			port.postMessage({message: "display::showFixationPoints"});
			isTestCleared = false;
			if(fixationDivsArray == null)
			{
				fixationDivsArray = new Array();	
			}
			
			maxWidthDrawingRestriction = Math.max($(document).width(), $(window).width());
			maxHeightDrawingRestriction = Math.max($(document).height(), $(window).height());
			
			popoverDiv = document.createElement('div');
			popoverDiv.style.zIndex = "999998";
			for(i = 0; i < xFixationPointCoords.length; i++)
			{
				if(currentPageOnPlayback == individualFixationPage[i])
				{
					console.log("Page: " + currentPageOnPlayback);
					var sizeDiameter;
					if(timesMerged[i] == 0)
					{
						sizeDiameter = 48;
					}
					else
					{
						sizeDiameter = 48 + (5*(timesMerged[i]+1));
					}
					fixationDivsArray[i] = document.createElement('div');
					fixationDivsArray[i].style.position = 'absolute';
					fixationDivsArray[i].style.width = sizeDiameter +"px";
					fixationDivsArray[i].style.height = sizeDiameter +"px";
					fixationDivsArray[i].style.left = (xFixationPointCoords[i]-(sizeDiameter/2)) +'px';
					fixationDivsArray[i].style.top = (yFixationPointCoords[i]-(sizeDiameter/2)) +'px';
					fixationDivsArray[i].style.zIndex = "999997";
					
					var id= "myID_" + i;
					
					var popoverPosition = "right";
					
					if(((maxWidthDrawingRestriction - (xFixationPointCoords[i]-24)) <= 300) && ((maxHeightDrawingRestriction - (yFixationPointCoords[i]-24)) >= 200))
					{
						popoverPosition = "bottom";
					}
					else if(((maxWidthDrawingRestriction - (xFixationPointCoords[i]-24)) <= 300) && ((maxHeightDrawingRestriction - (yFixationPointCoords[i]-24)) < 200))
					{
						popoverPosition = "top";
					}
					
					var timeInHundredDecimal = timeStampFixation[i]/1000.0;				
					timeInHundredDecimal *= 100;
					timeInHundredDecimal = Math.round(timeInHundredDecimal);
					
					var textContentInPopover;
					var header = '';		
					var numberOfTimepoints = timePoints[i].length;				
					var content = "";
					
					for(var j=0;j<numberOfTimepoints;j++)
					{
						var tempContent = "<br/><p>Fixation order: " + (fixationOrders[i][j]+1) + "</p> <p> Fixated at: " + timePoints[i][j] + "</p> <p>Duration: " + individualFixationTimePerOrder[i][j] + "ms </p>";
						content += tempContent;
					}
					
					if(mostFixatedIndex == i)
					{
						header = "Most Fixated Area";
						textContentInPopover = "<p>Area fixation time: "+(timeInHundredDecimal/100.0)+" second(s)</p><p>Area fixated in times: "+(timesMerged[i]+1)+ "</p> <p>Page: " + (individualFixationPage[i]+1) + "</p> <p>Other info: This area was most fixated</p>" + content;
					}
					else if(i==0)
					{
						header = "Area Contains First Fixated Point";
						textContentInPopover = "<p>Area fixation time: "+(timeInHundredDecimal/100.0)+" second(s)</p> <p>Area fixated in times: "+(timesMerged[i]+1)+ "</p><p>Page: " + (individualFixationPage[i]+1) + "</p><p>Other info: This area contains the first fixated point</p>" + content;
					}
					else
					{
						header = "Fixation Point";
						textContentInPopover = "<p>Area fixation time: "+(timeInHundredDecimal/100.0)+" second(s)</p><p>Area fixated in times: "+(timesMerged[i]+1)+ "</p> <p>Page: " + (individualFixationPage[i]+1) + "</p> <p>Other info: No other information</p>" + content;
					}
					
					var fixationOrderText = "";
					var numberOfFixations = fixationOrders[i].length;
					
					if(numberOfFixations > 1)
					{
						fixationOrderText = (fixationOrders[i][0]+1) + "(!)";
					}		
					else
					{
						fixationOrderText = (fixationOrders[i][0]+1);
					}
				
					var text = document.createElement('a');
					text.className += "fixationDivClass";
					text.innerHTML = "<a href='#' title='"+header+"' data-toggle='"+ id +"' data-placement='"+popoverPosition+"' data-html='true' data-trigger='hover' data-content='"+textContentInPopover+"'>"+ fixationOrderText + "</a>";
					text.style.position = 'absolute';
					
					var popoverIcon = document.createElement('img');
					popoverIcon.src = chrome.runtime.getURL("../../img/circle.png");
					popoverIcon.style.width = "100%";
					popoverIcon.style.height = "100%";
					
					fixationDivsArray[i].appendChild(popoverDiv);			
					fixationDivsArray[i].appendChild(popoverIcon);
					fixationDivsArray[i].appendChild(text);
					
					fixationDivsArray[i].childNodes[0].style.zIndex = 999997;
					document.body.appendChild(fixationDivsArray[i]);	
					$("[data-toggle='"+id+"']").popover({position: 'fixed',container: popoverDiv});	
				}
			}	
		}
		catch(err)
		{
			console.log(err.message);
		}
	}
}

function clearPrevious()
{
	if(fixationDivsArray != null)
	{
		var size = fixationDivsArray.length;	
		for(i = 0; i < size; i++)
		{
			document.body.removeChild(fixationDivsArray[i]);
		}
		fixationDivsArray = null;
	}
	xFixationPointCoords = null;
	yFixationPointCoords = null;
	timeStampFixation = null;
	timesMerged = null;
	timePoints = null;
	fixationOrders = null;
	individualFixationPage = null;
	individualFixationTimePerOrder = null;
	
	port.postMessage({message: "display::hideFixationPoints"});	
	isDisplayingFixationPoints = false;
	
	currentPageOnPlayback = 0;
}

//Listen for messages from background script 'display.js'
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) 
{
	if(request.msg == "injectedfixationdisplay::clearPrevious")
	{
		if(!isTestCleared)
		{
			isTestCleared = true;
			clearPrevious();	
		}	
		sendResponse({message: "Cleared fixation data!"});	
	}
	else if (request.msg == "injectedfixationdisplay::setFixationData")
	{
		clearPrevious();
		setFixationData(request.data);
		sendResponse({message: "Updating fixation data!"});
	}
	else if(request.msg == "injectedfixationdisplay::showFixationPoints")
	{
		sendResponse({message: "Displaying fixation points!"});
		if(!isDisplayingFixationPoints)
		{
			isDisplayingFixationPoints = true;
			drawFixationPoints();	
		}
	}
	else if(request.msg == "injectedfixationdisplay::hideFixationPoints")
	{
		if(isDisplayingFixationPoints)
		{
			isDisplayingFixationPoints = false;
			hideFixationPoints();		
		}
		sendResponse({message: "Hiding fixation points!"});
	}
	else if(request.msg == "injectedfixationdisplay::resumeRenderingAfterLoad")
	{
		currentPageOnPlayback++;
		console.log("Updating page to: " + currentPageOnPlayback);
	}
});
