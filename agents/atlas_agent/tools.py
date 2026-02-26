import asyncio
import os
from typing import Optional, Any

import googlemaps
import httpx
from google import genai
from google.genai import types

from dotenv import load_dotenv, find_dotenv
_ = load_dotenv(find_dotenv())

def _get_required_env(*keys: str) -> str:
    """Return first present env var value, otherwise raise a clear error."""
    for key in keys:
        value = os.getenv(key)
        if value:
            return value

    formatted_keys = ", ".join(keys)
    raise RuntimeError(
        f"Missing API credentials. Set one of: {formatted_keys}."
    )

def _google_maps_denied_hint(error_message: str) -> str:
    """Return actionable hints for common Google Maps auth/config errors."""
    text = error_message.upper()

    if "REQUEST_DENIED" in text:
        return (
            "Google Maps request was denied. Verify this exact API key's project has "
            "Geocoding API enabled, billing enabled, and key restrictions allow "
            "Geocoding API."
        )

    if "API KEY" in text and "INVALID" in text:
        return "Google Maps API key looks invalid. Double-check GOOGLE_MAPS_API_KEY value."

    return ""

google_maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
gmaps_client = (
    googlemaps.Client(key=google_maps_api_key)
    if google_maps_api_key
    else None
)

genai_client = genai.Client(
    api_key=_get_required_env("GOOGLE_API_KEY", "GEMINI_API_KEY"),
    http_options=types.HttpOptions(api_version="v1"),
)

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

async def get_weather(location_name: str) -> dict:
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
                f"https://geocoding-api.open-meteo.com/v1/search?name={location_name}&count=1"
            )

            geocoding_response = await client.get(geocoding_url)
            geocoding_data = geocoding_response.json()

            if not geocoding_data.get("results"):
                raise ValueError(f"Location '{location_name}' not found")

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
    
def get_place_location(place_name: str) -> dict[str, str]:
    """Get coordinates from an address using Google Maps API.

    Args:
        place_name: The name of the place to get coordinates for.

    Returns:
        A dictionary with the status of the operation and the result.
        If successful, the resul contains the latitude and longitude.
    """    
    if gmaps_client is None:
        return {
            "status": "error",
            "message": "Missing API credentials. Set GOOGLE_MAPS_API_KEY."
        }

    try:
        geocode_result = gmaps_client.geocode(place_name)
        if geocode_result is None:
            return {
                "status": "error",
                "message": f"Could not find coordinates for address: {place_name}"
            }

        location = geocode_result[0]["geometry"]["location"]
        lat = location["lat"]
        lng = location["lng"]
        
        print(f"Geocode Result: {location} ")

        return {
            "status": "success",
            "result": {"latitude": lat, "longitude": lng}
        }

    except Exception as e:
        hint = _google_maps_denied_hint(str(e))
        message = str(e)
        if hint:
            message = f"{message} | Hint: {hint}"
        return {
            "status": "error",
            "message": message
        }

def get_place_details(query_prompt: str, latitude: float, longitude: float, model_name: Optional[str]= "gemini-2.5-flash") -> dict[str, Any]:
    """Get place details using Google Maps Tool in Gemini.

    Args:
        query_prompt: The prompt to search for.
        latitude: The latitude of the location.
        longitude: The longitude of the location.
        model_name: The name of the model to use.

    Returns:
        A dictionary with the status of the operation and the result.
        If successful, the result contains the place details.
    """

    try:
        response = genai_client.models.generate_content(
            model=model_name,
            contents=query_prompt,
            config=types.GenerateContentConfig(            
                tools=[
                    types.Tool(google_maps=types.GoogleMaps(
                        enable_widget=False
                    ))
                ],
                tool_config=types.ToolConfig(
                    retrieval_config=types.RetrievalConfig(
                        lat_lng=types.LatLng(
                            latitude=latitude,
                            longitude=longitude
                        ),
                        language_code="en_US"
                    )
                )
            )          
        )
        return {
            "status": "success",
            "result": response.text
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        } 