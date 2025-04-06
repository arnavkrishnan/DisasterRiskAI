const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');
const connectDB = require('./db');
require('dotenv').config(); // Make sure this is there for .env variables

const OPEN_WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Function to fetch weather data for a city
async function fetchWeather(city, lat, lng) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPEN_WEATHER_API_KEY}&units=metric`;
  try {
    const response = await axios.get(url);
    return {
      city: city,
      temperature: response.data.main.temp,
      rainfall: response.data.rain ? response.data.rain['1h'] : 0,
      snowfall: response.data.snow ? response.data.snow['1h'] : 0,
      humidity: response.data.main.humidity,
      weather: response.data.weather[0].description,
      date: new Date(),
    };
  } catch (error) {
    console.error(`Error fetching weather data for ${city}:`, error);
  }
}

// Function to process cities from CSV and fetch weather data
async function processCitiesFromCSV() {
  const cities = [];
  
  fs.createReadStream('./assets/worldcities.csv')
    .pipe(csv())
    .on('data', async (row) => {
      // Add the row to the cities array
      cities.push(row);
    })
    .on('end', async () => {
      console.log('CSV file successfully processed');
      
      // Iterate through cities to fetch weather data
      for (let i = 0; i < cities.length; i++) {
        const city = cities[i].city;
        const lat = parseFloat(cities[i].lat);
        const lng = parseFloat(cities[i].lng);

        console.log(`Fetching weather for ${city}...`);
        const weatherData = await fetchWeather(city, lat, lng);

        if (weatherData) {
          // Insert data into MongoDB
          const client = await connectDB();
          const db = client.db('disasterRisk');
          const collection = db.collection('weatherData');

          await collection.insertOne(weatherData);
          console.log(`Weather data for ${city} inserted.`);
        }
      }
    });
}

// Execute the process
processCitiesFromCSV();
