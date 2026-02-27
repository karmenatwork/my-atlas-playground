"use client";

import { useCoAgent, useFrontendTool } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AgentState } from "@/lib/types";
import AgentDebugger from "@/componentes/AgentDebugger";

import { useWeatherTool } from "@/componentes/weather/useWeatherTool";
import type { PendingWeatherResult } from "@/componentes/weather/types";

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

  const updateWeatherState = useCallback(
    (summary: string, pending: PendingWeatherResult) => {
      console.log("🟢 updateWeatherState called with:", summary);

      // setLocalAgentState((previousState) => ({
      //   ...previousState,
      //   latestResult: summary,
      //   latestLocationName: pending.locationName,
      //   latestWeather: {
      //     ...pending.weather,
      //     temperature:
      //       typeof pending.weather.temperature === "string"
      //         ? parseFloat(pending.weather.temperature)
      //         : pending.weather.temperature,
      //   },
      //   history: [summary, ...(previousState.history || [])].slice(0, 8),
      // }));
      setLocalAgentState((previousState) => ({
        ...previousState,
        latestResult: summary,
        latestLocationName: pending.locationName,
        latestWeather: { ...pending.weather },
        history: [summary, ...(previousState.history || [])].slice(0, 8),
      }));
    },
    [],
  );
  useWeatherTool({ onResult: updateWeatherState });

  // const hasSharedHistory =
  //   Array.isArray(state.history) && state.history.length > 0;
  // const activeState =
  //   state.latestResult || hasSharedHistory ? state : localAgentState;
  const hasLocalHistory =
    Array.isArray(localAgentState.history) &&
    localAgentState.history.length > 0;

  // Prefer local state when local tools write results
  const activeState = hasLocalHistory ? localAgentState : state;

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
