const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection URI
const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);

// OpenWeather API key
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Function to connect to MongoDB
async function connectDB() {
    if (!MONGO_URI) {
        throw new Error('MONGO_URI is not set in .env file');
    }
    await client.connect();
    console.log('Connected to MongoDB');
    return client;
}

// Function to fetch weather data for a city
async function fetchWeather(city, lat, lng) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`;
    try {
        const response = await axios.get(url);
        return {
            city: city,
            temperature: response.data.main.temp,
            feels_like: response.data.main.feels_like,
            pressure: response.data.main.pressure,
            humidity: response.data.main.humidity,
            weather: response.data.weather[0].description,
            wind_speed: response.data.wind.speed,
            wind_deg: response.data.wind.deg,
            wind_gust: response.data.wind.gust,
            visibility: response.data.visibility,
            clouds: response.data.clouds.all,
            rainfall: response.data.rain ? response.data.rain['1h'] : 0,
            snowfall: response.data.snow ? response.data.snow['1h'] : 0,
            lat: lat,
            lng: lng,
            date: new Date(),
        };
    } catch (error) {
        console.error(`Error fetching weather data for ${city}:`, error);
    }
}

// Function to insert multiple weather data into MongoDB
async function insertWeatherData(weatherDataArray) {
    const db = client.db('disasterRisk');
    const collection = db.collection('weatherData');
    
    // Clear the collection first
    await collection.deleteMany({});
    console.log('Cleared existing weather data from MongoDB.');
    
    // Insert all the new weather data at once
    if (weatherDataArray.length > 0) {
        await collection.insertMany(weatherDataArray);
        console.log(`${weatherDataArray.length} weather data entries inserted into MongoDB.`);
    } else {
        console.log('No weather data to insert.');
    }
}

// Function to read the CSV file and get cities based on country filter
function getCitiesByCountry(countryCodeOrName) {
    return new Promise((resolve, reject) => {
        const cities = [];
        fs.createReadStream('./assets/worldcities.csv')
            .pipe(csv())
            .on('data', (row) => {
                if (
                    countryCodeOrName === 'ALL' ||
                    row.country.toLowerCase() === countryCodeOrName.toLowerCase() ||
                    row.iso2.toLowerCase() === countryCodeOrName.toLowerCase()
                ) {
                    cities.push({
                        city: row.city,
                        lat: parseFloat(row.lat),
                        lng: parseFloat(row.lng),
                    });
                }
            })
            .on('end', () => {
                resolve(cities);
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

// Function to scrape and insert weather data for the cities in a given country
async function scrapeWeatherForCities(countryCodeOrName) {
    const cities = await getCitiesByCountry(countryCodeOrName);
    
    if (cities.length === 0) {
        console.log(`No cities found for country code or name: ${countryCodeOrName}`);
        return;
    }

    // Array to store all weather data
    const weatherDataArray = [];

    // Iterate through each city, fetch weather data, and add it to the array
    for (let { city, lat, lng } of cities) {
        const weatherData = await fetchWeather(city, lat, lng);
        if (weatherData) {
            weatherDataArray.push(weatherData);
        }
    }

    // Insert all weather data into MongoDB at once
    await insertWeatherData(weatherDataArray);
}

// Run the weather scraping and insertion
async function run() {
    try {
        // Prompt user for the country code or name, or "ALL" for all cities
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question('Enter country code (e.g., US) or full country name (e.g., United States) or "ALL" for all cities: ', async (country) => {
            console.log(`Fetching weather data for ${country}...`);
            await connectDB();  // Connect to MongoDB
            await scrapeWeatherForCities(country);  // Fetch and insert weather data for selected cities
            console.log('Weather data scraping and insertion completed.');
            rl.close();
        });
    } catch (err) {
        console.error('Error in the weather scraping process:', err);
    } finally {
        await client.close();  // Close MongoDB connection
    }
}

run();
