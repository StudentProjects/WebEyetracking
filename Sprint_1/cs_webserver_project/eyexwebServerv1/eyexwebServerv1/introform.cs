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
        static int DEFAULTPORT = 5746;
        public bool m_serverCanStart;
        private int m_assignedPort;

        // Constructor
        public introform()
        {
            InitializeComponent();
            //Defaulting port number to 5746
            m_assignedPort = 5746;
            m_serverCanStart = false;

            // Event handler to handle tab switch events
            tabControl1.Selecting += new TabControlCancelEventHandler(tabControl1_Selecting);
        }

        // returns true of the user has typed in correct values
        public bool doStartServer()
        {
            return m_serverCanStart;
        }


        // get the currently chosen port
        public int getAssignedPort()
        {
            return m_assignedPort;
        }

        public void updatePort(int i_newPort)
        {
            m_assignedPort = i_newPort;
        }

        // Is the specified port a valid port number
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

        // Updates the server can start bool and disposes self
        private void btnStartServer_Click(object sender, EventArgs e)
        {
            m_serverCanStart = true;
            this.Dispose();
        }

        // Try to update the port number
        // Notifies the user if the change succeeded or failed
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

        // Called on tab switch
        // Case it is the options tab. Type the current port number into the field
        private void tabControl1_Selecting(Object sender, TabControlCancelEventArgs e)
        {
            if(tabControl1.SelectedIndex == 1)
            {
                this.txtCurrentPort.Text = m_assignedPort.ToString();
            }
        }

        //Setting text box to default port
        private void button1_Click(object sender, EventArgs e)
        {
            this.txtCurrentPort.Text = DEFAULTPORT.ToString();
            m_assignedPort = Convert.ToInt32(this.txtCurrentPort.Text);
            MessageBox.Show("Successfully updated port number to default port: " + DEFAULTPORT.ToString(), "Information", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
    }
}
