from youtube_transcript_api import YouTubeTranscriptApi

# YouTube ID for the "Lecture 1: Introduction to CS and Programming" video
VIDEO_ID = "2-p-I402-90" 

print(f"Attempting to fetch transcript for video ID: {VIDEO_ID}...")

try:
    # Attempt to get the transcript
    transcript = YouTubeTranscriptApi.get_transcript(VIDEO_ID)
    
    # If successful, print a success message and a snippet
    print("\nSUCCESS: Transcript fetched successfully!")
    print("-----------------------------------------")
    for item in transcript[:5]: # Print the first 5 lines
        print(f"  {item['start']}: {item['text']}")

except Exception as e:
    # If it fails, print the exact error message
    print("\nERROR: The script failed. Here is the error from the library:")
    print("-------------------------------------------------------------")
    print(e)