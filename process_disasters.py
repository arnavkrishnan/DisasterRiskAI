import pandas as pd
import requests

# Function to get closest weather station using NOAA API based on Latitude and Longitude
def get_closest_station(lat, lon):
    # NOAA API endpoint for finding the closest weather station
    url = f"https://api.weather.gov/points/{lat},{lon}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for a bad response
        data = response.json()

        # Extract the station's information
        closest_station = data['properties']['observationStations']
        if closest_station:
            return closest_station[0]
        else:
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

# Function to get the weather data at a specific station and time
def get_weather_data(station, date):
    # NOAA API endpoint for retrieving weather data for a specific station
    url = f"https://api.weather.gov/stations/{station}/observations?start={date}T00:00:00Z&end={date}T23:59:59Z"
    
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for a bad response
        data = response.json()

        # If the response has observations, return the first observation
        if 'features' in data and len(data['features']) > 0:
            return data['features'][0]['properties']
        else:
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching weather data: {e}")
        return None

# Load the modified Excel file (now in .xlsx format) using pandas
df = pd.read_excel("assets/usa.xlsx", engine='openpyxl')

# Print out the first few rows to inspect the structure
print(df.head())

# Verify that latitude and longitude are correctly extracted (adjust column names as needed)
# Check if the 'Latitude' and 'Longitude' columns exist and are valid
if 'Latitude' not in df.columns or 'Longitude' not in df.columns:
    print("Warning: Latitude and/or Longitude columns are missing.")
else:
    # Add new columns to the dataframe for weather data
    df['Weather Station'] = None
    df['Weather Data'] = None

    # Filter out rows where latitude or longitude are missing
    df = df.dropna(subset=['Latitude', 'Longitude'])

    # Loop through the rows of the dataframe
    for index, row in df.iterrows():
        # Extract latitude and longitude from the row
        lat = row['Latitude']
        lon = row['Longitude']
        
        # Print out the latitude and longitude for debugging purposes
        print(f"Processing row {index}: Latitude = {lat}, Longitude = {lon}")
        
        # Get the closest weather station using the latitude and longitude
        station = get_closest_station(lat, lon)
        
        if station:
            # Get the weather data for the specific date
            date = f"{int(row['Start Year'])}-{int(row['Start Month']):02d}-{int(row['Start Day']):02d}"  # Date format YYYY-MM-DD
            weather_data = get_weather_data(station, date)
            
            # Add weather data to the dataframe
            df.at[index, 'Weather Station'] = station
            df.at[index, 'Weather Data'] = weather_data
        else:
            print(f"No weather station found for coordinates {lat}, {lon}.")

    # Select relevant columns for the final output (disaster + weather data)
    final_df = df[['DisNo.', 'Event Name', 'Location', 'Start Year', 'Start Month', 'Start Day', 
                    'Weather Station', 'Weather Data']]

    # Save the modified dataframe to a new CSV file (usa_with_weather_data.csv)
    final_df.to_csv("assets/usa_with_weather_data.csv", index=False)

    print("Processed data with weather information has been saved to 'usa_with_weather_data.csv'.")
