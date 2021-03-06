﻿// EYE.cs
// Created by: Daniel Johansson
// Edited by: 

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Timers;
using EyeXFramework;
using Tobii.EyeX.Client;
using Tobii.EyeX.Framework;
using System.Threading;
using System.IO;
using System.Reflection;
using Newtonsoft.Json;

namespace eyexwebServerv1
{
   public class EYE
    {
       // MEMBER BASIC VARIABLES //
        private bool m_isRecording;
        private bool m_isPaused;
        private bool m_isInfoSubmitted;
        private bool m_isFirstPointCollected;
        private List<int> m_coordinateList;
        private List<ulong> m_timeStamps;
        private string m_dataString = String.Empty;
        private int m_scrollPosition;
        private int m_activeScreenWidth;
        private int m_activeScreenHeight;
        private ulong m_firstTimestamp;
        private UserInfo m_userInfo;
        private FileSaver m_fileSaver; 

       // MEMBER OBJECT VARIABLES
        private EyeXHost m_eyeHost; 
        private GazePointDataStream m_dataStream;

        public EYE(int i_activeScreenHeight,int i_activeScreenWidth,FileSaver i_fileSaverInstance)
        {
            m_activeScreenHeight = i_activeScreenHeight;
            m_activeScreenWidth = i_activeScreenWidth;
            m_userInfo = new UserInfo();
            //Defaulting scroll position to zero
            m_scrollPosition = 0;
            // Not recording as default
            m_isRecording = false;
            // Not paused as default
            m_isPaused = false;
            //Start timestamp counter after first timestamp
            m_isFirstPointCollected = false;
            // User info must be submitted before a test can start
            m_isInfoSubmitted = false;
            // Will contain the coordinates
            m_coordinateList = new List<int>(); 
            //Will contains timestamps
            m_timeStamps = new List<ulong>();
            // initializing the EYETracker
            m_eyeHost = new EyeXHost();
            // starting eyetracker host
            m_eyeHost.Start();

            m_fileSaver = i_fileSaverInstance;
        }


       // returning current status of the recording
       public bool isRecording()
       {
           return m_isRecording;
       }

       // returning data string of latest test
       public string getDataString()
       {
           return m_dataString;
       }

       // updates to the current scrollposition
       public void setScrollPosition(int i_pos)
       {
           m_scrollPosition = i_pos;
       }
     
       // Updating display
       public void setDisplayHeight(int i_displayHeight)
       {
           m_activeScreenHeight = i_displayHeight;
       }

       public void setDisplayWidth(int i_displayWidth)
       {
           m_activeScreenWidth = i_displayWidth;
       }
       // saves coordinates from current frame to temporary array if the recording is not paused
       // Check so that the vision is not focused outside the screen
       public void saveTemporaryCoordinates(int i_x, int i_y, ulong i_timeStamp)
       {
           if(!m_isPaused)
           {
               // Ignoring values located outside the screen
               if(!m_isFirstPointCollected)
               {
                   m_firstTimestamp = i_timeStamp;
                   m_isFirstPointCollected = true;
               }
               if((i_x >= 0 && i_x <= m_activeScreenWidth) && (i_y >= 0 && i_y <= m_activeScreenHeight))
               {
                   m_coordinateList.Add(i_x);
                   // offsetting y with scroll position
                   m_coordinateList.Add(i_y + m_scrollPosition);
                   m_timeStamps.Add(calculateTimestamp(i_timeStamp));
               }
           }
       }

       // start a new recording instance
       public bool startRecording()
       {
           // Start recording and collect data stream if we are not currently recording and there is a valid EyeHost
           if (m_eyeHost != null && !m_isRecording && m_isInfoSubmitted)
           {
               // Start if the eye tracker device is available
               if (m_eyeHost.EyeTrackingDeviceStatus.Value != EyeTrackingDeviceStatus.DeviceNotConnected)
               {
                   m_coordinateList.Clear();
                   m_dataString = "";

                   // Initializing datastream which will collect points where the user is looking. LightlyFiltered means that the GazeData will be somehow filtered and not just raw data.
                   m_dataStream = m_eyeHost.CreateGazePointDataStream(GazePointDataMode.LightlyFiltered);
                   // Everytime a new point is looked at the function updateEYEPosition is called.  
                   m_dataStream.Next += (s, e) => saveTemporaryCoordinates((int)e.X, (int)e.Y, (ulong)e.Timestamp);
                   // The application is currently recording
                   m_isRecording = true;
                   m_isPaused = false;
                   m_isFirstPointCollected = false;
                   return true;
               }
           }

           return false;
       }

       // pause current recording if possible
       public bool pauseRecording()
       {
           if(!m_isPaused && m_isRecording)
           {
               m_isPaused = true;
               return true;
           }
           return false;
       }

       // Resume paused recording
       public bool resumeRecording()
       {
           if(m_isPaused && m_isRecording)
           {
               m_isPaused = false;
               return true;
           }
           return false;
       }

       // Stop active recording if there is any
       public bool stopRecording()
       {
          if(m_dataStream != null && m_isRecording)
          {
              // Stopping the datastream and nullify it
              m_dataStream.Dispose();
              m_dataStream = null;
              // not longer recording
              m_isRecording = false;
              m_isPaused = false;
              m_isFirstPointCollected = false;
              // Will save collected data to file
              saveDataToFile();

              return true;
          }
          return false;
       }

       public void clearPreviousUserInfo()
       {
           m_isRecording = false;
           m_isPaused = false;
           m_isInfoSubmitted = false;
       }
       // update user data object with info
       public void insertUserData(string i_name,string i_age,string i_occupation,string i_location,string i_computerusage,string i_application,string i_otherinfo)
       {
           // Check if optional value application is filled. Else default it since the value is used in the file name
           string t_application = i_application;
           if (t_application == "")
           {
               t_application = "DefaultApplication";
           }


           m_userInfo.Name = i_name;
           m_userInfo.Age = i_age;
           m_userInfo.Occupation = i_occupation;
           m_userInfo.Location = i_location;
           m_userInfo.ComputerUsage = i_computerusage;
           m_userInfo.Application = t_application;
           m_userInfo.OtherInfo = i_otherinfo;
           m_userInfo.TestDate = DateTime.Today.ToString("yyyy-MM-dd");
           m_userInfo.TestTime = DateTime.Now.ToString("HH:mm:ss", System.Globalization.DateTimeFormatInfo.InvariantInfo);

           // The necessary information for a test is submitted. Now it is clear to start a test
           m_isInfoSubmitted = true;
       }
        
       private ulong calculateTimestamp(ulong i_timeStamp)
       {
           ulong t_timestampMilliSeconds = i_timeStamp - m_firstTimestamp;

           return t_timestampMilliSeconds;
       }
       // Adding all data to testData structure
       // Call instance of FileSaver to save data
       public void saveDataToFile()
       {
           int[] t_x = new int[m_coordinateList.Count / 2];
           int[] t_y = new int[m_coordinateList.Count / 2];
           ulong[] t_timeStamps = new ulong[m_timeStamps.Count];


           // Move coordinate data to separate arrays
           int t_index = 0;
           for(int i=0;i<m_coordinateList.Count;i+=2)
           {
                 t_x[t_index] = m_coordinateList[i];
                 t_y[t_index] = m_coordinateList[i + 1];
                 t_timeStamps[t_index] = m_timeStamps[t_index];
                 t_index++;
           }

           // Create testdata struct
           TestData t_testData = new TestData();
           t_testData.X = t_x;
           t_testData.Y = t_y;
           t_testData.timeStamp = t_timeStamps;

           // Tell file saver to save files
           m_fileSaver.saveAllData(m_userInfo.Application, m_userInfo.TestDate, t_testData, m_userInfo);

           //Saving current test data in string if user requests it
           m_dataString = JsonConvert.SerializeObject(t_testData, Newtonsoft.Json.Formatting.None);
       }

    }
}
