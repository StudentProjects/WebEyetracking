using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Audio;
using System.Timers;
using System.IO;

namespace tieto.education.eyetrackingwebserver
{
    public class AudioHandler
    {
        private Microphone m_microphoneDevice;
        private System.Timers.Timer m_updateFramework;

        private MemoryStream m_playAudioStream;
        private SoundEffect m_loadedTestSoundEffect;
        private SoundEffectInstance m_loadedTestSoundInstance;

        private Byte[] m_microphoneBuffer;
        private Byte[] m_loadedBuffer;
        private int m_recorderData;

        private bool m_isMicrophoneRecording;
        private bool m_isMicrophoneRecordingPaused;

        private EYE m_eyeInstance;

        /// <summary>
        /// Initializes important variables and intervals when created
        /// </summary>
        /// <param name="i_eye">Eye reference, reference to RecorderInstance. Used when calling log method in Eye class since this class
        /// does not contain a logproperty</param>
        public AudioHandler(EYE i_eye)
        {
            m_isMicrophoneRecording = false;
            m_isMicrophoneRecordingPaused = false;
            m_recorderData = 0;

            m_eyeInstance = i_eye;

            m_microphoneDevice = Microphone.Default;
            if(m_microphoneDevice != null)
            {
                m_microphoneDevice.BufferReady += new EventHandler<EventArgs>(saveAudio);
            }

            m_loadedBuffer = null;

            m_updateFramework = new System.Timers.Timer();
            m_updateFramework.Interval = 50;
            m_updateFramework.AutoReset = true;
            m_updateFramework.Elapsed += new ElapsedEventHandler(this.updateFramework);
            m_updateFramework.Start();
        }

        /// <summary>
        /// updating the framework dispatcher
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void updateFramework(object sender, EventArgs e)
        {
            FrameworkDispatcher.Update();
        }

        /// <summary>
        /// Event handler that handles new recorder audio data.
        /// Saves data to the buffer
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void saveAudio(object sender,EventArgs e)
        {
            try
            {
                if (m_isMicrophoneRecording && !m_isMicrophoneRecordingPaused && m_microphoneDevice != null)
                {
                    m_recorderData += m_microphoneDevice.GetData(m_microphoneBuffer, m_recorderData, m_microphoneBuffer.Length - m_recorderData);
                }
            }
            catch(Exception)
            {
                m_eyeInstance.log("Possible overflow in audio buffer", 3);
            }
        }

        /// <summary>
        /// Starts a new audio recording instance if no recording instance is active and if a microphone is connected
        /// </summary>
        public void startAudioRecording()
        {
            if(!m_isMicrophoneRecording && m_microphoneDevice != null)
            {
                m_recorderData = 0;
                m_microphoneBuffer = new Byte[Microphone.Default.GetSampleSizeInBytes(TimeSpan.FromSeconds(3600))];
                m_microphoneDevice.Start();
                m_isMicrophoneRecording = true;
                m_isMicrophoneRecordingPaused = false;

                m_eyeInstance.log("Starting sound recorder", 1);
            }
        }

        /// <summary>
        /// Stops an active audio recording.
        /// Transfers all saved audio data to a new audio buffer
        /// </summary>
        /// <returns>Byte array, the newest recorded data</returns>
        public Byte[] stopAudioRecording()
        {
            Byte[] tempAudiobuffer = null;
            if(m_isMicrophoneRecording && m_microphoneBuffer != null)
            {
                m_isMicrophoneRecordingPaused = false;
                m_isMicrophoneRecording = false;
                m_microphoneDevice.Stop();

                if(m_microphoneBuffer.Length > m_recorderData)
                {
                    tempAudiobuffer = new Byte[m_recorderData];

                    for(int i=0;i<m_recorderData;i++)
                    {
                        tempAudiobuffer[i] = m_microphoneBuffer[i];
                    }
                    m_loadedBuffer = tempAudiobuffer;
                }
                else
                {
                    m_eyeInstance.log("Audio Handler: Stopped audio recording", 1);
                    m_loadedBuffer = m_microphoneBuffer;
                    return m_microphoneBuffer;
                }
            }
            m_eyeInstance.log("Audio Handler: Stopped audio recording", 1);
            return tempAudiobuffer;
        }

        /// <summary>
        /// Starts playing audio if audiobuffer is not empty.
        /// Also stops old playback if there is something playing right now
        /// </summary>
        /// <param name="i_audioBuffer">audio buffer with data to playback</param>
        public void playbackAudio(Byte[] i_audioBuffer)
        {
            if(m_loadedTestSoundInstance != null)
            {
                if(m_loadedTestSoundInstance.State == SoundState.Playing || m_loadedTestSoundInstance.State == SoundState.Paused)
                {
                    m_loadedTestSoundInstance.Stop();
                }
                m_loadedTestSoundInstance = null;
            }
            if(i_audioBuffer != null)
            {
                m_playAudioStream = new MemoryStream();
                m_playAudioStream.Write(i_audioBuffer, 0, i_audioBuffer.Length);

                m_loadedTestSoundEffect = new SoundEffect(m_playAudioStream.ToArray(), 44100, AudioChannels.Mono);

                m_loadedTestSoundInstance = m_loadedTestSoundEffect.CreateInstance();
                m_loadedTestSoundInstance.Play();
            }
            else
            {
                m_eyeInstance.log("Audio Handler: Received empty audio buffer", 3);
            }
        }

        /// <summary>
        /// Pauses an active audio recording instance
        /// </summary>
        public void pauseMicrophoneRecording()
        {
            if(m_isMicrophoneRecording && !m_isMicrophoneRecordingPaused)
            {
                m_isMicrophoneRecordingPaused = true;
            }
        }

        /// <summary>
        /// Resumes an active audio recording instance
        /// </summary>
        public void resumeMicrophoneRecording()
        {
            if(m_isMicrophoneRecording && m_isMicrophoneRecordingPaused)
            {
                m_isMicrophoneRecordingPaused = false;
            }
        }

        /// <summary>
        /// resumes active playback if state of the SoundInstance is set to 'Paused'
        /// </summary>
        public void resumePlayback()
        {
            if(m_loadedTestSoundInstance != null)
            {
                if(m_loadedTestSoundInstance.State == SoundState.Paused)
                {
                    m_loadedTestSoundInstance.Resume();
                }
            }
        }

        /// <summary>
        /// Pauses the active playback if the state of the SoundInstance is set to 'Playing'
        /// </summary>
        public void pausePlayback()
        {
            if (m_loadedTestSoundInstance != null)
            {
                if (m_loadedTestSoundInstance.State == SoundState.Playing)
                {
                    m_loadedTestSoundInstance.Pause();
                }
            }
        }

        /// <summary>
        /// Stops the active playback if the state of the SoundInstance is set to either 'Playing' or 'Paused'
        /// </summary>
        public void stopPlayback()
        {
            if (m_loadedTestSoundInstance != null)
            {
                if (m_loadedTestSoundInstance.State == SoundState.Playing || m_loadedTestSoundInstance.State == SoundState.Paused)
                {
                    m_loadedTestSoundInstance.Stop();
                }
            }
        }
    }
}
