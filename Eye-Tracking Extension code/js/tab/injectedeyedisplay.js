//////////////////////
//Daniel Johansson////
//injectedeyedisplay.js//////////
//////////////////////
//
//Responsible for displaying eye data
//

/////////////
//Variables//
/////////////

var xEyeCoords = null; //Array of eye x coordinates.
var yEyeCoords = null; //Array of eye y coordinates.
var timeStampEYE = null; //Array of eye time stamps.


var animationEye = null; //Callback function for setInterval if animating.

var isEyeAnimationPaused = false; // True if animation is paused

var previousEyeFrameTime = 0;
var currentEyeFrameTime = 0;

var indexEye = 0; //Integer representing the current animation frame, which
			   //is the index of the current position in the xCoords and yCoords array.
var sizeEye = 0; //Size of coordinate arrays.

var heatmapEyeInstance = null; //Heatmap instance for eye heatmap
var port = chrome.runtime.connect({name:"display"}); //Port to display.js

var eyeCanvasDiv = null; //Canvas for rendering heatmap

var isDisplayingEyeHeatmap = false;
var nrOfDisplayedTests = 0;
var isSuperContainer = false;
var bgColor = null;
var testerName = "";

///////////
//METHODS//
///////////
function createSuperContainer(){
	var superContainer = document.createElement("div");
	superContainer.style.position = "absolute";
	superContainer.style.overflow = "hidden";
	superContainer.style.top = "0px";
	superContainer.style.left = "0px";
	superContainer.height = Math.max($(document).height(), $(window).height()) + "px";
	superContainer.width = Math.max($(document).width(), $(window).width()) + "px";	
	superContainer.style.height = Math.max($(document).height(), $(window).height()) + "px";
	superContainer.style.width = Math.max($(document).width(), $(window).width()) + "px";	
	superContainer.style.zIndex = "999996";	
	superContainer.id = "superContainer";
	
	var userInfoContainer = document.createElement("div");
	userInfoContainer.style.position = "absolute";
	userInfoContainer.style.top = "0";
	userInfoContainer.style.left = "0";
	userInfoContainer.style.zIndex = "25";
	userInfoContainer.style.padding = ".7em";
	userInfoContainer.style.backgroundColor = "rgba(0,0,0,.6)";
	userInfoContainer.style.overflow = "auto";
	userInfoContainer.id = "userInfoContainer";

	document.body.appendChild(superContainer);
	superContainer.appendChild(userInfoContainer);
}
// Initializes the canvas for animating eye data
function initializeEyeCanvas()
{
	if(!isSuperContainer){
		createSuperContainer();
		isSuperContainer = true;
	}
	eyeCanvasDiv = document.createElement("div");
	eyeCanvasDiv.style.position = "absolute";
	eyeCanvasDiv.style.top = "0px";
	eyeCanvasDiv.style.left = "0px";
	eyeCanvasDiv.height = Math.max($(document).height(), $(window).height()) + "px";
	eyeCanvasDiv.width = Math.max($(document).width(), $(window).width()) + "px";	
	eyeCanvasDiv.style.height = Math.max($(document).height(), $(window).height()) + "px";
	eyeCanvasDiv.style.width = Math.max($(document).width(), $(window).width()) + "px";	
	eyeCanvasDiv.style.zIndex = nrOfDisplayedTests;
	eyeCanvasDiv.id = "eye-canvas-div-"+nrOfDisplayedTests;
	eyeCanvasDiv.className = "canvas-class";
        
	var superContainer = document.getElementById("superContainer");
	superContainer.appendChild(eyeCanvasDiv);
	/*
	if(!eyeCanvasDiv)
	{
		eyeCanvasDiv = document.createElement("div");
		eyeCanvasDiv.style.position = "absolute";
		eyeCanvasDiv.style.top = "0px";
		eyeCanvasDiv.style.left = "0px";
		eyeCanvasDiv.height = Math.max($(document).height(), $(window).height()) + "px";
		eyeCanvasDiv.width = Math.max($(document).width(), $(window).width()) + "px";	
		eyeCanvasDiv.style.height = Math.max($(document).height(), $(window).height()) + "px";
		eyeCanvasDiv.style.width = Math.max($(document).width(), $(window).width()) + "px";	
		eyeCanvasDiv.style.zIndex = "999996";	
		eyeCanvasDiv.id = "eye-canvas-div";
		eyeCanvasDiv.className = "canvas-class";
	        
		document.body.appendChild(eyeCanvasDiv);
	}
	*/
	
	// Setup heatmap for displaying eye data
	heatmapEyeInstance = h337.create( //Heatmap instance.
		{
			container: document.getElementById("eye-canvas-div-"+nrOfDisplayedTests),
			radius: 45,
			maxOpacity: 1,
		    minOpacity: .0,
		    blur: .75
		});

	heatmapEyeInstance.configure(generateRandomConfig());

	var nameContainer = document.getElementById("userInfoContainer");
	var nameListItem = document.createElement("li");
	nameListItem.style.listStyle = "none";
	nameListItem.style.color = "white";
	nameListItem.style.fontSize = "14pt";
	var colorArray = bgColor.split(" ");

	nameListItem.innerHTML = testerName + "<div style='height: 20px; width: 40px; background-color:rgb("+ colorArray[0] +","+ colorArray[1] +","+ colorArray[2] +") '>";
	nameContainer.appendChild(nameListItem);

	++nrOfDisplayedTests;
}


//Updates arrays of eye data with new eye data
function setEyeData(i_eyeData)
{	
	var t_data = JSON.parse(i_eyeData);
	
	
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
		
}


//Animate the result of the collected eye data. Recursive function that runs
//as long as index is less than the size of the timeStampEYE array.
function animateEye()
{
	document.getElementById('eye-canvas-div').style.position = 'absolute';
	
	if(!isEyeAnimationPaused)
	{
		//Check so that the current frame is the one closest to 
		//the actual timestep. If not, skip to next frame and check
		//that one instead. This is made to keep the animation in
		//real time.
		var time = new Date();
		currentEyeFrameTime += time.getTime() - previousEyeFrameTime;
		previousEyeFrameTime = time.getTime();
		
		while(timeStampEYE[indexEye+1] < currentEyeFrameTime)
		{
			indexEye++;
		}
		
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
					stopEyeAnimation();
					return false;
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
		else
		{
			return false;
		}
	}
}

//Start the animate function. Gets the length of timeStampEye.
function startEyeAnimation(startTime)
{
	console.log("Start eye animation");	

	port.postMessage({message: "display::eyeAnimationStarted"});
	console.log("Animating eye data");
	
	//Set eye related variables
	sizeEye = xEyeCoords.length;
	indexEye = 0;
	while(startTime > timeStampEYE[indexEye])
	{
		indexEye++;
	}
	
	var time = new Date();
	previousEyeFrameTime = time.getTime();
	currentEyeFrameTime = startTime;
	initializeEyeCanvas();
	isDisplayingEyeHeatmap = true;
	animateEye();

}

//Stop the animate function
function stopEyeAnimation()
{
	if(animationEye && indexEye >= sizeEye)
	{
		console.log("Stop eye animation!");
		indexEye = 0;
		
		clearTimeout(animationEye);
		animationEye = null;
		
		port.postMessage({message: "display::eyeAnimationFinished"});
	}
}

function forceEyeAnimationStop()
{
	indexEye = 0;	
	clearTimeout(animationEye);
	animationEye = null;
	port.postMessage({message: "display::eyeAnimationFinished"});
	isEyeAnimationPaused = false;
	hideEye();
}

//Show the collected eye data as a heatmap in the tab
function displayEyeHeatmap()
{	
	if(xEyeCoords && yEyeCoords)
	{
		initializeEyeCanvas();
		console.log("Display eye heatmap!");
		
		var canvas = heatmapEyeInstance._renderer.canvas;
		canvas.style.zIndex = "999996";
		
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
		isDisplayingEyeHeatmap = true;
		port.postMessage({message: "display::displayingData"});
	}
	else
	{
		console.log("No data!");
	}
}


//Hide the heatmap
function hideEye()
{
	/*if(isDisplayingEyeHeatmap)
	{
		console.log("Hide eye heatmap!");
		port.postMessage({message: "display::setHeaderToDefault"});
		if(heatmapEyeInstance != null)
		{
			//find corresponding canvas element
			var canvas = heatmapEyeInstance._renderer.canvas;
			//remove the canvas from DOM
			//$(canvas).remove();
			heatmapEyeInstance = null;
		}
		
		if(eyeCanvasDiv)
		{
			document.body.removeChild(document.getElementById("eye-canvas-div"));
			eyeCanvasDiv = null;
		}
	
		isDisplayingEyeHeatmap = false;	
	}*/
}


//Listen for messages from displayheatmap.js in extension
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) 
{
	if (request.msg == "injectedeyedisplay::startAnimation")
	{
		if(timeStampEYE)
		{
			hideEye(); //Hide before starting animation
			startEyeAnimation(0);
			sendResponse({message: "Animating eye heatmap!",data:true});	
		}		
		else
		{
			sendResponse({message: "Failed to start eye animation. No data existed.",data:false});	
		}
	}
	else if(request.msg == "injectedeyedisplay::pauseRendering")
	{
		isEyeAnimationPaused = true;
		sendResponse({message: "Paused eye rendering!"});	
	}
	else if(request.msg == "injectedeyedisplay::resumeRendering")
	{
		var time = new Date();
		previousEyeFrameTime = time.getTime();
		isEyeAnimationPaused = false;
		animateEye();
		sendResponse({message: "Resumed eye rendering!"});	
	}
	else if(request.msg == "injectedeyedisplay::removeDataFromPreviousTest")
	{
		forceEyeAnimationStop();		
		sendResponse({message: "Cleared!"});	
	}
	else if(request.msg == "injectedeyedisplay::setTester"){
		testerName = request.data;
		sendResponse({message: "Sucess!"})
	}
	//If script is reloaded and we were animating, continue animating from the last frame.
	else if(request.msg == "injectedeyedisplay::resumeRenderingAfterLoad")
	{
		startEyeAnimation(request.data.previousFrameTimestamp);
		sendResponse({message: "Resumed eye animation!"});	
	}
	else if (request.msg == "injectedeyedisplay::show")
	{
		/*if(!isDisplayingEyeHeatmap)
		{
			displayEyeHeatmap();
			sendResponse({message: "Showing heatmap!",data:true});	
		}
		else
		{
			sendResponse({message: "Eye heatmap already shown!",data:false});
		}*/
		displayEyeHeatmap();
		sendResponse({message: "Showing heatmap!",data:true});	
	}
	else if (request.msg == "injectedeyedisplay::hide")
	{
		if(isDisplayingEyeHeatmap)
		{
			forceEyeAnimationStop();
			sendResponse({message: "Hiding eye heatmap!",data:true});	
		}
		else
		{
			sendResponse({message: "Eye heatmap is not displayed, skipping hide command!",data:false});
		}
	}
	else if (request.msg == "injectedeyedisplay::clearCanvas")
	{
		hideEye();
	}
	else if (request.msg == "injectedeyedisplay::setEyeData")
	{
		setEyeData(request.data);
		if(request.resume)
		{
			sendResponse({message: "resume"});
		}
		else
		{
			sendResponse({message: "Updating eye data!"});
			hideEye();
		}
	}
});


function generateRandomConfig() {
    // let's keep at least the bgcolor the same...
    var backgroundColor = 'rgba(0,0,0,0)';
    var randVals = [Math.random(), Math.random()];
    //var maxOpacity = Math.max.apply(Math, randVals);
    //var minOpacity = (Math.random() > .5) ? Math.min.apply(Math, randVals) : 0;
    var maxOpacity = .5*(1-(nrOfDisplayedTests*.1)); 
    var minOpacity = .1*(1-(nrOfDisplayedTests*.1));
    var gradientCfg = {};
    var len = 6;

    while (len--) {
    	//using low primes to differ the colors
    	red = Math.floor(random(3)*255); 
    	green = Math.floor(random(7)*255);
    	blue = Math.floor(random(11)*255);
      	gradientCfg[''+Math.random()] = 'rgb(' + (red) + ',' + (green) + ', ' + (blue) + ')';
      	bgColor = red + ' ' + green + ' ' + blue;
    }

    return {
      backgroundColor: backgroundColor,
      gradient: gradientCfg,
      maxOpacity: maxOpacity,
      minOpacity: minOpacity
    }
};

function random(spunk){
	//var seed = Math.random();
	var seed = ((nrOfDisplayedTests)*(nrOfDisplayedTests)+spunk)*spunk;
    var x = Math.sin(++seed) * 10000;
    return x - Math.floor(x);
}