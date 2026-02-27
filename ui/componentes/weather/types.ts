
export type WeatherToolResult ={
  temperature: number;
  conditions: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}
export type PendingWeatherResult = {
  locationName: string;
  weather: WeatherToolResult;
};

export type WeatherResultBridgeProps = {
  locationName: string;
  weather: WeatherToolResult;
  onResult: (data: PendingWeatherResult) => void;
};
