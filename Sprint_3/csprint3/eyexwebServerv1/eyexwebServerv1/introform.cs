// introform.cs
// Created by: Daniel Johansson
// Edited by: 

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace tieto.education.eyetrackingwebserver
{
    public partial class introform : Form
    {
        //Variables
        static int s_defaultPort = 5746;
        public bool m_serverCanStart;
        private int m_assignedPort;

        /// <summary>
        /// Initializing components and binds events
        /// </summary>
        public introform()
        {
            InitializeComponent();
            //Defaulting port number to 5746
            m_assignedPort = 5746;
            m_serverCanStart = false;

            // Event handler to handle tab switch events
            tabControl1.Selecting += new TabControlCancelEventHandler(tabControl1_Selecting);
            setupToolTips();
        }

        /// <summary>
        /// Checking if the server can start
        /// </summary>
        /// <returns>Bool, can the server start or not</returns>
        public bool doStartServer()
        {
            return m_serverCanStart;
        }


        /// <summary>
        /// Collects the assigned port
        /// </summary>
        /// <returns>Integer, the currently active port</returns>
        public int getAssignedPort()
        {
            return m_assignedPort;
        }

        /// <summary>
        /// Updating the assigned port with a new number.
        /// </summary>
        /// <param name="i_newPort">Integer, the new port number</param>
        public void updatePort(int i_newPort)
        {
            m_assignedPort = i_newPort;
        }

        /// <summary>
        /// Binding tool tip to buttons
        /// </summary>
        private void setupToolTips()
        {
            this.introToolTip.SetToolTip(this.btnStartServer, "Start the local listening server");
            this.introToolTip.SetToolTip(this.btnSave, "Update port number");
            this.introToolTip.SetToolTip(this.button1, "Use default port as port number");
        }

        /// <summary>
        /// Controls if the requested port number is valid
        /// </summary>
        /// <param name="i_port">String, the requested port number</param>
        /// <returns>Bool, confirming if the port number is okay to use or not</returns>
        bool controlPort(string i_port)
        {
            if(String.IsNullOrEmpty(i_port))
            {
                return false;
            }

            // Check if it only contains numbers
            Regex t_valueAsNumber = new Regex(@"^[0-9]+$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
            if (t_valueAsNumber.IsMatch(i_port))
            {
                try
                {
                    // Check that the port number is not out of range
                    if (Convert.ToInt32(i_port) < 65536)
                    {
                        return true;
                    }
                }
                catch (OverflowException)
                {
                    // Error
                    MessageBox.Show("Too large port number", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            return false;
        }

        /// <summary>
        /// Starting server and disposes this form
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void btnStartServer_Click(object sender, EventArgs e)
        {
            m_serverCanStart = true;
            this.Dispose();
        }

        /// <summary>
        /// Will try to update the port number based on what the user typed in the text box.
        /// Will throw an alert message if the update wetn through successfully or not
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void btnSave_Click(object sender, EventArgs e)
        {
            bool t_succeded = controlPort(this.txtCurrentPort.Text);

            if(t_succeded)
            {
                m_assignedPort = Convert.ToInt32(this.txtCurrentPort.Text);
                MessageBox.Show("Successfully updated port number to: " + m_assignedPort.ToString(), "Information", MessageBoxButtons.OK,MessageBoxIcon.Information);
            }
            else
            {
                MessageBox.Show("Not a valid port number", "Error", MessageBoxButtons.OK,MessageBoxIcon.Error);
            }
        }

        private void tabPage2_Click(object sender, EventArgs e)
        {

        }

        /// <summary>
        /// Setting new port number text box to the current port number when the user switches to that tab
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void tabControl1_Selecting(Object sender, TabControlCancelEventArgs e)
        {
            if(tabControl1.SelectedIndex == 1)
            {
                this.txtCurrentPort.Text = m_assignedPort.ToString();
            }
        }

        /// <summary>
        /// Updating current port to default port and sets textbox text to the default port number
        /// Showing messagebox to notify the user that the port number has changed
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void button1_Click(object sender, EventArgs e)
        {
            this.txtCurrentPort.Text = s_defaultPort.ToString();
            m_assignedPort = Convert.ToInt32(this.txtCurrentPort.Text);
            MessageBox.Show("Successfully updated port number to default port: " + s_defaultPort.ToString(), "Information", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
    }
}
