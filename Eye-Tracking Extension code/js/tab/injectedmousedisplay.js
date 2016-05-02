//////////////////////
//Daniel Lindgren////
//injectedmousedisplay.js//////////
//////////////////////
//
//Responsible for displaying mouse data
//

/////////////
//Variables//
/////////////

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

var animationMouse = null; //Callback function for setInterval if animating.
var indexMouse = 0;
var sizeMouse = 0; //Size of coordinate arrays.

var previousMouseFrameTime = 0;
var currentMouseFrameTime = 0;

var mousePointer = null; //Div for mouse pointer
var mouseImage = null; //Mouse pointer image

var heatmapMouseInstance = null; //Heatmap instance for mouse heatmap

var isMouseAnimationPaused = false;

var port = chrome.runtime.connect({name:"display"}); //Port to display.js

var lastTarget = null;

var mouseCanvasDiv = null; //Canvas for rendering heatmap

var isDisplayingMouseHeatmap = false;

var animateBothMouseAndKeys = false;

///////////
//METHODS//
///////////

function initializeMouseCanvas()
{
	if(mouseCanvasDiv == null) {
	    if (animateBothMouseAndKeys) {
		    mouseCanvasDiv = document.createElement("div");
		    mouseCanvasDiv.style.position = "absolute";
		    mouseCanvasDiv.style.top = "0px";
		    mouseCanvasDiv.style.left = "0px";
		    mouseCanvasDiv.height = Math.max($(document).height(), $(window).height()) + "px";
		    mouseCanvasDiv.width = Math.max($(document).width(), $(window).width()) + "px";
		    mouseCanvasDiv.style.height = Math.max($(document).height(), $(window).height()) + "px";
		    mouseCanvasDiv.style.width = Math.max($(document).width(), $(window).width()) + "px";
		    mouseCanvasDiv.style.zIndex = "999996";
		    mouseCanvasDiv.id = "mouse-canvas-div";
		    mouseCanvasDiv.className = "canvas-class";

		    document.body.appendChild(mouseCanvasDiv);
		}
	}
    try {
        heatmapMouseInstance = h337.create( //Heatmap instance.
	    {
	        container: document.querySelector(".canvas-class"),
	        radius: 45,
	        maxOpacity: 1,
	        minOpacity: 0.0,
	        blur: 0.75,
	        gradient:
		    {
		        '.2': 'red',
		        '.5': 'blue',
		        '.85': 'white'
		    }
	    });
    } catch (e) {
        console.log(e);
    } 
}

//Update the xCoords and yCoords with the latest collected data.
function setMouseData(i_data)
{
	
	var t_data = JSON.parse(i_data);

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
}

//Animates mouse pointer for current frame, and calculates when to draw the next frame.
function animateMouse()
{	
	if(animateBothMouseAndKeys)
	{
		try
		{
			document.getElementById('mouse-canvas-div').style.position = 'absolute';	
		}
		catch(err)
		{
		    console.log("Mouse canvas is null!!");
		}	
	}
	
	try
	{
		document.getElementById('test-canvas-div').style.position = 'absolute';
	}
	catch(err)
	{
		
	}
	
	if(!isMouseAnimationPaused)
	{
		//Check so that the current frame is the one closest to 
		//the actual timestep. If not, skip to next frame and check
		//that one instead. This is made to keep the animation in
		//real time.
		var time = new Date();
		currentMouseFrameTime += time.getTime() - previousMouseFrameTime;
		previousMouseFrameTime = time.getTime();
		
		while(timeStampMouse[indexMouse+1] < currentMouseFrameTime)
		{
			indexMouse++;
		}
		
		var nextFrame = 0;		
		
		if(indexMouse > 0)
		{
			
			var nextFrame = timeStampMouse[indexMouse] - timeStampMouse[indexMouse-1];
		}
		
		try
		{
			animationMouse = setTimeout(function()
			{	
				if(indexMouse >= sizeMouse)
				{
					stopMouseAnimation();
					return false;
				}
				
				//If both the mouse movement and all click events should be simulated
				if(animateBothMouseAndKeys)
				{
					if(mousePointer == null)
					{
						return false;
					}	
					
					mousePointer.style.left = (xMouseCoords[indexMouse]-8)+'px';
					mousePointer.style.top = (yMouseCoords[indexMouse]-5)+'px';
					
					//Move canvases backward
					mousePointer.style.zIndex = "-1";
					mouseCanvasDiv.style.zIndex = "-1";
				}
				port.postMessage({message: "display::setLastFrameTime", data: timeStampMouse[indexMouse]});
			
				if(eyeCanvasDiv)
				{
					eyeCanvasDiv.style.zIndex = "-1";
				}
				
				//Simulate hover event
				var target = document.elementFromPoint(xMouseCoords[indexMouse], yMouseCoords[indexMouse]);
				
				if(target)
				{					
					if(lastTarget)
					{
						if(lastTarget != target)
						{
							var evt1 = document.createEvent("MouseEvents"); 
							evt1.initMouseEvent("mouseout", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
							
							lastTarget.dispatchEvent(evt1);
							
							lastTarget = null;						
						}
					}
					else
					{					
						var evt = document.createEvent("MouseEvents"); 
						evt.initMouseEvent("mouseover", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
						
						lastTarget = target;
						
						target.dispatchEvent(evt);
					}	
				}
				else
				{
					lastTarget = null;
				}

				if(animateBothMouseAndKeys)
				{
					mousePointer.style.zIndex = "999999";
					mouseCanvasDiv.style.zIndex = "999996";
				}
				//Move canvases forward
				if(eyeCanvasDiv)
				{
					eyeCanvasDiv.style.zIndex = "999996";
				}
				
				//If there are mouseclicks left to handle
				if(timeMouseClicks[currentMouseClick])
				{
					if(timeMouseClicks[currentMouseClick] <= timeStampMouse[indexMouse])
					{
						//Move canvases backward
						if(animateBothMouseAndKeys)
						{
							mousePointer.style.zIndex = "-1";
							mouseCanvasDiv.style.zIndex = "-1";	
						}
						if(eyeCanvasDiv)
						{
							eyeCanvasDiv.style.zIndex = "-1";
						}
						
						//Get mouse click target
						target = document.elementFromPoint(xMouseClicks[currentMouseClick], yMouseClicks[currentMouseClick]);
						
						if(target)
						{
							var evt2 = document.createEvent("MouseEvents"); 
							evt2.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null); 
							
							target.dispatchEvent(evt2);
							target.focus();
						}
						
						currentMouseClick++;

						//Move canvases forward
						if(animateBothMouseAndKeys)
						{
							mousePointer.style.zIndex = "999999";
							mouseCanvasDiv.style.zIndex = "999996";	
						}
						if(eyeCanvasDiv)
						{
							eyeCanvasDiv.style.zIndex = "999996";
						}
					}
				}
				
				//If there are key events left to handle
				if(timeStampKey[currentKey])
				{
					if(timeStampKey[currentKey] <= timeStampMouse[indexMouse] && !keyEventTriggered)
					{						
						keyEventTriggered = true;
						
						var active = document.activeElement;
					
						//Check if we have an active element
						if(active)
						{
							//If the keycode is 8, a backspace event should be dispathes.
							//Instead, this function gets the value of the current element,
							//and then removes the last element in that string.
							if(keys[currentKey] == 8)
							{
								var currentValue = active.value;
								if(currentValue)
								{
									var newValue = currentValue.substring(0, currentValue.length - 1);
									active.value = newValue;
								}
								else
								{
									active.value = "";
								}
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
										while(current.nodeName != "FORM")
										{
											current = current.parentNode;
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
						else
						{
							console.log("Error: No active element, keyboard events will not be dispatched!"); 	
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
		 catch(err)
		 {
		 	console.log("Error in animateMouse!");
		 }
	}
}

//Start the animate function. Gets the length of timeStampEye.
function startMouseAnimation(startTime)
{
	console.log("Start mouse animation");
	
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
	
	port.postMessage({message: "display::mouseAnimationStarted"});
	console.log("Animating mouse data");
	
	//Set mouse related variables
	sizeMouse = timeStampMouse.length;
	indexMouse = 0;
	while(startTime > timeStampMouse[indexMouse])
	{
		indexMouse++;
	}
	
	var time = new Date();
	previousMouseFrameTime = time.getTime();
	currentMouseFrameTime = startTime;
	console.log("Animating from frame " + indexMouse);
	manageMouseDiv(true);
	initializeMouseCanvas();
	animateMouse();
}

//Show or hide mouse pointer
function manageMouseDiv(create)
{
	if(create)
	{
		if(animateBothMouseAndKeys)
		{
			mousePointer = document.createElement('div');
			mousePointer.id = "mouse";
			mousePointer.style.position = 'absolute';
			mousePointer.style.width = "24px";
			mousePointer.style.height = "24px";
			mousePointer.style.zIndex = "999999";
		    mouseImage = document.createElement('img');
			mouseImage.src = chrome.runtime.getURL("../../img/mouse-icon16.png");
			mousePointer.appendChild(mouseImage);
			document.body.appendChild(mousePointer);	
		}
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
function displayMouseHeatmap() {
	if(xMouseCoords && yMouseCoords) {
	    animateBothMouseAndKeys = true;
		initializeMouseCanvas();
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
	    isDisplayingMouseHeatmap = true;
		port.postMessage({message: "display::displayingData"});
	}
	else
	{
		console.log("No data!");
	}
	
	try
	{
		document.getElementById('mouse-canvas-div').style.position = 'absolute';	
	}
	catch(err)
	{
		console.log("Something went wrong in displaying mouse heatmap");
	}
}

//Stop the animate function
function stopMouseAnimation()
{
	if(animationMouse && indexMouse >= sizeMouse)
	{
		console.log("Stop mouse animation!");
		indexMouse = 0;
		
		clearTimeout(animationMouse);
		animationMouse = null;
		manageMouseDiv(false);		
		hideMouseHeatmap();		
		animateBothMouseAndKeys = false;
	
		port.postMessage({message: "display::mouseAnimationFinished"});
	}
}


function forceMouseAnimationStop()
{

	//Mouse
	indexMouse = 0;
		
	clearTimeout(animationMouse);
	animationMouse = null;
	manageMouseDiv(false);
	
	port.postMessage({message: "display::mouseAnimationFinished"});
	isMouseAnimationPaused = false;
	
	animateBothMouseAndKeys = false;
	
	hideMouseHeatmap();
}

//Hide the heatmap
function hideMouseHeatmap()
{
	console.log("Hide mouse heatmap!");
	if(heatmapMouseInstance != null)
	{
		var canvas = heatmapMouseInstance._renderer.canvas;
		//remove the canvas from DOM
		$(canvas).remove();	
		heatmapMouseInstance = null;
	}
	
	if(mouseCanvasDiv)
	{
		document.body.removeChild(document.getElementById("mouse-canvas-div"));
		mouseCanvasDiv = null;
	}

    isDisplayingMouseHeatmap = false;
}

//Listen for messages from displayheatmap.js in extension
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) 
{
	if (request.msg == "injectedmousedisplay::startAnimation") {
		if(timeStampMouse)
		{
			hideMouseHeatmap(); //Hide before starting animation
			animateBothMouseAndKeys = request.data;
			startMouseAnimation(0);
			sendResponse({message: "Animating mouse heatmap!", data:true});	
		}		
		else
		{
			sendResponse({message: "Failed to start mouse animation. No data existed.",data:false});	
		}
	}
	else if(request.msg == "injectedmousedisplay::pauseRendering")
	{
		isMouseAnimationPaused = true;
		sendResponse({message: "Paused mouse rendering!"});	
	}
	else if(request.msg == "injectedmousedisplay::resumeRendering")
	{
		var time = new Date();
		previousMouseFrameTime = time.getTime();
		isMouseAnimationPaused = false;
		animateMouse();
		sendResponse({message: "Resumed mouse rendering!"});	
	}
	else if(request.msg == "injectedmousedisplay::removeDataFromPreviousTest")
	{
		forceMouseAnimationStop();	
		sendResponse({message: "Cleared mouse!"});	
	}
	//If script is Reloaded and we were animating, continue animating from the last frame.
	else if(request.msg == "injectedmousedisplay::resumeRenderingAfterLoad")
	{
		console.log("Resuming rendering after load at frame " + request.data.previousFrameTimestamp);
		animateBothMouseAndKeys = request.data.isSimulatingBothMouseAndClicksKeys;
		startMouseAnimation(request.data.previousFrameTimestamp);
		sendResponse({message: "Resumed mouse rendering!"});	
	}
	else if (request.msg == "injectedmousedisplay::show") {
		if(!isDisplayingMouseHeatmap)
		{
			displayMouseHeatmap();
			sendResponse({message: "Showing mouse heatmap!", data:true});
		}
		else {
			sendResponse({message: "Heatmap already displayed!", data:false});
		}
	}
	else if (request.msg == "injectedmousedisplay::hide") {
		forceMouseAnimationStop();
		sendResponse({message: "Hiding mouse heatmap!", data:true});
	}
	else if (request.msg == "injectedmousedisplay::clearCanvas") {
		hideMouseHeatmap();
	}
	else if (request.msg == "injectedmousedisplay::setMouseData") {
		setMouseData(request.data);
		if(request.resume)
		{
			sendResponse({message: "resume"});
		}
		else
		{
			sendResponse({message: "Updating data!"});
			hideMouseHeatmap();
		}
	}
});
