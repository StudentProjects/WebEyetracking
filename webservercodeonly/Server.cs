// Server.cs
// Created by: Daniel Johansson
// Edited by: 

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading;
using System.Net.Sockets;
using System.Net;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System.Windows.Forms;
using System.Xml;
using System.IO;
using System.Reflection;

namespace eyexwebServerv1
{
    public class Server
    {
        // Server related variables //
        private int m_portNo;
        private string m_ipAddress;
        private Form1 m_formReference;
        private Thread m_listeningThread;
        private Thread m_recieveDataThread;
        private TcpClient m_connectedClient;
        private TcpListener m_socketListener;
        private bool m_isTerminatingListeningThread;
        private bool m_safeToExit;
        private EYE m_recorderInstance;
        private MessageHandler m_messageHandler;

        // CONSTRUCTOR //
        // Construct the server
        public Server(string i_ipAddress,int i_portNo,Form1 i_form)
        {
            // Initialize variables
            m_formReference = i_form;
            m_ipAddress = i_ipAddress;
            m_portNo = i_portNo;
            m_isTerminatingListeningThread = false;
            m_safeToExit = false;

            // Initializing server and recorder
            initializeServerComponents();
            initializeRecorder();
            TestXml();
        }

        // DESTRUCTOR //
        ~Server()
        {

        }

        // METHODS //

       void TestXml()
       {
           string t_folderPath = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), @"Saved");
           string t_xmlPath = Path.Combine(t_folderPath, @"config.xml");

           if(File.Exists(t_xmlPath))
           {
               XmlTextReader reader = new XmlTextReader(t_xmlPath);
               string ipaddress = "";
               bool ipfound = false;
               bool iptextfound = false;
               bool textfound = false;
               while (reader.Read())
               {
                   switch (reader.NodeType)
                   {
                       case XmlNodeType.Element: // The node is an element.

                               if (!ipfound)
                               {
                                   if (reader.Name == "IPADDRESS")
                                   {
                                       ipfound = true;
                                   }
                               }
                               if (ipfound && !iptextfound)
                               {
                                   if (reader.Name == "IPText")
                                   {
                                       iptextfound = true;
                                       while(reader.MoveToNextAttribute())
                                       {
                                           if (ipfound && iptextfound && !textfound)
                                           {
                                               if (reader.Name == "attrvalue")
                                               {
                                                   ipaddress = reader.Value;
                                                   textfound = true;
                                               }
                                           }
                                       }
                                   }
                               }
                           
                           
                           break;
                       case XmlNodeType.Text: //Display the text in each element.
                           updateOutputLog("NodeType: Text, value is: " + reader.Value);
                           break;
                   }
               }

               updateOutputLog(ipaddress);
           }
           else
           {
        
           }
           
       }

        void initializeServerComponents()
        {
            // Surround with try catch if the initialization of the server would fail
            try
            {
                // Starting server and notify form
                m_socketListener = new TcpListener(IPAddress.Parse(m_ipAddress), m_portNo);
                m_socketListener.Start();
                updateOutputLog("A server has started!");

                // start listening thread

                m_listeningThread = new Thread(new ThreadStart(listenForConnection));
                // Run as background thread. Will exit with the program
                m_listeningThread.IsBackground = true;
                m_listeningThread.Start();

                // Initializing the message handler
                m_messageHandler = new MessageHandler(this);
                updateOutputLog("Waiting for client!");
            }
            catch(Exception e)
            {
                updateOutputLog("Error when starting server: " + e.ToString());
            }     
        }

        // Initializes the recorder on startup
        void initializeRecorder()
        {
            // Initialize the recorder
            m_recorderInstance = new EYE(Screen.PrimaryScreen.Bounds.Height, Screen.PrimaryScreen.Bounds.Width);

            // updating display on form
            updateDisplayHeightWidthToForm(Screen.PrimaryScreen.Bounds.Height, Screen.PrimaryScreen.Bounds.Width);

            updateOutputLog("Finished initializing recorder!");
        }

        // Request start of a new recording
        public bool requestStartRecording()
        {
            bool t_succeeded = true;
            if(m_recorderInstance != null)
            {
                t_succeeded = m_recorderInstance.startRecording("TestUser");
            }
            return t_succeeded;
        }

        // request the current recording to pause
        public bool requestPauseRecording()
        {
            bool t_succeeded = true;
            if (m_recorderInstance != null)
            {
                t_succeeded = m_recorderInstance.pauseRecording();
            }
            return t_succeeded;
        }

        // request the recording instance to resume
        public bool requestResumeRecording()
        {
            bool t_succeeded = true;
            if (m_recorderInstance != null)
            {
                t_succeeded = m_recorderInstance.resumeRecording();
            }
            return t_succeeded;
        }

        // Request the recording instance to stop
        public bool requestStopRecording()
        {
            bool t_succeeded = true;
            if (m_recorderInstance != null)
            {
                t_succeeded = m_recorderInstance.stopRecording();
            }
            return t_succeeded;
        }

        // Collecting the data string from the latest test from the eye instance
        public string requestDataString()
        {
            return m_recorderInstance.getDataString();
        }

        // Asking eye object instance to update to the current scrollposition
        public void requestScrollUpdate(int i_newScrollHeight)
        {
            m_recorderInstance.setScrollPosition(i_newScrollHeight);
        }

        Byte[] constructHandshakeMessage(string i_message)
        {
            Byte[] response = Encoding.UTF8.GetBytes("HTTP/1.1 101 Switching Protocols" + Environment.NewLine
                        + "Connection: Upgrade" + Environment.NewLine
                        + "Upgrade: websocket" + Environment.NewLine
                        + "Sec-WebSocket-Accept: " + Convert.ToBase64String(
                            SHA1.Create().ComputeHash(
                                Encoding.UTF8.GetBytes(
                                    new Regex("Sec-WebSocket-Key: (.*)").Match(i_message).Groups[1].Value.Trim() + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
                                )
                            )
                        ) + Environment.NewLine
                        + Environment.NewLine);
            return response;
        }


        // USED BY THREADS //
        public void listenForConnection()
        {
            // Blocking signal waiting for a client to connect
            m_connectedClient = m_socketListener.AcceptTcpClient();
            // Moving forward if client connected
            updateOutputLog("A client connected!");
            // Getting the client stream so that the server can read and write data to it
            NetworkStream t_clientStream = m_connectedClient.GetStream();
            while (true)
            {
                // Wait until handshake data is available
                while (!t_clientStream.DataAvailable);
                Byte[] bytes = new Byte[m_connectedClient.Available];
                t_clientStream.Read(bytes, 0, bytes.Length);

                // Convert recieved bytes to string with UTF-8 standard
                String t_messageData = Encoding.UTF8.GetString(bytes);

                // HANDSHAKE BETWEEN SERVER AND CLIENT //
                // Handshaking session started
                // Checking if the request message is correct
                if (new Regex("^GET").IsMatch(t_messageData))
                {
                    // Constructing handshake response message to send to the client
                    // Adding magic key
                    Byte[] response = constructHandshakeMessage(t_messageData);

                    // Write response on client stream and finalize handshake process
                    t_clientStream.Write(response, 0, response.Length);
                    // Handshake is done
                    updateOutputLog("Handshake done!");
                    break;
                }
                else
                {
                    // If the handshake failed it is just printed to the log
                    updateOutputLog("Failed on handshake.. Retrying");
                }
            }

            updateOutputLog("Terminating handshake thread! Started client reader thread!");
            updateClientStatus(0);

            // Starting client listening thread
            // resetting variables which handles the thread safe killing control every time a new client connects
            resetThreadSpecificVariables();
            m_recieveDataThread = new Thread(new ThreadStart(readClientData));
            m_recieveDataThread.Start();
            // Set as background thread so it will exit when the main thread dies
            m_recieveDataThread.IsBackground = true;
            // Closing this thread because the handshake is done and a client is connected to the server
            m_listeningThread.Abort();
        }

        // Runned by a thread. As long as the thread is alive
        // and there is a connected client this function will check for incoming data and send the data to appropiate functions
        void readClientData()
        {
            //Only run if this thread is not supposed to terminate
            if(!m_isTerminatingListeningThread)
            {
                // Is client still connected?
                if (m_connectedClient.Connected)
                {
                    NetworkStream t_incomingStream = m_connectedClient.GetStream();
                    while (true)
                    {
                        bool t_isConnected = true;
                        while (!t_incomingStream.DataAvailable)
                        {               
                            if(m_isTerminatingListeningThread && m_safeToExit)
                            {
                                break;
                            }
                        }
                        if (t_isConnected && !m_isTerminatingListeningThread)
                        {
                            updateOutputLog("Data received from client");
                            // Read all available data and store it in an array
                            Byte[] t_receivedBytes = new Byte[m_connectedClient.Available];
                            t_incomingStream.Read(t_receivedBytes, 0, t_receivedBytes.Length);
                            t_incomingStream.Flush();
                            // Send decrypted string to HandleMessage which will do something with the message
                            // Setting safe to exit to false so that the thread doesn't get killed while handling messages
                            m_safeToExit = false;
                            // Sending the message to messagehandler
                            m_messageHandler.decryptMessage(t_receivedBytes);
                            // The thread can successfully exit when the message has been handled
                            m_safeToExit = true;
                        }
                        else
                        {
                            if(m_safeToExit)
                            {
                                // Closing client socket
                                // if exit is possible
                                m_connectedClient.Close();
                                break;  
                            }
                            
                        }
                    }

                } 
            }              
        }

      
        // VISUAL FORM RELATED
        public void updateOutputLog(string i_text)
        {
            m_formReference.updateOutputLogBox(i_text);
        }

        public void updateDisplayHeightWidthToForm(int i_newDisplayHeight,int i_newDisplayWidth)
        {
            m_formReference.updateDisplayHeight(i_newDisplayHeight);
            m_formReference.updateDisplayWidth(i_newDisplayWidth);
        }

        public void updateClientStatus(int i_type)
        {
            // Switching on client status type
            // 0 = Connected, 1= Not connected
            switch(i_type)
            {
                case 0:
                    m_formReference.updateClientStatusLabel("Connected");
                    break;
                case 1:
                    m_formReference.updateClientStatusLabel("Not connected");
                    break;
            }
        }
        public void updateEyeTrackingStatus(int i_type)
        {
            // Switching on status type
            // 0 = Online, 1= Offline, 2=Paused
            switch(i_type)
            {
                case 0:
                    m_formReference.updateEyeTrackStatus("Online");
                    break;
                case 1:
                    m_formReference.updateEyeTrackStatus("Offline");
                    break;
                case 2:
                    m_formReference.updateEyeTrackStatus("Paused");
                    break;
            }
        }

        // Notifies eye class instance to update display
        public void requestDisplayHeightUpdateEYE(int i_displayHeight)
        {
            if (m_recorderInstance != null)
            {
                m_recorderInstance.setDisplayHeight(i_displayHeight);
                updateOutputLog("Updated Display Height to: " + i_displayHeight.ToString());
            }
        }

        // request to update width and print to log
        public void requestDisplayWidthUpdateEYE(int i_displayWidth)
        {
            if(m_recorderInstance != null)
            {
                m_recorderInstance.setDisplayWidth(i_displayWidth);
                updateOutputLog("Updated Display Width to: " + i_displayWidth.ToString());
            }
        }

        // Resetting variables which are used by the client listening thread
        // Should be used when a new client connects
        void resetThreadSpecificVariables()
        {
            m_isTerminatingListeningThread = false;
            m_safeToExit = false;
        }

        // Removing client and restarting listening thread which will wait for new connections
        // Returning success or failed. Bool later used by MessageHandler Instance.
        public bool handleClientDisconnectRequest()
        {
            if(m_recieveDataThread.IsAlive && m_recieveDataThread != null)
            {
                m_isTerminatingListeningThread = true;
                // Restarting listening

                // UPDATE FORM FOR VISUALIZATION
                updateClientStatus(1);
                updateOutputLog("Disconnecting old client!.. Waiting for new client..");

                //Stop recording if the recording is currently active
                m_recorderInstance.stopRecording();
                updateEyeTrackingStatus(1);

                // Starting listener thread
                m_listeningThread = null;
                m_listeningThread = new Thread(new ThreadStart(listenForConnection));
                m_listeningThread.IsBackground = true;
                m_listeningThread.Start();
                Thread.Sleep(1);
                return true;
            }
            return false;
        }

        // Write message to connected sockets stream
        // Adding header to message which states that this is the entire message
        public void writeToSocket(string i_message)
        {
            // Only messages which contains something will be written to the client
            if (i_message != String.Empty)
            {
                // Safety check to see if the client is still connected to this server
                if (m_connectedClient != null && m_connectedClient.Connected)
                {
                        // Getting client stream
                        NetworkStream t_clientStream = m_connectedClient.GetStream();
                        // Extra space added for message header
                        string t_totalMessage = i_message;
                        byte[] t_sendingByte = Encoding.UTF8.GetBytes(t_totalMessage);
                        int t_messageLength = t_sendingByte.Length;
                        byte[] t_headerFrame = new byte[10];

                        int t_frameCount = 0;
                        // If length is less or equal to 125 we don't need to mask the message
                        if(t_sendingByte.Length <= 125)
                        {
                            t_headerFrame[0] = 0x81; // final message and it is a text
                            t_headerFrame[1] = (byte)t_sendingByte.Length;
                            t_frameCount = 2;
                        }
                        // A bit larger message, masking header with 3 bytes
                        else if(t_sendingByte.Length >= 126 && t_sendingByte.Length <= 65535)
                        {
                            // This is the final message and it is a text
                            t_headerFrame[0] = 0x81;  // final message and it is a text
                            t_headerFrame[1] = (byte)126;
                            // Interpent as a 16-bit unsigned integer which defines messages length
                            t_headerFrame[2] = (byte)((t_messageLength >> 8) & (byte)255);
                            t_headerFrame[3] = (byte)(t_messageLength & (byte)255);
                            t_frameCount = 4;
                        }
                            // A very large message, masking the header with 9 bytes
                        else
                        {
                            t_headerFrame[0] = 0x81;  // final message and it is a text
                            t_headerFrame[1] = (byte)127;
                            // Interpent as a 64-bit unsigned integer which defines messages length
                            t_headerFrame[2] = (byte)((t_messageLength >> 56) & (byte)255);
                            t_headerFrame[3] = (byte)((t_messageLength >> 48) & (byte)255);
                            t_headerFrame[4] = (byte)((t_messageLength >> 40) & (byte)255);
                            t_headerFrame[5] = (byte)((t_messageLength >> 32) & (byte)255);
                            t_headerFrame[6] = (byte)((t_messageLength >> 24) & (byte)255);
                            t_headerFrame[7] = (byte)((t_messageLength >> 16) & (byte)255);
                            t_headerFrame[8] = (byte)((t_messageLength >> 8) & (byte)255);
                            t_headerFrame[9] = (byte)(t_messageLength & (byte)255);
                            t_frameCount = 10;
                        }

                        // Constructing the final response message //
                        // Adding message to message header
                        int t_totalLength = t_frameCount + t_sendingByte.Length;
                        byte[] t_replyMessage = new byte[t_totalLength];

                        int t_counter = 0;

                        for (int i = 0; i < t_frameCount; i++)
                        {
                            t_replyMessage[t_counter] = t_headerFrame[i];
                            t_counter++;
                        }

                        for (int i = 0; i < t_sendingByte.Length;i++)
                        {
                            t_replyMessage[t_counter] = t_sendingByte[i];
                            t_counter++;
                        }

                        // Avoiding possible errors
                        try
                        {
                            // Write the message to the open stream
                            t_clientStream.Write(t_replyMessage, 0, t_replyMessage.Length);
                            // cleanup stream
                            t_clientStream.Flush();
                            // For better UX, printing info to the local form telling that the message was sent
                            updateOutputLog("Successfully sent");
                        }
                        catch(Exception e)
                        {
                            updateOutputLog("Error when sending!: " + e.ToString());
                        }
                        
                    
                }
            }
        }
    }
}
