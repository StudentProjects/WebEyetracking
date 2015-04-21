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

var heatmapEyeInstance = h337.create( //Heatmap instance.
{
	container: document.querySelector('*'),
	radius: 45
});

var heatmapMouseInstance = h337.create( //Heatmap instance.
{
	container: document.querySelector('*'),
	radius: 45,
	gradient:
	{
		'.5': 'blue',
		'.8': 'red',
		'.95': 'white'
	}
});

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
var imageObj = null;
///////////
//METHODS//
///////////

//Update the xCoords and yCoords with the latest collected data.
function setData(i_data)
{
	var t_data = JSON.parse(i_data);
	
	//If eye data exists
	if(t_data['timeStampEYE'])
	{
		console.log("Update eye data!");
		
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
	}
}

//Animate the result of the collected eye data. Recursive function that runs
//as long as index is less than the size of the timeStampEYE array.
function animateEye()
{	
	console.log("Animating eye...");
	
	animationEye = setInterval(function()
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
	}, 16.67);
}

//Animate the result of the collected mouse data. Recursive function that runs
//as long as index is less than the size of the timeStampMouse array.
function animateMouse()
{	
	console.log("Totally drawing");
	if(mousePointer != null)
	{
		animationMouse = setInterval(function()
		{	
			if(indexMouse >= sizeMouse)
			{
				stopAnimation();
				return;
			}
			
			/*heatmapMouseInstance.addData(
			{
				x: xMouseCoords[indexMouse],
				y: yMouseCoords[indexMouse],
				value: 1
			});*/
		
			mousePointer.style.left = xMouseCoords[indexMouse]+'px';
			mousePointer.style.top = yMouseCoords[indexMouse]+'px';
			mousePointer.style.position = 'absolute';
			indexMouse++;
		}, 16.67);	
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
			console.log("Start eye animation!");
			
			sizeEye = timeStampEYE.length;
			indexEye = 0;
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
			console.log("Start mouse animation!");
			
			sizeMouse = timeStampMouse.length;
			indexMouse = 0;
			animating = true;
			manageMouseDiv(true);
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
			console.log("Start eye & mouse animation!");
			
			sizeEye = xEyeCoords.length;
			indexEye = 0;
			sizeMouse = timeStampMouse.length;
			indexMouse = 0;
			animating = true;
			manageMouseDiv(true);
			animateBoth();
		}
		else if(timeStampEYE)
		{
			console.log("No mouse data to animate, animating eye only!");
			
			sizeEye = timeStampEYE.length;
			indexEye = 0;
			animating = true;
			animateEye();			
		}
		else if(timeStampMouse)
		{
			console.log("No eye data to animate, animating mouse only!");
			
			sizeMouse= timeStampMouse.length;
			indexMouse = 0;
			animating = true;
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
	
	indexEye = 0;
	indexMouse = 0;
	if(animationEye)
	{
		clearInterval(animationEye);
		animationEye = null;
	}
	if(animationMouse)
	{
		clearInterval(animationMouse);
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
		//mousePointer.style.backgroundColor= "#FFFFFF";
	    mousePointer.style.backgroundImage = chrome.runtime.getURL("../../img/mousepointer.png");
		document.body.appendChild(mousePointer);
	}
	else
	{
		document.body.removeChild(mousePointer);
		mousePointer = null;
	}
}
//Show the collected data as a heatmap in the tab
function showEye()
{	
	if(xEyeCoords && yEyeCoords)
	{
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
	
	var t_newData = 
	{
		max: 8,
		min: 0,
		data: []
	};
		  
	heatmapEyeInstance.setData(t_newData);
	heatmapMouseInstance.setData(t_newData);
}

//Listen for messages from displayheatmap.js in extension
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) 
{
	if (request.msg == "injecteddisplay::animate")
	{
		hide(); //Hide before starting animation
		startAnimation(request.eye, request.mouse);
		sendResponse({message: "Animating heatmap!"});	
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
});