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

var currentData;
var allApplications = null;
var currentApplication = "";
var currentDate = "";

///////////
//METHODS//
///////////

initLoad();

function initLoad()
{
	addLoadMessageListener();
	
	console.log("load.js initialized!");
}

//Creates navigation links above the test links, for
//easy navigation in the tab.
function createNavigationLinks(state)
{
	//Reset links
	var tablerow = document.getElementById("link-tablerow");
	tablerow.innerHTML = "";
	
	//Make application link that takes the user
	//back to the "all applications" state.
	var tabledata = document.createElement("td");
	tabledata.innerHTML = '<a href="#">Applications</a>';
	tabledata.className = "link-tabledata";
	
	tabledata.addEventListener("click", (function()
	{
		createApplicationTable(allApplications);
	}));	
	
	tablerow.appendChild(tabledata);
	
	//If state is higher that 0, we are to enter stage 1
	//which creates a link for the current application.
	if(state > 0)
	{
		tabledata = document.createElement("td");
		tabledata.innerHTML = " >> ";
		
		tablerow.appendChild(tabledata);
		
		tabledata = document.createElement("td");
		tabledata.innerHTML = '<a href="#">' + currentApplication + '</a>';
		tabledata.className = "link-tabledata";
		
		tabledata.addEventListener("click", (function()
		{
			createDateTable(currentData);
		}));	
		
		tablerow.appendChild(tabledata);
	}
	
	//If state is higher that 1, we are to enter stage 2
	//which creates a link for the current date.
	if(state > 1)
	{
		tabledata = document.createElement("td");
		tabledata.innerHTML = " >> ";
		tabledata.className = "link-tabledata";
		
		tablerow.appendChild(tabledata);
		
		tabledata = document.createElement("td");
		tabledata.innerHTML = '<a href="#">' + currentDate + '</a>';
		tabledata.className = "link-tabledata";
	
		tablerow.appendChild(tabledata);
	}
	
	if(state == 0)
	{
		currentApplication = "";
		currentDate = "";
	}
	else if(state == 1)
	{
		currentDate = "";
	}
}

//Create button for every available application
function createApplicationTable(input)
{
	var list = document.getElementById('search_list');
	list.innerHTML = "";
	var data = null;
	
	//Check if value is a JSON-string or not, and depending
	//on which, handle input differently.
	try
	{
		data = JSON.parse(input);
		currentData = data;
	}
	catch(err)
	{
		data = input;
		currentData = input;
	}
	
	var sizeData = data['ApplicationName'].length;
	var applications = data['ApplicationName'];
	
	//Save for later, so we don't have to ask the server each time
	allApplications = data;
	
	//Build link list of applications
	for(i = 0; i < sizeData; i++)
	{
		var listItem = document.createElement('li');
		listItem.innerHTML = '<a href="#">' + applications[i] + '</a>';
		listItem.className = "list-group-item";

		listItem.addEventListener("click", (function(data)
		{
			return function()
			{
				currentApplication = data;
				chrome.extension.sendRequest({ msg: "websocket::applicationRequest", data: data});
			};
		}(applications[i])));	
				
		list.appendChild(listItem);
	}
	
	createNavigationLinks(0);
}

//Create button for every available application
function createDateTable(input)
{
	var list = document.getElementById('search_list');
	list.innerHTML = "";	
	var data = null;
	
	//Check if value is a JSON-string or not, and depending
	//on which, handle input differently.
	try
	{
		data = JSON.parse(input);
		currentData = data;
	}
	catch(err)
	{
		data = input;
		currentData = input;
	}
	
	//Build link list of dates.
	var sizeDate = data['Dates'].length;
	var dates = data['Dates'];
	for(i = 0; i < sizeDate; i++)
	{
		var listItem = document.createElement('li');
		listItem.innerHTML = '<a href="#">' + dates[i]['Date'] + '</a>';
		listItem.className = "list-group-item";

		listItem.addEventListener("click", (function(date)
		{
			return function()
			{
				currentDate = date;
				createLinkTable(currentData);
			};
		}(dates[i]['Date'])));	
				
		list.appendChild(listItem);
	}
	
	createNavigationLinks(1);
}

//Create button for every recording matching a specific application name.
//Each recording becomes a list item with the name of the user and
//the date it was recorded.
function createLinkTable(input)
{
	var list = document.getElementById('search_list');
	list.innerHTML = "";
	var data = null;
	
	try
	{
		data = JSON.parse(input);
		currentData = data;
	}
	catch(err)
	{
		data = input;
		currentData = input;
	}
	
	//Build link list of tests.
	var sizeDate = data['Dates'].length;
	var dates = data['Dates'];
	for(i = 0; i < sizeDate; i++)
	{
		if(data['Dates'][i]['Date'] == currentDate)
		{
			sizeName = data['Dates'][i]['Names'].length;
			var names = data['Dates'][i]['Names'];
			for(j = 0; j < sizeName; j++)
			{
				var userSplitArray = data['Dates'][i]['Names'][j]['Name'].split(" ");
				var userName = "";
				for(k = 0; k < userSplitArray.length; k++)
				{
					var first = userSplitArray[k].substring(0, 1);
					var rest = userSplitArray[k].substring(1);
					userSplitArray[k] = first.toUpperCase() + rest;
					
					if(k < (userSplitArray.length - 1))
					{
						userName += userSplitArray[k] + " ";
					}
					else
					{
						userName += userSplitArray[k];
					}
				}
				
				var listItem = document.createElement('li');
				listItem.innerHTML = '<a href="#" id="load_button_' + i + '">' + userName + ' - ' + data['Dates'][i]['Names'][j]['Time'] + '</a>';
				listItem.className = "list-group-item";
				
				var tempData = new Object();
				tempData.Name = data['Dates'][i]['Names'][j]['Name'];
				tempData.Date =	data['Dates'][i]['Date'];
				tempData.Application = data['ApplicationName'];
				tempData.Id = data['Dates'][i]['Names'][j]['Id'];
			
				
				listItem.addEventListener("click", (function(data, time)
				{
					return function()
					{
						chrome.extension.sendRequest({ msg: "websocket::getSpecificDataRequest", data: JSON.stringify(data)});
						setCurrentTestInfo(data.Name, data.Application, data.Date, time);
						
						//Save testInfo variable in persistantpopupvariables.js
						var testInfo = new Object();
						testInfo.Name = data.Name;
						testInfo.Application = data.Application;
						testInfo.Date = data.Date;
						testInfo.Time = time;
						chrome.extension.sendRequest({ msg: "persistentpopupvariables::setTestInfo", data: testInfo });
					};
				}(tempData, data['Dates'][i]['Names'][j]['Time'])));
				
				list.appendChild(listItem);
			}
		}
	}
	
	createNavigationLinks(2);
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
		//createDateTable
		else if(i_message.msg == "load::createDateTable")
		{
			if(i_message.data == "NoData")
			{
				noDataFound();
				renderInfo("No matching application tests found!", "Error");
			}
			else
			{
				
				createDateTable(i_message.data);
				renderInfo("Successfully loaded test list!", "Alert");
			}
		}
		//loadSucceeded
		else if(i_message.msg == "load::loadSucceeded")
		{
			//Render info
			renderInfo("Succeeded loading data!", "Alert");
			
			//Parse JSON file
			var data = JSON.parse(i_message.data);
			
			//Load statistics into statistics tab.
			setStatistics(data['testStatistics']);
			
			//Change to player tab.
			setActiveTab(2);
		}
		//loadFailed
		else if(i_message.msg == "load::loadFailed")
		{
			renderInfo("Failed to load data, please try again!", "Error");
			
			//Reset info in 
			resetCurrentTestInfo();
		}
	});
}
