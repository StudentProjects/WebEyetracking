/////////////////////
//Daniel Lindgren////
//injectedtabinfo.js//
/////////////////////
//
//Gets information about the current tab
//and sends it back to tabinfo.js
//

/////////////
//Variables//
/////////////

var port = chrome.runtime.connect({name:"tabinfo"}); //Port to tabinfo.js

///////////
//METHODS//
///////////

//Listen for scroll events. If one occurs, send new scroll height to extension (tabinfo.js).
var tempTimer = setTimeout(function()
{
	$(window).scroll(function() 
	{
		port.postMessage({message: "tabinfo::scrollHeight", scroll: $(window).scrollTop()});
	});
	
	$(window).mousemove(function(event)
	{	
		port.postMessage({message: "tabinfo::mouseCoords", xCoord: event.pageX, yCoord: event.pageY});
	});
}, 50);

//Listen for messages from tabinfo.js in extension
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) 
{
	if (request.msg == "injectedtabinfo::alive")
	{
		sendResponse({message: true});	
	}
	else if (request.msg == "injectedtabinfo::getScrollHeight")
	{
		var scrollHeight = $(window).scrollTop();
		sendResponse({data: scrollHeight});	
	}
	else if (request.msg == "injectedtabinfo::getDocumentSize")
	{
		var data = new Object();
		data.Width = Math.max($(document).width(), $(window).width());
		data.Height = Math.max($(document).height(), $(window).height());
		
		sendResponse({data: JSON.stringify(data)});	
	}
});