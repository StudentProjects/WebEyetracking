// FileSaver.cs
// Created by: Daniel Johansson
// Edited by: 

using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace tieto.education.eyetrackingwebserver
{
    public class FileSaver
    {

        public event EventHandler onFileSaveNotificationUpdate = delegate { };
        private string m_notificationText;
        private int m_logType;
        // The main directory to save data in
        string m_defaultLocation;

        /// <summary>
        /// Initializes the notificationtext and the log type and also sets up the default location to save data in
        /// </summary>
        public FileSaver()
        {
            m_notificationText = "";
            m_logType = -1;
            m_defaultLocation = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),@"EyeXTestData");
        }

        /// <summary>
        /// Initializing the file saver
        /// Sets up the main directory if it doesn't exist
        /// </summary>
        public void initialize()
        {
            bool t_isDefaultLocationCreated = isFolderExisting(m_defaultLocation);
            if (!t_isDefaultLocationCreated)
            {
                createFolderWithNameAtPath(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), @"EyeXTestData");
                m_logType = 0;
                saveNotificationProperty = "File Saver: Created directory EYEXTestData in " + Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            }
            else
            {
                m_logType = 1;
                saveNotificationProperty = "File Saver: Main directory existed!";
            }
        }

        /// <summary>
        /// Saving all data with the specified information.
        /// Created a new folder for the test based on date and tester name as subfolders to the application folder corresponding
        /// to the application the tests was performed on.
        /// When folders are created the testdata object and the userinfo object will be saved as two different files within
        /// the subfolder with the name of the tester
        /// </summary>
        /// <example>
        /// When a test at the application 'norran.se' is performed by user Daniel Johansson at 2015-04-21
        /// the created folder structure will look like this: Documents/EyeXTestData/norran.se/2015-04-21/daniel_johansson_1
        /// if this is the first time Daniel Johansson performs a test at norran.se at the same date.
        /// Otherwise the last subfolder would be named daniel_johansson_2
        /// </example>
        /// <param name="i_application">String, the application the test was performed on</param>
        /// <param name="i_date">String, the date when the test was performed</param>
        /// <param name="i_testData">TestData, all testdata collected during test. Contains X,Y coordinates etc</param>
        /// <param name="i_userInfo">UserInfo, all userinfo received before starting the test.</param>
        public void saveAllData(string i_application,string i_date,TestData i_testData,UserInfo i_userInfo,SoundData i_audioData)
        { 
            if(i_date == null)
            {
                i_date = DateTime.Now.ToString("yyyy-MM-dd");
            }
            string t_applicationLocation = Path.Combine(m_defaultLocation,i_application.ToLower());
            bool t_isApplicationLocationCreated = isFolderExisting(t_applicationLocation);
            if(!t_isApplicationLocationCreated)
            {
                createFolderWithNameAtPath(m_defaultLocation, i_application.ToLower());
            }
            string t_dateLocation = Path.Combine(t_applicationLocation,i_date);
            bool t_isDateLocationCreated = isFolderExisting(t_dateLocation);
            if(!t_isDateLocationCreated)
            {
                createFolderWithNameAtPath(t_applicationLocation, i_date);
            }

            string t_testNameUnderscore = updateUserName(i_userInfo.Name.ToLower());
            int t_testID = updateID(t_dateLocation, t_testNameUnderscore);
            string t_idNameDirectory = t_testNameUnderscore + "_" + t_testID.ToString();
            //Creating Folder for this test
            createFolderWithNameAtPath(t_dateLocation, t_idNameDirectory);

            // Create both files
            string t_fullPathDirectory = Path.Combine(t_dateLocation,t_idNameDirectory);
            string t_userInfoFileName = Path.Combine(t_fullPathDirectory, @"userinfo.json");
            string t_testDataFileName = Path.Combine(t_fullPathDirectory, @"testdata.json");

            createFileWithNameAtPath(t_fullPathDirectory, @"userinfo.json");
            createFileWithNameAtPath(t_fullPathDirectory, @"testdata.json");

            // Save data and update ID
            UserInfo t_userInfo = i_userInfo;
            t_userInfo.TESTID = t_testID;
            TestData t_testData = i_testData;
            t_testData.TESTID = t_testID;
            saveUserInfo(t_userInfoFileName, t_userInfo);
            saveTestData(t_testDataFileName, t_testData);

            if(i_audioData != null)
            {
                string t_audioDataFileName = Path.Combine(t_fullPathDirectory, @"audiodata.json");
                createFileWithNameAtPath(t_fullPathDirectory, @"audiodata.json");
                SoundData t_soundData = i_audioData;
                saveAudioData(t_audioDataFileName, t_soundData);
            }
        }

        /// <summary>
        /// Updating username. Adding underscores if the name contains empty spaces
        /// </summary>
        /// <param name="i_name">String, The username to edit</param>
        /// <returns>String, the modified user name</returns>
        private string updateUserName(string i_name)
        {
            string t_originalName = i_name;
            t_originalName = t_originalName.Trim();
            string t_newName = String.Empty;
            if (t_originalName.Contains(" "))
            {
                string[] t_splittedName = t_originalName.Split(' ');
                t_newName = t_splittedName[0];
                for (int i = 1; i < t_splittedName.Length; i++)
                {
                    t_newName = t_newName + "_" + t_splittedName[i];
                }
            }
            else
            {
                t_newName = t_originalName;
            }
            return t_newName;
        }

        /// <summary>
        /// Creating folder at specified path if it doesn't exist
        /// </summary>
        /// <param name="i_path">String, The specified path</param>
        /// <param name="i_name">String, the requested name of the new folder</param>
        private void createFolderWithNameAtPath(string i_path,string i_name)
        {
            m_logType = 0;
            string t_folderPath = Path.Combine(i_path, i_name);
            if(!Directory.Exists(t_folderPath))
            {
                saveNotificationProperty = "File Saver: Creating directory " + t_folderPath;
                Directory.CreateDirectory(t_folderPath);

                m_logType = 1;
                saveNotificationProperty = "File Saver: Successfully created directory " + t_folderPath;
            }
            else
            {
                m_logType = 3;
                saveNotificationProperty = "File Saver: Tried to create already existing directory: " + t_folderPath;
            }
        }

        /// <summary>
        /// Creating file at specified path
        /// </summary>
        /// <param name="i_path">String, the requested path</param>
        /// <param name="i_name">String, the requested file name</param>
        private void createFileWithNameAtPath(string i_path,string i_name)
        {
            m_logType = 0;
            string t_filePath = Path.Combine(i_path, i_name);
            if (!File.Exists(t_filePath))
            {
                saveNotificationProperty = "File Saver: Creating file " + t_filePath;
                using (var t_file = File.Create(t_filePath))
                {
                    t_file.Close();
                }
                m_logType = 1;
                saveNotificationProperty = "File Saver: Successfully created file " + t_filePath;
            }
            else
            {
                m_logType = 3;
                saveNotificationProperty = "File Saver: Tried to create already existing file " + t_filePath;
            }
        }

        /// <summary>
        /// Will try to save test data at the specified path
        /// </summary>
        /// <param name="i_path">String, the specified path</param>
        /// <param name="i_testData">TestData, the testdata object with all test information to be saved</param>
        private void saveTestData(string i_path,TestData i_testData)
        {
            try
            {
                // Serializing data before inserting into json file
                string t_testDataToJson = JsonConvert.SerializeObject(i_testData, Newtonsoft.Json.Formatting.Indented);
                //write string of data to file
                System.IO.File.WriteAllText(i_path, t_testDataToJson);

                m_logType = 1;
                saveNotificationProperty = "File Saver: Successfully saved property TESTDATA";
            }
            catch (FileNotFoundException e)
            {
                m_logType = 2;
                saveNotificationProperty = "File Saver: Failed to save property TESTDATA: " + e.ToString();
            }
        }

        /// <summary>
        /// Saving user information at specified path
        /// </summary>
        /// <param name="i_path">String, the specified path</param>
        /// <param name="i_userInfo">UserInfo, the object containing all user info</param>
        private void saveUserInfo(string i_path,UserInfo i_userInfo)
        {
            try
            {
                // Serializing data before inserting into json file
                string t_userStructToJson = JsonConvert.SerializeObject(i_userInfo, Newtonsoft.Json.Formatting.Indented);
                //write string of data to file
                System.IO.File.WriteAllText(i_path, t_userStructToJson);

                m_logType = 1;
                saveNotificationProperty = "File Saver: Successfully saved property USERINFO";
            }
            catch(FileNotFoundException e)
            {
                m_logType = 2;
                saveNotificationProperty = "File Saver: Failed to save property USERINFO: " + e.ToString();
            }
        }

        private void saveAudioData(string i_path,SoundData i_soundData)
        {
            try
            {
                // Serializing data before inserting into json file
                string t_audioStructToJson = JsonConvert.SerializeObject(i_soundData, Newtonsoft.Json.Formatting.Indented);
                //write string of data to file
                System.IO.File.WriteAllText(i_path, t_audioStructToJson);

                m_logType = 1;
                saveNotificationProperty = "File Saver: Successfully saved property AUDIO";
            }
            catch (FileNotFoundException e)
            {
                m_logType = 2;
                saveNotificationProperty = "File Saver: Failed to save property AUDIO: " + e.ToString();
            }
        }

        /// <summary>
        /// Controls if a directory exists or not
        /// </summary>
        /// <param name="i_path">String, the path to search at</param>
        /// <returns>A bool, did the directory exist</returns>
        private bool isFolderExisting(string i_path)
        {
            if(Directory.Exists(i_path))
            {
                return true;
            }
            return false;
        }

        /// <summary>
        /// Controls if a file exists or not
        /// </summary>
        /// <param name="i_path">String, the path to search at</param>
        /// <returns>A bool, did the file exist</returns>
        private bool isFileExisting(string i_path)
        {
            if(File.Exists(i_path))
            {
                return true;
            }
            return false;
        }

        /// <summary>
        /// Returning which ID to use when creating new folder name with tester name + ID.
        /// Will check how many user with the same name that exists in that specific folder and set the ID to one value higher than the existing tests
        /// </summary>
        /// <param name="i_path">String, the path to look at</param>
        /// <param name="i_name">String, the tester name</param>
        /// <returns>The ID to use when creating folder</returns>
        private int updateID(string i_path,string i_name)
        {
            int t_idToUse = 1; 
            string[] t_folderNameArray = Directory.GetDirectories(i_path);
            List<string> t_filesWithName = new List<string>();

            // Get all folders with the same name
            for(int i=0;i<t_folderNameArray.Length;i++)
            {
                if(t_folderNameArray[i].Contains(i_name))
                {
                    t_filesWithName.Add(t_folderNameArray[i]);
                }
            }

            // Get the currently highest ID
            int t_currentLargest = 0;
            if(t_filesWithName.Count > 0)
            {
                t_currentLargest = t_filesWithName.Count;
            }

            t_idToUse = t_currentLargest + 1;

            return t_idToUse;
        }

        // PROPERTIES //

        /// <summary>
        /// Fires event which can be handled by EventHandlers if the property value changes
        /// used for log updates
        /// </summary>
        private string saveNotificationProperty
        {
            get { return m_notificationText; }
            set
            {
                m_notificationText = value;
                if (m_notificationText == saveNotificationProperty)
                {
                    onFileSaveNotificationUpdate(this, new OutputTextArgs(m_notificationText, m_logType));
                }
            }
        }

    }
}
