/////////////////////
//Daniel Lindgren////
//injecteddisplay.js//
/////////////////////
//
//Injects a script into the browser and tells it to display 
//a heatmap using heatmap.js 2.0.
//

/////////////
//Variables//
/////////////

var xEyeCoords = null; //Array of eye x coordinates.
var yEyeCoords = null; //Array of eye y coordinates.
var timeStampEYE = null; //Array of eye time stamps.

var xMouseCoords = null; //Array of mouse x coordinates.
var yMouseCoords = null; //Array of mouse y coordinates.
var timeStampMouse = null; //Array of mouse time stamps.

var xMouseClicks = null; //Array of mouse click x coordinates.
var yMouseClicks = null; //Array of mouse click y coordinates.
var timeMouseClicks = null; //Array of mouse click time stamps.
var currentMouseClick = 0;

var key = null;
var timeStampKey = null;
var keyEventTriggered = false;
var currentKey = 0;

var xFixationPointCoords = null;
var yFixationPointCoords = null;
var timeStampFixation = null;
var timesMerged = null;
var timePoints = null;
var fixationOrders = null;
var individualFixationTimePerOrder = null;

var animationEye = null; //Callback function for setInterval if animating.
var animationMouse = null; //Callback function for setInterval if animating.
var animating = false; //True if animating.
var indexEye = 0; //Integer representing the current animation frame, which
			   //is the index of the current position in the xCoords and yCoords array.
var sizeEye = 0; //Size of coordinate arrays.

var indexMouse = 0; //Integer representing the current animation frame, which
			   //is the index of the current position in the xCoords and yCoords array.
var sizeMouse = 0; //Size of coordinate arrays.

var mousePointer = null;
var mouseImage = null;

var fixationDivs = new Array();
var maxHeight = 9001;

var heatmapEyeInstance = null;
var heatmapMouseInstance = null;
var mostFixatedOrder = -1;
var mostFixatedIndex = -1;

var port = chrome.runtime.connect({name:"display"}); //Port to tabinfo.js

var isPaused = false;
var showingFixationPoints = false;
var isWindowStatic = false;

var canvasDiv = null;
var popoverDiv = null;

var width = 0;
var height = 0;
var cssLink;

///////////
//METHODS//
///////////

function initializeCanvas(mouse,eye)
{
	if(!canvasDiv)
	{
		canvasDiv = document.createElement("div");
		canvasDiv.style.position = "absolute";
		canvasDiv.style.top = "0px";
		canvasDiv.style.left = "0px";
		canvasDiv.height = Math.max($(document).height(), $(window).height()) + "px";
		canvasDiv.width = Math.max($(document).width(), $(window).width()) + "px";	
		canvasDiv.style.height = Math.max($(document).height(), $(window).height()) + "px";
		canvasDiv.style.width = Math.max($(document).width(), $(window).width()) + "px";	
		canvasDiv.style.zIndex = "9000";	
		canvasDiv.id = "canvas-div";
		canvasDiv.className = "canvas-class";
	        
		document.body.appendChild(canvasDiv);
	}
	
	if(eye)
	{
		heatmapEyeInstance = h337.create( //Heatmap instance.
		{
			container: document.querySelector(".canvas-class"),
			radius: 45,
			maxOpacity: 1,
		    minOpacity: .0,
		    blur: .75
		});
	}
	if(mouse)
	{
		heatmapMouseInstance = h337.create( //Heatmap instance.
		{
			container: document.querySelector(".canvas-class"),
			radius: 45,
		 	maxOpacity: 1,
		    minOpacity: .0,
		    blur: .75,
			gradient:
			{
				'.2': 'red',
				'.5': 'blue',
				'.85': 'white'
			}
		});
	}
}

function showFixationPoints()
{
	try
	{
		if(!showingFixationPoints)
		{			
			width = Math.max($(document).width(), $(window).width());
			height = Math.max($(document).height(), $(window).height());
			if(xFixationPointCoords)
			{
				showingFixationPoints = true;	
				popoverDiv = document.createElement('div');
				popoverDiv.style.zIndex = "9999";
				for(i = 0; i < xFixationPointCoords.length; i++)
				{
					var sizeDiameter;
					if(timesMerged[i] == 0)
					{
						sizeDiameter = 48;
					}
					else
					{
						sizeDiameter = 48 + (5*(timesMerged[i]+1));
					}
					fixationDivs[i] = document.createElement('div');
					fixationDivs[i].style.position = 'absolute';
					fixationDivs[i].style.width = sizeDiameter +"px";
					fixationDivs[i].style.height = sizeDiameter +"px";
					fixationDivs[i].style.left = (xFixationPointCoords[i]-(sizeDiameter/2)) +'px';
					fixationDivs[i].style.top = (yFixationPointCoords[i]-(sizeDiameter/2)) +'px';
					fixationDivs[i].style.zIndex = "9001";
					
					var id= "myID_" + i;
					
					var popoverPosition = "right";
					
					if(((width - (xFixationPointCoords[i]-24)) <= 300) && ((height - (yFixationPointCoords[i]-24)) >= 200))
					{
						popoverPosition = "bottom";
					}
					else if(((width - (xFixationPointCoords[i]-24)) <= 300) && ((height - (yFixationPointCoords[i]-24)) < 200))
					{
						popoverPosition = "top";
					}
					
		
					var time = timeStampFixation[i]/1000.0;				
					time *= 100;
					time = Math.round(time);
					
					var test;
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
						test = "<p>Area fixation time: "+(time/100.0)+" second(s)</p><p>Area fixated in times: "+(timesMerged[i]+1)+ "</p><p>Other info: This area was most fixated</p>" + content;
					}
					else if(i==0)
					{
						header = "Area Contains First Fixated Point";
						test = "<p>Area fixation time: "+(time/100.0)+" second(s)</p> <p>Area fixated in times: "+(timesMerged[i]+1)+ "</p><p>Other info: This area contains the first fixated point</p>" + content;
					}
					else
					{
						header = "Fixation Point";
						test = "<p>Area fixation time: "+(time/100.0)+" second(s)</p><p>Area fixated in times: "+(timesMerged[i]+1)+ "</p> <p>Other info: No other information</p>" + content;
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
					text.innerHTML = "<a href='#' title='"+header+"' data-toggle='"+ id +"' data-placement='"+popoverPosition+"' data-html='true' data-trigger='hover' data-content='"+test+"'>"+ fixationOrderText + "</a>";
					text.style.position = 'absolute';
					
					var img = document.createElement('img');
					img.src = chrome.runtime.getURL("../../img/circle.png");
					img.style.width = "100%";
					img.style.height = "100%";
					
					fixationDivs[i].appendChild(popoverDiv);			
					fixationDivs[i].appendChild(img);
					fixationDivs[i].appendChild(text);
					
					fixationDivs[i].childNodes[0].style.zIndex = 9999;
					document.body.appendChild(fixationDivs[i]);	
					$("[data-toggle='"+id+"']").popover({position: 'fixed',container: popoverDiv});		
				}	
				
			}
			//drawLines();
		}	
	}
	catch(err)
	{
		console.log(err.message);
	}
}

//Draw lines between fixation points
function drawLines()
{
	var height = Math.max($(document).height(), $(window).height());
	var width = Math.max($(document).width(), $(window).width());
	
	var c = document.createElement("canvas");
	c.height = height;
	c.width = width;
	c.style.position = "absolute";
	c.style.top = "0px";
	c.style.left = "0px";
	c.style.zIndex = 9000;
	c.id = "line-canvas";
	
	var ctx=c.getContext("2d");
	
	for(i = 0; i < xFixationPointCoords.length-1; i++)
	{
		//Remove 24px from start and end of line to make the lines start and end
		//at the beginning of the fixation point areas.
		var xAbs = Math.abs(xFixationPointCoords[i] - xFixationPointCoords[i+1]);
		var yAbs = Math.abs(yFixationPointCoords[i] - yFixationPointCoords[i+1]);
		var xDir = xFixationPointCoords[i] - xFixationPointCoords[i+1];
		var yDir = yFixationPointCoords[i] - yFixationPointCoords[i+1];
		var lineLength = Math.sqrt(Math.pow(xAbs, 2) + Math.pow(yAbs, 2));
		var xLen = (xDir / lineLength) * 24;
		var yLen = (yDir / lineLength) * 24;
		
		var xStartPoint = xFixationPointCoords[i] - xLen;
		var yStartPoint = yFixationPointCoords[i] - yLen;
		var xEndPoint = xFixationPointCoords[i+1] + xLen;
		var yEndPoint = yFixationPointCoords[i+1] + yLen;
		ctx.beginPath();
		ctx.moveTo(xStartPoint, yStartPoint);
		ctx.lineTo(xEndPoint, yEndPoint);
		ctx.lineWidth = 1;
		ctx.stroke();
		
		//Paint arrow lines.	
		xLen /= 2;
		yLen /= 2;
		
		var theta = 45 * (Math.PI/180);

		var cs = Math.cos(theta);
		var sn = Math.sin(theta);
		
		var xLine = xEndPoint - (xEndPoint + xLen);
		var yLine = yEndPoint - (yEndPoint + yLen);
		
		px = xLine * cs - yLine * sn;
		py = xLine * sn + yLine * cs;
		
		ctx.beginPath();
		ctx.moveTo(xEndPoint, yEndPoint);
		ctx.lineTo(xEndPoint + (xLen*2) + px, yEndPoint + (yLen*2) + py);
		ctx.lineWidth = 1;
		ctx.stroke();
		
		theta = -45 * (Math.PI/180);

		cs = Math.cos(theta);
		sn = Math.sin(theta);
		
		xLine = xEndPoint - (xEndPoint + xLen);
		yLine = yEndPoint - (yEndPoint + yLen);
		
		px = xLine * cs - yLine * sn;
		py = xLine * sn + yLine * cs;
		
		ctx.beginPath();
		ctx.moveTo(xEndPoint, yEndPoint);
		ctx.lineTo(xEndPoint + (xLen*2) + px, yEndPoint + (yLen*2) + py);
		ctx.lineWidth = 1;
		ctx.stroke();
	}

	document.body.appendChild(c);
}

function hideLines()
{
	try
	{
		var lineCanvas = document.getElementById("line-canvas");
		if(lineCanvas)
		{
			document.body.removeChild(lineCanvas);		
		}
	}
	catch(err)
	{
		console.log(err.message);
	}
}

function controlPreviousTests()
{
	if(showingFixationPoints)
	{
		hideFixationPoints();
		xFixationPointCoords = null;
		yFixationPointCoords = null;
		port.postMessage({message: "display::hideFixationPoints"});
	}
}

//Hide fixation points if they are shown
function hideFixationPoints()
{
	if(showingFixationPoints)
	{
		if(xFixationPointCoords)
		{
			showingFixationPoints = false;	
			var size = fixationDivs.length;
			for(i = 0; i < size; i++)
			{
				document.body.removeChild(fixationDivs[i]);
			}
			
			fixationDivs = [];	
		}
		
		var canvas = document.getElementById("line-canvas");
		if(canvas)
		{
			document.body.removeChild(canvas);
		}
	}
}

//Update the xCoords and yCoords with the latest collected data.
function setData(i_data)
{
	var t_data = JSON.parse(i_data);
	
	//If eye data exists
	if(t_data['timeStampEYE'])
	{		
		var t_xEyeCoords = new Array();
		var t_yEyeCoords = new Array();
		var t_timeStampEye = new Array();
		
		//Check so that there are an equal amount of x and y coordinates.
		if(t_data['eyeX'].length == t_data['eyeY'].length)
		{
			var t_size = t_data['timeStampEYE'].length;
			for(var i = 0; i < t_size; i++)
			{
				t_xEyeCoords[i] = t_data['eyeX'][i];
				t_yEyeCoords[i] = t_data['eyeY'][i];
				t_timeStampEye[i] = t_data['timeStampEYE'][i];
			}
			
			xEyeCoords = t_xEyeCoords;
			yEyeCoords = t_yEyeCoords;
			timeStampEYE = t_timeStampEye;
			
			console.log("Loaded " + t_size + " frames of eye data.");
		}
		else
		{
			console.log("X and Y eye coords do not match!");
		}
		
		port.postMessage({message: "display::hasEyeData", data: true});
	}
	else 
	{
		port.postMessage({message: "display::hasEyeData", data: false});
	}
	
	//If mouse data exists
	if(t_data['timeStampMouse'])
	{
		console.log("Update mouse data!");		
		var t_xMouseCoords = new Array();
		var t_yMouseCoords = new Array();
		var t_timeStampMouse = new Array();
		
		//Check so that there are an equal amount of x and y coordinates.
		if(t_data['mouseX'].length == t_data['mouseY'].length)
		{
			var t_size = t_data['timeStampMouse'].length;
			for(var i = 0; i < t_size; i++)
			{
				t_xMouseCoords[i] = t_data['mouseX'][i];
				t_yMouseCoords[i] = t_data['mouseY'][i];
				t_timeStampMouse[i] = t_data['timeStampMouse'][i];
			}
			
			xMouseCoords = t_xMouseCoords;
			yMouseCoords = t_yMouseCoords;
			timeStampMouse = t_timeStampMouse;
			
			console.log("Loaded " + t_size + " frames of mouse data.");
		}
		else
		{
			console.log("X and Y mouse coords do not match!");
		}
		
		port.postMessage({message: "display::hasMouseData", data: true});
	}
	else 
	{
		port.postMessage({message: "display::hasMouseData", data: false});
	}
	
	//If mouse clicks exist
	if(t_data['mouseClickTimeStamp'])
	{
		console.log("Update mouse click data!");		
		var t_xMouseClicks = new Array();
		var t_yMouseClicks = new Array();
		var t_timeMouseClicks = new Array();
		
		//Check so that there are an equal amount of x and y coordinates.
		if(t_data['mouseClickX'].length == t_data['mouseClickY'].length)
		{
			var t_size = t_data['mouseClickTimeStamp'].length;
			for(var i = 0; i < t_size; i++)
			{
				t_xMouseClicks[i] = t_data['mouseClickX'][i];
				t_yMouseClicks[i] = t_data['mouseClickY'][i];
				t_timeMouseClicks[i] = t_data['mouseClickTimeStamp'][i];
			}
			
			xMouseClicks = t_xMouseClicks;
			yMouseClicks = t_yMouseClicks;
			timeMouseClicks = t_timeMouseClicks;
			
			console.log("Loaded " + t_size + " mouse clicks.");
		}
		else
		{
			console.log("X and Y mouse coords do not match!");
		}
	}
	else
	{
		console.log("No mouse click data found!");
	}
	
	//If key events exist
	if(t_data['timeStampKey'])
	{
		console.log("Update key event data!");		
		var t_keys = new Array();
		var t_timeStampKey = new Array();
		
		//Check so that there are an equal amount of x and y coordinates.
		var t_size = t_data['timeStampKey'].length;
		for(var i = 0; i < t_size; i++)
		{
			t_keys[i] = t_data['keys'][i];
			t_timeStampKey[i] = t_data['timeStampKey'][i];
		}
		
		keys = t_keys;
		timeStampKey = t_timeStampKey;
		
		console.log("Loaded " + t_size + " key events.");
	}
	else
	{
		console.log("No key event data found!");
	}
	
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
		}
		console.log("Loaded " + t_size + " frames of fixation points!");
	}
	
	if(t_data['testStatistics']['mostFixated'])
	{
		mostFixatedOrder = t_data['testStatistics']['mostFixated']['fixationOrder'][0];
		
		var t_size = t_data['testStatistics']['allFixations'].length;
		var isFound = false;
		for(var i=0;i<t_size;i++)
		{
			if(isFound)
			{
				break;
			}
			var t_numberOfOrder = t_data['testStatistics']['allFixations'][i]['fixationOrder'].length;
			for(var j=0;j<t_numberOfOrder;j++)
			{
				if(t_data['testStatistics']['allFixations'][i]['fixationOrder'][j] == mostFixatedOrder)
				{
					mostFixatedOrder = j;
					mostFixatedIndex = i;
					isFound = true;
					break;
				}
			}
		}
	}
}

//Animate the result of the collected eye data. Recursive function that runs
//as long as index is less than the size of the timeStampEYE array.
function animateEye()
{
	document.getElementById('canvas-div').style.position = 'absolute';
	
	if(!isPaused)
	{
		var nextFrame = 0;
		if(indexEye > 0)
		{
			var nextFrame = timeStampEYE[indexEye] - timeStampEYE[indexEye-1];
		}
		
		if(heatmapEyeInstance)
		{
			animationEye = setTimeout(function()
			{	
				if(indexEye >= sizeEye)
				{
					stopAnimation();
					return false;
				}
				
				port.postMessage({message: "display::setLastFrameTime", data: timeStampEYE[indexMouse]});
				
				heatmapEyeInstance.addData(
				{
					x: xEyeCoords[indexEye],
					y: yEyeCoords[indexEye],
					value: 1
				});
				
				indexEye++;
				animateEye();
				
			}, nextFrame);	
		}
		else
		{
			return false;
		}
	}
}

//Animate the result of the collected mouse data. Recursive function that runs
//as long as index is less than the size of the timeStampMouse array.
function animateMouse()
{	
	document.getElementById('canvas-div').style.position = 'absolute';
	
	if(!isPaused)
	{
		var nextFrame = 0;
		if(indexMouse > 0)
		{
			var nextFrame = timeStampMouse[indexMouse] - timeStampMouse[indexMouse-1];
		}
		
		try
		{
			if(mousePointer)
			{
				animationMouse = setTimeout(function()
				{	
					if(indexMouse >= sizeMouse)
					{
						stopAnimation();
						return false;
					}
				
					mousePointer.style.left = xMouseCoords[indexMouse]+'px';
					mousePointer.style.top = yMouseCoords[indexMouse]+'px';
					port.postMessage({message: "display::setLastFrameTime", data: timeStampMouse[indexMouse]});
					
					//If there are mouseclicks left to handle
					if(timeMouseClicks[currentMouseClick])
					{
						if(timeMouseClicks[currentMouseClick] == timeStampMouse[indexMouse])
						{
							mousePointer.style.zIndex = "1";
							canvasDiv.style.zIndex = "1";
							
							var target = document.elementFromPoint(xMouseClicks[currentMouseClick], yMouseClicks[currentMouseClick]);
							
							var evt = document.createEvent("MouseEvents"); 
							evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null); 
							
							target.dispatchEvent(evt);
							target.focus();
							
							mousePointer.style.zIndex = "9001";
							canvasDiv.style.zIndex = "9000";
	
							currentMouseClick++;
						}
					}
					
					//If there are key events left to handle
					if(timeStampKey[currentKey])
					{
						if(timeStampKey[currentKey] <= timeStampMouse[indexMouse] && !keyEventTriggered)
						{
							console.log("Key " + currentKey + ": " + keys[currentKey]);
							
							keyEventTriggered = true;
							
							var active = document.activeElement;
							
							//If the keycode is 8, a backspace event should be dispathes.
							//Instead, this function gets the value of the current element,
							//and then removes the last element in that string.
							if(keys[currentKey] == 8)
							{
								var currentValue = active.value;
								var newValue = currentValue.substring(0, currentValue.length - 1);
								active.value = newValue;
							}
							
							//If keycode is 13, an enter event should be dispatched. 
							//The following code checks if the current element is
							//a input element, and if so, it tries to find its
							//parent form and submit it.
							else if(keys[currentKey] == 13)
							{				
								try
								{
									var current = document.activeElement;
									
									if(current.nodeName == "INPUT")
									{								
										console.log(current);
									
										while(current.nodeName != "FORM")
										{
											current = current.parentNode;
											console.log(current);
										}
										
										current.submit();
									}
								}
								catch(err)
								{
									console.log("Unable to generate ENTER event: " + err); 	
								}
							//In all other cases, add the char value of the key code to
							//the current element.
							}
							else
							{
								var currentChar = String.fromCharCode(keys[currentKey]);
								active.value += currentChar;
							}
						}
						else if(timeStampKey[currentKey] <= timeStampMouse[indexMouse] && keyEventTriggered)
						{
							keyEventTriggered = false;
							currentKey++;
						}
					}
					 	
					indexMouse++;
					animateMouse();
					
				}, nextFrame);	
			}
			else
			{
				return false;
			}
		 }
		 catch(err)
		 {
		 	
		 }
	}
}

//Animate the result of the collected eye and mouse data. Recursive function that runs
//as long as index is less than the size of the largest of the timeStampEYE and timeStampMouse array.
function animateBoth()
{	
	animateEye();
	animateMouse();
}

//Start the animate function. Gets the length of timeStampEye.
function startAnimation(animateEyeBool, animateMouseBool, startTime)
{
	console.log("Start animation");
	
	//Check which mouse click and key event index
	currentMouseClick = 0;
	currentKey = 0;
	keyEventTriggered = false;
	
	if(timeMouseClicks[currentMouseClick])
	{
		while(startTime > timeMouseClicks[currentMouseClick])
		{
			currentMouseClick++;
		}
	}

	if(timeStampKey[currentKey])
	{
		while(startTime > timeStampKey[currentKey])
		{
			currentKey++;
		}
	}
	
	if(!animating && animateEyeBool && !animateMouseBool)
	{
		if(timeStampEYE)
		{
			port.postMessage({message: "display::animationStarted"});
			console.log("Animating eye data");
			
			//Set eye related variables
			sizeEye = xEyeCoords.length;
			indexEye = 0;
			while(startTime > timeStampEYE[indexEye])
			{
				indexEye++;
			}
			
			initializeCanvas(false,true);
			animating = true;
			animateEye();
		}
		else
		{
			console.log("No eye data to animate!");
		}
	}
	else if(!animating && !animateEyeBool && animateMouseBool)
	{
		if(timeStampMouse)
		{
			port.postMessage({message: "display::animationStarted"});
			console.log("Animating mouse data");
			
			//Set mouse related variables
			sizeMouse = timeStampMouse.length;
			indexMouse = 0;
			while(startTime > timeStampMouse[indexMouse])
			{
				indexMouse++;
			}
			
			console.log("Animating from frame " + indexMouse);
			
			animating = true;
			manageMouseDiv(true);
			initializeCanvas(true,false);
			animateMouse();
		}
		else
		{
			console.log("No mouse data to animate!");
		}
	}
	else if(!animating && animateEyeBool && animateMouseBool)
	{
		if(timeStampEYE && timeStampMouse)
		{
			port.postMessage({message: "display::animationStarted"});
			console.log("Animating eye and mouse data");
			
			//Set eye related variables
			sizeEye = xEyeCoords.length;
			indexEye = 0;
			while(startTime > timeStampEYE[indexEye])
			{
				indexEye++;
			}
			
			//Set mouse related variables
			sizeMouse = timeStampMouse.length;
			indexMouse = 0;		
			while(startTime > timeStampMouse[indexMouse])
			{
				indexMouse++;
			}
			
			animating = true;
			manageMouseDiv(true);
			initializeCanvas(true,true);
			animateBoth();
		}
		else
		{
			console.log("No data to animate!");
		}
	}
}

//Stop the animate function
function stopAnimation()
{
	
	if(animationEye && indexEye >= sizeEye)
	{
		console.log("Stop eye animation!");
		indexEye = 0;
		
		clearTimeout(animationEye);
		animationEye = null;
	}
	
	if(animationMouse && indexMouse >= sizeMouse)
	{
		console.log("Stop mouse animation!");
		indexMouse = 0;
		
		clearTimeout(animationMouse);
		animationMouse = null;
		manageMouseDiv(false);
	}
	
	if(!animationEye && !animationMouse)
	{
		port.postMessage({message: "display::animationFinished"});
		animating = false;
	}
}

function show(eyeShow, mouseShow)
{
	if(eyeShow)
	{
		showEye();
	}
	if(mouseShow)
	{
		showMouse();
	}
}

//Show or hide mouse pointer
function manageMouseDiv(create)
{
	if(create)
	{
		mousePointer = document.createElement('div');
		mousePointer.id = "mouse";
		mousePointer.style.position = 'absolute';
		mousePointer.style.width = "24px";
		mousePointer.style.height = "24px";
		mousePointer.style.zIndex = "9001";
	    mouseImage = document.createElement('img');
		mouseImage.src = chrome.runtime.getURL("../../img/mouse-icon16.png");
		mousePointer.appendChild(mouseImage);
		document.body.appendChild(mousePointer);
	}
	else
	{
		if(mousePointer)
		{
			mousePointer.removeChild(mouseImage);
			document.body.removeChild(mousePointer);
			mousePointer = null;
			mouseImage = null;	
		}
	}
}
//Show the collected data as a heatmap in the tab
function showEye()
{	
	if(xEyeCoords && yEyeCoords)
	{
		initializeCanvas(false,true);
		console.log("Show eye heatmap!");
		
		var canvas = heatmapEyeInstance._renderer.canvas;
		canvas.style.zIndex = "9999";
		console.log("Setting z index");
		
		var t_size = xEyeCoords.length;
		for(var i = 0; i < t_size; i++)
		{
			heatmapEyeInstance.addData(
			{
				x: xEyeCoords[i],
				y: yEyeCoords[i],
				value: 1
			});
		}
		port.postMessage({message: "display::displayingData"});
	}
	else
	{
		console.log("No data!");
	}
	
	document.getElementById('canvas-div').style.position = 'absolute';
}

//Show the collected data as a heatmap in the tab
function showMouse()
{	
	if(xMouseCoords && yMouseCoords)
	{
		initializeCanvas(true,false);
		console.log("Show mouse heatmap!");
		
		var t_size = xMouseCoords.length;
		for(var i = 0; i < t_size; i++)
		{
			heatmapMouseInstance.addData(
			{
				x: xMouseCoords[i],
				y: yMouseCoords[i],
				value: 1
			});
		}
		port.postMessage({message: "display::displayingData"});
	}
	else
	{
		console.log("No data!");
	}
	
	document.getElementById('canvas-div').style.position = 'absolute';
}

//Hide the heatmap
function hide()
{
	console.log("Hide heatmap!");
	port.postMessage({message: "display::setHeaderToDefault"});
	if(heatmapEyeInstance != null)
	{
		//find corresponding canvas element
		var canvas = heatmapEyeInstance._renderer.canvas;
		//remove the canvas from DOM
		$(canvas).remove();
		heatmapEyeInstance = null;
	}
	if(heatmapMouseInstance != null)
	{
		var canvas = heatmapMouseInstance._renderer.canvas;
		//remove the canvas from DOM
		$(canvas).remove();	
		heatmapMouseInstance = null;
	}
	
	if(canvasDiv)
	{
		document.body.removeChild(document.getElementById("canvas-div"));
		canvasDiv = null;
	}
}

//Listen for messages from displayheatmap.js in extension
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) 
{
	if (request.msg == "injecteddisplay::alive")
	{
		sendResponse({message: true});	
	}
	else if (request.msg == "injecteddisplay::animate")
	{
		if(!animating)
		{
			if(timeStampEYE || timeStampMouse)
			{
				hide(); //Hide before starting animation
				console.log(request.eye + " - " + request.mouse);
				startAnimation(request.eye, request.mouse, 0);
				sendResponse({message: "Animating heatmap!"});	
			}		
			else
			{
				sendResponse({message: "Failedstart"});	
			}
		}
		else if(animating && !isPaused)
		{
			if(timeStampEYE)
			{
				animateEye();	
			}
			if(timeStampMouse)
			{
				animateMouse();
			}
		}
	}
	else if(request.msg == "injecteddisplay::pauseRendering")
	{
		isPaused = true;
		sendResponse({message: "Paused!"});	
	}
	else if(request.msg == "injecteddisplay::clearPrevious")
	{
		clearInterval(animationEye);
		clearInterval(animationMouse);
		animationEye = null;
		animationMouse = null;
		manageMouseDiv(false);
		hide();
		animating = false;
		isPaused = false;
		isShowing = false;
		
		sendResponse({message: "Cleared!"});	
	}
	else if(request.msg == "injecteddisplay::resumeRendering")
	{
		isPaused = false;
		sendResponse({message: "Resumed!"});	
	}
	//If script is leloaded and we were animating, continue animating from the last frame.
	else if(request.msg == "injecteddisplay::resumeRenderingAfterLoad")
	{
		startAnimation(request.data.lastAnimateEye, request.data.lastAnimateMouse, request.data.lastFrameTime);
		sendResponse({message: "Resumed!"});	
	}
	else if (request.msg == "injecteddisplay::show")
	{
		hide(); //Hide before showing, so that we don't get duplicated heatmaps.
		show(request.eye, request.mouse);
		isShowing = true;
		sendResponse({message: "Showing heatmap!"});
	}
	else if (request.msg == "injecteddisplay::hide")
	{
		stopAnimation();
		hide();
		isShowing = false;
		sendResponse({message: "Hiding heatmap!"});
	}
	else if (request.msg == "injecteddisplay::setData")
	{
		setData(request.data);
		if(request.resume)
		{
			sendResponse({message: "resume"});
		}
		else
		{
			sendResponse({message: "Updating data!"});
			controlPreviousTests();
		}
	}
	else if(request.msg == "injecteddisplay::showFixationPoints")
	{
		sendResponse({message: "Displaying fixation points!"});
		showFixationPoints();
	}
	else if(request.msg == "injecteddisplay::hideFixationPoints")
	{
		sendResponse({message: "Hiding fixation points!"});
		hideFixationPoints();
	}
	else if(request.msg == "injecteddisplay::showGrid")
	{
		sendResponse({message: "Showing navigation!"});
		drawLines();
	}
	else if(request.msg == "injecteddisplay::hideGrid")
	{
		sendResponse({message: "hiding navigation!"});
		hideLines();
	}
	else if(request.msg == "injecteddisplay::jqueryversion")
	{
		if(window.jquery)
		{
			sendResponse({message: $().jquery });	
		}
		else
		{
			sendResponse({message: ""});	
		}
	}
	else if(request.msg == "injecteddisplay::jquery")
	{
		if(window.jQuery)
		{
			console.log("jQuery is initialized!");
			sendResponse({message: "ready"});
			
			var cssSource = chrome.runtime.getURL("../../css/injected.css");
			cssLink = document.createElement('link');
			cssLink.setAttribute('rel', 'stylesheet');
			cssLink.setAttribute('type', 'text/css');
			cssLink.setAttribute('href', cssSource);
			document.getElementsByTagName('head')[0].appendChild(cssLink);
		
			$(window).on("beforeunload",function()
			{
				if(animationEye)
				{
					clearTimeout(animationEye);
				}
				if(animationMouse)
				{
					clearTimeout(animationMouse);
				}
			});
		}
		else
		{
			console.log("jQuery not initialized!");
			sendResponse({message: "not ready"});
		}	
	}
});

/*function makeSendKeys()
{
	(function($)
	{

		$.fn.sendkeys = function (x)
		{
			x = x.replace(/([^{])\n/g, '$1{enter}'); // turn line feeds into explicit break insertions, but not if escaped
			return this.each( function()
			{
				bililiteRange(this).bounds('selection').sendkeys(x).select();
				this.focus();
			});
		}; // sendkeys
		
		// add a default handler for keydowns so that we can send keystrokes, even though code-generated events 
		// are untrusted (http://www.w3.org/TR/DOM-Level-3-Events/#trusted-events)
		// documentation of special event handlers is at http://learn.jquery.com/events/event-extensions/
		$.event.special.keydown = $.event.special.keydown || {};
		$.event.special.keydown._default = function (evt)
		{
			if (evt.isTrusted) return false;
			if (evt.ctrlKey || evt.altKey || evt.metaKey) return false; // only deal with printable characters. This may be a false assumption
			if (evt.key == null) return false; // nothing to print. Use the keymap plugin to set this 
			var target = evt.target;
			if (target.isContentEditable || target.nodeName == 'INPUT' || target.nodeName == 'TEXTAREA') 
			{
				// only insert into editable elements
				var key = evt.key;
				if (key.length > 1 && key.charAt(0) != '{') key = '{'+key+'}'; // sendkeys notation
				$(target).sendkeys(key);
				return true;
			}
			return false;
		};
	})(window.jQuery);
}*/

//Send when finished setup
console.log("Script ready!");
port.postMessage({message: "display::injectedDisplayReady"});
