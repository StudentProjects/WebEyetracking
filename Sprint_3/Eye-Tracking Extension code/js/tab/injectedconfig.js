//////////////////////
//Daniel Johansson////
//injectedconfig.js//////////
//////////////////////
//
//Handles setup of jquery and tells the extension
//when content scripts have finished loading.
//

/////////////
//Variables//
/////////////

var port = chrome.runtime.connect({name:"display"}); //Port to tabinfo.js

///////////
//METHODS//
///////////

//Listen for messages from displayheatmap.js in extension
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) 
{
	if(request.msg == "injectedconfig::jquery")
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
			
			// Clearing animation timeout before unloading page
			$(window).on("beforeunload",function()
			{
				if(animationEye)
				{
					clearTimeout(animationEye);
				}
			});

		}
		else
		{
			console.log("jQuery not initialized!");
			sendResponse({message: "not ready"});
		}	
	}
	else if(request.msg == "injectedconfig::alive")
	{
		sendResponse({message: "alive"});
	}
	else if(request.msg == "injectedconfig::jqueryversion")
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
});

//Tell the background script that the injection of the content scripts has
//been successful
console.log("Injected content ready!");
port.postMessage({message: "display::injectedContentReady"});