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
var isDisplayingFPConnectors = false;
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
			popoverDiv.style.zIndex = "999999";
			popoverDiv.style.position = "absolute";
			popoverDiv.style.width = "200px";
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
					fixationDivsArray[i].style.zIndex = "999998";
					
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
				
					/*var text = document.createElement('a');
					text.className += "fixationDivClass";
					text.innerHTML = "<a href='#' title='"+header+"' data-toggle='"+ id +"' data-placement='"+popoverPosition+"' data-html='true' data-trigger='hover' data-content='"+textContentInPopover+"'>"+ fixationOrderText + "</a>";
					text.style.position = 'absolute';*/
					
					/*var popoverIcon = document.createElement('img');
					popoverIcon.src = chrome.runtime.getURL("../../img/circle.png");
					popoverIcon.style.width = "100%";
					popoverIcon.style.height = "100%";*/

					
					
					var popoverText = document.createElement('a');
					popoverText.className += "fixationDivClass";
					popoverText.innerHTML = "<a href='#' title='"+header+"' style='color: white' data-toggle='"+ id +"' data-placement='"+popoverPosition+"' data-html='true' data-trigger='hover' data-content='"+textContentInPopover+"'>"+ fixationOrderText + "</a>";
					popoverText.style.position = 'absolute';
					popoverText.style.color = "white";
					popoverText.style.fontSize = "14pt";
					popoverText.style.fontWeight = "bold";

					var popoverIcon = document.createElement('div');
					popoverIcon.style.backgroundColor = "rgba(0,0,0,.55)";
					popoverIcon.style.borderRadius = "50%";
					popoverIcon.style.width = "100%";
					popoverIcon.style.height = "100%";
					popoverIcon.style.border = "1px solid #333";

					fixationDivsArray[i].appendChild(popoverDiv);			
					fixationDivsArray[i].appendChild(popoverIcon);
					fixationDivsArray[i].appendChild(popoverText);
					
					//fixationDivsArray[i].childNodes[0].style.zIndex = 999997;
					document.body.appendChild(fixationDivsArray[i]);	
					$("[data-toggle='"+id+"']").popover({container: popoverDiv});	
				}
			}	
		}
		catch(err)
		{
			console.log(err.message);
		}
	}
}




//Get the absolute position of a DOM object on a page
//Help-function for func: drawFPConnectors() 
function findPos(obj) {
    var rect = obj.getBoundingClientRect();
    return {x:rect.left, y:rect.top,centerX:(rect.right-rect.left)/2,centerY:(rect.bottom-rect.top)/2};
}

//Help-function for func: drawFPConnectors()
//Used to draw a line between two points form parameters
function drawLine(o1, o2){
	//if lines was already calculated
	if(document.getElementsByClassName('line').length == xFixationPointCoords.length-1){
		var line = document.getElementsByClassName('line');
		for (var i = 0; i < xFixationPointCoords.length-1; i++) {
			line[i].style.visibility = "visible";
		}
	}
	else{
		var length = Math.sqrt((o1.x-o2.x)*(o1.x-o2.x) + (o1.y-o2.y)*(o1.y-o2.y));
		var angle  = Math.atan2(o2.y - o1.y, o2.x - o1.x) * 180 / Math.PI;
		var transform = 'rotate('+angle+'deg)';
		var line = document.createElement('div');
		line.style.transformOrigin = "0 100%";
		line.style.height = "1px";
		line.style.width = length+"px";
		line.style.top = o1.y+o1.centerY+"px";
		line.style.left = o1.x+o1.centerX+"px";
		line.style.background = "#666";
		line.style.zIndex = "999997";
		line.style.position = "absolute";
		line.style.transform = transform;
		line.className = line.className+"line";
		document.body.appendChild(line);
	}
}


//Draw lines between all fixation-points
function drawFPConnectors() {
    if (xFixationPointCoords != null) {
        for (i = 0; i < xFixationPointCoords.length - 1; i++) {
            var p1 = findPos(fixationDivsArray[i]);
            var p2 = findPos(fixationDivsArray[i + 1]);
            drawLine(p1, p2);
        }
        port.postMessage({ message: "display::showFPConnectors" });
    } else {
        //posting back error message
        port.postMessage({ message: "display::alertMessage", info: "No Fixation points available", type: "Error" });
    }
}

//undraw the lines
function hideFPConnectors() {
    if (xFixationPointCoords != null) {
        var line = document.getElementsByClassName('line');
        for (var i = 0; i < xFixationPointCoords.length - 1; i++) {
            line[i].style.visibility = "hidden";
        }
        port.postMessage({ message: "display::hideFPConnectors" });
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
	
	port.postMessage({message: "display::hideFPConnectors"});
	isDisplayingFPConnectors = false;

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
			hideFixationPoints();
			isDisplayingFixationPoints = false;
			chrome.runtime.sendMessage({msg: "statistics::hidingFixationPoints"});
			if(isDisplayingFPConnectors){
				isDisplayingFPConnectors = false;
				hideFPConnectors();
			}
		}
		sendResponse({message: "Hiding fixation points!"});
	}
	else if(request.msg == "injectedfixationdisplay::showFPConnectors")
	{	
		sendResponse({message: "Displaying FP-connectors"});
		
		if(!isDisplayingFPConnectors){
			isDisplayingFPConnectors = true;
			drawFPConnectors();	
		}
	}
	else if(request.msg == "injectedfixationdisplay::hideFPConnectors")
	{
		if(isDisplayingFPConnectors)
		{
			isDisplayingFPConnectors = false;
			hideFPConnectors();
			sendResponse({message: "Hiding FP-connectors!"});
		}

	}
	else if(request.msg == "injectedfixationdisplay::resumeRenderingAfterLoad")
	{
		currentPageOnPlayback = request.data;
		sendResponse({message: "Updating page number!"});
	}
	else if(request.msg == "injectedfixationdisplay::resetPage")
	{
		sendResponse({message: "Resetting page number!"});
		currentPageOnPlayback = 0;
	}
});
