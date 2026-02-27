// WeatherResultBridge
// PURPOSE: Syncs weather tool response data into app state without duplicates
// BENEFIT: Prevents re-rendering the same weather result multiple times
// USAGE: Called when get_weather tool completes, triggers handleWeatherResult callback

// import { WeatherToolResult } from "../WeatherCard";
import { WeatherResultBridgeProps } from "./types";
import { useEffect, useRef } from "react";

// type WeatherResultBridgeProps = {
//   locationName: string;
//   weather: WeatherToolResult;
//   onResult: (data: PendingWeatherResult) => void;
// };
const seenSignatures = new Set<string>();

export function WeatherResultBridge({
  locationName,
  weather,
  onResult,
}: WeatherResultBridgeProps) {
  
  const onResultRef = useRef(onResult);

    useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    // const { temperature, conditions, humidity, windSpeed, feelsLike } = weather;
    // const signature = `${locationName}|${temperature}|${conditions}|${humidity}|${windSpeed}|${feelsLike}`;

    const signature = `${locationName}|${weather.temperature}|${weather.conditions}|${weather.humidity}|${weather.windSpeed}|${weather.feelsLike}`;

    console.log("🟡 Bridge: Checking signature:", signature);
    console.log("🟡 Bridge: Previous signature:", seenSignatures);

    if (seenSignatures.has(signature)) {
      console.log("⏭️ Bridge: Duplicate signature, skipping");
      return;
    }

    console.log("✅ Bridge: New signature, calling onResult");
    seenSignatures.add(signature);
    onResultRef.current({ locationName, weather });

  }, [locationName, weather]);

  return null;
}
