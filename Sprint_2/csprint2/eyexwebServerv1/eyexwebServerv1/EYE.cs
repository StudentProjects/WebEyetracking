﻿// EYE.cs
// Created by: Daniel Johansson
// Edited by: 

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EyeXFramework;
using Tobii.EyeX.Client;
using Tobii.EyeX.Framework;
using System.Threading;
using System.IO;
using System.Reflection;
using Newtonsoft.Json;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Audio;
using System.Timers;

namespace tieto.education.eyetrackingwebserver
{
   public class EYE
    {
       // MEMBER BASIC VARIABLES //
        private bool m_isRecording;
        private bool m_isPaused;
        private bool m_isInfoSubmitted;
        private bool m_isFirstPointCollected;
        private bool m_isDocumentBoundsSet;
        private bool m_isMouseSubmitted;
        private bool m_isKeySubmitted;

        private List<int> m_pageTimestamps;
        private List<int> m_gazeXCoordinates;
        private List<int> m_gazeYCoordinates;
        private List<ulong> m_gazePointTimeStamps;
        private List<FixationPoint> m_fixationPoints;

        private string m_convertedTestData;
        private string m_logMessage;

       // integers
        private uint m_areasOfWidth;
        private uint m_areasOfHeight;
        private uint m_documentAreaWidth;
        private uint m_documentAreaHeight;
        private int m_logType;
        private int m_currentScrollPositionY;
        private int m_activeDisplayWidth;
        private int m_activeDisplayHeight;
        private int m_activeTestType;
        private int m_currentFixationIndex;
        private uint m_pageWidthInTestApplication;
        private uint m_pageHeightInTestApplication;
        private ulong m_firstGazeTimestamp;
        

       // EVENTS

        public event EventHandler onTextUpdate = delegate { };
        public event EventHandler onDataSaved = delegate { };

       // MEMBER OBJECT VARIABLES
        private TestData m_dataCurrentTest;
        private UserInfo m_currentTestUserInfo;
        private FileSaver m_fileSaver;
        private StatisticsHandler m_statisticsHandler;
        private EyeXHost m_eyeHost; 
        private GazePointDataStream m_gazePointStream;
        private FixationDataStream m_fixationPointStream;
        private FixationPoint m_currentFixationPoint;
        private DocumentArea[,] m_documentAreas;
        private AudioHandler m_audioHandler;

        Byte[] m_loadedAudio;

       /// <summary>
       /// Initializing all necessary class objects and variables
       /// </summary>
       /// <param name="i_activeScreenHeight">The start screen height of the display</param>
       /// <param name="i_activeScreenWidth">The start screen width of the display</param>
       /// <param name="i_fileSaverInstance">An active instance of the file saver to use when saving data</param>
        public EYE(int i_activeScreenHeight,int i_activeScreenWidth,FileSaver i_fileSaverInstance)
        {
            m_activeDisplayHeight = i_activeScreenHeight;
            m_activeDisplayWidth = i_activeScreenWidth;
            m_currentTestUserInfo = new UserInfo();
            //Defaulting scroll position to zero
            m_currentScrollPositionY = 0;

            m_areasOfHeight = 9;
            m_areasOfWidth = 12;
            // Not recording as default
            m_isRecording = false;
            // Not paused as default
            m_isPaused = false;
            //document bounds is not set for starters
            m_isDocumentBoundsSet = false;
            //Start timestamp counter after first timestamp
            m_isFirstPointCollected = false;
            // User info must be submitted before a test can start
            m_isInfoSubmitted = false;
            //List for timestamps per test page
            m_pageTimestamps = new List<int>();
            // Will contain the coordinates
            m_gazeXCoordinates = new List<int>(); 
            //Will contains timestamps
            m_gazePointTimeStamps = new List<ulong>();
            m_gazeYCoordinates = new List<int>();
            //Will contain the fixation points
            m_fixationPoints = new List<FixationPoint>();
            // initializing the EYETracker
            m_eyeHost = new EyeXHost();
            // starting eyetracker host
            m_eyeHost.Start();
            //Initializing statistics manager
            m_statisticsHandler = new StatisticsHandler();


            m_logType = -1;
            // 0 = EYE, 1=Mouse, 2= Both
            m_activeTestType = -1;
            m_currentFixationIndex = -1;

            m_isMouseSubmitted = false;
            m_isKeySubmitted = false;
            m_fileSaver = i_fileSaverInstance;

            m_loadedAudio = null;

            m_audioHandler = new AudioHandler(this);
        }

       public bool isEyeTrackerOnline()
       {
           if(m_eyeHost != null)
           {
               if(m_eyeHost.EyeTrackingDeviceStatus.Value == EyeTrackingDeviceStatus.Tracking)
               {
                   return true;
               }
               else
               {
                   return false;
               }
           }
           return false;
       }

       public bool isMicrophoneConnected()
       {
           Microphone mic = Microphone.Default;
           if(mic != null)
           {
               return true;
           }
           return false;
       }

       /// <summary>
       /// Function called when the datastring with current test information is needed
       /// </summary>
       /// <returns>the datastring with test data content</returns>
       public string getConvertedTestData()
       {
           return m_convertedTestData;
       }

       /// <summary>
       /// Updating the scroll position Y value used for offsetting the Gaze Point Y value according to where at the page the user is looking
       /// </summary>
       /// <param name="i_pos">An integer, the new scrollposition. Received in message from client</param>
       public void setScrollPosition(int i_pos)
       {
           m_currentScrollPositionY = i_pos;
       }

       /// <summary>
       /// Updating the screen height used when checking if the received GazePoints coordinates are within the bounds of the display
       /// </summary>
       /// <param name="i_displayHeight">An integer, the new display height</param>
       public void setDisplayHeight(int i_displayHeight)
       {
           m_activeDisplayHeight = i_displayHeight;
       }

       /// <summary>
       /// Updating the screen width used when checking if the received GazePoints coordinates are within the bounds of the display
       /// </summary>
       /// <param name="i_displayWidth">And integer, the new display width</param>
       public void setDisplayWidth(int i_displayWidth)
       {
           m_activeDisplayWidth = i_displayWidth;
       }

       public void setLoadedAudio(Byte[] i_audioData)
       {
           m_loadedAudio = i_audioData;
       }

       /// <summary>
       /// Inserts a given timestamp into the list of page timestamps
       /// </summary>
       /// <param name="i_timestamp">timestamp to be added</param>
       public void addPageTimestamp(int i_timestamp)
       {
           m_pageTimestamps.Add(i_timestamp);
       }

       public void startAudio()
       {
           if(m_audioHandler != null)
           {
               m_audioHandler.playbackAudio(m_loadedAudio);
               log("Recorder: Calling audio player start", 1);
           }
       }

       public void pauseAudio()
       {
           if (m_audioHandler != null)
           {
               m_audioHandler.pausePlayback();
               log("Recorder: Calling audio player pause", 1);
           }
       }

       public void resumeAudio()
       {
           if (m_audioHandler != null)
           {
               m_audioHandler.resumePlayback();
               log("Recorder: Calling audio player resume", 1);
           }
       }

       public void stopAudio()
       {
           if(m_audioHandler != null)
           {
               m_audioHandler.stopPlayback();
               log("Recorder: Calling audio player stop", 1);
           }
       }

       /// <summary>
       /// Setting the width and height of the current test document
       /// with coordinates received from client.
       /// </summary>
       /// <param name="width">The document width</param>
       /// <param name="height">The document height</param>
       public void setTestDocumentWidthHeight(uint width,uint height)
       {
           m_pageHeightInTestApplication = height;
           m_pageWidthInTestApplication = width;

           uint t_width = width / m_areasOfWidth;
           uint t_height = height / m_areasOfHeight;

           m_documentAreaWidth = t_width;
           m_documentAreaHeight = t_height;

           //Creating document blocks of the current document based on the specified number of blocks in the width and height axis
           //Used when calculating total percent of page seen
           DocumentArea[,] t_documentAreas = new DocumentArea[m_areasOfWidth, m_areasOfHeight];
           for (int i = 0; i < m_areasOfWidth;i++ )
           {
               for(int j=0;j<m_areasOfHeight;j++)
               {
                   t_documentAreas[i,j] = new DocumentArea();
                   t_documentAreas[i, j].xMin = (int)width;
                   t_documentAreas[i, j].xMax = -1 * (int)width;
                   t_documentAreas[i, j].yMax = -1 * (int)height;
                   t_documentAreas[i, j].yMin = (int)height;
               }
           }

           m_documentAreas = t_documentAreas;

           m_isDocumentBoundsSet = true;
       }



       /// <summary>Adds the received coordinates from the GazePointDataStream if the recording is not paused
       /// and the points are within the display bounds.
       /// Function also responsible of updating the current minimum and maximum x and y-values which the user have looked at</summary>
       /// <param name="i_timeStamp">timestamp in milliseconds received from GazePointDataStream</param>
       /// <param name="i_x">X coordinate of the Gaze Point received from an active GazePointDataStream</param>
       /// <param name="i_y">Y coordinate of the Gaze Point received from an active GazePointDataStream</param>
       private void saveGazePointAndTimestamp(int i_gazeX, int i_gazeY, ulong i_gazeTimeStamp)
       {
           if(!m_isPaused)
           {
               // Ignoring values located outside the screen
               if(!m_isFirstPointCollected)
               {
                   m_firstGazeTimestamp = i_gazeTimeStamp;
                   m_isFirstPointCollected = true;
               }
               if ((i_gazeX >= 0 && i_gazeX <= m_activeDisplayWidth) && (i_gazeY >= 0 && i_gazeY <= m_activeDisplayHeight))
               {
                   m_gazeXCoordinates.Add(i_gazeX);
                   // offsetting y with scroll position
                   m_gazeYCoordinates.Add(i_gazeY + m_currentScrollPositionY);
                   m_gazePointTimeStamps.Add(calculateTimestampForGazePoint(i_gazeTimeStamp));
               }
           }
       }

       /// <summary>saveFixationPoint switches on the fixation event
       /// and depending on if the fixation event is begin or end it will handled the event differently</summary>
       /// <param name="i_fixationEvent">The event arguments sent from the fixation point stream in the EyeXHost</param>
       private void saveFixationPointAndTimestamp(FixationEventArgs i_fixationEvent)
       {
           if(m_fixationPoints != null)
           {
               if ((i_fixationEvent.X >= 0 && i_fixationEvent.X <= m_activeDisplayWidth) && (i_fixationEvent.Y >= 0 && i_fixationEvent.Y <= m_activeDisplayHeight))
               {
                   // event type is begin which means the points can be collected
                   if (i_fixationEvent.EventType == FixationDataEventType.Begin)
                   {
                       //Setting up new fixation point
                       m_currentFixationPoint = new FixationPoint();

                       m_currentFixationPoint.X = (int)i_fixationEvent.X;
                       m_currentFixationPoint.Y = (int)i_fixationEvent.Y;
                       m_currentFixationPoint.timeStampFixation = (int)i_fixationEvent.Timestamp;
                   }
                       // End of fixation. Only calculate gaze time
                   else if (i_fixationEvent.EventType == FixationDataEventType.End)
                   {
                       // Modifying values from start fixation, timestamp och fixation time
                        try
                        {
                            if(m_currentFixationPoint != null)
                            {
                                if (m_currentFixationPoint.timeStampFixation > 10000)
                                {
                                    m_currentFixationIndex++;
                                    int t_currentTimestampFixation = (int)i_fixationEvent.Timestamp - m_currentFixationPoint.timeStampFixation;
                                    m_currentFixationPoint.timeStampFixation = t_currentTimestampFixation;

                                    m_currentFixationPoint.fixationTime = new string[1];
                                    m_currentFixationPoint.fixationTime[0] = t_currentTimestampFixation.ToString();
                                    m_currentFixationPoint.fixationOrder = new int[1];
                                    m_currentFixationPoint.fixationOrder[0] = m_currentFixationIndex;
                                    m_currentFixationPoint.timesMerged = 0;
                                    m_currentFixationPoint.fixationTimePoints = new string[1];
                                    m_currentFixationPoint.fixationTimePoints[0] = DateTime.Now.ToString("HH:mm:ss", System.Globalization.DateTimeFormatInfo.InvariantInfo);
                                    m_currentFixationPoint.Y += m_currentScrollPositionY;
                                    m_fixationPoints.Add(m_currentFixationPoint);
                                }
                            }
                        }
                        catch (FormatException formatException)
                        {
                            log("Recorder: Error when parsing fixation point starttime!", 2);
                            log("Recorder: Error message: " + formatException.ToString(), 3);
                        }
                       
                   }
               }
           }
       }

       /// <summary>
       /// Merging fixation points if they are really close to eachother
       /// </summary>
       private void mergeFixationPoints()
       {
           try
           {
               if (m_fixationPoints != null)
               {
                   if (m_fixationPoints.Count > 2)
                   {
                       FixationPoint tempFixationPoint;
                       for (int i = 0; i < m_fixationPoints.Count - 1; i++)
                       {
                           int iterator = 0;
                           while (iterator < m_fixationPoints.Count)
                           {
                               if(iterator != i)
                               {
                                   double squiredLength = Math.Pow(((double)m_fixationPoints[iterator].X - m_fixationPoints[i].X), 2.0) + Math.Pow(((double)m_fixationPoints[iterator].Y - m_fixationPoints[i].Y), 2.0);
                                   double lengthBetweenPoints = Math.Sqrt(squiredLength);
                                   int maxMerged = Math.Max(m_fixationPoints[i].timesMerged, m_fixationPoints[iterator].timesMerged);

                                   if (lengthBetweenPoints <= (24 + (5*(maxMerged + 1))))
                                   {
                                       int newX = Convert.ToInt32((double)(m_fixationPoints[i].X + m_fixationPoints[iterator].X) / 2.0);
                                       int newY = Convert.ToInt32((double)(m_fixationPoints[i].Y + m_fixationPoints[iterator].Y) / 2.0);

                                       tempFixationPoint = new FixationPoint();
                                       tempFixationPoint.X = newX;
                                       tempFixationPoint.Y = newY;

                                       int totalFixationOrderAmount = m_fixationPoints[i].fixationOrder.Length + m_fixationPoints[iterator].fixationOrder.Length;
                                       int[] allFixationOrderNumber = new int[totalFixationOrderAmount];

                                       for (int j = 0; j < m_fixationPoints[i].fixationOrder.Length; j++)
                                       {
                                           allFixationOrderNumber[j] = m_fixationPoints[i].fixationOrder[j];
                                       }
                                       int counter = 0;
                                       for (int j = m_fixationPoints[i].fixationOrder.Length; j < totalFixationOrderAmount; j++)
                                       {
                                           allFixationOrderNumber[j] = m_fixationPoints[iterator].fixationOrder[counter];
                                           counter++;
                                       }

                                       tempFixationPoint.fixationOrder = allFixationOrderNumber;

                                       int totalFixationTimesAmount = m_fixationPoints[i].fixationTime.Length + m_fixationPoints[iterator].fixationTime.Length;
                                       string[] allFixationTimes = new string[totalFixationTimesAmount];
                                       for (int j = 0; j < m_fixationPoints[i].fixationTime.Length; j++)
                                       {
                                           allFixationTimes[j] = m_fixationPoints[i].fixationTime[j];
                                       }
                                       counter = 0;
                                       for (int j = m_fixationPoints[i].fixationTime.Length; j < totalFixationTimesAmount; j++)
                                       {
                                           allFixationTimes[j] = m_fixationPoints[iterator].fixationTime[counter];
                                           counter++;
                                       }

                                       tempFixationPoint.fixationTime = allFixationTimes;
                                       tempFixationPoint.timesMerged = maxMerged + 1;
                                       tempFixationPoint.timeStampFixation = m_fixationPoints[i].timeStampFixation + m_fixationPoints[iterator].timeStampFixation;

                                       string[] allTimePoints = new string[m_fixationPoints[i].fixationTimePoints.Length + m_fixationPoints[iterator].fixationTimePoints.Length];

                                       for (int j = 0; j < m_fixationPoints[i].fixationTimePoints.Length; j++)
                                       {
                                           allTimePoints[j] = m_fixationPoints[i].fixationTimePoints[j];
                                       }
                                       counter = 0;
                                       for (int j = m_fixationPoints[i].fixationTimePoints.Length; j < allTimePoints.Length; j++)
                                       {
                                           allTimePoints[j] = m_fixationPoints[iterator].fixationTimePoints[counter];
                                           counter++;
                                       }

                                       tempFixationPoint.fixationTimePoints = allTimePoints;

                                       m_fixationPoints[i] = tempFixationPoint;
                                       m_fixationPoints.RemoveAt(iterator);
                                   }
                                   else
                                   {
                                       iterator++;
                                   }
                               }
                               else
                               {
                                   iterator++;
                               }
                           }
                       }
                   }
               }   
           }
           catch(Exception)
           {
               log("Recorder: Error when merging fixation points!", 2);
           }
       }

       /// <summary>
       /// Initializes a new recording instance based on the in parameters if there is no active recording and the user info is submitted
       /// </summary>
       /// <param name="i_requestedTestType">the test type requested from client 0 = EYE, 1 = MOUSE, 2 = BOTH</param>
       /// <param name="i_pageWidth">The page width of the document which the test is performed on</param>
       /// <param name="i_pageHeight">The page height of the document which the test is performed on</param>
       /// <returns>Did start recording success or not</returns>
       public bool startRecording()
       {
           // Check so that no recording is active and the user has submitted necessary 
           if (!m_isRecording && m_isInfoSubmitted && m_isDocumentBoundsSet)
           {
                if (m_eyeHost != null && !m_isRecording && m_isInfoSubmitted)
                {
                    // Start if the eye tracker device is available
                    if (m_eyeHost.EyeTrackingDeviceStatus.Value == EyeTrackingDeviceStatus.Tracking)
                    {
                        // Initializing datastream which will collect points where the user is looking. LightlyFiltered means that the GazeData will be somehow filtered and not just raw data.
                        m_gazePointStream = m_eyeHost.CreateGazePointDataStream(GazePointDataMode.LightlyFiltered);
                        // Everytime a new point is looked at the function updateEYEPosition is called.  
                        m_gazePointStream.Next += (s, e) => saveGazePointAndTimestamp((int)e.X, (int)e.Y, (ulong)e.Timestamp);
                        //Initializing fixation stream
                        m_fixationPointStream = m_eyeHost.CreateFixationDataStream(FixationDataMode.Slow);
                        // Adding event to handler
                        m_fixationPointStream.Next += (s, e) => saveFixationPointAndTimestamp(e);
                        // The application is currently recording
                        m_isRecording = true;
                        //Initializing test struct and statistics section
                        m_dataCurrentTest = new TestData();
                        m_dataCurrentTest.testStatistics = new AllStatistics();
                        m_activeTestType = 2;
                        m_currentTestUserInfo.TestTime = DateTime.Now.ToString("HH:mm:ss", System.Globalization.DateTimeFormatInfo.InvariantInfo);

                        if(isMicrophoneConnected())
                        {
                            m_audioHandler.startAudioRecording();

                            log("Recorder: Recording audio!", 1);
                        }

                        log("Recorder: Successfully started new recording instance!", 1);

                        return true;
                    }
                    else
                    {
                        m_isRecording = true;
                        m_activeTestType = 1;
                        m_dataCurrentTest = new TestData();
                        m_dataCurrentTest.testStatistics = new AllStatistics();
                        m_currentTestUserInfo.TestTime = DateTime.Now.ToString("HH:mm:ss", System.Globalization.DateTimeFormatInfo.InvariantInfo);

                        if (isMicrophoneConnected())
                        {
                            m_audioHandler.startAudioRecording();
                        }

                        return true;
                    }
                }
           }
           else
           {
               if (m_isRecording)
               {
                   log("Recorder: Client requested to start a new test. But a test is already started", 3);
               }
               else if (!m_isInfoSubmitted)
               {
                   log("Recorder: Could not start a recording. The tester has not submitted necessary test information", 3);
               }
           }
           return false;
       }

       /// <summary>
       /// Will try to pause a currently active recording
       /// </summary>
       /// <returns>Status if the pause succeeded or not</returns>
       public bool pauseRecording()
       {
           if(!m_isPaused && m_isRecording)
           {
               m_audioHandler.pauseMicrophoneRecording();
               m_isPaused = true;
               return true;
           }
           return false;
       }

       /// <summary>
       /// Will try to resume a paused recording instance
       /// </summary>
       /// <returns>The status if the resume operation was successful or not</returns>
       public bool resumeRecording()
       {
           if(m_isPaused && m_isRecording)
           {
               m_audioHandler.resumeMicrophoneRecording();
               m_isPaused = false;
               return true;
           }
           return false;
       }

       /// <summary>
       /// Will try to stop a currently active recording and call suitable functions based on the test type if 
       /// the recording stop succeeded. 
       /// Will save data directly if the performed test was just an EYE-test. Or wait for mouse coordinates if the test was mouse or eye+mouse
       /// </summary>
       /// <returns>The status if the stop recording command succeeded or not</returns>
       public bool stopRecording()
       {
           if(m_isRecording)
           {
               m_isRecording = false;
               if (m_activeTestType == 1)
               {
                   if (m_statisticsHandler != null)
                   {
                       m_dataCurrentTest.testStatistics.timeOnPage = m_statisticsHandler.getTimeOnPage(m_currentTestUserInfo.TestTime);
                   }
                   log("Recorder: Successfully stopped Mouse-tracking test.. Waiting for mouse coordinates", 1);
                   log("Recorder: Time on page: " + m_dataCurrentTest.testStatistics.timeOnPage, 1);
                   return true;
               }
               else if (m_activeTestType == 2)
               {
                   if (m_gazePointStream != null)
                   {
                       // Stopping the datastream and nullify it
                       m_gazePointStream.Dispose();
                       m_gazePointStream = null;
                       m_fixationPointStream.Dispose();
                       m_fixationPointStream = null;
                       if (m_statisticsHandler != null)
                       {
                           m_dataCurrentTest.testStatistics.timeOnPage = m_statisticsHandler.getTimeOnPage(m_currentTestUserInfo.TestTime);
                       }
                       //m_audioHandler.playbackAudio(m_audioHandler.stopAudioRecording());
                       log("Recorder: Successfully stopped EYE and Mouse-tracking test.. Waiting for mouse coordinates", 1);
                       return true;
                   }
               }
           }
           return false;
       }

       public bool stopCriticalRecording()
       {
           if(m_isRecording)
           {
               m_isRecording = false;
               if (m_gazePointStream != null)
               {
                   // Stopping the datastream and nullify it
                   m_gazePointStream.Dispose();
                   m_gazePointStream = null;
                   m_fixationPointStream.Dispose();
                   m_fixationPointStream = null;
                   m_audioHandler.stopAudioRecording();

                   m_gazeXCoordinates.Clear();
                   m_gazeYCoordinates.Clear();
                   m_gazePointTimeStamps.Clear();
                   m_fixationPoints.Clear();
                   m_pageTimestamps.Clear();
                   m_isFirstPointCollected = false;
               }
               return true;
           }
           return false;
       }

       /// <summary>
       /// Adding mouse data received from client to the current test instance and then calls the save function 
       /// </summary>
       /// <param name="i_x">Array of mouse x coordinates received from client</param>
       /// <param name="i_y">Array of mouse y coordinates received from client</param>
       /// <param name="i_timeStamp">The corresponding timestamp of each mouse point</param>
       /// <returns>Was the operation successful or not</returns>
       public bool addMouseCoordinatesToTest(int[] i_mouseXCoords, int[] i_mouseYCoords, int[] i_mouseTimeStamps,int[] i_mouseClickX,int[] i_mouseClickY,int[] i_mouseClickTimeStamp)
       {
            if (m_dataCurrentTest != null)
            {
                m_dataCurrentTest.mouseX = i_mouseXCoords;
                m_dataCurrentTest.mouseY = i_mouseYCoords;
                m_dataCurrentTest.timeStampMouse = i_mouseTimeStamps;
                m_dataCurrentTest.mouseClickX = i_mouseClickX;
                m_dataCurrentTest.mouseClickY = i_mouseClickY;
                m_dataCurrentTest.mouseClickTimeStamp = i_mouseClickTimeStamp;
                m_isMouseSubmitted = true;

                if(m_isKeySubmitted)
                {
                    if (m_activeTestType == 1)
                    {
                        log("Recorder: Received mouse coordinates!, saving single mouse to file", 1);
                        saveSingleMouseTest();
                    }
                    else
                    {
                        log("Recorder: Received mouse coordinates!, saving data to file", 1);
                        saveDataToFile();
                    }
                }
                else
                {
                    log("Recorder: Received mouse coordinates!, waiting for keys!", 3);
                }
                return true;
            }
            return false;
       }

       /// <summary>
       /// Adding key press data to current test
       /// </summary>
       /// <param name="i_keyTimeStamps">Int array, key timestamps</param>
       /// <param name="i_keys">String array, key strings</param>
       /// <returns></returns>
       public bool addKeysToTest(int[] i_keyTimeStamps,string[] i_keys)
       {
           if(m_dataCurrentTest != null)
           {
               m_dataCurrentTest.timeStampKey = i_keyTimeStamps;
               m_dataCurrentTest.keys = i_keys;
               m_isKeySubmitted = true;

               if(m_isMouseSubmitted)
               {
                   if (m_activeTestType == 1)
                   {
                       log("Recorder: Received key data!, saving single mouse to file", 1);
                       saveSingleMouseTest();
                   }
                   else
                   {
                       log("Recorder: Received key data!, saving data to file", 1);
                       saveDataToFile();
                   }
               }
               else
               {
                   log("Recorder: Received key data!, waiting for mouse!", 3);
               }
               return true;
           }
           return false;
       }

       /// <summary>
       /// Clearing test variables before a new test
       /// </summary>
       /// <param name="i_endType">the type of clear that should be done. 0 = normal clearing when test ends 1=normal clearing + clearing info
       /// (used when a client suddenly disconnects)</param>
       public void clearPreviousTest(int i_endType)
       {
           m_isRecording = false;
           m_isPaused = false;
           m_dataCurrentTest = null;
           m_fixationPoints.Clear();
           m_gazeXCoordinates.Clear();
           m_gazeYCoordinates.Clear();
           m_isFirstPointCollected = false;
           m_gazePointTimeStamps.Clear();
           m_isDocumentBoundsSet = false;
           m_currentFixationIndex = -1;
           m_isKeySubmitted = false;
           m_isMouseSubmitted = false;
           m_pageTimestamps.Clear();

           if(i_endType == 1)
           {
               m_isInfoSubmitted = false;
           }
       }
       /// <summary>
       /// Inserting received user info into the userInfo object
       /// </summary>
       /// <param name="i_name">The tester name (required)</param>
       /// <param name="i_age">The tester age(optional)</param>
       /// <param name="i_occupation">The tester occupation(optional)</param>
       /// <param name="i_location">The tester location(optional)</param>
       /// <param name="i_computerusage">The tester computer knowledge(optional)</param>
       /// <param name="i_application">The test application (required). Defaulted if somehow empty string</param>
       /// <param name="i_otherinfo">Other information (optional)</param>
       /// <param name="i_gender">Gender of tester (optional)</param>
       public void insertUserData(string i_name,string i_age,string i_occupation,string i_location,string i_computerusage,string i_application,string i_otherinfo,string i_gender)
       {
           // Check if optional value application is filled. Else default it since the value is used in the file name
           string t_application = i_application;
           if (t_application.Trim() == "")
           {
               t_application = "DefaultApplication";
           }

           m_currentTestUserInfo.Name = i_name;
           m_currentTestUserInfo.Age = i_age;
           m_currentTestUserInfo.Occupation = i_occupation;
           m_currentTestUserInfo.Location = i_location;
           m_currentTestUserInfo.ComputerUsage = i_computerusage;
           m_currentTestUserInfo.Application = t_application;
           m_currentTestUserInfo.OtherInfo = i_otherinfo;
           m_currentTestUserInfo.Gender = i_gender;
           m_currentTestUserInfo.TestDate = DateTime.Now.ToString("yyyy-MM-dd");

           // The necessary information for a test is submitted. Now it is clear to start a test
           log("Info submitted from tester! Tester name is " + i_name,1);
           m_isInfoSubmitted = true;
       }
        
       /// <summary>
       /// Calculated timestamp from first GazePoint to current GazePoint. Used by general gaze point collector
       /// </summary>
       /// <param name="i_timeStamp">The timestamp associated with the current received GazePoint in the GazePointDataStream</param>
       /// <returns>The calculated timestamp in milliseconds</returns>
       private ulong calculateTimestampForGazePoint(ulong i_timeStamp)
       {
           ulong t_timestampMilliSeconds = i_timeStamp - m_firstGazeTimestamp;
           return t_timestampMilliSeconds;
       }
       
       /// <summary>
       /// Moving x and y coordinates + associated timestamp to array and adds the arrays to the current TestData object
       /// Receives statistics info from the StatisticsHandler and inserts the results into the TestData object
       /// when previous operations are done the function calls the filesaver to save the data to a file
       /// </summary>
       private void saveDataToFile()
       {
           try
           {
               //Adding Gaze Data to current test object
               m_dataCurrentTest.eyeX = m_gazeXCoordinates.ToArray();
               m_dataCurrentTest.eyeY = m_gazeYCoordinates.ToArray();
               m_dataCurrentTest.timeStampEYE = m_gazePointTimeStamps.ToArray();

               //Adding page timestamps to current test
               m_dataCurrentTest.pageTimestamp = m_pageTimestamps.ToArray();

               mergeFixationPoints();
               //Statistics
               log("Recorder: Calculating statistics!", 0);
               m_dataCurrentTest.testStatistics.percentageOfPageSeen = m_statisticsHandler.getPercentageOfPage(m_documentAreas,m_gazeXCoordinates,m_gazeYCoordinates,m_documentAreaWidth,m_documentAreaHeight);
               if(m_fixationPoints.Count > 0)
               {
                   m_dataCurrentTest.testStatistics.mostFixated = m_statisticsHandler.getMostFixated(m_fixationPoints.ToArray());
                   m_dataCurrentTest.testStatistics.allFixations = m_statisticsHandler.getAllFixationPoints(m_fixationPoints);
                   m_dataCurrentTest.testStatistics.firstFixation = m_statisticsHandler.getFirstFixated(m_fixationPoints.ToArray());
               }
               log("Recorder: Successfully calculated statistics!", 1);

               // Tell file saver to save files
               SoundData t_soundData = new SoundData();
               t_soundData.soundData = m_audioHandler.stopAudioRecording();
               m_fileSaver.saveAllData(m_currentTestUserInfo.Application, m_currentTestUserInfo.TestDate, m_dataCurrentTest, m_currentTestUserInfo, t_soundData);
               onDataSaved(this, new SavedArgs("Data"));

               //Saving current test data in string if user requests it
               m_convertedTestData = JsonConvert.SerializeObject(m_dataCurrentTest, Newtonsoft.Json.Formatting.None);

               clearPreviousTest(0);
           }
           catch(Exception e)
           {
               log("Recorder: Error when saving to file", 2);
               log("Recorder: The error is: "+e.ToString(), 3);
           }
       }

       /// <summary>
       /// Used when only a mouse test was performed. Calling the file saver to save data and converts the TestData object to a string.
       /// </summary>
       private void saveSingleMouseTest()
       {
           log("Recorder: Saving single mouse test!", 0);

           //Adding page timestamps to current test
           m_dataCurrentTest.pageTimestamp = m_pageTimestamps.ToArray();

           // Tell file saver to save files
           SoundData t_soundData = new SoundData();
           t_soundData.soundData = m_audioHandler.stopAudioRecording();
           m_fileSaver.saveAllData(m_currentTestUserInfo.Application, m_currentTestUserInfo.TestDate, m_dataCurrentTest, m_currentTestUserInfo,t_soundData);
           //Saving current test data in string if user requests it
           m_convertedTestData = JsonConvert.SerializeObject(m_dataCurrentTest, Newtonsoft.Json.Formatting.None);
           onDataSaved(this, new SavedArgs("Data"));

           clearPreviousTest(0);
       }


       //PROPERTIES
       /// <summary>
       /// Fires an event when the string is changed. Used for notifying about log output.
       /// </summary>
       private string _LogUpdateProperty
       {
           get
           {
               return m_logMessage;
           }
           set
           {
               m_logMessage = value;
               if(m_logMessage == _LogUpdateProperty)
               {
                   onTextUpdate(this, new OutputTextArgs(m_logMessage, m_logType));
               }
           }
       }

       /// <summary>
       /// Updating logtype and changes the logproperty value based on the log message
       /// </summary>
       /// <param name="i_logMessage">The wanted log message</param>
       /// <param name="i_logType">The log type. 0=Normal, 1=Success,2=Error and 3=Warning</param>
       public void log(string i_logMessage,int i_logType)
       {
           m_logType = i_logType;
           _LogUpdateProperty = i_logMessage;
       }

    }
}
