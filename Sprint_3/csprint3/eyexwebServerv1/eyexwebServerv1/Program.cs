// Program.cs
// Created by: Daniel Johansson
// Edited by: 

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace tieto.education.eyetrackingwebserver
{
    static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            introform t_firstWindow = new introform();
            Application.Run(t_firstWindow);

            // Only run if the user has typed a valid port and ip in the previous form
            if (t_firstWindow.doStartServer())
            {
                int t_localPort = t_firstWindow.getAssignedPort();
                Application.Run(new Form1(t_localPort));
            }

        }
    }
}
