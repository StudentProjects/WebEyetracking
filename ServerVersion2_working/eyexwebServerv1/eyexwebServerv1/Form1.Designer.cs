namespace eyexwebServerv1
{
    partial class Form1
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.label1 = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.label3 = new System.Windows.Forms.Label();
            this.label4 = new System.Windows.Forms.Label();
            this.label5 = new System.Windows.Forms.Label();
            this.sbWindowWidth = new System.Windows.Forms.NumericUpDown();
            this.sbWindowHeight = new System.Windows.Forms.NumericUpDown();
            this.btnClearLog = new System.Windows.Forms.Button();
            this.lvOutput = new System.Windows.Forms.ListView();
            this.lClientCon = new System.Windows.Forms.Label();
            this.lEyeTrack = new System.Windows.Forms.Label();
            ((System.ComponentModel.ISupportInitialize)(this.sbWindowWidth)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.sbWindowHeight)).BeginInit();
            this.SuspendLayout();
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1.Location = new System.Drawing.Point(39, 10);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(65, 15);
            this.label1.TabIndex = 1;
            this.label1.Text = "Output log";
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label2.Location = new System.Drawing.Point(39, 218);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(106, 15);
            this.label2.TabIndex = 2;
            this.label2.Text = "Client Connection:";
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label3.Location = new System.Drawing.Point(39, 245);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(92, 15);
            this.label3.TabIndex = 3;
            this.label3.Text = "Recorder Status:";
            // 
            // label4
            // 
            this.label4.AutoSize = true;
            this.label4.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label4.Location = new System.Drawing.Point(255, 218);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(108, 15);
            this.label4.TabIndex = 6;
            this.label4.Text = "Test Display Width:";
            // 
            // label5
            // 
            this.label5.AutoSize = true;
            this.label5.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label5.Location = new System.Drawing.Point(255, 245);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(112, 15);
            this.label5.TabIndex = 7;
            this.label5.Text = "Test Display Height:";
            // 
            // sbWindowWidth
            // 
            this.sbWindowWidth.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.sbWindowWidth.Location = new System.Drawing.Point(370, 215);
            this.sbWindowWidth.Maximum = new decimal(new int[] {
            3000,
            0,
            0,
            0});
            this.sbWindowWidth.Name = "sbWindowWidth";
            this.sbWindowWidth.Size = new System.Drawing.Size(52, 23);
            this.sbWindowWidth.TabIndex = 9;
            this.sbWindowWidth.ValueChanged += new System.EventHandler(this.sbWindowWidth_ValueChanged);
            // 
            // sbWindowHeight
            // 
            this.sbWindowHeight.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.sbWindowHeight.Location = new System.Drawing.Point(370, 242);
            this.sbWindowHeight.Maximum = new decimal(new int[] {
            3000,
            0,
            0,
            0});
            this.sbWindowHeight.Name = "sbWindowHeight";
            this.sbWindowHeight.Size = new System.Drawing.Size(52, 23);
            this.sbWindowHeight.TabIndex = 10;
            this.sbWindowHeight.ValueChanged += new System.EventHandler(this.sbWindowHeight_ValueChanged);
            // 
            // btnClearLog
            // 
            this.btnClearLog.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnClearLog.Location = new System.Drawing.Point(654, 209);
            this.btnClearLog.Name = "btnClearLog";
            this.btnClearLog.Size = new System.Drawing.Size(75, 23);
            this.btnClearLog.TabIndex = 11;
            this.btnClearLog.Text = "&Clear Log";
            this.btnClearLog.UseVisualStyleBackColor = true;
            this.btnClearLog.Click += new System.EventHandler(this.btnClearLog_Click);
            // 
            // lvOutput
            // 
            this.lvOutput.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lvOutput.Location = new System.Drawing.Point(42, 26);
            this.lvOutput.Name = "lvOutput";
            this.lvOutput.Size = new System.Drawing.Size(687, 162);
            this.lvOutput.TabIndex = 12;
            this.lvOutput.UseCompatibleStateImageBehavior = false;
            // 
            // lClientCon
            // 
            this.lClientCon.AutoSize = true;
            this.lClientCon.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lClientCon.ForeColor = System.Drawing.Color.Red;
            this.lClientCon.Location = new System.Drawing.Point(150, 218);
            this.lClientCon.Name = "lClientCon";
            this.lClientCon.Size = new System.Drawing.Size(86, 15);
            this.lClientCon.TabIndex = 13;
            this.lClientCon.Text = "Not connected";
            // 
            // lEyeTrack
            // 
            this.lEyeTrack.AutoSize = true;
            this.lEyeTrack.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lEyeTrack.ForeColor = System.Drawing.Color.Red;
            this.lEyeTrack.Location = new System.Drawing.Point(140, 245);
            this.lEyeTrack.Name = "lEyeTrack";
            this.lEyeTrack.Size = new System.Drawing.Size(81, 15);
            this.lEyeTrack.TabIndex = 14;
            this.lEyeTrack.Text = "Not recording";
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(760, 280);
            this.Controls.Add(this.lEyeTrack);
            this.Controls.Add(this.lClientCon);
            this.Controls.Add(this.lvOutput);
            this.Controls.Add(this.btnClearLog);
            this.Controls.Add(this.sbWindowHeight);
            this.Controls.Add(this.sbWindowWidth);
            this.Controls.Add(this.label5);
            this.Controls.Add(this.label4);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.label1);
            this.Font = new System.Drawing.Font("Segoe UI", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.Name = "Form1";
            this.SizeGripStyle = System.Windows.Forms.SizeGripStyle.Hide;
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "EyeTracking WebServer Control";
            ((System.ComponentModel.ISupportInitialize)(this.sbWindowWidth)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.sbWindowHeight)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.NumericUpDown sbWindowWidth;
        private System.Windows.Forms.NumericUpDown sbWindowHeight;
        private System.Windows.Forms.Button btnClearLog;
        private System.Windows.Forms.ListView lvOutput;
        private System.Windows.Forms.Label lClientCon;
        private System.Windows.Forms.Label lEyeTrack;

    }
}

