// Form1.cs
// Created by: Daniel Johansson
// Edited by: 

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;


namespace eyexwebServerv1
{
    public partial class Form1 : Form
    {
        public Server m_server;
        private bool m_safeToClose;
        
        public delegate void UpdateEYETrackStatusCallback(string i_status);
        public delegate void updateClientLabelCallback(string i_status);
        public delegate void updateOutputLogBoxCallback(string i_logMessage);
        public delegate void updateDisplayHeightCallback(int i_newDisplayHeight);
        public delegate void updateDisplayWidthCallback(int i_newDisplayWidth);

        public Form1()
        {
            InitializeComponent();
            m_server = new Server("127.0.0.1", 5746, this);
            m_safeToClose = false;
        }
        
        private void Form1_FormClosing(object sender, FormClosingEventArgs e)
        {
            //Hiding the window, because closing it makes the window unaccessible.
            this.Hide();
            this.Parent = null;
            
            if(m_safeToClose)
            {
                e.Cancel = true; //hides the form, cancels closing event
            }
        }

        // Updating textbox with eyetracker status
        public void updateEyeTrackStatus(string i_status)
        {
            // Callback if method is called from other thread than this object was created in
            if (this.tbEyeTrack.InvokeRequired)
            {
                if (!this.IsDisposed)
                {
                    try
                    {
                        UpdateEYETrackStatusCallback t_callbackSelf = updateEyeTrackStatus;
                        this.Invoke(t_callbackSelf, new object[] { i_status });
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine("Tried accessing disposed object " + e.ToString());
                    }
                }
            }
            else
            {
                this.tbEyeTrack.Text = i_status;
                m_safeToClose = true;
            }
        }

        // Update connected client status
        public void updateClientStatusLabel(string i_status)
        {
            // Callback if method is called from other thread than this object was created in
            if(this.tbClientCon.InvokeRequired)
            {
                try
                {
                    updateClientLabelCallback t_callbackSelf = updateClientStatusLabel;
                    this.Invoke(t_callbackSelf, new object[] { i_status });
                }
                catch(Exception e)
                {
                    Console.WriteLine("Tried accessing disposed object: "+ e.ToString());
                }
            }
            else
            {
                this.tbClientCon.Text = i_status;
                m_safeToClose = true;
            }
        }

        // updating form listbox with output messages
        public void updateOutputLogBox(string i_logMessage)
        {
            // Callback if method is called from other thread than this object was created in
            if(this.lbOutput.InvokeRequired)
            {
                updateOutputLogBoxCallback t_callbackSelf = updateOutputLogBox;
                this.Invoke(t_callbackSelf, new object[] { i_logMessage });
            }
            else
            {
                // Only allowing 10 logmessages at the time
                if(this.lbOutput.Items.Count == 5)
                {
                    this.lbOutput.ScrollAlwaysVisible = true;
                }
                // Adding logmessage to listbox
                this.lbOutput.Items.Add(i_logMessage);
                m_safeToClose = true;
            }
        }

        // updating value of display height in form
        public void updateDisplayHeight(int i_newDisplayHeight)
        {
            if (this.sbWindowHeight.InvokeRequired)
            {
                updateDisplayHeightCallback t_callbackSelf = updateDisplayHeight;
                this.Invoke(t_callbackSelf, new object[] { i_newDisplayHeight });
                m_safeToClose = false;
            }
            else
            {
                this.sbWindowHeight.Value = i_newDisplayHeight;
                m_safeToClose = true;
            }
        }

        // updating value of display width in form
        public void updateDisplayWidth(int i_newDisplayWidth)
        {
            if(this.sbWindowWidth.InvokeRequired)
            {
                updateDisplayWidthCallback t_callbackSelf = updateDisplayWidth;
                this.Invoke(t_callbackSelf, new object[] { i_newDisplayWidth });
                m_safeToClose = false;
            }
            else
            {
                this.sbWindowWidth.Value = i_newDisplayWidth;
                m_safeToClose = true;
            }
        }

        private void sbWindowWidth_ValueChanged(object sender, EventArgs e)
        {
            if(m_server != null)
            {
                m_server.requestDisplayWidthUpdateEYE((int)sbWindowWidth.Value);
            }
        }

        private void sbWindowHeight_ValueChanged(object sender, EventArgs e)
        {
            if(m_server != null)
            {
                m_server.requestDisplayHeightUpdateEYE((int)sbWindowHeight.Value);
            }
        }

        // Clearing log window on button pressed
        private void btnClearLog_Click(object sender, EventArgs e)
        {
            this.lbOutput.Items.Clear();
        }
    }
}
