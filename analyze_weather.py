import sys
import json
import os
from groq import Groq

# Get weather data from the command line argument
weather_data = json.loads(sys.argv[1])

# Initialize the Groq client with your API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # Make sure to set the GROQ_API_KEY environment variable
client = Groq(api_key=GROQ_API_KEY)

# Creating the prompt to analyze weather data
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

# Requesting the AI model to generate the disaster risk analysis
chat_completion = client.chat.completions.create(
    messages=[
        {"role": "user", "content": prompt}
    ],
    model="llama-3.3-70b-versatile",  # Replace with the actual model name you want to use
)

# Print the AI response to be captured by the Node.js server
print(chat_completion.choices[0].message.content)
