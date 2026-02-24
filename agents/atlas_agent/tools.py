import asyncio
import os
from typing import Optional, Any

import googlemaps
import httpx
from google import genai
from google.genai import types

from dotenv import load_dotenv, find_dotenv
_ = load_dotenv(find_dotenv())

def get_weather_condition(code: int) -> str:
    """Map weather code to human-readable condition.

    Args:
        code: WMO weather code.

    Returns:
        Human-readable weather condition string.
    """
    conditions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snow fall",
        73: "Moderate snow fall",
        75: "Heavy snow fall",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail",
    }
    return conditions.get(code, "Unknown")

async def get_weather(location: str) -> dict:
    """Get the weather for a given location.

    Args:
        location: City name.

    Returns:
        Dictionary with weather information including temperature, feels like,
        humidity, wind speed, wind gust, conditions, and location name.
    """

    try:
        async with httpx.AsyncClient() as client:
            # Geocode the location
            geocoding_url = (
                f"https://geocoding-api.open-meteo.com/v1/search?name={location}&count=1"
            )

            geocoding_response = await client.get(geocoding_url)
            geocoding_data = geocoding_response.json()

            if not geocoding_data.get("results"):
                raise ValueError(f"Location '{location}' not found")

            result = geocoding_data["results"][0]
            latitude = result["latitude"]
            longitude = result["longitude"]
            name = result["name"]
            print(f"Name: {name} - Latitude: {latitude} - Longitude: {longitude} ")

             # Get weather data
            weather_url = (
                f"https://api.open-meteo.com/v1/forecast?"
                f"latitude={latitude}&longitude={longitude}"
                f"&current=temperature_2m,apparent_temperature,relative_humidity_2m,"
                f"wind_speed_10m,wind_gusts_10m,weather_code"
            )
            weather_response = await client.get(weather_url)
            weather_data = weather_response.json()
            current = weather_data["current"]

            result =  {
                "temperature": current["temperature_2m"],
                "feelsLike": current["apparent_temperature"],
                "humidity": current["relative_humidity_2m"],
                "windSpeed": current["wind_speed_10m"],
                "windGust": current["wind_gusts_10m"],
                "conditions": get_weather_condition(current["weather_code"]),
                "location": name,
            }
            return {
                "status": "success",
                "result": result
            }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
    