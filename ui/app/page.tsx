"use client";

import {
  useCoAgent,
  useFrontendTool,
  useRenderToolCall,
} from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import WeatherCard, {
  getThemeColor,
  WeatherToolResult,
} from "@/componentes/WeatherCard";
import GoogleMap from "@/componentes/GoogleMap";
import { AgentState } from "@/lib/types";
import AgentDebugger from "@/componentes/AgentDebugger";

export default function CopilotKitPage() {
  const searchParams = useSearchParams();
  const showDebuggerParam = searchParams.get("showDebugger");
  const showDebugger =
    showDebuggerParam !== null &&
    showDebuggerParam.toLowerCase() !== "false" &&
    showDebuggerParam !== "0";

  const [background, setBackground] = useState<string>("#f8fafc");

  /* --------------------------------------------------------------------------------------------
   * CHANGE BACKGROUND TOOL
   * This tool allows the LLM to set the chat background.
   * ------------------------------------------------------------------------------------------*/
  useFrontendTool({
    name: "change_background",
    description:
      "Change the chat's background using any CSS background value (color, gradient, etc.).",
    parameters: [
      {
        name: "background",
        type: "string",
        description: "CSS background definition (colors, gradients, etc).",
      },
    ],
    // The tool handler executes when the LLM calls this tool.
    handler: ({ background }) => {
      setBackground(background);
      return {
        status: "success",
        message: `Background changed to ${background}`,
      };
    },
  });

  const [themeColor, setThemeColor] = useState<string>("#6366f1");

  // 🪁 Frontend Actions: https://docs.copilotkit.ai/adk/frontend-actions
  useFrontendTool({
    name: "setThemeColor",
    description: "Set the app theme color using any valid CSS color value.",

    parameters: [
      {
        name: "themeColor",
        type: "string",
        description:
          "Theme color value (e.g. green, #22c55e, linear-gradient(...)).",
        required: true,
      },
    ],
    handler({ themeColor }) {
      setThemeColor(themeColor);
      return {
        status: "success",
        message: `Theme changed to ${themeColor}`,
      };
    },
  });

  return (
    <main
      className="min-h-screen box-border p-6 md:p-8"
      style={
        {
          background,
          // "--copilot-kit-background-color": background,
          "--copilot-kit-primary-color": themeColor,
        } as CopilotKitCSSProperties
      }
    >
      <CopilotSidebar
        disableSystemMessage={true}
        clickOutsideToClose={false}
        defaultOpen={true}
        labels={{
          title: "Atlas Assistant",
          initial: "👋 Hi, there! You're chatting with a Playfull Atlas agent.",
        }}
        suggestions={[
          {
            title: "Weather in San Francisco",
            message: "Get the weather in San Francisco.",
          },
          {
            title: "Where is the SF Moma?",
            message: "Get me the location of the SF Moma.",
          },
          {
            title: "Change color theme",
            message: "Set the theme to green.",
          },
          {
            title: "Change background to blue-green gradient",
            message:
              "Change the background to a right-to-left gradient from blue to green.",
          },
        ]}
      >
        <MainContent themeColor={themeColor} />
      </CopilotSidebar>
      {showDebugger && (
        <div className="w-full max-w-6xl mt-4">
          <AgentDebugger className="h-72" />
        </div>
      )}
    </main>
  );
}

// WeatherResultBridge
// PURPOSE: Syncs weather tool response data into app state without duplicates
// BENEFIT: Prevents re-rendering the same weather result multiple times
// USAGE: Called when get_weather tool completes, triggers handleWeatherResult callback

type PendingWeatherResult = {
  locationName: string;
  weather: WeatherToolResult;
};

function WeatherResultBridge({
  locationName,
  weather,
  onResult,
}: {
  locationName: string;
  weather: WeatherToolResult;
  onResult: (result: PendingWeatherResult) => void;
}) {
  const { temperature, conditions, humidity, windSpeed, feelsLike } = weather;

  useEffect(() => {
    onResult({
      locationName,
      weather: {
        temperature,
        conditions,
        humidity,
        windSpeed,
        feelsLike,
      },
    });
  }, [
    locationName,
    temperature,
    conditions,
    humidity,
    windSpeed,
    feelsLike,
    onResult,
  ]);

  return null;
}

// LocationResultBridge
// PURPOSE: Syncs location tool response data (lat/long) into app state
// BENEFIT: Centralizes location data handling, keeps tool render logic clean
// USAGE: Called when get_place_location tool completes, triggers handlePlaceLocationResult callback

type PendingLocationResult = {
  placeName: string;
  latitude: number;
  longitude: number;
};

// LocationResultBridge
function LocationResultBridge({
  placeName,
  latitude,
  longitude,
  onResult,
}: {
  placeName: string;
  latitude: number;
  longitude: number;
  onResult: (result: PendingLocationResult) => void;
}) {
  useEffect(() => {
    onResult({
      placeName,
      latitude,
      longitude,
    });
  }, [placeName, latitude, longitude, onResult]);

  return null;
}

function MainContent({ themeColor }: { themeColor: string }) {
  const initialAgentState: AgentState = {
    latestResult: null,
    latestLocationName: null,
    latestWeather: null,
    latestLocationData: null,
    history: [],
  };

  const { state } = useCoAgent<AgentState>({
    name: "atlas_agent",
    initialState: initialAgentState,
  });

  const [localAgentState, setLocalAgentState] =
    useState<AgentState>(initialAgentState);
  const seenResultSignatures = useRef<Set<string>>(new Set());

  const handleWeatherResult = useCallback(
    (pendingWeatherResult: PendingWeatherResult) => {
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

      setLocalAgentState((previousState) => ({
        ...previousState,
        latestResult: summary,
        latestLocationName: pendingWeatherResult.locationName,
        latestWeather: pendingWeatherResult.weather,
        history: [summary, ...(previousState.history || [])].slice(0, 8),
      }));
    },
    [],
  );

  useRenderToolCall(
    {
      name: "get_weather",
      description: "Get the weather for a given location.",
      parameters: [{ name: "location_name", type: "string", required: true }],
      render: ({ args, status, result: toolResponse }) => {
        if (status === "inProgress") {
          return (
            <div className="bg-[#667eea] text-white p-4 rounded-lg max-w-md">
              <span className="animate-spin">⚙️ Retrieving weather...</span>
            </div>
          );
        }

        if (status === "complete" && toolResponse) {
          const weatherResult: WeatherToolResult | null =
            toolResponse?.result || null;

          if (!weatherResult) {
            return (
              <div className="bg-red-300 text-red-900 p-4 rounded-lg max-w-md">
                <strong>⚠️ Error:</strong> Unable to retrieve weather data.
                Please try again.
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
    },
    [],
  );

  const handlePlaceLocationResult = useCallback(
    (locationData: PendingLocationResult) => {
      const signature = `${locationData.placeName} | ${locationData.longitude} | ${locationData.latitude}`

      if (seenResultSignatures.current.has(signature)) {
        return;
      }

      seenResultSignatures.current.add(signature)
      
      const summary = `Location of ${locationData.placeName}: ${locationData.latitude}°, ${locationData.longitude}°`;
      console.log('seenResultSignatures', seenResultSignatures)

      setLocalAgentState((previousState) => ({
        ...previousState,
        latestResult: summary,
        latestLocationData: {
          placeName: locationData.placeName,
          lat: locationData.latitude,
          lng: locationData.longitude,
          address: locationData.placeName,
        },
        history: [summary, ...(previousState.history || [])].slice(0, 8),
      }));
    },
    [],
  );

  /* --------------------------------------------------------------------------------------------
   * RENDER PLACE LOCATION TOOL CALL
   * This visually renders the result of the get_place_location tool.
   * ------------------------------------------------------------------------------------------
   */

  useRenderToolCall({
    name: "get_place_location",
    description: "get the latitude and longitude of a place given its name.",
    available: "disabled",
    parameters: [{ name: "place_name", type: "string", required: true }],
    render: ({ args, status, result }) => {
      if (status === "inProgress") {
        return (
          <div className="bg-[#667eea] text-white p-4 rounded-lg max-w-md">
            <span className="animate-spin">⚙️ Retrieving location...</span>
          </div>
        );
      }

      console.log(result);
      if (status === "complete" && result) {
        const { result: coords } = result;
        console.log("Place Location Result:", coords);

        if (
          typeof coords?.latitude !== "number" ||
          typeof coords?.longitude !== "number"
        ) {
          return (
            <div className="bg-red-300 text-red-900 p-4 rounded-lg max-w-md">
              <strong>⚠️ Error:</strong> Unable to retrieve location data.
            </div>
          );
        }

        return (
          <>
            <LocationResultBridge
              placeName={args.place_name}
              latitude={coords?.latitude.toFixed(4)}
              longitude={coords?.longitude.toFixed(4)}
              onResult={handlePlaceLocationResult}
            />
            ;
            <GoogleMap lat={coords?.latitude} lng={coords?.longitude} />;
          </>
        );
      }
      return null;
    },
  });

  const hasSharedHistory =
    Array.isArray(state.history) && state.history.length > 0;
  const activeState =
    state.latestResult || hasSharedHistory ? state : localAgentState;

  return (
    <div
      style={{ backgroundColor: themeColor }}
      className="w-full min-h-[70vh] flex justify-center items-center flex-col"
    >
      <ConversationResultCard state={activeState} />
    </div>
  );
}

function ConversationResultCard({ state }: { state: AgentState }) {
  return (
    <div className="w-full max-w-2xl rounded-xl bg-white/90 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Agent Result</h2>
      <p className="mt-2 text-sm text-slate-600">
        Ask the assistant for weather (example: “Get the weather in San
        Francisco”). The latest result appears here.
      </p>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        {state.latestResult ? (
          <p className="text-slate-900">{state.latestResult}</p>
        ) : (
          <p className="text-slate-500">No result yet.</p>
        )}
      </div>

      {state.history && state.history.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-slate-700">Recent Results</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-800">
            {state.history.map((item, index) => (
              <li
                key={`${item}-${index}`}
                className="rounded-md bg-slate-50 px-3 py-2"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
