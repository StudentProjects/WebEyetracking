// EYE.cs
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
    public class data
    {
        public int TESTID { get; set; }
        public string User { get; set; }
        public int[] X { get; set; }
        public int[] Y { get; set; }
    }

   public class EYE
    {
       // MEMBER BASIC VARIABLES //
        private bool m_isRecording;
        private bool m_isPaused;
        private List<int> m_coordinateList;
        private string m_currentUser;
        private const string SAVEFOLDERNAME = @"Saved";
        private const string JSONFILENAME = @"testdata.json";
        private string m_dataString = String.Empty;
        private int m_scrollPosition;
        private int m_activeScreenWidth;
        private int m_activeScreenHeight;

       // MEMBER OBJECT VARIABLES
        private EyeXHost m_eyeHost; 
        private GazePointDataStream m_dataStream;

        public EYE(int i_activeScreenHeight,int i_activeScreenWidth)
        {
            m_activeScreenHeight = i_activeScreenHeight;
            m_activeScreenWidth = i_activeScreenWidth;
            m_currentUser = "None";
            //Defaulting scroll position to zero
            m_scrollPosition = 0;
            // Not recording as default
            m_isRecording = false;
            // Not paused as default
            m_isPaused = false;
            m_coordinateList = new List<int>(); 
            // initializing the EYETracker
            m_eyeHost = new EyeXHost();
            // starting eyetracker host
            m_eyeHost.Start();
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
       public void saveTemporaryCoordinates(int i_x,int i_y)
       {
           if(!m_isPaused)
           {
               // Ignoring values located outside the screen
               if((i_x >= 0 && i_x <= m_activeScreenWidth) && (i_y >= 0 && i_y <= m_activeScreenHeight))
               {
                   m_coordinateList.Add(i_x);
                   // offsetting y with scroll position
                   m_coordinateList.Add(i_y + m_scrollPosition);
               }
           }
       }

       // start a new recording instance
       public bool startRecording(string i_user)
       {
           // Start recording and collect data stream if we are not currently recording and there is a valid EyeHost
           if (m_eyeHost != null && !m_isRecording)
           {
               // Start if the eye tracker device is available
               if (m_eyeHost.EyeTrackingDeviceStatus.Value != EyeTrackingDeviceStatus.DeviceNotConnected)
               {
                   m_coordinateList.Clear();
                   m_dataString = "";

                   m_currentUser = i_user;
                   // Initializing datastream which will collect points where the user is looking. LightlyFiltered means that the GazeData will be somehow filtered and not just raw data.
                   m_dataStream = m_eyeHost.CreateGazePointDataStream(GazePointDataMode.LightlyFiltered);
                   // Everytime a new point is looked at the function updateEYEPosition is called.  
                   m_dataStream.Next += (s, e) => saveTemporaryCoordinates((int)e.X, (int)e.Y);
                   // The application is currently recording
                   m_isRecording = true;
                   m_isPaused = false;


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
              // Will save collected data to file
              prepareSaveCoordinatesToFile();

              return true;
          }
          return false;
       }


       // prepare the saving of the file
       // Create necessary file and folder if it doesn't exist
       void prepareSaveCoordinatesToFile()
       {

           // All paths and file name which will be used for test data
           // Everything will be located in the same directory as the .exe runs from
           string t_folderPath = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), SAVEFOLDERNAME);
           string t_jsonPath = Path.Combine(t_folderPath, JSONFILENAME);
           // Looking for folder in same directory as the .exe is located in
           if (!Directory.Exists(t_folderPath))
           {
               //Creating directory of specific name if it doesn't exist
               createFolder(t_folderPath);
               //Creating file
               createJSONFile(t_jsonPath);
               // Saving data
               saveDataToFile(t_jsonPath);
           }
           else
           {
               // Folder existed, now control if the file exists
               if(!File.Exists(t_jsonPath))
               {
                   createJSONFile(t_jsonPath);
                   saveDataToFile(t_jsonPath);
               }
               else
               {
                   // Everything was ok. Saving data to file
                   saveDataToFile(t_jsonPath);
               }
           }
       }

       // creating a folder to save data files in
       public void createFolder(string i_folderPath)
       {
           if (!Directory.Exists(i_folderPath))
           {
               //Creating directory of specific name if it doesn't exist
               Directory.CreateDirectory(i_folderPath);
           }
       }

       // create data file in specific folder
       public void createJSONFile(string i_filePath)
       {
           if (!File.Exists(i_filePath))
           {
               using (var t_newFile = File.Create(i_filePath))
               {
                   // Closing the file after creating it since it will be written to from another function
                   t_newFile.Close();
               }        
           }
       }

       // Collects the currently existing data from the file and appends the new test data to it.
       // Resaving the file with new data added
       // Adding data from current test to data string variable
       public void saveDataToFile(string i_filePath)
       {
           // Deserializing already existing items in the file so the new data can be added to the already existing data list
           if(File.Exists(i_filePath))
           {
               bool t_currentDataExisted = false;
               List<data> t_currentData = new List<data>();
               using (StreamReader t_jsonFileStream = new StreamReader(i_filePath))
               {
                    string t_currentJsonData = t_jsonFileStream.ReadToEnd();
                    t_currentData = JsonConvert.DeserializeObject<List<data>>(t_currentJsonData);
               }

               
             

               //Inserting all x and y-values into separate arrays. Later used when creating the new data structure to add to the json file
               int[] t_xCoordinates = new int[m_coordinateList.Count / 2];
               int[] t_yCoordinates = new int[m_coordinateList.Count / 2];
               int t_xIndex = 0;
               int t_yIndex = 0;

               for (int i = 0; i < m_coordinateList.Count; i += 2)
               {
                   // X is always before Y so if we stand at an X value, add X and Y to file
                   if (i % 2 == 0)
                   {
                       t_xCoordinates[t_xIndex] = m_coordinateList[i];
                       t_yCoordinates[t_yIndex] = m_coordinateList[i + 1];

                       t_xIndex++;
                       t_yIndex++;
                   }
               }

               // Getting largest index in current file which will be the ID of this test.
               int t_highestId = 0;
               if (t_currentData != null)
               {
                   t_highestId = t_currentData[t_currentData.Count - 1].TESTID + 1;
                   t_currentDataExisted = true;
               }

               // Did data exist or not
               List<data> t_dataCoordList;
               if(t_currentDataExisted)
               {
                   // Structure to save to the json file
                   // Creating new data object of the results from the current test and applying it on the old results
                   t_dataCoordList = t_currentData;
                   t_dataCoordList.Add(new data()
                   {
                       TESTID = t_highestId,
                       User = m_currentUser,
                       X = t_xCoordinates,
                       Y = t_yCoordinates,
                   });
               }
               else
               {
                   // Adding new data to new list
                   t_dataCoordList = new List<data>();
                   t_dataCoordList.Add(new data()
                   {
                       TESTID = t_highestId,
                       User = m_currentUser,
                       X = t_xCoordinates,
                       Y = t_yCoordinates,
                   });
               }
               // Saving only this test to data string
               data t_tempData = new data();
               t_tempData.TESTID = t_highestId;
               t_tempData.User = m_currentUser;
               t_tempData.X = t_xCoordinates;
               t_tempData.Y = t_yCoordinates;

               m_dataString = JsonConvert.SerializeObject(t_tempData, Newtonsoft.Json.Formatting.None);

               // Serializing data before inserting into json file
               string json = JsonConvert.SerializeObject(t_dataCoordList.ToArray(), Newtonsoft.Json.Formatting.Indented);
              

               //write string of data to file
               System.IO.File.WriteAllText(i_filePath, json);
           }
       }
    }
}
