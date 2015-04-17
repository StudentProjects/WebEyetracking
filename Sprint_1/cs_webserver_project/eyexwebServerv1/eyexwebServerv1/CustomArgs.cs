// CustomArgs.cs
// Created by: Daniel Johansson
// Edited by: 

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

// Event arguments which can be used when custom events are triggered
namespace eyexwebServerv1
{
    // Contains a string as argument
    public class OutputTextArgs : EventArgs
    {
        private readonly string _eventText;
        private readonly int _logType;

        public OutputTextArgs(string i_value, int i_type)
        {
            _eventText = i_value;
            _logType = i_type;
        }

        public string getEventText
        {
            get { return _eventText; }
        }

        public int getType
        {
            get { return _logType; }
        }
    }

    // contains an in as argument
    public class LabelTextArgs : EventArgs
    {
        private readonly int _eventText;

        public LabelTextArgs(int i_value)
        {
            _eventText = i_value;
        }

        public int getEventText
        {
            get { return _eventText; }
        }
    }

    // Contains an int array as argument
    public class DisplayArgs : EventArgs
    {
        private readonly int[] _eventText;

        public DisplayArgs(int[] i_value)
        {
            _eventText = i_value;
        }

        public int[] getEventText
        {
            get { return _eventText; }
        }
    }
}
