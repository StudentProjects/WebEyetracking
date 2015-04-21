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
		
		if(form.elements[0].value && form.elements[9].value)
		{
			for(var i = 4; i < 9; i++)
			{
				if(form.elements[i].checked)
				{
					//Gives a value between 1-5, 5 being highest computer usage  
					//and 1 being lowest computer usage.
					computerUsage = 9 - i;
					break;
				}
			}
			
			//Fill array.
			result[0] = form.elements[0].value;
			result[1] = form.elements[1].value;
			result[2] = form.elements[2].value;
			result[3] = form.elements[3].value;
			result[4] = computerUsage;
			result[5] = form.elements[9].value;
			result[6] = form.elements[10].value;
	
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
		form.elements[2].value = "";
		form.elements[3].value = "";
		form.elements[4].checked = false;
		form.elements[5].checked = false;
		form.elements[6].checked = false;
		form.elements[7].checked = false;
		form.elements[8].checked = false;
		form.elements[9].value = "";	
		form.elements[10].value = "";
		
		renderInfo("User information has been reset!", "Alert");
	});
		
	if(userInfo)
	{
		var form = document.getElementById('userform');
		form.elements[0].value = userInfo[0];
		form.elements[1].value = userInfo[1];
		form.elements[2].value = userInfo[2];
		form.elements[3].value = userInfo[3];	
		form.elements[10].value = userInfo[5];

		document.getElementById('other').value = userInfo[6];

		//Check which radio is true.
		switch(userInfo[4])
		{
		case 1:
			form.elements[8].checked = true;
			break;
		case 2:
			form.elements[7].checked = true;
			break;
		case 3:
			form.elements[6].checked = true;
			break;
		case 4:
			form.elements[5].checked = true;
			break;
		case 5:
			form.elements[4].checked = true;
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
	userInfo = input;
	chrome.extension.sendRequest({ msg: "persistentpopupvariables::setUserInfo", info: input });
	chrome.extension.sendRequest({ msg: "websocket::sendUserInfo", info: input});
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
		form.elements[2].value = userInfo[2];
		form.elements[3].value = userInfo[3];
		form.elements[9].value = userInfo[5];
		form.elements[10].value = userInfo[6];

		switch(userInfo[4])
		{
		case 1:
			form.elements[8].checked = true;
			break;
		case 2:
			form.elements[7].checked = true;
			break;
		case 3:
			form.elements[6].checked = true;
			break;
		case 4:
			form.elements[5].checked = true;
			break;
		case 5:
			form.elements[4].checked = true;
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
