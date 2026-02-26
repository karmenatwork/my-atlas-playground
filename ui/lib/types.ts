export type AgentWeatherResult = {
  temperature: number;
  conditions: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
};

export type AgentLocationData = {
  lat: number;
  lng: number;
  address: string;
};

export type AgentState = {
  latestResult: string | null;
  latestLocationName: string | null;
  latestWeather: AgentWeatherResult | null;
  latestLocationData: AgentLocationData | null;
  history: string[];
};