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
	var table = document.getElementById('load_table');
	table.innerHTML = "";
	
	console.log("Parsing JSON");
	var data = JSON.parse(input);
	
	var sizeData = data['ApplicationName'].length;
	var applications = data['ApplicationName'];
	for(i = 0; i < sizeData; i++)
	{
		table = document.getElementById('load_table');
		var row = table.insertRow(0);
		var cell = row.insertCell(0);
			
		cell.innerHTML = '<a href="#" id="load_button_' + i + '" class="button grey">' + applications[i] + '</a>';
		
		cell.addEventListener("click", (function(name)
		{
			return function()
			{
				chrome.extension.sendRequest({ msg: "websocket::applicationRequest", application: name});
			};
		}(applications[i])));
	}
}

//Create button for every recording matching a specific application name
function createLinkTable(input)
{
	var table = document.getElementById('load_table');
	table.innerHTML = "";
	
	console.log("Parsing JSON");
	var data = JSON.parse(input);
	
	var sizeDate = data['Dates'].length;
	var dates = data['Dates'];
	for(i = 0; i < sizeDate; i++)
	{
		sizeName = data['Dates'][i]['Names'].length;
		var names = data['Dates'][i]['Names'];
		for(j = 0; j < sizeName; j++)
		{
			table = document.getElementById('load_table');
			var row = table.insertRow(0);
			var cell = row.insertCell(0);
			
			cell.innerHTML = '<a href="#" id="load_button_' + i + '" class="button grey">' + data['Dates'][i]['Names'][j]['Name'] + '_' + data['Dates'][i]['Names'][j]['Time'] + '</a>';
			var tempData = new Object();
			tempData.Name = data['Dates'][i]['Names'][j]['Name'];
			tempData.Date =	data['Dates'][i]['Date'];
			tempData.Application = data['ApplicationName'];
			tempData.Id = data['Dates'][i]['Names'][j]['Id'];
		
			cell.addEventListener("click", (function(data)
			{
				return function()
				{
					chrome.extension.sendRequest({ msg: "websocket::getSpecificDataRequest", info: data});
				};
			}(JSON.stringify(tempData))));
		}
	}
}

//If no data was found, print that out.
function noDataFound()
{
	var table = document.getElementById('load_table');
	table.innerHTML = "";
	
	var row = table.insertRow(0);
	var cell = row.insertCell(0);
	
	cell.innerHTML = "No data found!";
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
