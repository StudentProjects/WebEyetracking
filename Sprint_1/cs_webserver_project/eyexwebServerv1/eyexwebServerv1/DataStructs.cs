// DataStructs.cs
// Created by: Daniel Johansson
// Edited by: 

using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace eyexwebServerv1
{
    // Message responds structure

    public class MessageObject
    {
        public int MessageType { get; set; }
        public string MessageContent { get; set; }
    }

    public class NameInfo
    {
        public string Name { get; set; }
        public string Time { get; set; }
        public int Id { get; set; }
    }

    public class DateInfo
    {
        public string Date {get;set;}
        public NameInfo[] Names { get; set; }
    }

    public class ApplicationData
    {
        public string ApplicationName { get; set; }
        public DateInfo[] Dates { get; set; }
    }

    public class AllApplicationNames
    {
        public string[] ApplicationName { get; set; }
    }

    public class TestData
    {
        public int TESTID { get; set; }
        public int[] eyeX { get; set; }
        public int[] eyeY { get; set; }
        public int[] mouseX { get; set; }
        public int[] mouseY { get; set; }
        public ulong[] timeStampEYE { get; set; }
        public ulong[] timeStampMouse { get; set; }
    }

    public class MouseCoord
    {
        public int[] mouseX { get; set; }
        public int[] mouseY { get; set; }
        public ulong[] timeStampMouse { get; set; }
    }

    public class SubTest
    {
        public string Name { get; set; }
        public int TestNumber { get; set; }
        public int[] eyeX { get; set; }
        public int[] eyeY { get; set; }
        public int[] mouseX { get; set; }
        public int[] mouseY { get; set; }
        public ulong[] timeStampEYE { get; set; }
        public ulong[] timeStampMouse { get; set; }
    }

    public struct UserInfo
    {
        public int TESTID { get; set; }
        public string Name;
        public string Age;
        public string Occupation;
        public string Location;
        public string ComputerUsage;
        public string Application;
        public string OtherInfo;
        public string TestDate;
        public string TestTime;
    }

    public class MyListBoxItem {
    public MyListBoxItem(Color c, string m) 
    { 
        ItemColor = c; 
        Message = m;
    }
    public Color ItemColor { get; set; }
    public string Message { get; set; }
}
}
