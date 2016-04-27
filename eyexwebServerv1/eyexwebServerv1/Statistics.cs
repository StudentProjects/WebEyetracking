// Statistics.cs
// Created by: Daniel Johansson
// Edited by: 

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace tieto.education.eyetrackingwebserver
{
    public class StatisticsHandler
    {
        public StatisticsHandler()
        {

        }

        /// <summary>
        /// Calculates the total time spent on the page based on the start time and current time
        /// </summary>
        /// <param name="i_startTime">The start time of the test</param>
        /// <returns>The total spent time on the page as a string formatted with only simple info</returns>
        public string getTimeOnPage(string i_startTime)
        {
            string t_totalTime = "";
            if(i_startTime.Trim() != "")
            {
                try
                {
                    DateTime t_startTime = DateTime.Parse(i_startTime);
                    DateTime t_stopTime = DateTime.Now;
                    TimeSpan t_timeOnPage = t_stopTime - t_startTime;
                    t_totalTime = t_timeOnPage.ToString("g");
                }
                catch(FormatException)
                {
                    t_totalTime = "";
                }
            }
            return t_totalTime;
        }

        /// <summary>
        /// Getting point containing fixation order 0
        /// </summary>
        /// <param name="i_fixationPoints"></param>
        /// <returns></returns>
        public FixationPoint getFirstFixated(FixationPoint[] i_fixationPoints)
        {
            FixationPoint t_firstFixated = new FixationPoint();
            try
            {
                bool isFirstFixatedFound = false;
                for (int i = 0; i < i_fixationPoints.Length; i++)
                {
                    if (isFirstFixatedFound)
                    {
                        break;
                    }
                    for (int j = 0; j < i_fixationPoints[i].fixationOrder.Length; j++)
                    {
                        if (i_fixationPoints[i].fixationOrder[j] == 0)
                        {
                            t_firstFixated = i_fixationPoints[i];
                            isFirstFixatedFound = true;
                            break;
                        }
                    }
                }
                return t_firstFixated;
            }
            catch(Exception)
            {
                return t_firstFixated;
            }
        }

       /// <summary>
       /// Calculates the most fixated point based on the timeStamps in the received fixation point array
       /// </summary>
       /// <param name="i_fixationPoints">All fixation points collected during the test</param>
       /// <returns>The most fixated point</returns>
        public FixationPoint getMostFixated(FixationPoint[] i_fixationPoints)
        {
            FixationPoint t_mostFixated = new FixationPoint();
            t_mostFixated.timeStampFixation = 0;

            if(i_fixationPoints != null)
            {
                //Getting most fixated point
                if(i_fixationPoints.Length > 0)
                {
                    foreach (FixationPoint currentPoint in i_fixationPoints)
                    {
                        if (currentPoint.timeStampFixation > t_mostFixated.timeStampFixation)
                        {
                            t_mostFixated = currentPoint;
                        }
                    }
                }
            }
            return t_mostFixated;
        }


        /// <summary>
        /// Converting a list of fixation points to an array
        /// </summary>
        /// <param name="i_fixationPoints">A list of fixation point objects received during a test</param>
        /// <returns>Array of all fixation points</returns>
        public FixationPoint[] getAllFixationPoints(List<FixationPoint> i_fixationPoints)
        {
            FixationPoint[] t_fixationPoints = i_fixationPoints.ToArray();
            return t_fixationPoints;
        }

        /// <summary>
        /// Calculates how much percent of the page the user has seen based on document areas which the document has been divided into
        /// Calculates max and minimun values of each block in the document and calculates the total percentage based on number of blocks
        /// </summary>
        /// <param name="i_documentAreas">All document blocks</param>
        /// <param name="i_x">All X Coordinates</param>
        /// <param name="i_y"> All Y Coordinates</param>
        /// <param name="i_areaWidth">Width of each block</param>
        /// <param name="i_areaHeight">Height of each block</param>
        /// <returns>Integer, percent of page seen</returns>
        public int getPercentageOfPage(DocumentArea[,] i_documentAreas, List<int> i_x, List<int> i_y,uint i_areaWidth,uint i_areaHeight)
        {
            DocumentArea[,] t_documentAreas = i_documentAreas;
            int t_percentOfDocument = 4;
            try
            {
                int tempX = -1;
                int tempY = -1;
                for (int i = 0; i < i_x.Count; i++)
                {
                    //Getting the corresponding index to this point in the document area array
                    tempX = (int)Math.Floor((double)i_x[i] / (double)i_areaWidth);
                    tempY = (int)Math.Floor((double)i_y[i] / (double)i_areaHeight);

                    //Checking so that the values does not exceed the bounds of the array
                    if (tempX > (t_documentAreas.GetLength(0)-1))
                    {
                        tempX = t_documentAreas.GetLength(0)-1;
                    }
                    else if(tempX < 0)
                    {
                        tempX = 0;
                    }
                    if (tempY > (t_documentAreas.GetLength(1)-1))
                    {
                        tempY = t_documentAreas.GetLength(1)-1;
                    }
                    else if(tempY < 0)
                    {
                        tempY = 0;
                    }

                    //Checking if the x value is greater or less than the maximum or minimum value in this document block
                    if (t_documentAreas[tempX, tempY].xMin > i_x[i])
                    {
                        t_documentAreas[tempX, tempY].xMin = i_x[i];
                    }
                    if (t_documentAreas[tempX, tempY].xMax < i_x[i])
                    {
                        t_documentAreas[tempX, tempY].xMax = i_x[i];
                    }
                }

                for(int i=0;i<i_y.Count;i++)
                {
                    //Getting the corresponding index to this point in the document area array
                    tempX = (int)Math.Floor((double)i_x[i] / (double)i_areaWidth);
                    tempY = (int)Math.Floor((double)i_y[i] / (double)i_areaHeight);


                    //Checking so that the values does not exceed the bounds of the array
                    if (tempX > (t_documentAreas.GetLength(0) - 1))
                    {
                        tempX = t_documentAreas.GetLength(0) - 1;
                    }
                    else if (tempX < 0)
                    {
                        tempX = 0;
                    }
                    if (tempY > (t_documentAreas.GetLength(1) - 1))
                    {
                        tempY = t_documentAreas.GetLength(1) - 1;
                    }
                    else if (tempY < 0)
                    {
                        tempY = 0;
                    }

                    //Checking if the t value is greater or less than the maximum or minimum value in this document block
                    if (t_documentAreas[tempX, tempY].yMin > i_y[i])
                    {
                        t_documentAreas[tempX, tempY].yMin = i_y[i];
                    }
                    if (t_documentAreas[tempX, tempY].yMax < i_y[i])
                    {
                        t_documentAreas[tempX, tempY].yMax = i_y[i];
                    }
                }

                //Calculating the area seen within each block based on min and max values
                double totalAreaPercent = 0.0;
                uint totalBlockArea = i_areaWidth * i_areaHeight;
                for (int i = 0; i < t_documentAreas.GetLength(0); i++)
                {
                    for(int j=0;j<t_documentAreas.GetLength(1);j++)
                    {
                        int x = t_documentAreas[i, j].xMax - t_documentAreas[i, j].xMin;
                        int y = t_documentAreas[i, j].yMax - t_documentAreas[i, j].yMin;

                        if(x > 0 && y > 0)
                        {
                            int minMaxIntervalArea = x * y;
                            double tempArea = (double)minMaxIntervalArea / (double)totalBlockArea;
                            totalAreaPercent += tempArea;
                        }
                    }
                }

                totalAreaPercent *= 100.0;
                // final percent. Total percent of page seen in all blocks divided by number of blocks
                double finalPercent = totalAreaPercent / (double)(t_documentAreas.GetLength(0) * t_documentAreas.GetLength(1));
                t_percentOfDocument = (int)finalPercent;
            }
            catch(Exception)
            {
                t_percentOfDocument = 1000;
            }

            return t_percentOfDocument;
        }
    }
}
