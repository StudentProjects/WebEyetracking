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
        /// Calculates how much percentage of the page the user has looked at based on the area of the page and the view area
        /// </summary>
        /// <param name="i_minX">The minimum x value which the user has looked at</param>
        /// <param name="i_maxX">The maximum x value which the user has looked at</param>
        /// <param name="i_minY">The minimum y value which the user has looked at</param>
        /// <param name="i_maxY">The maximum y value which the user has looked at</param>
        /// <param name="i_pageX">The width of the page which the test was performed on</param>
        /// <param name="i_pageY">The height of the page which the test was performed on</param>
        /// <returns>The total percentage of how much of the screen the user has looked at as an integer</returns>
        public int getPercentageOfPage(DocumentArea[,] i_documentAreas, List<int> i_x, List<int> i_y,uint i_areaWidth,uint i_areaHeight)
        {
            DocumentArea[,] t_documentAreas = i_documentAreas;
            int t_asInt = 4;
            try
            {
                int tempX = -1;
                int tempY = -1;
                for (int i = 0; i < i_x.Count; i++)
                {
                    tempX = (int)Math.Floor((double)i_x[i] / (double)i_areaWidth);
                    tempY = (int)Math.Floor((double)i_y[i] / (double)i_areaHeight);

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
                    tempX = (int)Math.Floor((double)i_x[i] / (double)i_areaWidth);
                    tempY = (int)Math.Floor((double)i_y[i] / (double)i_areaHeight);

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

                    if (t_documentAreas[tempX, tempY].yMin > i_y[i])
                    {
                        t_documentAreas[tempX, tempY].yMin = i_y[i];
                    }
                    if (t_documentAreas[tempX, tempY].yMax < i_y[i])
                    {
                        t_documentAreas[tempX, tempY].yMax = i_y[i];
                    }
                }

                double areaPercent = 0.0;
                uint totalArea = i_areaWidth * i_areaHeight;
                for (int i = 0; i < t_documentAreas.GetLength(0); i++)
                {
                    for(int j=0;j<t_documentAreas.GetLength(1);j++)
                    {
                        int x = t_documentAreas[i, j].xMax - t_documentAreas[i, j].xMin;
                        int y = t_documentAreas[i, j].yMax - t_documentAreas[i, j].yMin;

                        int partArea = x * y;

                        double tempArea = (double)partArea/(double)totalArea;
                        areaPercent += tempArea;
                    }
                }

                double finalPercent = areaPercent / (double)(t_documentAreas.GetLength(0) * t_documentAreas.GetLength(1));
                t_asInt = (int)finalPercent;
            }
            catch(Exception)
            {
                t_asInt = 1000;
            }
          
            return t_asInt;
        }
    }
}
