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
        public FileSaver()
        {
            m_notificationText = "";
            m_logType = -1;
            m_defaultLocation = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),@"EyeXTestData");
        }

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

        // Save all test data to two files
        // One file will contain the test data (ID,X,Y)
        // The other file will contain the user info
        public void saveAllData(string i_application,string i_date,TestData i_testData,UserInfo i_userInfo)
        { 
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
        }

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

        // Creating new directory on the specified path with the specified name
        private void createFolderWithNameAtPath(string i_path,string i_name)
        {
            m_logType = 0;
            string t_folderPath = Path.Combine(i_path, i_name);
            saveNotificationProperty = "File Saver: Creating directory " + t_folderPath;
            Directory.CreateDirectory(t_folderPath);

            m_logType = 1;
            saveNotificationProperty = "File Saver: Successfully created directory " + t_folderPath;

        }

        //Creating a new file with the specified name and selected path
        private void createFileWithNameAtPath(string i_path,string i_name)
        {
            m_logType = 0;
            string t_filePath = Path.Combine(i_path, i_name);
            saveNotificationProperty = "File Saver: Creating file " + t_filePath;
            using(var t_file = File.Create(t_filePath))
            {
                t_file.Close();
            }
            m_logType = 1;
            saveNotificationProperty = "File Saver: Successfully created file " + t_filePath;
        }

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

        //Check if directory at path exists
        private bool isFolderExisting(string i_path)
        {
            if(Directory.Exists(i_path))
            {
                return true;
            }
            return false;
        }

        // Check if file at path exists
        private bool isFileExisting(string i_path)
        {
            if(File.Exists(i_path))
            {
                return true;
            }
            return false;
        }

        // return ID to use when creating file folder to the highest possible ID of folder with the same user in this date folder
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
