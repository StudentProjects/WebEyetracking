/////////////////////
//Daniel Lindgren////
//load.js///////////
/////////////////////
//
//Handles the functionality of the load tab in the extension popup.
//

/////////////
//Variables//
/////////////

var loadData;

///////////
//METHODS//
///////////

initLoad();

function initLoad()
{
	//When search_button is pressed, gather application name from input
	//and send to server, requesting matching user data.
	document.getElementById('search_button').addEventListener("click", function(event)
	{
		var input = document.getElementById('load_input');
		var data = input.value;
		
		if(data)
		{
			chrome.extension.sendRequest({ msg: "websocket::applicationRequest", application: data});
		}
		else
		{
			chrome.extension.sendRequest({ msg: "websocket::getAllApplicationsRequest"});
		}
	});
	
	addLoadMessageListener();
}	

//Create button for every available application
function createApplicationTable(input)
{
	var list = document.getElementById('search_list');
	list.innerHTML = "";
	
	var data = JSON.parse(input);
	
	var sizeData = data['ApplicationName'].length;
	var applications = data['ApplicationName'];
	
	for(i = 0; i < sizeData; i++)
	{
		var listItem = document.createElement('li');
		listItem.innerHTML = '<a href="#">' + applications[i] + '</a>';;
		listItem.className = "list-group-item";

		listItem.addEventListener("click", (function(data)
		{
			return function()
			{
				chrome.extension.sendRequest({ msg: "websocket::applicationRequest", application: data});
			};
		}(applications[i])));	
				
		list.appendChild(listItem);
	}
}

//Create button for every recording matching a specific application name
function createLinkTable(input)
{
	var list = document.getElementById('search_list');
	list.innerHTML = "";
	
	var data = JSON.parse(input);
	
	var sizeDate = data['Dates'].length;
	var dates = data['Dates'];
	for(i = 0; i < sizeDate; i++)
	{
		sizeName = data['Dates'][i]['Names'].length;
		var names = data['Dates'][i]['Names'];
		for(j = 0; j < sizeName; j++)
		{
			var listItem = document.createElement('li');
			listItem.innerHTML = '<a href="#" id="load_button_' + i + '">' + data['Dates'][i]['Names'][j]['Name'] + '_' + data['Dates'][i]['Names'][j]['Time'] + '</a>';
			listItem.className = "list-group-item";
			
			var tempData = new Object();
			tempData.Name = data['Dates'][i]['Names'][j]['Name'];
			tempData.Date =	data['Dates'][i]['Date'];
			tempData.Application = data['ApplicationName'];
			tempData.Id = data['Dates'][i]['Names'][j]['Id'];
		
			listItem.addEventListener("click", (function(data)
			{
				return function()
				{
					chrome.extension.sendRequest({ msg: "websocket::getSpecificDataRequest", info: data});
				};
			}(JSON.stringify(tempData))));
			
			list.appendChild(listItem);
		}
	}
}

//If no data was found, print that out.
function noDataFound()
{
}

//Add a listener that listens for messages.
function addLoadMessageListener()
{
	//This tells the script to listen
	//for messages from our extension.
	chrome.extension.onMessage.addListener(function(i_message, i_messageSender, i_sendResponse)
	{
		//createApplicationTable
		if(i_message.msg == "load::createApplicationTable")
		{
			if(i_message.data == "NoData")
			{
				noDataFound();
				renderInfo("No application tests found!", "Error");
			}
			else
			{
				createApplicationTable(i_message.data);
				renderInfo("Successfully loaded application list!", "Alert");
			}
		}
		//createLinkTable
		else if(i_message.msg == "load::createLinkTable")
		{
			if(i_message.data == "NoData")
			{
				noDataFound();
				renderInfo("No matching application tests found!", "Error");
			}
			else
			{
				createLinkTable(i_message.data);
				renderInfo("Successfully loaded test list!", "Alert");
			}
		}
		//loadSucceeded
		else if(i_message.msg == "load::loadSucceeded")
		{
			console.log("Load Succeeded!");
		}
		//loadFailed
		else if(i_message.msg == "load::loadFailed")
		{
			console.log("Load Failed!");
			renderInfo("Failed to load data, please try again!", "Error");
		}
	});
}
