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

namespace tieto.education.eyetrackingwebserver
{
    class MessageHandler
    {
        public Server m_activeServerInstance;
        string t_tempMessageContent;

        /// <summary>
        /// Initializes class variables
        /// </summary>
        /// <param name="i_serverInstance">A valid instance of the server</param>
        public MessageHandler(Server i_serverInstance)
        {
            m_activeServerInstance = i_serverInstance;
            t_tempMessageContent = "";
        }

        /// <summary>
        /// Decrypting the message received from client. Can handle all sizes of messages.
        /// </summary>
        /// <param name="i_messageAsBytes">The raw message data received from client</param>
        public void decryptMessage(Byte[] i_messageAsBytes)
        {
            string t_decryptedMessage = String.Empty;

            Byte t_firstByte = i_messageAsBytes[0];
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

            // Mouse coordinates. Can be very very large
            // Will be received in parts
            // Decided on client
            int t_messageType = getMessageType(t_decryptedMessage);
            if(t_messageType == 23)
            {
                handleLargeMessage(t_decryptedMessage);
            }
            else
            {
                handleDecryptedMessage(t_decryptedMessage);
            }
        }

        /// <summary>
        /// Handles a very large message and checks the opcode of the message.
        /// 0 = start of new message, 1 = part of message, 2=End of message
        /// When the constructed message is completed it is sent to handleDecryptedMessage
        /// </summary>
        /// <param name="i_message">The message decrypted messages as a string</param>
        void handleLargeMessage(string i_message)
        {
            try
            {
                string t_decryptedMessage = i_message;
                JObject t_message = JObject.Parse(t_decryptedMessage);
                int t_opcode = t_message.GetValue("Opcode").Value<int>();

                //Start of message
                if (t_opcode == 0)
                {
                    string t_messageContent = t_message.GetValue("MessageContent").Value<string>();
                    t_tempMessageContent += t_messageContent;

                    m_activeServerInstance.setLogType(3);
                    m_activeServerInstance.setOutputTextProperty("MessageHandler: Received very large message, splitting!");
                }
                // Addon to message
                else if (t_opcode == 1)
                {
                    string t_messageContent = t_message.GetValue("MessageContent").Value<string>();
                    t_tempMessageContent += t_messageContent;
                    m_activeServerInstance.setLogType(3);
                    m_activeServerInstance.setOutputTextProperty("MessageHandler: Applying data to previous message!");
                }
                // Final part of message
                else if (t_opcode == 2)
                {
                    string t_messageContent = t_message.GetValue("MessageContent").Value<string>();
                    t_tempMessageContent += t_messageContent;
                    MessageObject t_newContent = new MessageObject();
                    t_newContent.MessageType = 23;
                    t_newContent.MessageContent = t_tempMessageContent;
                    t_decryptedMessage = JsonConvert.SerializeObject(t_newContent, Formatting.None);

                    m_activeServerInstance.setLogType(1);
                    m_activeServerInstance.setOutputTextProperty("MessageHandler: Message is now complete!!");
                    handleDecryptedMessage(t_decryptedMessage);
                    t_tempMessageContent = "";
                }
                // Received complete message directly
                else if (t_opcode == 3)
                {
                    handleDecryptedMessage(t_decryptedMessage);
                }
            }
            catch(Exception)
            {
                m_activeServerInstance.setLogType(2);
                m_activeServerInstance.setOutputTextProperty("MessageHandler: Error when parsing opcode on large message!");
            }
        }

        /// <summary>
        /// Handles decrypted message.
        /// Gets the message type of the received message and performs various operations depending on the message type
        /// </summary>
        /// <param name="i_decryptedMessage">The decrypted message as a string</param>
        public void handleDecryptedMessage(string i_decryptedMessage)
        {
            int t_messageType = getMessageType(i_decryptedMessage);
            m_activeServerInstance.setLogType(0);
            m_activeServerInstance.setOutputTextProperty("MessageHandler: Got message of type from client: " + t_messageType.ToString());
            if(t_messageType != -1)
            {
                // Client requesting start of eye tracker
                if(t_messageType == 1)
                {
                    try
                    {
                        bool t_recordingSucceeded = m_activeServerInstance.requestStartRecording();
                        if (t_recordingSucceeded)
                        {
                            constructResponseMessage(7, true);
                        }
                        else
                        {
                            constructResponseMessage(7, false);
                        }
                    }
                    catch(Exception)
                    {
                        m_activeServerInstance.setLogType(2);
                        m_activeServerInstance.setOutputTextProperty("MessageHandler: Failed to convert request start recording content");
                    }

                }
                // Client requesting pause of eye tracking
                else if(t_messageType == 2)
                {
                    bool t_pauseSucceeded = m_activeServerInstance.requestPauseRecording();
                    if (t_pauseSucceeded)
                    {
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
                    bool t_resumeSucceeded = m_activeServerInstance.requestResumeRecording();
                    if (t_resumeSucceeded)
                    {
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
                    bool t_stopSucceeded = m_activeServerInstance.requestStopRecording();
                    if(t_stopSucceeded)
                    {
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
                    string t_jsonMessage = m_activeServerInstance.requestDataString();
                    m_activeServerInstance.setOutputTextProperty(t_jsonMessage);

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
                    bool t_disconnectSucceeded = m_activeServerInstance.handleClientDisconnectRequest();
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
                        m_activeServerInstance.requestScrollUpdate(t_scrollPosition);
                        m_activeServerInstance.setLogType(0);
                        m_activeServerInstance.setOutputTextProperty("Recorder: Updated scroll height to " + t_scrollPosition.ToString());
                    }
                    else
                    {
                        m_activeServerInstance.setLogType(3);
                        m_activeServerInstance.setOutputTextProperty("MessageHandler: Invalid scroll height received from server");
                    }      
                }
                //Client sending form data
                else if (t_messageType == 14)
                {
                    m_activeServerInstance.setRecorderUserData(i_decryptedMessage);
                }
                //Client requesting info from specific application
                else if(t_messageType == 15)
                {
                    try
                    {
                        JObject t_stringToJSON = JObject.Parse(i_decryptedMessage);
                        string t_applicationData = t_stringToJSON.GetValue("MessageContent").Value<string>();
                        constructResponseMessage(16, true, m_activeServerInstance.getApplicationData(t_applicationData));
                    }
                    catch(Exception e)
                    {
                        m_activeServerInstance.setLogType(2);
                        m_activeServerInstance.setOutputTextProperty("MessageHandler: Failed when converting json message of type " + t_messageType.ToString());
                        m_activeServerInstance.setLogType(2);
                        m_activeServerInstance.setOutputTextProperty("Error message: " + e.ToString());
                    }
                }
                    //Client requesting all application names
                else if(t_messageType == 17)
                {
                    constructResponseMessage(18, true, m_activeServerInstance.getAllApplicationData());
                }
                //Client requesting specific data
                else if(t_messageType == 19)
                {
                    string t_message = "";
                    try
                    {
                        JObject t_stringToJson = JObject.Parse(i_decryptedMessage);
                        string t_testInfo = t_stringToJson.GetValue("MessageContent").Value<string>();

                        JObject t_messageContent = JObject.Parse(t_testInfo);

                        //Getting all specific test info sent from client
                        string t_applicationName = t_messageContent.GetValue("Application").Value<string>();
                        string t_testDate = t_messageContent.GetValue("Date").Value<string>();
                        string t_testerName = t_messageContent.GetValue("Name").Value<string>();
                        int t_testId = t_messageContent.GetValue("Id").Value<int>();

                        t_message = m_activeServerInstance.getSpecificData(t_applicationName, t_testDate, t_testerName, t_testId);
                    }
                    catch(Exception e)
                    {
                        t_message = "NoData";
                        m_activeServerInstance.setLogType(2);
                        m_activeServerInstance.setOutputTextProperty("MessageHandler: Failed when converting json message of type " + t_messageType.ToString());
                        m_activeServerInstance.setLogType(2);
                        m_activeServerInstance.setOutputTextProperty("Error message: "+ e.ToString());
                    }
                    constructResponseMessage(20, true, t_message);
                }
                // MessageType = 21 client requests a new subtest to current test
                else if(t_messageType == 21)
                {
                    m_activeServerInstance.setLogType(0);
                    m_activeServerInstance.setOutputTextProperty("MessageHandler: Client requested a new subtest!");

                    try
                    {
                        JObject t_stringToJson = JObject.Parse(i_decryptedMessage);
                        string t_subTestAddress = t_stringToJson.GetValue("MessageContent").Value<string>();

                        m_activeServerInstance.setLogType(0);
                        m_activeServerInstance.setOutputTextProperty("MessageHandler: New subtest address: " + t_subTestAddress);
                    }
                    catch (Exception)
                    {
                        m_activeServerInstance.setLogType(2);
                        m_activeServerInstance.setOutputTextProperty("MessageHandler: Failed when converting new subtest message content to string! Is it valid json?");
                    }
                }
                // Client sending mouse coordinates
                else if(t_messageType == 23)
                {
                    m_activeServerInstance.setLogType(0);
                    m_activeServerInstance.setOutputTextProperty("MessageHandler: Client sent mouse coordinates!");

                    try
                    {
                        JObject t_stringToJson = JObject.Parse(i_decryptedMessage);
                        string t_messageContent = t_stringToJson.GetValue("MessageContent").Value<string>();

                        // Collecting all values from JObject by key
                        MouseCoord t_mouse = JsonConvert.DeserializeObject<MouseCoord>(t_messageContent);
                      
                        //Add mouse coordinates 
                        if(m_activeServerInstance.addMouseCoordinatesToTest(t_mouse.mouseX, t_mouse.mouseY, t_mouse.timeStampMouse,t_mouse.mouseClickX,t_mouse.mouseClickY,t_mouse.mouseClickTimeStamp))
                        {
                            constructResponseMessage(24, true);
                        }
                        else
                        {
                            constructResponseMessage(24, false);
                        }
                    }
                    catch (Exception e)
                    {
                        m_activeServerInstance.setLogType(2);
                        m_activeServerInstance.setOutputTextProperty("MessageHandler: Failed when parsing Mouse Coordinate message! Is it valid json?");
                        m_activeServerInstance.setLogType(2);
                        m_activeServerInstance.setOutputTextProperty("MessageHandler: Error message: "+e.ToString());
                        constructResponseMessage(24, false);
                    }
                }
                // Client sending document width and height
                else if(t_messageType == 25)
                {
                    try
                    {
                        JObject t_completeMessageAsJSON = JObject.Parse(i_decryptedMessage);
                        string t_messageContentNotParsed = t_completeMessageAsJSON.GetValue("MessageContent").Value<string>();
                        JObject t_messageContentParsed = JObject.Parse(t_messageContentNotParsed);

                        uint t_receivedDocumentWidth = (uint)t_messageContentParsed.GetValue("Width").Value<int>();
                        uint t_receivedDocumentHeight = (uint)t_messageContentParsed.GetValue("Height").Value<int>();

                        m_activeServerInstance.requestRecorderToSetDocumentBounds(t_receivedDocumentWidth, t_receivedDocumentHeight);

                        m_activeServerInstance.setLogType(1);
                        m_activeServerInstance.setOutputTextProperty("MessageHandler: Got document coordinates from client!");
                    }
                    catch(Exception e)
                    {
                        m_activeServerInstance.setLogType(2);
                        m_activeServerInstance.setOutputTextProperty("MessageHandler: Failed when parsing document message! Is it valid json?");
                        m_activeServerInstance.setLogType(3);
                        m_activeServerInstance.setOutputTextProperty("MessageHandler: Error message: " +e.ToString());
                    }
                }
                // Key data from client
                else if(t_messageType == 27)
                {
                    m_activeServerInstance.setLogType(0);
                    m_activeServerInstance.setOutputTextProperty("MessageHandler: Client sent key data!");

                    try
                    {
                        JObject t_stringToJson = JObject.Parse(i_decryptedMessage);
                        string t_messageContent = t_stringToJson.GetValue("MessageContent").Value<string>();

                        // Collecting all values from JObject by key
                        KeyData t_keyData = JsonConvert.DeserializeObject<KeyData>(t_messageContent);

                        //Add mouse coordinates 
                        if (m_activeServerInstance.addKeysToTest(t_keyData.timeStampKey,t_keyData.keys))
                        {
                            constructResponseMessage(28, true);
                        }
                        else
                        {
                            constructResponseMessage(28, false);
                        }
                    }
                    catch (Exception e)
                    {
                        m_activeServerInstance.setLogType(2);
                        m_activeServerInstance.setOutputTextProperty("MessageHandler: Failed when parsing key data message! Is it valid json?");
                        m_activeServerInstance.setLogType(2);
                        m_activeServerInstance.setOutputTextProperty("MessageHandler: Error message: " + e.ToString());
                        constructResponseMessage(28, false);
                    }
                }
                else if(t_messageType == 31)
                {
                    if(m_activeServerInstance != null)
                    {
                        m_activeServerInstance.startAudioPlayer();
                    }
                }
                else if(t_messageType == 32)
                {
                    if (m_activeServerInstance != null)
                    {
                        m_activeServerInstance.pauseAudioPlayer();
                    }
                }
                else if(t_messageType == 33)
                {
                    if (m_activeServerInstance != null)
                    {
                        m_activeServerInstance.resumeAudioPlayer();
                    }
                }
                // Client sending error message
                else if(t_messageType == 99)
                {
                    m_activeServerInstance.setLogType(3);
                    m_activeServerInstance.setOutputTextProperty("MessageHandler: Got error message from server!");
                }
            }
            // Client message didn't contain a valid message type
            else
            {
                m_activeServerInstance.setLogType(2);
                m_activeServerInstance.setOutputTextProperty("MessageHandler: Invalid message type from client");
                // Sending error message to client
            }
        }

        public void serverNotificationToClient(int i_messageType,string i_dataMessage = "")
        {
            if(i_messageType == 18)
            {
                constructResponseMessage(18, true, i_dataMessage);
            }
            else if (i_messageType == 26)
            {
                constructResponseMessage(26, true, i_dataMessage);
            }
            else if(i_messageType == 30)
            {
                constructResponseMessage(30, true, i_dataMessage);
            }
        }


        /// <summary>
        /// Constructing a response message with messagetype and messagecontent based on the message type in the received message
        /// </summary>
        /// <param name="i_messageType">MessageType of previous message as int. Decided in handleDecryptedMessage</param>
        /// <param name="i_succeeded">Some messages requires a succeeded status to determine which type of response message to send (optional)</param>
        /// <param name="i_dataMessage">(optional) a datamessage which will be used as message content in the new message. Could for example be the
        /// data from the current test</param>
        public void constructResponseMessage(int i_messageType, bool i_succeeded = true,string i_dataMessage = "")
        {
            m_activeServerInstance.setLogType(0);
            m_activeServerInstance.setOutputTextProperty("MessageHandler: Constructing message of type: " + i_messageType.ToString());
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
                    m_activeServerInstance.setOutputTextProperty(t_messageToSend);
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
            //Sending application data to client
            else if(i_messageType==16)
            {
                t_responseObject.MessageType = 16;
                t_responseObject.MessageContent = i_dataMessage;

                t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
            }
            //Sending application names to client
            else if(i_messageType == 18)
            {
                t_responseObject.MessageType = 18;
                t_responseObject.MessageContent = i_dataMessage;

                t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
            }
            //Sending specific test data to client
            else if(i_messageType == 20)
            {
                t_responseObject.MessageType = 20;
                t_responseObject.MessageContent = i_dataMessage;

                t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
            }
            //Response to client on mouse coordinates
            else if(i_messageType == 24)
            {
                t_responseObject.MessageType = 24;

                if(i_succeeded)
                {
                    t_responseObject.MessageContent = "Succeeded";
                }
                else
                {
                    t_responseObject.MessageContent = "Failed";
                }
                t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
            }
            else if(i_messageType == 26)
            {
                t_responseObject.MessageType = 26;
                t_responseObject.MessageContent = i_dataMessage;

                t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
            }
            else if(i_messageType == 28)
            {
                t_responseObject.MessageType = 28;

                if (i_succeeded)
                {
                    t_responseObject.MessageContent = "Succeeded";
                }
                else
                {
                    t_responseObject.MessageContent = "Failed";
                }
                t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
            }
            else if(i_messageType == 30)
            {
                t_responseObject.MessageType = 30;
                t_responseObject.MessageContent = i_dataMessage;

                t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
            }
             // error message
            else if(i_messageType == 99)
            {
               
                 t_responseObject.MessageType = 99;
                 t_responseObject.MessageContent = "Invalid Message";
                 // Serialize object (convert it to a string)
                 t_messageToSend = JsonConvert.SerializeObject(t_responseObject, Formatting.None);
            }
            
            //Send message to server instance
            sendResponseMessage(t_messageToSend);
        }

        // Telling server to handle the constructed message and send it to the server
        public void sendResponseMessage(string i_message)
        {
            m_activeServerInstance.writeToSocket(i_message);
        }

        /// <summary>
        /// Gets the message type of the received message.
        /// </summary>
        /// <param name="i_message">The message as a string</param>
        /// <returns>The collected message type. -1 if error in message</returns>
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
                m_activeServerInstance.setLogType(2);
                m_activeServerInstance.setOutputTextProperty("MessageHandler: Couldn't receive message type");
                Console.WriteLine("Something went wrong " + e.ToString());
            }

            return t_messageType;
        }

        /// <summary>
        /// Will try to received message content as an int. Used when getting a updatescrollheight message from the client where the message content is
        /// the new scroll height
        /// </summary>
        /// <param name="i_message">String, the received message from client in a decrypted state</param>
        /// <returns>Returning the message content as an int, -1 if an error occurred</returns>
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
                m_activeServerInstance.setLogType(2);
                m_activeServerInstance.setOutputTextProperty("MessageHandler: Couldn't convert message content to integer when updating scroll height");
                m_activeServerInstance.setLogType(2);
                m_activeServerInstance.setOutputTextProperty("Something went wrong (message is not an int)" + e.ToString());
            }
            return t_messageContent;
        }
    }
}
