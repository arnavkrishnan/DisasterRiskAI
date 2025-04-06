import sys
import json

# Get weather data from the command line argument
weather_data = json.loads(sys.argv[1])

####

import os

from groq import Groq

client = Groq(
    api_key=GROQ_API_KEY,
)

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": f"Based on the provided weather data for {weather_data['city']}, here is an analysis of the potential risks associated with the current weather conditions and location:\nTemperature: {weather_data['temperature']}°C\nFeels Like: {weather_data['feels_like']}°C\nPressure: {weather_data['pressure']} hPa\nHumidity: {weather_data['humidity']}%\nWeather: {weather_data['weather']}\nWind Speed: {weather_data['wind_speed']} m/s\nWind Direction: {weather_data['wind_deg']}°\nVisibility: {weather_data['visibility']} meters\nCloud Coverage: {weather_data['clouds']}%, analyze the risks for different natural disasters."
        }
    ],
    model="llama-3.3-70b-versatile",
)

print(chat_completion.choices[0].message.content)