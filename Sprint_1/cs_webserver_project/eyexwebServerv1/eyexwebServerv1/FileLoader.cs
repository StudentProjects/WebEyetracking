// FileLoader.cs
// Created by: Daniel Johansson
// Edited by: 

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.IO;

namespace eyexwebServerv1
{
    public class FileLoader
    {
        public event EventHandler onFileLoadNotificationUpdate = delegate { };
        private string m_notificationText;
        private int m_logType;

        // The main directory to save data in
        string m_defaultLocation;

        public FileLoader()
        {
            m_notificationText = "";
            m_logType = -1;
            m_defaultLocation = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), @"EyeXTestData");
        }

        //Printing start text to output log
        public void initialize()
        {
            m_logType = 1;
            loadNotificationProperty = "File Loader: Finished initializing";
        }

        // Get data from requested application folder as a finished json string
        public string getApplicationData(string i_application)
        {
            string t_applicationMessage = "NoData";
            string t_applicationLocation = Path.Combine(m_defaultLocation, i_application);
            ApplicationData t_allInfo = new ApplicationData();

            // Check if searched directory exists
            if (Directory.Exists(t_applicationLocation))
            {
                t_allInfo.ApplicationName = i_application;

                //Adding a new array to application data. Will contains all the subdirectories (Dates) in the specific application folder
                DateInfo[] t_dateInfo = new DateInfo[System.IO.Directory.GetDirectories(t_applicationLocation).Length];
                int t_dateNumberOfSubdirectories = t_dateInfo.Length;
                string[] t_dateDirectoryNamesPath = System.IO.Directory.GetDirectories(t_applicationLocation);

                //Looping through all date folders
                for (int i = 0; i < t_dateNumberOfSubdirectories; i++)
                {
                    t_dateInfo[i] = new DateInfo();

                    //Get folder name of date folder without the whole path
                    string t_directoryFolderName = Path.GetFileName(t_dateDirectoryNamesPath[i]);

                    //Setting current date in array to the same as folder name
                    t_dateInfo[i].Date = t_directoryFolderName;

                    //Getting all subdirectories of specific date folder
                    string[] t_nameDirectoriesPath = System.IO.Directory.GetDirectories(Path.Combine(t_applicationLocation, t_directoryFolderName));

                    //Getting location path of subfolders application + date
                    string t_pathToNameFolders = Path.Combine(t_applicationLocation, t_directoryFolderName);

                    //Initializing array with the size of all subdirectories in ApplicationFolder/DateFolder
                    t_dateInfo[i].Names = new NameInfo[t_nameDirectoriesPath.Length];

                    //Going through all name folders
                    for (int j = 0; j < t_nameDirectoriesPath.Length; j++)
                    {
                        //Get path to foldername in Application/Date/FOLDERNAME
                        t_nameDirectoriesPath[j] = Path.GetFileName(t_nameDirectoriesPath[j]);
                        t_dateInfo[i].Names[j] = new NameInfo();

                        //Since the folder with name and id is separated by _ we'll split the foldername by underscore to get the id and the name of the tester
                        string[] t_separatedNameFolderName = t_nameDirectoriesPath[j].Split('_');
                        int t_id = Convert.ToInt32(t_separatedNameFolderName[t_separatedNameFolderName.Length - 1]);

                        //Constructing testers full name based on the folder name
                        string t_testerFullName = t_separatedNameFolderName[0];
                        for (int c = 1; c < t_separatedNameFolderName.Length - 1; c++)
                        {
                            t_testerFullName = t_testerFullName + " " + t_separatedNameFolderName[c];
                        }

                        //Setting id and name
                        t_dateInfo[i].Names[j].Id = t_id;
                        t_dateInfo[i].Names[j].Name = t_testerFullName;

                        //Getting test time for current test data folder in the userinfo.js file
                        string t_pathToNameFolder = Path.Combine(t_pathToNameFolders, t_nameDirectoriesPath[j]);
                        using (StreamReader r = new StreamReader(Path.Combine(t_pathToNameFolder, @"userinfo.json")))
                        {
                            string json = r.ReadToEnd();
                            UserInfo t_info = JsonConvert.DeserializeObject<UserInfo>(json);
                            t_dateInfo[i].Names[j].Time = t_info.TestTime;
                        }
                    }
                }

                // Adding all dates of application folder to the Application object
                t_allInfo.Dates = t_dateInfo;
                //Serializing it to a string so that it can be written to the client
                t_applicationMessage = JsonConvert.SerializeObject(t_allInfo, Formatting.None);

                m_logType = 1;
                loadNotificationProperty = "File Loader: Successfully received ApplicationData with specified parameters";
            }
            else
            {
                m_logType = 3;
                loadNotificationProperty = "File Loader: Tried to access data from unknown application '" + i_application + "'. Please try again.";
            }
            return t_applicationMessage;
        }

        //Returning all available applications
        public string getAllApplicationData()
        {
            string t_applicationData = "NoData";
            //Getting total amount of subfolders in root directory (all applications)
            int t_totalApplicationsInFolder = System.IO.Directory.GetDirectories(m_defaultLocation).Length;

            // if there are any applications, collect all the names
            if (t_totalApplicationsInFolder > 0)
            {
                AllApplicationNames t_allApplications = new AllApplicationNames();
                t_allApplications.ApplicationName = new string[t_totalApplicationsInFolder];

                //Getting all application names with path
                string[] t_allApplicationNames = System.IO.Directory.GetDirectories(m_defaultLocation);

                // for every application, add it to the data structure
                for (int i = 0; i < t_totalApplicationsInFolder; i++)
                {
                    string t_currentApplicationName = Path.GetFileName(t_allApplicationNames[i]);
                    t_allApplications.ApplicationName[i] = t_currentApplicationName;
                }

                //Serializing object to string
                t_applicationData = JsonConvert.SerializeObject(t_allApplications, Formatting.None);

                //Notifying viewer of successful operation
                m_logType = 1;
                loadNotificationProperty = "File Loader: Successfully collected all application names";
            }
            else
            {
                m_logType = 3;
                loadNotificationProperty = "File Loader: Client requested application names. But no applications exists in the root directory";
            }
            return t_applicationData;
        }

        //Returns a string containing test data specific for an application,date and tester
        public string getSpecificTestData(string i_application, string i_date, string i_testerName, int i_id)
        {
            // The response will be nodata if the rest of this function fails
            string t_completeTestResults = "NoData";


            //Constructing paths to necessary directories
            string[] t_testerName = i_testerName.Split(' ');
            string t_testerNameUnderscored = t_testerName[0];
            for (int i = 1; i < t_testerName.Length; i++)
            {
                t_testerNameUnderscored = t_testerNameUnderscored + "_" + t_testerName[i];
            }

            string t_nameFolder = t_testerNameUnderscored + "_" + i_id.ToString();
            string t_applicationLocation = Path.Combine(m_defaultLocation, i_application);
            string t_dateLocation = Path.Combine(t_applicationLocation, i_date);
            string t_nameLocation = Path.Combine(t_dateLocation, t_nameFolder);

            // If directory with wanted results still exists
            if (Directory.Exists(t_nameLocation))
            {
                //Checking that file exists
                string t_dataFilePath = Path.Combine(t_nameLocation, @"testdata.json");
                if (File.Exists(t_dataFilePath))
                {
                    //Read all data from file
                    using (StreamReader r = new StreamReader(t_dataFilePath))
                    {
                        string json = r.ReadToEnd();
                        //Must be a long string with test data
                        if (json.Length > 10)
                        {
                            // surrounding with try catch if there is any error in the file. Trying to parse it to a TestData object
                            try
                            {
                                TestData t_testData = JsonConvert.DeserializeObject<TestData>(json);

                                //Final message to send
                                t_completeTestResults = JsonConvert.SerializeObject(t_testData, Formatting.None);

                                m_logType = 1;
                                loadNotificationProperty = "File Loader: The file " + t_dataFilePath + " was successfully read from and will be sent to client";
                            }
                            catch (Exception e)
                            {
                                m_logType = 2;
                                loadNotificationProperty = "File Loader: The file " + t_dataFilePath + " contains invalid data";
                                Console.WriteLine("Error in file " + e.ToString());

                                //Set as no data
                                t_completeTestResults = "NoData";
                            }
                        }
                    }
                }
                else
                {
                    m_logType = 3;
                    loadNotificationProperty = "File Loader: The file " + t_dataFilePath + " does not exist and the client tried to access it";
                }
            }
            else
            {
                m_logType = 3;
                loadNotificationProperty = "File Loader: The directory " + t_nameLocation + " does not exist and the client tried to access it";
            }

            return t_completeTestResults;
        }

        // PROPERTIES //

        // triggers event when the file loader wants the output log to print something
        private string loadNotificationProperty
        {
            get { return m_notificationText; }
            set
            {
                m_notificationText = value;
                if (m_notificationText == loadNotificationProperty)
                {
                    onFileLoadNotificationUpdate(this, new OutputTextArgs(m_notificationText, m_logType));
                }
            }
        }



    }
}
