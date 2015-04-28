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
        public int getPercentageOfPage(uint i_minX,uint i_maxX,uint i_minY, uint i_maxY, uint i_pageX, uint i_pageY)
        {
            uint t_totalX = i_maxX - i_minX;
            uint t_totalY = i_maxY - i_minY;

            uint t_viewArea = t_totalX * t_totalY;
            uint t_pageArea = i_pageX * i_pageY;

            double t_viewPercentage = ((double)t_viewArea / (double)t_pageArea) * 100.0;

            int t_asInt = (int)t_viewPercentage;
            return t_asInt;
        }
    }
}
