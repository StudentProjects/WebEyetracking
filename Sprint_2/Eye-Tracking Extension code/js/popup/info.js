/////////////////////
//Daniel Lindgren////
//info.js///////////
/////////////////////
//
//Handles the functionality of the info tab in the extension popup.
//

/////////////
//Variables//
/////////////

var userInfo;

///////////
//METHODS//
///////////

initInfo();

function initInfo()
{
	//When send_button is pressed, gather form data from userform and
	//send it to the parent windows function sendUserInfo
	document.getElementById('save_button').addEventListener("click", function(event)
	{
		var form = document.getElementById('userform');
		var result = new Array();
		var computerUsage = null;
		var gender = null;
		
		
		if(form.elements[0].value && form.elements[12].value)
		{   
			//Find checked box
			for(var i = 2; i < 5; i++)
			{
				if(form.elements[i].checked)
				{
					gender = form.elements[i].value;
					break;
				}
			}
			
			//Find checked box
			for(var i = 7; i < 12; i++)
			{
				if(form.elements[i].checked)
				{
					//Gives a value between 1-5, 5 being highest computer usage  
					//and 1 being lowest computer usage.
					computerUsage = 12 - i;
					break;
				}
			}
			
			//Fill array.
			result[0] = form.elements[0].value;
			result[1] = form.elements[1].value;
			result[2] = gender;
			result[3] = form.elements[5].value;
			result[4] = form.elements[6].value;
			result[5] = computerUsage;
			result[6] = form.elements[12].value;
			result[7] = form.elements[13].value;
	
			sendUserInfo(result);
			renderInfo("User information has been saved!", "Alert");
		}
		else
		{
			renderInfo("Please enter Name and Application!", "Error");
		}

	});

	//Close window if cancel_button is pressed.
	document.getElementById('reset_button').addEventListener("click", function()
	{
		userInfo = null;
		chrome.extension.sendRequest({ msg: "persistentpopupvariables::setUserInfo", info: userInfo });
		
		var form = document.getElementById('userform');
		form.elements[0].value = "";
		form.elements[1].value = "";
		form.elements[2].checked = false;
		form.elements[3].checked = false;
		form.elements[4].checked = false;
		form.elements[5].value = "";
		form.elements[6].value = "";
		form.elements[7].checked = false;
		form.elements[8].checked = false;
		form.elements[9].checked = false;
		form.elements[10].checked = false;
		form.elements[11].checked = false;
		form.elements[12].value = "";	
		form.elements[13].value = "";
		
		renderInfo("User information has been reset!", "Alert");
	});
		
	if(userInfo)
	{
		var form = document.getElementById('userform');
		form.elements[0].value = userInfo[0];
		form.elements[1].value = userInfo[1];
		form.elements[5].value = userInfo[3];
		form.elements[6].value = userInfo[4];	
		form.elements[12].value = userInfo[6];
		form.elements[13].value = userInfo[7];

		//document.getElementById('other').value = userInfo[6];
		
		//Check which gender radio is true.
		switch(userInfo[2])
		{
		case "female":
			form.elements[2].checked = true;
			break;
		case "male":
			form.elements[3].checked = true;
			break;
		case "other":
			form.elements[4].checked = true;
			break;
		}

		//Check which computer usage radio is true.
		switch(userInfo[5])
		{
		case 1:
			form.elements[11].checked = true;
			break;
		case 2:
			form.elements[10].checked = true;
			break;
		case 3:
			form.elements[9].checked = true;
			break;
		case 4:
			form.elements[8].checked = true;
			break;
		case 5:
			form.elements[7].checked = true;
			break;
		}
	}
	else
	{
		getUserInfo();
	}
	
	//Add listener.
	addInfoMessageListener();
	
	console.log("info.js initialized!");
}

//Send user info to websocket, which forwards it to the server. Also save userInfo in persistentpopupvariables.js.
function sendUserInfo(input)
{
	chrome.extension.sendRequest({ msg: "persistentpopupvariables::setUserInfo", info: input });
	chrome.extension.sendRequest({ msg: "websocket::sendUserInfo", data: input});
}

//Send user info to websocket, which forwards it to the server
function getUserInfo()
{
	chrome.extension.sendRequest({ msg: "persistentpopupvariables::getUserInfo"});
}

//Set user info received from persistentpopupvariables.js.
function setUserInfo(input)
{
	userInfo = input;
	
	if(userInfo)
	{
		var form = document.getElementById('userform');
		form.elements[0].value = userInfo[0];
		form.elements[1].value = userInfo[1];
		form.elements[5].value = userInfo[3];
		form.elements[6].value = userInfo[4];
		form.elements[12].value = userInfo[6];
		form.elements[13].value = userInfo[7];

		switch(userInfo[2])
		{
		case "female":
			form.elements[2].checked = true;
			break;
		case "male":
			form.elements[3].checked = true;
			break;
		case "other":
			form.elements[4].checked = true;
			break;
		}

		switch(userInfo[5])
		{
		case 1:
			form.elements[11].checked = true;
			break;
		case 2:
			form.elements[10].checked = true;
			break;
		case 3:
			form.elements[9].checked = true;
			break;
		case 4:
			form.elements[8].checked = true;
			break;
		case 5:
			form.elements[7].checked = true;
			break;
		}
	}
}

//Add a listener that listens for messages.
function addInfoMessageListener()
{
	//This tells the script to listen
	//for messages from our extension.
	chrome.extension.onMessage.addListener(function(i_message, i_messageSender, i_sendResponse) 
	{
		//setUserInfo
		if(i_message.msg == "info::setUserInfo")
		{
			setUserInfo(i_message.info);
		}
	});
}
