/////////////////////
//Daniel Lindgren////
//injectedmouserecorder.js//
/////////////////////
//
//Gets information about the current tab
//and sends it back to tabinfo.js
//

/////////////
//Variables//
/////////////

var port = chrome.runtime.connect({name:"mouserecorder"}); //Port to mouserecorder.js

///////////
//METHODS//
///////////

$(window).mousemove(function(event)
{	
		port.postMessage({message: "mouserecorder::mouseCoords", xCoord: event.pageX, yCoord: event.pageY});
});