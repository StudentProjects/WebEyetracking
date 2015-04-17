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


namespace tieto.education.eyetrackingwebserver
{
    public partial class Form1 : Form
    {
        public Server m_server;

        public delegate void UpdateEYETrackStatusCallback(object e, EventArgs a);
        public delegate void updateClientLabelCallback(object e,EventArgs a);
        public delegate void updateOutputLogBoxCallback(object e,EventArgs a);
        public delegate void updateDisplayHeightCallback(int i_newDisplayHeight);
        public delegate void updateDisplayWidthCallback(int i_newDisplayWidth);

        public Form1(int i_port)
        {
            InitializeComponent();

            this.lvOutput.View = View.Details;
            this.lvOutput.Columns.Add("Text");
            this.lvOutput.Columns[0].Width = this.lvOutput.Width - 4;
            this.lvOutput.HeaderStyle = ColumnHeaderStyle.None;

            startServer("127.0.0.1", i_port);
        }
        
        private void Form1_FormClosing(object sender, FormClosingEventArgs e)
        {
            //Hiding the window, because closing it makes the window unaccessible.
            this.Hide();
            this.Parent = null;
            e.Cancel = true; //hides the form, cancels closing event

        }

        // Initializes the server with specified address and port
        public void startServer(string i_ipAddress,int i_port)
        {
            m_server = new Server(i_ipAddress, i_port);
            // Make local event handlers subsribe to events on the server so that the form can be updated when something happens on the server
            m_server.onOutputTextUpdate += new EventHandler(this.updateOutputOnEvent);
            m_server.onClientStatusUpdate += new EventHandler(this.updateClientStatusOnEvent);
            m_server.onRecorderStatusUpdate += new EventHandler(this.updateEyeTrackStatus);
            m_server.onDisplayCoordUpdate += new EventHandler(this.updateDisplayCoordsOnEvent);
            // Getting startmessage and preparing file saver
            m_server.printStartLogAndPrepareFileSaver();
        }

        // Updating textbox with eyetracker status
        public void updateEyeTrackStatus(object e,EventArgs arg)
        {
            // Callback if method is called from other thread than this object was created in
            if (this.lEyeTrack.InvokeRequired)
            {
                if (!this.IsDisposed)
                {
                    try
                    {
                        UpdateEYETrackStatusCallback t_callbackSelf = updateEyeTrackStatus;
                        this.Invoke(t_callbackSelf, new object[] { e,arg });
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Tried accessing disposed object " + ex.ToString());
                    }
                }
            }
            else
            {
                LabelTextArgs t_arguments = (LabelTextArgs)arg;
                int t_clientStatus = t_arguments.getEventText;
                string t_statusAsString = "";
                switch (t_clientStatus)
                {
                    case 0:
                        t_statusAsString = "Recording";
                        this.lEyeTrack.Text = t_statusAsString;
                        this.lEyeTrack.ForeColor = Color.Green;
                        break;
                    case 1:
                        t_statusAsString = "Not recording";
                        this.lEyeTrack.Text = t_statusAsString;
                        this.lEyeTrack.ForeColor = Color.Red;
                        break;
                    case 2:
                        t_statusAsString = "Paused";
                        this.lEyeTrack.Text = t_statusAsString;
                        this.lEyeTrack.ForeColor = Color.Black;
                        break;
                }
            }
        }


        private void updateClientStatusOnEvent(object e,EventArgs arg)
        {
            // Callback if method is called from other thread than this object was created in
            if (this.lClientCon.InvokeRequired)
            {
                try
                {
                    updateClientLabelCallback t_callbackSelf = updateClientStatusOnEvent;
                    this.Invoke(t_callbackSelf, new object[] { e,arg });
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Tried accessing disposed object: " + ex.ToString());
                }
            }
            else
            {
                LabelTextArgs t_arguments = (LabelTextArgs)arg;
                int t_clientStatus = t_arguments.getEventText;
                string t_statusAsString = "";
                switch(t_clientStatus)
                {
                    case 0:
                        t_statusAsString = "Connected";
                        this.lClientCon.Text = t_statusAsString;
                        this.lClientCon.ForeColor = Color.Green;
                        break;
                    case 1:
                        t_statusAsString = "Not connected";
                        this.lClientCon.Text = t_statusAsString;
                        this.lClientCon.ForeColor = Color.Red;
                        break;
                }
                
            }
        }
        
        // updating form log based on event content
        private void updateOutputOnEvent(object e,EventArgs arg)
        {
            // Callback if method is called from other thread than this object was created in
            if (this.lvOutput.InvokeRequired)
            {
                updateOutputLogBoxCallback t_callbackSelf = updateOutputOnEvent;
                this.Invoke(t_callbackSelf, new object[] {e,arg});
            }
            else
            {
                OutputTextArgs t_eventContent = (OutputTextArgs)arg;
                string t_logMessage = t_eventContent.getEventText;
                int t_type = t_eventContent.getType;
                // Adding logmessage to listbox

                
                if(t_logMessage.Length > 115)
                {
                    int t_totalLines = Convert.ToInt32(Math.Ceiling(t_logMessage.Length / 115.0));
                    for (int i = 0; i < t_totalLines; i++)
                    {
                        string t_subString;
                        if(i != (t_totalLines-1))
                        {
                            t_subString = t_logMessage.Substring(i * 115, 115);
                        }
                        else
                        {
                            int index = t_logMessage.Length - (i*115);
                            t_subString = t_logMessage.Substring(i * 115,index);
                        }
                        if (t_type == 0)
                        {
                            lvOutput.Items.Add(t_subString);
                            lvOutput.Items[lvOutput.Items.Count - 1].BackColor = Color.White;
                            lvOutput.Items[lvOutput.Items.Count - 1].ForeColor = Color.Black;
                        }
                        // Positive notification
                        else if (t_type == 1)
                        {
                            lvOutput.Items.Add(t_subString);
                            lvOutput.Items[lvOutput.Items.Count - 1].BackColor = Color.Green;
                            lvOutput.Items[lvOutput.Items.Count - 1].ForeColor = Color.White;
                        }
                        //Error message
                        else if (t_type == 2)
                        {
                            lvOutput.Items.Add(t_subString);
                            lvOutput.Items[lvOutput.Items.Count - 1].BackColor = Color.Red;
                            lvOutput.Items[lvOutput.Items.Count - 1].ForeColor = Color.White;
                        }
                        //Warning message
                        else if (t_type == 3)
                        {
                            lvOutput.Items.Add(t_subString);
                            lvOutput.Items[lvOutput.Items.Count - 1].BackColor = Color.Yellow;
                            lvOutput.Items[lvOutput.Items.Count - 1].ForeColor = Color.Black;
                        }
                    }
                }
                else
                {
                    if (t_type == 0)
                    {
                        lvOutput.Items.Add(t_logMessage);
                        lvOutput.Items[lvOutput.Items.Count - 1].BackColor = Color.White;
                        lvOutput.Items[lvOutput.Items.Count - 1].ForeColor = Color.Black;
                    }
                    // Positive notification
                    else if (t_type == 1)
                    {
                        lvOutput.Items.Add(t_logMessage);
                        lvOutput.Items[lvOutput.Items.Count - 1].BackColor = Color.Green;
                        lvOutput.Items[lvOutput.Items.Count - 1].ForeColor = Color.White;
                    }
                    //Error message
                    else if (t_type == 2)
                    {
                        lvOutput.Items.Add(t_logMessage);
                        lvOutput.Items[lvOutput.Items.Count - 1].BackColor = Color.Red;
                        lvOutput.Items[lvOutput.Items.Count - 1].ForeColor = Color.White;
                    }
                    //Warning message
                    else if (t_type == 3)
                    {
                        lvOutput.Items.Add(t_logMessage);
                        lvOutput.Items[lvOutput.Items.Count - 1].BackColor = Color.Yellow;
                        lvOutput.Items[lvOutput.Items.Count - 1].ForeColor = Color.Black;
                    }
                }
            }
        }

        private void updateDisplayCoordsOnEvent(object e, EventArgs arg)
        {
            DisplayArgs t_arguments = (DisplayArgs)arg;

            int[] t_coords = t_arguments.getEventText;

            updateDisplayHeight(t_coords[0]);
            updateDisplayWidth(t_coords[1]);
        }
        // updating value of display height in form
        public void updateDisplayHeight(int i_newDisplayHeight)
        {
            if (this.sbWindowHeight.InvokeRequired)
            {
                updateDisplayHeightCallback t_callbackSelf = updateDisplayHeight;
                this.Invoke(t_callbackSelf, new object[] { i_newDisplayHeight });
            }
            else
            {
                this.sbWindowHeight.Value = i_newDisplayHeight;
            }
        }

        // updating value of display width in form
        public void updateDisplayWidth(int i_newDisplayWidth)
        {
            if(this.sbWindowWidth.InvokeRequired)
            {
                updateDisplayWidthCallback t_callbackSelf = updateDisplayWidth;
                this.Invoke(t_callbackSelf, new object[] { i_newDisplayWidth });
            }
            else
            {
                this.sbWindowWidth.Value = i_newDisplayWidth;
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
            this.lvOutput.Items.Clear();
        }

    }
}
