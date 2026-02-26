export type AgentWeatherResult = {
  temperature: number;
  conditions: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
};

export type AgentState = {
  latestResult: string | null;
  latestLocation: string | null;
  latestWeather: AgentWeatherResult | null;
  history: string[];
};