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

namespace tieto.education.eyetrackingwebserver
{
    
    // The main server class. Handles clients and receives messages from client
    public class Server
    {
        // Server related variables //
        private int m_portNo;
        private int m_clientStatus;
        private int m_recorderStatus;
        private int m_logType;
        private int[] m_coordinates;

        private string m_ipAddress;
        private string m_outputMessage;     
        
        private bool m_isTerminatingListeningThread;
        private bool m_safeToDisconnectClient;
        private bool m_startSucceded;
        private bool m_clientConnected;
        private bool m_runListeningThread;
        private bool m_runClientThread;

        private Thread m_listeningThread;
        private Thread m_recieveDataThread;
        private TcpClient m_connectedClient;
        private TcpListener m_socketListener;
        private EYE m_recorderInstance;
        private MessageHandler m_messageHandler;
        private FileSaver m_fileSaver;
        private FileLoader m_fileLoader;

        // declare event
        public event EventHandler onOutputTextUpdate = delegate { };
        public event EventHandler onClientStatusUpdate = delegate { };
        public event EventHandler onRecorderStatusUpdate = delegate { };
        public event EventHandler onDisplayCoordUpdate = delegate { };
        public event EventHandler onClientConnected = delegate { };

        /// <summary>
        /// Initializes variables and start a listening server based on the received parameters
        /// </summary>
        /// <example>
        /// An initalization of the server might look as this
        /// </example>
        /// <code>
        /// Server m_serverInstance = new Server("127.0.0.1",5746);
        /// </code>
        /// <param name="i_ipAddress">The requested IP-address as a string</param>
        /// <param name="i_portNo">The requested port number as an integer</param>
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
            m_clientConnected = false;
            m_runListeningThread = true;
            m_runClientThread = false;
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

        /// <summary>
        /// Initalizes the the listening server and starting listening thread.
        /// Initializes the messagehandler
        /// </summary>
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

        /// <summary>
        /// Prints a start log message and initializes the file saver and the file loader
        /// </summary>
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

        /// <summary>
        /// Initializes the EYE class with the screen bounds and binds the EYE onTextUpdate to this class's EventHandler updateOutputOnRecorderEvent
        /// </summary>
        private void initializeRecorder()
        {
            // Initialize the recorder
            m_recorderInstance = new EYE(Screen.PrimaryScreen.Bounds.Height, Screen.PrimaryScreen.Bounds.Width,m_fileSaver);

            // Listening to recorder log messages
            m_recorderInstance.onTextUpdate += new EventHandler(this.updateOutputOnRecorderEvent);
            m_recorderInstance.onDataSaved += new EventHandler(this.dataSavedEvent);
        }

        /// <summary>
        /// Updates the current log type 
        /// </summary>
        /// <param name="i_logType">the new log type</param>
        public void setLogType(int i_logType)
        {
            m_logType = i_logType;
        }

        // PROPERTIES //

        /// <summary>
        /// fires event of type onOutputTextUpdate if the value changes
        /// </summary>
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

        private bool clientConnectedProperty
        {
            get { return m_clientConnected; }
            set
            {
                m_clientConnected = value;
                onClientConnected(this, new DisconnectButtonArgs(m_clientConnected));
            }
        }

        /// <summary>
        /// fires event of type onClientStatusUpdate if the value changes
        /// </summary>
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

        /// <summary>
        /// fires event of type onRecorderStatusUpdate if the value changes
        /// </summary>
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

        /// <summary>
        /// fires event of type onDisplayCoordUpdate if the value changes
        /// </summary>
        private int[] displayCoordProperty
        {
            get { return m_coordinates; }
            set
            {
                m_coordinates = value;
                if(m_coordinates == displayCoordProperty)
                {
                    m_recorderInstance.setDisplayHeight(m_coordinates[0]);
                    m_recorderInstance.setDisplayHeight(m_coordinates[1]);
                    onDisplayCoordUpdate(this, new DisplayArgs(m_coordinates));
                }
            }
        }

       /// <summary>
       /// Sends a request to the Recorder instance to start a recording with parameters received from MessageHandler
       /// </summary>
       /// <param name="i_requestedTestType">The requested test type 0=Eye,1=Mouse,2=Both</param>
       /// <param name="i_pageWidth">Page width of the application the test is performed on</param>
       /// <param name="i_pageHeight">Page height of the application the test is performed on</param>
       /// <returns>A bool which indicates if the start recording request was successful</returns>
        public bool requestStartRecording(int i_requestedTestType)
        {
            bool t_startRecordingSucceeded = true;
            if(m_recorderInstance != null)
            {
                t_startRecordingSucceeded = m_recorderInstance.startRecording(i_requestedTestType);
                if (t_startRecordingSucceeded)
                {
                    recorderStatusProperty = 0;
                    // updating display on form
                    int[] t_startCoordinates = { Screen.PrimaryScreen.Bounds.Height, Screen.PrimaryScreen.Bounds.Width };
                    displayCoordProperty = t_startCoordinates;
                }
            }
            return t_startRecordingSucceeded;
        }

        /// <summary>
        /// Sends a request to the Recorder instance to pause a recording instance
        /// </summary>
        /// <returns>A bool which indicates if the pausing was successful or not</returns>
        public bool requestPauseRecording()
        {
            bool t_pauseRecordingSucceeded = true;
            if (m_recorderInstance != null)
            {
                t_pauseRecordingSucceeded = m_recorderInstance.pauseRecording();
                if (t_pauseRecordingSucceeded)
                {
                    recorderStatusProperty = 2;
                }
            }
            return t_pauseRecordingSucceeded;
        }

        /// <summary>
        /// Sends a request to the Recorder instance to resume a paused recording instance
        /// </summary>
        /// <returns>A bool indicating whether the resume operation succeeded or failed</returns>
        public bool requestResumeRecording()
        {
            bool t_resumeRecordingSucceeded = true;
            if (m_recorderInstance != null)
            {
                t_resumeRecordingSucceeded = m_recorderInstance.resumeRecording();
                if (t_resumeRecordingSucceeded)
                {
                    recorderStatusProperty = 0;
                }
            }
            return t_resumeRecordingSucceeded;
        }

        /// <summary>
        /// Sends a request to the recording instance to stop an active recording session
        /// </summary>
        /// <returns>A bool indicating whether the stop command went through successfully or if it failed</returns>
        public bool requestStopRecording()
        {
            bool t_stopRecordingSucceeded = true;
            if (m_recorderInstance != null)
            {
                t_stopRecordingSucceeded = m_recorderInstance.stopRecording();

                if (t_stopRecordingSucceeded)
                {
                    recorderStatusProperty = 1;
                }
            }
            return t_stopRecordingSucceeded;
        }

        /// <summary>
        /// Handles a client disconnect request received from server or if the client disconnected unexpectiedly
        /// Logging messages and ends all possible active recordings.
        /// Sets terminatethread bool to true so that the client listening thread can exit.
        /// Restarts the listening thread which will wait for new clients
        /// </summary>
        /// <returns>A bool which indicates whether the client was successfully disconnected or not</returns>
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
                clientConnectedProperty = false;

                //Stop recording if the recording is currently active
                m_recorderInstance.stopRecording();
                m_recorderInstance.clearPreviousTest(1);
                recorderStatusProperty = 1;

                // Starting listener thread
                m_runListeningThread = true;
                m_listeningThread = null;
                m_listeningThread = new Thread(new ThreadStart(listenForConnection));
                m_listeningThread.IsBackground = true;
                m_listeningThread.Start();
                Thread.Sleep(1);
                return true;
            }
            return false;
        }

        /// <summary>
        /// Request the data string of a test from the recorder class
        /// </summary>
        /// <returns>A string with the test data inside</returns>
        public string requestDataString()
        {
            return m_recorderInstance.getConvertedTestData();
        }

        /// <summary>
        /// Requests recorder to update scroll position with a parameter received from client
        /// </summary>
        /// <param name="i_newScrollHeight">The new scroll height sent from client</param>
        public void requestScrollUpdate(int i_newScrollHeight)
        {
            m_recorderInstance.setScrollPosition(i_newScrollHeight);
        }

        /// <summary>
        /// Constructing a handshake message based on the protocol and the message received from client
        /// </summary>
        /// <param name="i_message">The received begin handshake message</param>
        /// <returns>The handshake message as a byte array with UTF-8 characters</returns>
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
        /// <summary>
        /// Listens for incoming connections and tries to accept the connection
        /// Exits self and starts listening thread if connection and handshake succeeded
        /// </summary>
        private void listenForConnection()
        {
            try
            {
                // Blocking signal waiting for a client to connect
                m_connectedClient = m_socketListener.AcceptTcpClient();
                DateTime connectionTime = DateTime.Now;
                // Moving forward if client connected
                m_logType = 1;
                outputTextProperty = "Server: A client connected!";
                m_logType = 0;
                outputTextProperty = "Server: Performing handshake with new client";
                // Getting the client stream so that the server can read and write data to it
                NetworkStream t_clientStream = m_connectedClient.GetStream();
                bool t_connectionSucceeded = false;
                while (m_runListeningThread)
                {
                    // Wait until handshake data is available
                    while (!t_clientStream.DataAvailable)
                    {
                        TimeSpan timeSinceConnection = DateTime.Now - connectionTime;
                        if(timeSinceConnection.TotalSeconds >= 2.0)
                        {
                            m_logType = 0;
                            outputTextProperty = "Server: Too long time to perform handshake. Disconnecting client";
                            handleClientDisconnectRequest();
                            m_runListeningThread = false;
                        }
                    }
                    Byte[] bytes = new Byte[m_connectedClient.Available];
                    t_clientStream.Read(bytes, 0, bytes.Length);
                    String t_messageData = Encoding.UTF8.GetString(bytes);
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
                        clientConnectedProperty = true;
                        t_connectionSucceeded = true;
                        m_runListeningThread = false;
                    }
                    else
                    {
                        // If the handshake failed it is just printed to the log
                        m_logType = 2;
                        outputTextProperty = "Server: Failed on handshake.. Retrying";
                    }
                }
                if(t_connectionSucceeded)
                {
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
                    m_runListeningThread = true;
                    m_runClientThread = true;
                }
            }
            catch(Exception)
            {
                m_runListeningThread = true;
                m_listeningThread = new Thread(new ThreadStart(listenForConnection));
                m_listeningThread.IsBackground = true;
                m_listeningThread.Start();
            }
        }

        /// <summary>
        /// A listening thread waiting for incoming data from the connected client
        /// </summary>
        private void readClientData()
        {
            try
            {
                NetworkStream t_incomingStream = m_connectedClient.GetStream();
                while (m_runClientThread)
                {
                    while (!t_incomingStream.DataAvailable)
                    {               
                        if(m_isTerminatingListeningThread && m_safeToDisconnectClient)
                        {
                            m_logType = 3;
                            outputTextProperty = "Server: Breaking thread!";
                            m_runClientThread = false;
                            break;
                        }
                        else if (!IsConnected())
                        {
                            m_logType = 3;
                            outputTextProperty = "Server: Client suddenly disconnected!";
                            handleClientDisconnectRequest();
                            m_runClientThread = false;
                            break;
                        }
                    }
                    if (!m_isTerminatingListeningThread)
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
                        clientTextProperty = 0;
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
                            m_logType = 3;
                            outputTextProperty = "Server: Disconnecting in else statement, reading thread";
                            m_connectedClient.Close();
                            m_runClientThread = false;
                        }
                            
                    }
                } 
            }    
            catch(Exception)
            {
                m_logType = 3;
                outputTextProperty = "Server: Disconnecting in reading thread!";
                handleClientDisconnectRequest();
                m_connectedClient.Close();              
            }
        }

      
        // VISUAL FORM RELATED

        /// <summary>
        /// Requests recorder to update display height to use for checking if the Eye tracking coordinates are within the screen bounds
        /// </summary>
        /// <param name="i_displayHeight">The new display height as an integer</param>
        public void requestDisplayHeightUpdateEYE(int i_displayHeight)
        {
            if (m_recorderInstance != null)
            {
                m_recorderInstance.setDisplayHeight(i_displayHeight);
                m_logType = 1;
                outputTextProperty = "Recorder: Updated Display Height to: " + i_displayHeight.ToString();
            }
        }

        /// <summary>
        /// Requests recorder to update display width to use for checking if the Eye tracking coordinates are within the screen bounds
        /// </summary>
        /// <param name="i_displayWidth">The new display width as an integer</param>
        public void requestDisplayWidthUpdateEYE(int i_displayWidth)
        {
            if(m_recorderInstance != null)
            {
                m_recorderInstance.setDisplayWidth(i_displayWidth);
                m_logType = 1;
                outputTextProperty = "Recorder: Updated Display Width to: " + i_displayWidth.ToString();
            }
        }

        /// <summary>
        /// Collects user data received from messagehandler as a string.
        /// Tries to convert the data to JSON and get all the values from the user form
        /// If the operation succeeded the data will be sent to the recording instance
        /// </summary>
        /// <param name="i_values">The decrypted message received from client</param>
        public void setRecorderUserData(string i_values)
        {
            try
            {
                JObject t_stringToJSON = JObject.Parse(i_values);
                string t_messageContent = t_stringToJSON.GetValue("MessageContent").Value<string>();
                m_logType = 0;
                outputTextProperty = t_messageContent;
                t_stringToJSON = JObject.Parse(t_messageContent);
                string t_name = t_stringToJSON.GetValue("Name").Value<string>().Trim();
                string t_age = t_stringToJSON.GetValue("Age").Value<string>().Trim();
                string t_occupation = t_stringToJSON.GetValue("Occupation").Value<string>().Trim();
                string t_location = t_stringToJSON.GetValue("Location").Value<string>().Trim();
                string t_computerusage = t_stringToJSON.GetValue("ComputerUsage").Value<string>().Trim();
                string t_application = t_stringToJSON.GetValue("Application").Value<string>().Trim();
                string t_gender = t_stringToJSON.GetValue("Gender").Value<string>().Trim();
                string t_otherinfo = t_stringToJSON.GetValue("Other").Value<string>().Trim();

                m_recorderInstance.insertUserData(t_name, t_age, t_occupation, t_location, t_computerusage, t_application, t_otherinfo,t_gender);

            }
            catch (Exception e)
            {
                m_logType = 2;
                outputTextProperty = "Server: Error when parsing USERINFO received from client: " + e.ToString();
                m_logType = 3;
                outputTextProperty = "Server: Is the form filled in correctly in the extension?";
            }
        }

        /// <summary>
        /// Server forwarding new document bounds received by messagehandler, to recorder
        /// </summary>
        /// <param name="width">Integer, the document width</param>
        /// <param name="height">Integer, the document height</param>
        public void requestRecorderToSetDocumentBounds(uint width, uint height)
        {
            if(m_recorderInstance != null)
            {
                m_recorderInstance.setTestDocumentWidthHeight(width, height);
            }
        }

        /// <summary>
        /// Request the file loader to get specific data based on parameters
        /// </summary>
        /// <param name="i_application">String, the requested application to get the test from</param>
        /// <param name="i_date">String, the requested date to get the test from</param>
        /// <param name="i_testerName">String, selected tests tester name</param>
        /// <param name="i_id">Integer, the id of the test</param>
        /// <returns>String, containing the collected data from the File Loader</returns>
        public string getSpecificData(string i_application,string i_date,string i_testerName,int i_id)
        {
            return m_fileLoader.getSpecificTestData(i_application, i_date, i_testerName, i_id);
        }

        /// <summary>
        /// Resetting thread variables
        /// </summary>
        private void resetThreadSpecificVariables()
        {
            m_isTerminatingListeningThread = false;
            m_safeToDisconnectClient = false;
        }

        /// <summary>
        /// Updates the outputTextProperty which will fire an event
        /// </summary>
        /// <param name="i_text">String, the text to output</param>
        public void setOutputTextProperty(string i_text)
        {
            outputTextProperty = i_text;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="i_applicationName"></param>
        /// <returns></returns>
        public string getApplicationData(string i_applicationName)
        {
            clientConnectedProperty = true;
            return m_fileLoader.getApplicationData(i_applicationName);
        }

        /// <summary>
        /// Request all application data existing from the file loader
        /// </summary>
        /// <returns>A parsed JSON string containing all the applications</returns>
        public string getAllApplicationData()
        {
            clientConnectedProperty = true;
            return m_fileLoader.getAllApplicationData();
        }

        /// <summary>
        /// Event Handler handling events received from File saver
        /// </summary>
        /// <param name="e">the sender of the event</param>
        /// <param name="arg">The event arguments</param>
        private void updateOutputOnFileEvent(object e, EventArgs arg)
        {
            OutputTextArgs t_arguments = (OutputTextArgs)arg;

            int t_logType = t_arguments.getType;
            string t_logMessage = t_arguments.getEventText;

            m_logType = t_logType;
            outputTextProperty = t_logMessage;
        }
        /// <summary>
        /// Event Handler handling events received from file loader
        /// </summary>
        /// <param name="e">The sender of the event</param>
        /// <param name="arg">The event arguments</param>
        private void updateOutputOnFileLoadEvent(object e, EventArgs arg)
        {
            OutputTextArgs t_arguments = (OutputTextArgs)arg;

            int t_logType = t_arguments.getType;
            string t_logMessage = t_arguments.getEventText;

            m_logType = t_logType;
            outputTextProperty = t_logMessage;
        }

        /// <summary>
        /// Triggered when a test is saved in recorder. Sends application info to server
        /// </summary>
        /// <param name="e"></param>
        /// <param name="arg"></param>
        private void dataSavedEvent(object e,EventArgs arg)
        {
            m_messageHandler.serverNotificationToClient(18, getAllApplicationData());
        }
        /// <summary>
        /// Event Handler handling events received from recorder
        /// </summary>
        /// <param name="e">The event sender</param>
        /// <param name="arg">The event arguments</param>
        private void updateOutputOnRecorderEvent(object e, EventArgs arg)
        {
            OutputTextArgs t_arguments = (OutputTextArgs)arg;

            int t_logType = t_arguments.getType;
            string t_logMessage = t_arguments.getEventText;

            m_logType = t_logType;
            outputTextProperty = t_logMessage;
        }

        /// <summary>
        /// Function will notify the handle disconnect request function if there is a valid connection to a client
        /// otherwise it will notify the output log that no client is connected
        /// </summary>
        public void DisconnectClientOnRequest()
        {
            if(m_connectedClient != null)
            {
                if(m_connectedClient.Connected)
                {
                    if(handleClientDisconnectRequest())
                    {
                        m_logType = 1;
                        outputTextProperty = "Server: Successfully disconnected client on request!";
                        m_safeToDisconnectClient = true;
                    }
                }
                else
                {
                    m_logType = 3;
                    outputTextProperty = "Server: Cannot disconnect the client. Not Connected.";
                }
            }
            else
            {
                m_logType = 3;
                outputTextProperty = "Server: Cannot disconnect the client. Not Connected.";
            }
        }

        /// <summary>
        /// Checking if client is connected
        /// </summary>
        /// <returns>Bool, if the client is connected or not</returns>
        bool IsConnected()
        {
            try
            {
                if (m_connectedClient.Client.Connected)
                {
                    if ((m_connectedClient.Client.Poll(0, SelectMode.SelectWrite)) && (!m_connectedClient.Client.Poll(0, SelectMode.SelectError)))
                    {
                        byte[] buffer = new byte[1];
                        if (m_connectedClient.Client.Receive(buffer, SocketFlags.Peek) == 0)
                        {
                            return false;
                        }
                        else
                        {
                            return true;
                        }
                    }
                    else
                    {
                        return false;
                    }
                }
                else
                {
                    return false;
                }
            }
            catch(SocketException)
            {
                return false;
            }
        }

        /// <summary>
        /// Request the recorder to add all mouse test data received from the client
        /// </summary>
        /// <param name="i_x">Integer array of all X values</param>
        /// <param name="i_y">Integer array of all Y values</param>
        /// <param name="i_timeStamp">Ulong array of all the timeStamps</param>
        /// <returns>Bool, if the adding was successful or not</returns>
        public bool addMouseCoordinatesToTest(int[] i_x, int[] i_y, int[] i_timeStamp)
        {
            if(m_recorderInstance != null)
            {
                if(m_recorderInstance.addMouseCoordinatesToTest(i_x, i_y, i_timeStamp))
                {
                    m_logType = 1;
                    outputTextProperty = "Recorder: Successfully added mouse coordinates to current test";
                    return true;
                }
                else
                {
                    m_logType = 2;
                    outputTextProperty = "Recorder: Failed when adding mouse coordinates to current test. Is there a started test?";
                    return false;
                }
            }
            return false;
        }

        /// <summary>
        /// Writing requested message to client stream
        /// Modifies the messages header depending on the size of the message
        /// </summary>
        /// <param name="i_message">String, the message to send</param>
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
