// backend/server.js
const express = require('express');
const path = require('path');
const { connectDB } = require('./db');
const { scrapeAndStoreWeatherForCountry } = require('./weather');
require('dotenv').config();
const { exec } = require('child_process');

const app = express();
const port = 5000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Endpoint to trigger scraping for a given country (e.g., /scrape/US or /scrape/ALL)
app.get('/scrape/:country', async (req, res) => {
  const country = req.params.country;
  try {
    await scrapeAndStoreWeatherForCountry(country);
    res.status(200).send(`Weather data scraped and stored for country: ${country}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error scraping weather data');
  }
});

// API route to fetch weather data for a specific city
app.get('/weather', async (req, res) => {
  const { city } = req.query;
  if (!city) {
    return res.status(400).send('City parameter is required');
  }
  try {
    const db = (await connectDB()).db('disasterRisk');
    const collection = db.collection('weatherData');
    const weatherData = await collection.findOne({ city: city });
    if (!weatherData) {
      return res.status(404).send('Weather data not found for this city');
    }
    res.status(200).json(weatherData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching weather data');
  }
});

// API route to fetch cities (for map markers) for a specific country from weatherData collection
app.get('/cities/:country', async (req, res) => {
  const country = req.params.country;
  try {
    const db = (await connectDB()).db('disasterRisk');
    const collection = db.collection('weatherData');
    const cities = await collection.find({ country: { $regex: country, $options: 'i' } }).toArray();
    if (!cities || cities.length === 0) {
      return res.status(404).send('No cities found for this country');
    }
    // Return only fields needed for markers
    const cityMarkers = cities.map(item => ({
      city: item.city,
      lat: item.lat,
      lng: item.lng
    }));
    res.status(200).json(cityMarkers);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching cities');
  }
});

// New route to handle AI analysis
app.get('/analyze_weather', async (req, res) => {
  const { city } = req.query;
  if (!city) {
    return res.status(400).send('City parameter is required');
  }
  try {
    const db = (await connectDB()).db('disasterRisk');
    const collection = db.collection('weatherData');
    const weatherData = await collection.findOne({ city: city });
    if (!weatherData) {
      return res.status(404).send('Weather data not found for this city');
    }
    
    // Call the Python script to analyze the weather data
    exec(`python3 analyze_weather.py '${JSON.stringify(weatherData)}'`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).send('Error analyzing weather data');
      }
      // Return the AI analysis to the frontend
      const aiAnalysis = stdout.trim();
      res.status(200).json({ analysis: aiAnalysis });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching weather data for analysis');
  }
});

// Root route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});