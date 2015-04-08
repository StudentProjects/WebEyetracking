// MessageHandler.cs
// Created by: Daniel Johansson
// Edited by: 

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace eyexwebServerv1
{
    // Message responds structure

    public class MessageObject
    {
        public int MessageType { get; set; }
        public string MessageContent { get; set; }
    }

    class MessageHandler
    {
        public Server m_serverRef;
        public MessageHandler(Server i_server)
        {
            m_serverRef = i_server;
        }

        // Decrypting the message recieved from client
        // Can handle all sizes of messages
        // Inparam is message as raw data which is the state of the message when received from client
        public void decryptMessage(Byte[] i_messageAsBytes)
        {
            string t_decryptedMessage = String.Empty;

            // Decrypting message
            Byte t_secondByte = i_messageAsBytes[1];
            // Checking message type
            Int32 t_dataLength = t_secondByte & 127;
            Int32 t_indexFirstMask = 2;

            // if the data length is 126 the following two bytes are the length
            if(t_dataLength == 126)
            {
                t_indexFirstMask = 4;
            }
             // if 127 the following 8 bytes are the length
            else if (t_dataLength == 127)
            {
                t_indexFirstMask = 10;
            }
                
            // Collecting the key from the message. Ignoring the index bytes and taking the four following bytes to use as key
            IEnumerable<Byte> keys = i_messageAsBytes.Skip(t_indexFirstMask).Take(4);
            Int32 t_indexFirstDataByte = t_indexFirstMask + 4;

            // Decrypting the message
            Byte[] t_decodedAsBytes = new Byte[i_messageAsBytes.Length - t_indexFirstDataByte];
            for (Int32 i = t_indexFirstDataByte, j = 0; i < i_messageAsBytes.Length; i++, j++)
            {
                t_decodedAsBytes[j] = (Byte)(i_messageAsBytes[i] ^ keys.ElementAt(j % 4));
            }

            // Converting the decrypted message to a string
            t_decryptedMessage = Encoding.UTF8.GetString(t_decodedAsBytes, 0, t_decodedAsBytes.Length);

            handleDecryptedMessage(t_decryptedMessage);
        }

        // Handles the decrypted message received from the client
        // InParam is the decrypted messages as a string
        // Function will collect the messagetype of the message and notify the appropiate function on the server
        // Calls constructNewMessage with information depending on the server functions response.
        public void handleDecryptedMessage(string i_decryptedMessage)
        {
            int t_messageType = getMessageType(i_decryptedMessage);
            m_serverRef.updateOutputLog("Got message of type: " + t_messageType.ToString());
            m_serverRef.updateOutputLog(i_decryptedMessage);
            if(t_messageType != -1)
            {
                // Client requesting start of eye tracker
                if(t_messageType == 1)
                {
                    bool t_recordingSucceeded = m_serverRef.requestStartRecording();
                    if (t_recordingSucceeded)
                    {
                        m_serverRef.updateOutputLog("Starting EYE-tracker!");
                        m_serverRef.updateEyeTrackingStatus(0);
                        constructResponseMessage(7, true);
                    }
                    else
                    {
                        m_serverRef.updateOutputLog("EYE-tracker is already started!");
                        constructResponseMessage(7, false);
                    }
                }
                // Client requesting pause of eye tracking
                else if(t_messageType == 2)
                {
                    bool t_pauseSucceeded = m_serverRef.requestPauseRecording();
                    if (t_pauseSucceeded)
                    {
                        m_serverRef.updateEyeTrackingStatus(2);
                        constructResponseMessage(8, true);
                    }
                    else
                    {
                        constructResponseMessage(8, false);
                    }
                }
                // Client requesting to resume paused recording
                else if(t_messageType == 3)
                {
                    bool t_resumeSucceeded = m_serverRef.requestResumeRecording();
                    if (t_resumeSucceeded)
                    {
                        m_serverRef.updateEyeTrackingStatus(0);
                        constructResponseMessage(9, true);
                    }
                    else
                    {
                        constructResponseMessage(9, false);
                    }
                }
                // client requesting a stop of active recording
                else if(t_messageType == 4)
                {
                    bool t_stopSucceeded = m_serverRef.requestStopRecording();
                    if(t_stopSucceeded)
                    {
                        m_serverRef.updateEyeTrackingStatus(1);
                        constructResponseMessage(10, true);
                    }
                    else
                    {
                        constructResponseMessage(10, false);
                    }
                }
                // Client requesting data from the last recording
                else if(t_messageType == 5)
                {
                    string t_jsonMessage = m_serverRef.requestDataString();
                    m_serverRef.updateOutputLog(t_jsonMessage);

                    if(t_jsonMessage != "")
                    {
                        constructResponseMessage(6, true,t_jsonMessage);
                    }
                    else
                    {
                        constructResponseMessage(6, false);
                    }
                }
                // Client wants to disconnect
                else if(t_messageType == 11)
                {
                    bool t_disconnectSucceeded = m_serverRef.handleClientDisconnectRequest();
                    if (t_disconnectSucceeded)
                    {
                        constructResponseMessage(12, true);
                    }
                    else
                    {
                        constructResponseMessage(12, false);
                    }
                }
                // Client notifys about changed scroll height
                // Telling server to update scroll height
                else if(t_messageType == 13)
                {
                    int t_scrollPosition = getMessageContentAsInt(i_decryptedMessage);
                    if(t_scrollPosition != -1)
                    {
                        m_serverRef.requestScrollUpdate(t_scrollPosition);
                        m_serverRef.updateOutputLog("Updated scroll height to " + t_scrollPosition.ToString());
                    }
                    else
                    {
                        m_serverRef.updateOutputLog("Invalid scroll height");
                    }      
                }
                // Client sending error message
                else if(t_messageType == 99)
                {
                    m_serverRef.updateOutputLog("Got error message from server!");
                }
            }
            // Client message didn't contain a valid message type
            else
            {
                m_serverRef.updateOutputLog("Invalid message type from client");
                // Sending error message to client
                constructResponseMessage(99);
            }
        }

        // Constructing the response message which will later be sent to the client
        // messagetype indicates which type of message that should be constructed
        // succeeded tells if the client request in the previous message succeeded or not. Will affect the response message content.
        // (optional) datamessage will replace the standard MessageContent types. Used when client wants to collect the EYE-tracker data.
        public void constructResponseMessage(int i_messageType, bool i_succeeded = true,string i_dataMessage = "")
        {
            m_serverRef.updateOutputLog("Constructing message of type: " + i_messageType.ToString());
            String t_messageToSend = String.Empty;
            MessageObject t_responseObject = new MessageObject();
            // Constructing message of request data response
            if(i_messageType == 6)
            {
                if(i_succeeded)
                {
                    // Start record succeeded for test
                    t_responseObject.MessageType = 6;
                    t_responseObject.MessageContent = i_dataMessage;
                    // Serialize object (convert it to a string)
                    t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
                }
                else
                {
                    // Start record succeeded for test
                    t_responseObject.MessageType = 6;
                    t_responseObject.MessageContent = "No data available";
                    // Serialize object (convert it to a string)
                    t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
                }
            }
            // Constructing message of startrecordingresponse
            else if(i_messageType == 7)
            {
                if(i_succeeded)
                {
                    // Start record succeeded for test
                    t_responseObject.MessageType = 7;
                    t_responseObject.MessageContent = "Succeeded";
                    // Serialize object (convert it to a string)
                    t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
                    m_serverRef.updateOutputLog(t_messageToSend);
                }
                else
                {
                    // Start record succeeded for test
                    t_responseObject.MessageType = 7;
                    t_responseObject.MessageContent = "Failed";
                    // Serialize object (convert it to a string)
                    t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
                }
            }
                // Constructing message of pause recording response
            else if(i_messageType == 8)
            {
                if (i_succeeded)
                {
                    // Start record succeeded for test
                    t_responseObject.MessageType = 8;
                    t_responseObject.MessageContent = "Succeeded";
                    // Serialize object (convert it to a string)
                    t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
                }
                else
                {
                    // Start record succeeded for test
                    t_responseObject.MessageType = 8;
                    t_responseObject.MessageContent = "Failed";
                    // Serialize object (convert it to a string)
                    t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
                }
            }
                // Constructing message of resume recording response
            else if(i_messageType == 9)
            {
                if (i_succeeded)
                {
                    // Start record succeeded for test
                    t_responseObject.MessageType = 9;
                    t_responseObject.MessageContent = "Succeeded";
                    // Serialize object (convert it to a string)
                    t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
                }
                else
                {
                    // Start record succeeded for test
                    t_responseObject.MessageType = 9;
                    t_responseObject.MessageContent = "Failed";
                    // Serialize object (convert it to a string)
                    t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
                }
            }
                // Constructing message of stop recording response
            else if(i_messageType == 10)
            {
                if (i_succeeded)
                {
                    // Start record succeeded for test
                    t_responseObject.MessageType = 10;
                    t_responseObject.MessageContent = "Succeeded";
                    // Serialize object (convert it to a string)
                    t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
                }
                else
                {
                    // Start record succeeded for test
                    t_responseObject.MessageType = 10;
                    t_responseObject.MessageContent = "Failed";
                    // Serialize object (convert it to a string)
                    t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
                }
            }
                // Constructing client request disconnect response
            else if(i_messageType == 12)
            {
                if (i_succeeded)
                {
                    // Start record succeeded for test
                    t_responseObject.MessageType = 12;
                    t_responseObject.MessageContent = "Succeeded";
                    // Serialize object (convert it to a string)
                    t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
                }
                else
                {
                    // Start record succeeded for test
                    t_responseObject.MessageType = 12;
                    t_responseObject.MessageContent = "Failed";
                    // Serialize object (convert it to a string)
                    t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
                }
            }
                // error message
            else if(i_messageType == 99)
            {
               
                 t_responseObject.MessageType = 99;
                 t_responseObject.MessageContent = "Invalid Message";
                 // Serialize object (convert it to a string)
                 t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
            }
            

            sendResponseMessage(t_messageToSend);
        }

        // Telling server to handle the constructed message and send it to the server
        public void sendResponseMessage(string i_message)
        {
            m_serverRef.writeToSocket(i_message);
        }

        // Converting the message to a JSON object and trying to get the value of the messagetype which should be one of the keys in the message
        // Returning -1 if something is wrong with the message
        int getMessageType(string i_message)
        {
            int t_messageType = -1;

            try
            {
                JObject t_stringToJSON = JObject.Parse(i_message);
                t_messageType = t_stringToJSON.GetValue("MessageType").Value<int>();
            }
            catch(Exception e)
            {
                Console.WriteLine("Something went wrong " + e.ToString());
            }

            return t_messageType;
        }

        // Returning message content as int if it is an int
        int getMessageContentAsInt(string i_message)
        {
            int t_messageContent = -1;

            try
            {
                JObject t_stringToJSON = JObject.Parse(i_message);
                t_messageContent = t_stringToJSON.GetValue("MessageContent").Value<int>();
            }
            catch (Exception e)
            {
                Console.WriteLine("Something went wrong (message is not an int)" + e.ToString());
            }

            return t_messageContent;
        }
    }


}
