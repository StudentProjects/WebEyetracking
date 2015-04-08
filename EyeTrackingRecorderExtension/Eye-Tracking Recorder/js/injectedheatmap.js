/////////////////////
//Daniel Lindgren////
//injectedheatmap.js//
/////////////////////
//
//Injects a script into the browser and tells it to display 
//a heatmap using heatmap.js 2.0.
//

/////////////
//Variables//
/////////////

var xCoords = null; //Array of x coordinates.
var yCoords = null; //Array of y coordinates.
var heatmapInstance = h337.create( //Heatmap instance.
{
	container: document.querySelector('*'),
	radius: 45
});
var animation = null; //Callback function for setTimeout if animating.
var animating = false; //True if animating.
var index = 0; //Integer representing the current animation frame, which
			   //is the index of the current position in the xCoords and yCoords array.
var size = 0; //Size of coordinate arrays.

///////////
//METHODS//
///////////

//Update the xCoords and yCoords with the latest collected data.
function setData(i_data)
{
	console.log("Update data!");
	
	t_xCoords = new Array();
	t_yCoords = new Array();
	
	var t_data = JSON.parse(i_data);
	
	//Check so that there are an equal amount of x and y coordinates.
	if(t_data['X'].length == t_data['Y'].length)
	{
		var t_size = t_data['X'].length;
		for(var i = 0; i < t_size; i++)
		{
			t_xCoords[i] = t_data['X'][i];
			t_yCoords[i] = t_data['Y'][i];
		}
		
		xCoords = t_xCoords;
		yCoords = t_yCoords;
	}
	else
	{
		console.log("X and Y coords do not match");
	}
}

//Animate the result of the collected data. Recursive function that runs
//as long as index is less than the size of the coordinate arrays.
function animate()
{	
	animation = setTimeout(function()
	{	
		if(index >= size)
		{
			stopAnimation();
			return;
		}
		
		console.log("Current index: " + index);
		heatmapInstance.addData(
		{
			x: xCoords[index],
			y: yCoords[index],
			value: 1
		});
		
		index++;
		animate();
		
	}, 16.67);
}

//Start the animate function. Gets the length of xCoords (same as the 
//length of yCoords, checked inside setData).
function startAnimation()
{
	if(!animating)
	{
		console.log("Start animation!");
		
		size = xCoords.length;
		index = 0;
		animating = true;
		animate();
	}
}

//Stop the animate function
function stopAnimation()
{
	console.log("Stop animation!");
	
	index = 0;
	clearTimeout(animate);
	animating = false;
}

//Show the collected data as a heatmap in the tab
function show()
{	
	if(xCoords && yCoords)
	{
		console.log("Show heatmap!");
		
		var t_size = xCoords.length;
		for(var i = 0; i < t_size; i++)
		{
			heatmapInstance.addData(
			{
				x: xCoords[i],
				y: yCoords[i],
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
		  
	heatmapInstance.setData(t_newData);
}

//Listen for messages from displayheatmap.js in extension
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) 
{
	if (request.msg == "injectedheatmap::animate")
	{
		hide(); //Hide before starting animation
		startAnimation();
		sendResponse({message: "Animating heatmap!"});	
	}
	else if (request.msg == "injectedheatmap::show")
	{
		hide(); //Hide before showing, so that we don't get duplicated heatmaps.
		show();
		isShowing = true;
		sendResponse({message: "Showing heatmap!"});
	}
	else if (request.msg == "injectedheatmap::hide")
	{
		hide();
		isShowing = false;
		sendResponse({message: "Hiding heatmap!"});
	}
	else if (request.msg == "injectedheatmap::setData")
	{
		setData(request.data);
		sendResponse({message: "Updating data!"});
	}
});