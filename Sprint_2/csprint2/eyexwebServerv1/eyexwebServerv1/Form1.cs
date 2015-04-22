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
        public delegate void updateDisconnectButtonCallback(object e, EventArgs a);

        /// <summary>
        /// initializes server and form components
        /// </summary>
        /// <param name="i_port">Integer, the port to start the server at</param>
        public Form1(int i_port)
        {
            InitializeComponent();

            this.lvOutput.View = View.Details;
            this.lvOutput.Columns.Add("Text");
            this.lvOutput.Columns[0].Width = this.lvOutput.Width - 4;
            this.lvOutput.HeaderStyle = ColumnHeaderStyle.None;

            //Setting log box to focused
            this.ActiveControl = this.lvOutput;
            this.mainToolTip.SetToolTip(this.btnClearLog, "Clearing output log");
            startServer("127.0.0.1", i_port);
        }
        
        /// <summary>
        /// Triggered when form closes
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void Form1_FormClosing(object sender, FormClosingEventArgs e)
        {
            //Hiding the window, because closing it makes the window unaccessible.
            this.Hide();
            this.Parent = null;
            e.Cancel = true; //hides the form, cancels closing event

        }

        /// <summary>
        /// Initializes a new server instance based on the ip address and port
        /// After initialization this class binds its event handlers to event delegates in the server class
        /// </summary>
        /// <param name="i_ipAddress">String, The wanted IP-address</param>
        /// <param name="i_port">Integer, the wanted port number</param>
        public void startServer(string i_ipAddress,int i_port)
        {
            m_server = new Server(i_ipAddress, i_port);
            // Make local event handlers subsribe to events on the server so that the form can be updated when something happens on the server
            m_server.onOutputTextUpdate += new EventHandler(this.updateOutputOnEvent);
            m_server.onClientStatusUpdate += new EventHandler(this.updateClientStatusOnEvent);
            m_server.onRecorderStatusUpdate += new EventHandler(this.updateEyeTrackStatus);
            m_server.onDisplayCoordUpdate += new EventHandler(this.updateDisplayCoordsOnEvent);
            m_server.onClientConnected += new EventHandler(this.updateDisconnectButton);
            // Getting startmessage and preparing file saver
            m_server.printStartLogAndPrepareFileSaver();
        }

        /// <summary>
        /// Updates the Recording Status label in the form with a new value received in EventArgs
        /// </summary>
        /// <param name="e"></param>
        /// <param name="arg"></param>
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


        /// <summary>
        /// Updates the Client Status Label in the form based on information from the EventArgs
        /// </summary>
        /// <param name="e"></param>
        /// <param name="arg"></param>
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

        private void updateDisconnectButton(object sender,EventArgs eventArgs)
        {
            if(this.btn_condis.InvokeRequired)
            {
                updateDisconnectButtonCallback t_callbackSelf = updateDisconnectButton;
                this.Invoke(t_callbackSelf, new object[] { sender,eventArgs });
            }
            else
            {
                try
                {
                    DisconnectButtonArgs t_eventReceivedArgs = (DisconnectButtonArgs)eventArgs;

                    bool t_isButtonGoingToBeActivated = t_eventReceivedArgs.getEventBool;

                    if(t_isButtonGoingToBeActivated)
                    {
                        this.btn_condis.Enabled = true;
                    }
                    else
                    {
                        this.btn_condis.Enabled = false;
                    }
                }
                catch(Exception)
                {

                }
            }
        }
        
        /// <summary>
        /// Updates output log with new message based on EventArgs
        /// </summary>
        /// <param name="e"></param>
        /// <param name="arg"></param>
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
                //Always latest index visible
                lvOutput.Items[lvOutput.Items.Count - 1].EnsureVisible();
            }
        }

        /// <summary>
        /// Updating display size based on EventArgs
        /// </summary>
        /// <param name="e"></param>
        /// <param name="arg"></param>
        private void updateDisplayCoordsOnEvent(object e, EventArgs arg)
        {
            DisplayArgs t_arguments = (DisplayArgs)arg;

            int[] t_coords = t_arguments.getEventText;

            updateDisplayHeight(t_coords[0]);
            updateDisplayWidth(t_coords[1]);
        }
        /// <summary>
        /// Setting the new height in the scroll box in the form
        /// </summary>
        /// <param name="i_newDisplayHeight">Integer, the new height</param>
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

        /// <summary>
        /// Setting the new width in the scroll box in the form
        /// </summary>
        /// <param name="i_newDisplayWidth">Integer, the new width</param>
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

        /// <summary>
        /// Requests server to tell recorder to update its display width with the new width in the form
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void sbWindowWidth_ValueChanged(object sender, EventArgs e)
        {
            if(m_server != null)
            {
                m_server.requestDisplayWidthUpdateEYE((int)sbWindowWidth.Value);
            }
        }

        /// <summary>
        /// Requests server to tell recorder to update its display height with the new height value in the form
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void sbWindowHeight_ValueChanged(object sender, EventArgs e)
        {
            if(m_server != null)
            {
                m_server.requestDisplayHeightUpdateEYE((int)sbWindowHeight.Value);
            }
        }

        /// <summary>
        /// Clearing output log when Clear Log button is pressed
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void btnClearLog_Click(object sender, EventArgs e)
        {
            this.lvOutput.Items.Clear();
        }

        /// <summary>
        /// Sending request to server to disconnect client
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void btn_condis_Click(object sender, EventArgs e)
        {
            m_server.DisconnectClientOnRequest();
        }

    }
}
