import { useCallback, useRef, useEffect, useMemo } from "react";
import { useRenderToolCall } from "@copilotkit/react-core";
import { WeatherResultBridge } from "./WeatherResultBridge"
import  { WeatherToolResult, type PendingWeatherResult } from "./types";
import WeatherCard, {
  getThemeColor,
  // WeatherToolResult,
} from "@/componentes/WeatherCard";

type UseWeatherToolParams = {
  onResult: (summary: string, data: PendingWeatherResult) => void;
};
export function useWeatherTool({ onResult }: UseWeatherToolParams) {
  const seenResultSignatures = useRef<Set<string>>(new Set());

    // Wrap onResult in a ref to avoid infinite re-renders
  const onResultRef = useRef(onResult);

   useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const handleWeatherResult = useCallback(
    (pendingWeatherResult: PendingWeatherResult) => {
      console.log('🔴 useWeatherTool.handleWeatherResult called ', pendingWeatherResult);
      
      const signature = `${pendingWeatherResult.locationName}|
            ${pendingWeatherResult.weather.temperature}|
            ${pendingWeatherResult.weather.conditions}|
            ${pendingWeatherResult.weather.humidity}|
            ${pendingWeatherResult.weather.windSpeed}|
            ${pendingWeatherResult.weather.feelsLike}`;

      if (seenResultSignatures.current.has(signature)) {
        return;
      }

      seenResultSignatures.current.add(signature);
      const summary = `Weather in ${pendingWeatherResult.locationName}: 
            ${pendingWeatherResult.weather.temperature}, 
            ${pendingWeatherResult.weather.conditions}.`;
      onResultRef.current(summary, pendingWeatherResult);
    },
    [],// Empty deps — callback never changes
  );


  // const handleWeatherResult = useCallback(
  //   (pendingWeatherResult: PendingWeatherResult) => {
  //     console.log("🔴 useWeatherTool.handleWeatherResult called", pendingWeatherResult);

  //     const summary = `Weather in ${pendingWeatherResult.locationName}: ${pendingWeatherResult.weather.temperature}, ${pendingWeatherResult.weather.conditions}.`;
  //     onResultRef.current(summary, pendingWeatherResult);
  //   },
  //   [],
  // );
  
  useRenderToolCall({
    name: "get_weather",
    description: "Get the weather for a given location.",
    parameters: [{ name: "location_name", type: "string", required: true }],
    render: ({ args, status, result: toolResponse }) => {
      if (status === "inProgress") {
        return (
          <div className="bg-[#667eea] text-white p-4 rounded-lg max-w-md">
            <span className="animate-spin">⚙️ 🌤️ Retrieving weather...</span>
          </div>
        );
      }

      if (status === "complete" && toolResponse) {
        // console.log('toolResponse ', toolResponse)

        const weatherResult: WeatherToolResult | null = toolResponse?.result || null;

        if (!weatherResult) {
          return (
            <div className="bg-red-300 text-red-900 p-4 rounded-lg max-w-md">
              <strong>⚠️ Error:</strong> Unable to retrieve weather data. Please
              try again.
            </div>
          );
        }

        const weatherThemeColor = getThemeColor(weatherResult.conditions);

        return (
          <>
            <WeatherResultBridge
              locationName={args.location_name}
              weather={weatherResult}
              onResult={handleWeatherResult}
            />
            <WeatherCard
              location={args.location_name}
              themeColor={weatherThemeColor}
              result={weatherResult}
              status={status || "complete"}
            />
          </>
        );
      }
      return null;
    },
  });
}
