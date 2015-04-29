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
var xMouseCoords = null; //Array of eye x coordinates.
var yMouseCoords = null; //Array of eye y coordinates.
var timeStampMouse = null; //Array of eye time stamps.

var animationEye = null; //Callback function for setInterval if animating.
var animationMouse = null; //Callback function for setInterval if animating.
var animating = false; //True if animating.
var indexEye = 0; //Integer representing the current animation frame, which
			   //is the index of the current position in the xCoords and yCoords array.
var sizeEye = 0; //Size of coordinate arrays.
var timerEye = 0; //The delay until rendering next eye frame.

var indexMouse = 0; //Integer representing the current animation frame, which
			   //is the index of the current position in the xCoords and yCoords array.
var sizeMouse = 0; //Size of coordinate arrays.
var timerMouse = 0; //The delay until rendering next mouse frame.

var mousePointer = null;
var mouseImage = null;

var heatmapEyeInstance = null;
var heatmapMouseInstance = null;

var port = chrome.runtime.connect({name:"display"}); //Port to tabinfo.js

var isPaused = false;

///////////
//METHODS//
///////////

function initializeCanvas(mouse,eye)
{
	if(eye)
	{
		heatmapEyeInstance = h337.create( //Heatmap instance.
		{
			container: document.querySelector('*'),
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
			container: document.querySelector('*'),
			radius: 45,
		 	maxOpacity: 1,
		    minOpacity: .0,
		    blur: .75
			/*gradient:
			{
				'.2': 'yellow',
				'.5': 'orange',
				'.85': 'red'
			}*/
		});
	}
}

function showFixationPoints()
{
	
}

function hideFixationPoints()
{
	
}

//Update the xCoords and yCoords with the latest collected data.
function setData(i_data)
{
	var t_data = JSON.parse(i_data);
	
	//If eye data exists
	if(t_data['timeStampEYE'])
	{		
		t_xEyeCoords = new Array();
		t_yEyeCoords = new Array();
		t_timeStampEye = new Array();
		
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
		t_xMouseCoords = new Array();
		t_yMouseCoords = new Array();
		t_timeStampMouse = new Array();
		
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
}

//Animate the result of the collected eye data. Recursive function that runs
//as long as index is less than the size of the timeStampEYE array.
function animateEye()
{
	if(!isPaused)
	{
		var nextFrame = 0;
		if(indexEye > 0)
		{
			var nextFrame = timeStampEYE[indexEye] - timeStampEYE[indexEye-1];
		}
		
		animationEye = setTimeout(function()
		{	
			if(indexEye >= sizeEye)
			{
				stopAnimation();
				return;
			}
			
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
}

//Animate the result of the collected mouse data. Recursive function that runs
//as long as index is less than the size of the timeStampMouse array.
function animateMouse()
{	
	if(!isPaused)
	{
		var nextFrame = 0;
		if(indexMouse > 0)
		{
			var nextFrame = timeStampMouse[indexMouse] - timeStampMouse[indexMouse-1];
		}
		
		if(mousePointer != null)
		{
			animationMouse = setTimeout(function()
			{	
				if(indexMouse >= sizeMouse)
				{
					stopAnimation();
					return;
				}
			
				mousePointer.style.left = xMouseCoords[indexMouse]+'px';
				mousePointer.style.top = yMouseCoords[indexMouse]+'px';
				
				indexMouse++;	
				animateMouse();
				
			}, nextFrame);	
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
function startAnimation(animateEyeBool, animateMouseBool)
{
	console.log("Start animation");
	if(!animating && animateEyeBool && !animateMouseBool)
	{
		if(timeStampEYE)
		{
			port.postMessage({message: "display::animationStarted"});
			console.log("Start eye animation!");
			
			sizeEye = timeStampEYE.length;
			indexEye = 0;
			timerEye = 0;
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
			console.log("Start mouse animation!");
			
			sizeMouse = timeStampMouse.length;
			indexMouse = 0;
			timerMouse = 0;
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
	if(!animating && animateEyeBool && animateMouseBool)
	{
		if(timeStampEYE && timeStampMouse)
		{
			port.postMessage({message: "display::animationStarted"});
			console.log("Start eye & mouse animation!");
			
			sizeEye = xEyeCoords.length;
			indexEye = 0;
			timerEye = 0;
			sizeMouse = timeStampMouse.length;
			indexMouse = 0;
			timerMouse = 0;
			animating = true;
			manageMouseDiv(true);
			initializeCanvas(true,true);
			animateBoth();
		}
		else if(timeStampEYE)
		{
			port.postMessage({message: "display::animationStarted"});
			console.log("No mouse data to animate, animating eye only!");
			
			sizeEye = timeStampEYE.length;
			indexEye = 0;
			timerEye = 0;
			animating = true;
			initializeCanvas(false,true);
			animateEye();			
		}
		else if(timeStampMouse)
		{
			port.postMessage({message: "display::animationStarted"});
			console.log("No eye data to animate, animating mouse only!");
			
			sizeMouse= timeStampMouse.length;
			indexMouse = 0;
			timerMouse = 0;
			animating = true;
			initializeCanvas(true,false);
			manageMouseDiv(true);
			animateMouse();			
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
	console.log("Stop animation!");
	port.postMessage({message: "display::animationFinished"});
	indexEye = 0;
	indexMouse = 0;
	if(animationEye)
	{
		clearTimeout(animationEye);
		animationEye = null;
	}
	if(animationMouse)
	{
		clearTimeout(animationMouse);
		animationMouse = null;
		manageMouseDiv(false);
	}
	animating = false;
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
		console.log("Creating element");
		mousePointer = document.createElement('div');
		mousePointer.id = "mouse";
		mousePointer.style.position = 'absolute';
		mousePointer.style.width = "24px";
		mousePointer.style.height = "24px";
		mousePointer.style.zIndex = "1";
	    mouseImage = document.createElement('img');
		mouseImage.src = chrome.runtime.getURL("../../img/mouse-icon16.png");
		mousePointer.appendChild(mouseImage);
		document.body.appendChild(mousePointer);
	}
	else
	{
		mousePointer.removeChild(mouseImage);
		document.body.removeChild(mousePointer);
		mousePointer = null;
		mouseImage = null;
	}
}
//Show the collected data as a heatmap in the tab
function showEye()
{	
	if(xEyeCoords && yEyeCoords)
	{
		initializeCanvas(false,true);
		console.log("Show eye heatmap!");
		
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
				startAnimation(request.eye, request.mouse);
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
	else if(request.msg == "injecteddisplay::resumeRendering")
	{
		isPaused = false;
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
		sendResponse({message: "Updating data!"});
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
});