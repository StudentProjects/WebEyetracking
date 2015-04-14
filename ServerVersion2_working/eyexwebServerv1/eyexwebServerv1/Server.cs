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
        private int m_clientStatus;
        private int m_recorderStatus;
        private int[] m_coordinates;
        private string m_ipAddress;
        private string m_outputMessage;
        private int m_logType;
        private Thread m_listeningThread;
        private Thread m_recieveDataThread;
        private TcpClient m_connectedClient;
        private TcpListener m_socketListener;
        private bool m_isTerminatingListeningThread;
        private bool m_safeToDisconnectClient;
        private bool m_startSucceded;
        private EYE m_recorderInstance;
        private MessageHandler m_messageHandler;
        private FileSaver m_fileSaver;
        private FileLoader m_fileLoader;

        // declare event
        public event EventHandler onOutputTextUpdate = delegate { };
        public event EventHandler onClientStatusUpdate = delegate { };
        public event EventHandler onRecorderStatusUpdate = delegate { };
        public event EventHandler onDisplayCoordUpdate = delegate { };

        // CONSTRUCTOR //
        // Construct the server
        public Server(string i_ipAddress,int i_portNo)
        {
            // Initialize variables
            m_ipAddress = i_ipAddress;
            m_portNo = i_portNo;
            m_isTerminatingListeningThread = false;
            m_safeToDisconnectClient = false;
            m_startSucceded = false;
            m_outputMessage = "";
            m_clientStatus = -1;
            m_recorderStatus = -1;
            m_logType = 0;
            m_fileSaver = new FileSaver();
            m_fileLoader = new FileLoader();
            //Listening for file messages
            
            // Initializing server and recorder
            initializeServerComponents();
            initializeRecorder();
        }

        // DESTRUCTOR //
        ~Server()
        {

        }

        // METHODS //
        void initializeServerComponents()
        {
            // Surround with try catch if the initialization of the server would fail
            try
            {
                // Starting server and notify form
                m_socketListener = new TcpListener(IPAddress.Parse(m_ipAddress), m_portNo);
                m_socketListener.Start();

                // start listening thread
                m_listeningThread = new Thread(new ThreadStart(listenForConnection));
                // Run as background thread. Will exit with the program
                m_listeningThread.IsBackground = true;
                m_listeningThread.Start();

                // Initializing the message handler
                m_messageHandler = new MessageHandler(this);

                m_startSucceded = true;
            }
            catch(Exception)
            {
                // Alerting error
                MessageBox.Show("Failed to initialize server with specified parameters", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }     
        }

        public void printStartLogAndPrepareFileSaver()
        {
            if(m_startSucceded)
            {
                m_logType = 1;
                outputTextProperty = "Server: Started listening on address: " + m_ipAddress + ":" + m_portNo.ToString();
                m_logType = 0;
                outputTextProperty = "Server: Waiting for client..";
                m_logType = 1;
                outputTextProperty = "Server: Finished initializing recorder!";

                // updating display on form
                int[] t_startCoordinates = { Screen.PrimaryScreen.Bounds.Height, Screen.PrimaryScreen.Bounds.Width };
                displayCoordProperty = t_startCoordinates;

                m_fileSaver.onFileSaveNotificationUpdate += new EventHandler(this.updateOutputOnFileEvent);
                m_fileSaver.initialize();
                m_fileLoader.onFileLoadNotificationUpdate += new EventHandler(this.updateOutputOnFileLoadEvent);
                m_fileLoader.initialize();
            }
            else
            {
                m_logType = 2;
                outputTextProperty = "Server: Failed to start server on specified address: " + m_ipAddress + ":" + m_portNo.ToString();
                m_logType = 3;
                outputTextProperty = "Server: Please check parameters and firewall, then try again";
            }
        }

        // Initializes the recorder on startup
        private void initializeRecorder()
        {
            // Initialize the recorder
            m_recorderInstance = new EYE(Screen.PrimaryScreen.Bounds.Height, Screen.PrimaryScreen.Bounds.Width,m_fileSaver);
        }

        // Updated logtype. Can be reached from messagehandler
        public void setLogType(int i_logType)
        {
            m_logType = i_logType;
        }

        // PROPERTIES //
        private string outputTextProperty
        {
            get { return m_outputMessage; }
            set
            {
                m_outputMessage = value;
                if (m_outputMessage == outputTextProperty)
                {
                    onOutputTextUpdate(this, new OutputTextArgs(m_outputMessage,m_logType));
                }
            }
        }

        private int clientTextProperty
        {
            get { return m_clientStatus;  }
            set
            {
                m_clientStatus = value;
                if (m_clientStatus == clientTextProperty)
                {
                    onClientStatusUpdate(this, new LabelTextArgs(m_clientStatus));
                }
            }
        }

        private int recorderStatusProperty
        {
            get { return m_recorderStatus; }
            set
            {
                m_recorderStatus = value;
                if(m_recorderStatus == recorderStatusProperty)
                {
                    onRecorderStatusUpdate(this, new LabelTextArgs(m_recorderStatus));
                }
            }
        }

        private int[] displayCoordProperty
        {
            get { return m_coordinates; }
            set
            {
                m_coordinates = value;
                if(m_coordinates == displayCoordProperty)
                {
                    onDisplayCoordUpdate(this, new DisplayArgs(m_coordinates));
                }
            }
        }
        // END OF PROPERTIES //


        // Request start of a new recording
        public bool requestStartRecording()
        {
            bool t_succeeded = true;
            if(m_recorderInstance != null)
            {
                t_succeeded = m_recorderInstance.startRecording();
                if (t_succeeded)
                {
                    recorderStatusProperty = 0;
                }
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
                if (t_succeeded)
                {
                    recorderStatusProperty = 2;
                }
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
                if (t_succeeded)
                {
                    recorderStatusProperty = 0;
                }
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

                if(t_succeeded)
                {
                    recorderStatusProperty = 1;
                }
            }
            return t_succeeded;
        }

        // Removing client and restarting listening thread which will wait for new connections
        // Returning success or failed. Bool later used by MessageHandler Instance.
        public bool handleClientDisconnectRequest()
        {
            if (m_recieveDataThread.IsAlive && m_recieveDataThread != null)
            {
                m_isTerminatingListeningThread = true;
                // Restarting listening

                // UPDATE FORM FOR VISUALIZATION
                clientTextProperty = 1;
                m_logType = 1;
                outputTextProperty = "Server: Disconnecting old client!.. Waiting for new client..";

                //Stop recording if the recording is currently active
                m_recorderInstance.stopRecording();
                m_recorderInstance.clearPreviousUserInfo();
                recorderStatusProperty = 1;

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

        private Byte[] constructHandshakeMessage(string i_message)
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
        private void listenForConnection()
        {
            // Blocking signal waiting for a client to connect
            m_connectedClient = m_socketListener.AcceptTcpClient();
            // Moving forward if client connected
            m_logType = 1;
            outputTextProperty = "Server: A client connected!";
            m_logType = 0;
            outputTextProperty = "Server: Performing handshake with new client";
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
                    m_logType = 1;
                    outputTextProperty = "Server: Handshake with client done!";
                    break;
                }
                else
                {
                    // If the handshake failed it is just printed to the log
                    m_logType = 2;
                    outputTextProperty = "Server: Failed on handshake.. Retrying";
                }
            }

            m_logType = 0;
            outputTextProperty = "Server: Terminating handshake thread! Started client reader thread!";
            clientTextProperty = 0;

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
        private void readClientData()
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
                        bool t_isConnected = m_connectedClient.Connected;
                        while (!t_incomingStream.DataAvailable)
                        {               
                            if(m_isTerminatingListeningThread && m_safeToDisconnectClient)
                            {
                                break;
                            }
                        }
                        if (t_isConnected && !m_isTerminatingListeningThread)
                        {
                            m_logType = 0;
                            outputTextProperty = "Server: Message received from client!";
                            // Read all available data and store it in an array
                            Byte[] t_receivedBytes = new Byte[m_connectedClient.Available];
                            t_incomingStream.Read(t_receivedBytes, 0, t_receivedBytes.Length);
                            t_incomingStream.Flush();
                            // Send decrypted string to HandleMessage which will do something with the message
                            // Setting safe to exit to false so that the thread doesn't get killed while handling messages
                            m_safeToDisconnectClient = false;
                            // Sending the message to messagehandler
                            m_messageHandler.decryptMessage(t_receivedBytes);
                            // The thread can successfully exit when the message has been handled
                            m_safeToDisconnectClient = true;
                        }
                        else
                        {
                            if(m_safeToDisconnectClient)
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

        // Notifies eye class instance to update display
        public void requestDisplayHeightUpdateEYE(int i_displayHeight)
        {
            if (m_recorderInstance != null)
            {
                m_recorderInstance.setDisplayHeight(i_displayHeight);
                m_logType = 1;
                outputTextProperty = "Recorder: Updated Display Height to: " + i_displayHeight.ToString();
            }
        }

        // request to update width and print to log
        public void requestDisplayWidthUpdateEYE(int i_displayWidth)
        {
            if(m_recorderInstance != null)
            {
                m_recorderInstance.setDisplayWidth(i_displayWidth);
                m_logType = 1;
                outputTextProperty = "Recorder: Updated Display Width to: " + i_displayWidth.ToString();
            }
        }

        // Handle a form update
        public void setRecorderUserData(string i_values)
        {
            try
            {
                JObject t_stringToJSON = JObject.Parse(i_values);
                string t_messageContent = t_stringToJSON.GetValue("MessageContent").Value<string>();
                m_logType = 0;
                outputTextProperty = t_messageContent;
                t_stringToJSON = JObject.Parse(t_messageContent);
                string t_name = t_stringToJSON.GetValue("Name").Value<string>();
                string t_age = t_stringToJSON.GetValue("Age").Value<string>();
                string t_occupation = t_stringToJSON.GetValue("Occupation").Value<string>();
                string t_location = t_stringToJSON.GetValue("Location").Value<string>();
                string t_computerusage = t_stringToJSON.GetValue("ComputerUsage").Value<string>();
                string t_application = t_stringToJSON.GetValue("Application").Value<string>();
                string t_otherinfo = t_stringToJSON.GetValue("Other").Value<string>();

                m_recorderInstance.insertUserData(t_name, t_age, t_occupation, t_location, t_computerusage, t_application, t_otherinfo);

            }
            catch (Exception e)
            {
                m_logType = 2;
                outputTextProperty = "Server: Error when parsing USERINFO received from client: " + e.ToString();
                m_logType = 3;
                outputTextProperty = "Server: Is the form filled in correctly in the extension?";
            }
        }

        public string getSpecificData(string i_application,string i_date,string i_testerName,int i_id)
        {
            return m_fileLoader.getSpecificTestData(i_application, i_date, i_testerName, i_id);
        }

        // Resetting variables which are used by the client listening thread
        // Should be used when a new client connects
        private void resetThreadSpecificVariables()
        {
            m_isTerminatingListeningThread = false;
            m_safeToDisconnectClient = false;
        }

        public void setOutputTextProperty(string i_text)
        {
            outputTextProperty = i_text;
        }

        public string getApplicationData(string i_applicationName)
        {
            return m_fileLoader.getApplicationData(i_applicationName);
        }

        public string getAllApplicationData()
        {
            return m_fileLoader.getAllApplicationData();
        }

        //Event handler when file saver changes
        private void updateOutputOnFileEvent(object e, EventArgs arg)
        {
            OutputTextArgs t_arguments = (OutputTextArgs)arg;

            int t_logType = t_arguments.getType;
            string t_logMessage = t_arguments.getEventText;

            m_logType = t_logType;
            outputTextProperty = t_logMessage;
        }
        //Event handler when file saver changes
        private void updateOutputOnFileLoadEvent(object e, EventArgs arg)
        {
            OutputTextArgs t_arguments = (OutputTextArgs)arg;

            int t_logType = t_arguments.getType;
            string t_logMessage = t_arguments.getEventText;

            m_logType = t_logType;
            outputTextProperty = t_logMessage;
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
                            m_logType = 1;
                            outputTextProperty = "Server: Successfully sent a message to client";
                        }
                        catch(Exception e)
                        {
                            m_logType = 2;
                            outputTextProperty = "Server: Error when sending message - " + e.ToString();
                        }
                                            
                }
            }
        }
    }
}
