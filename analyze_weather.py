from dotenv import load_dotenv
import sys
import json
import os
from groq import Groq

# Load environment variables from .env file
load_dotenv()

# Get weather data from the command line argument
weather_data = json.loads(sys.argv[1])

# Retrieve the API key from the environment
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise Exception("GROQ_API_KEY environment variable not set")

# Initialize the Groq client with your API key
client = Groq(api_key=groq_api_key)

# Create the prompt using the weather data
prompt = f"""
Based on the provided weather data for {weather_data['city']}, here is an analysis of the potential risks associated with the current weather conditions and location:
- Temperature: {weather_data['temperature']}°C
- Feels Like: {weather_data['feels_like']}°C
- Pressure: {weather_data['pressure']} hPa
- Humidity: {weather_data['humidity']}%
- Weather: {weather_data['weather']}
- Wind Speed: {weather_data['wind_speed']} m/s
- Wind Direction: {weather_data['wind_deg']}°
- Visibility: {weather_data['visibility']} meters
- Cloud Coverage: {weather_data['clouds']}%

Analyze the risks for different natural disasters such as storms, floods, wildfires, tornadoes, etc., based on these weather conditions.
"""

try:
    # Request the AI analysis from Groq
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile"  # Ensure this model name is correct per your account
    )
    
    # Extracting the content from the response object
    result = chat_completion.choices[0].message.content
    
    # For debugging: print the response (no longer trying to serialize the object)
    print("AI Response:", result)
except Exception as e:
    print("Error during Groq API call:", e)
