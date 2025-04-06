// backend/weather.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { connectDB, client } = require('./db');
require('dotenv').config();

const OPEN_WEATHER_API_KEY = process.env.WEATHER_API_KEY;

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
      lat: lat,
      lng: lng
    };
  } catch (error) {
    console.error(`Error fetching weather data for ${city}:`, error.message);
    return null;
  }
}

function getCitiesFromCSV() {
  return new Promise((resolve, reject) => {
    const cities = [];
    const csvPath = path.join(__dirname, '../assets/worldcities.csv');
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        cities.push(row);
      })
      .on('end', () => {
        console.log('CSV file processed.');
        resolve(cities);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

async function scrapeAndStoreWeatherForCountry(countryFilter, limit = 100) {
  const allCities = await getCitiesFromCSV();
  let filteredCities;
  
  // Filter by country or get all cities if country is 'ALL'
  if (countryFilter.toUpperCase() === 'ALL') {
    filteredCities = allCities;
  } else {
    filteredCities = allCities.filter(row => {
      return (row.country && row.country.toLowerCase() === countryFilter.toLowerCase()) ||
             (row.iso2 && row.iso2.toLowerCase() === countryFilter.toLowerCase());
    });
  }
  
  console.log(`Found ${filteredCities.length} cities for country filter: ${countryFilter}`);
  
  // Limit the number of cities to fetch
  filteredCities = filteredCities.slice(0, limit); // Take only top `limit` cities
  
  const weatherDataArray = [];
  for (const row of filteredCities) {
    const cityName = row.city;
    const lat = parseFloat(row.lat);
    const lng = parseFloat(row.lng);
    console.log(`Fetching weather for ${cityName}...`);
    const weather = await fetchWeather(cityName, lat, lng);
    if (weather) {
      // Attach country info from CSV for later filtering
      weather.country = row.country || '';
      weather.iso2 = row.iso2 || '';
      weatherDataArray.push(weather);
    }
  }
  
  const dbClient = await connectDB();
  const db = dbClient.db('disasterRisk');
  const collection = db.collection('weatherData');
  
  // Clear previous weatherData records
  await collection.deleteMany({});
  if (weatherDataArray.length > 0) {
    await collection.insertMany(weatherDataArray);
    console.log(`${weatherDataArray.length} weather records inserted.`);
  } else {
    console.log('No weather records to insert.');
  }
}

module.exports = { scrapeAndStoreWeatherForCountry, fetchWeather };
