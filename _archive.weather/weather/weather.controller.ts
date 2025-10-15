import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type WuObs = {
  observations: Array<{
    stationID: string;
    obsTimeUtc: string;
    obsTimeLocal: string;
    neighborhood?: string | null;
    country?: string | null;
    lat?: number | null;
    lon?: number | null;
    humidity?: number | null;
    uv?: number | null;
    winddir?: number | null;
    qcStatus?: number | null;
    metric?: {
      temp?: number | null;
      heatIndex?: number | null;
      dewpt?: number | null;
      windChill?: number | null;
      windSpeed?: number | null;
      windGust?: number | null;
      pressure?: number | null;
      precipRate?: number | null;
      precipTotal?: number | null;
      elev?: number | null;
    } | null;
  }>;
};

@Controller('weather/wu')
@UseGuards(JwtAuthGuard)
export class WeatherController {
  @Get('ping')
  ping() {
    return { ok: true, provider: 'Weather Underground' };
  }

  @Get('check')
  async check(@Query('stationId') stationId?: string) {
    if (!stationId) throw new BadRequestException('stationId em falta');
    const apiKey = process.env.WEATHER_WU_API_KEY;
    if (!apiKey) throw new BadRequestException('WEATHER_WU_API_KEY não configurada');

    // Faz uma chamada leve para confirmar acesso/dados
    const url = `https://api.weather.com/v2/pws/observations/current?stationId=${encodeURIComponent(
      stationId,
    )}&format=json&units=m&apiKey=${encodeURIComponent(apiKey)}`;

    try {
      const { data } = await axios.get<WuObs>(url, { timeout: 8000 });
      const available = Array.isArray(data?.observations) && data.observations.length > 0;
      return { stationId, available };
    } catch (e) {
      // Não falha com 5xx da WU — apenas reporta indisponível
      return { stationId, available: false };
    }
  }

  @Get('current')
  async current(@Query('stationId') stationId?: string) {
    if (!stationId) throw new BadRequestException('stationId em falta');
    const apiKey = process.env.WEATHER_WU_API_KEY;
    if (!apiKey) throw new BadRequestException('WEATHER_WU_API_KEY não configurada');

    const url = `https://api.weather.com/v2/pws/observations/current?stationId=${encodeURIComponent(
      stationId,
    )}&format=json&units=m&apiKey=${encodeURIComponent(apiKey)}`;

    const { data } = await axios.get<WuObs>(url, { timeout: 8000 });
    const obs = data?.observations?.[0];
    if (!obs) return { stationId, available: false };

    return {
      stationId: obs.stationID,
      available: true,
      at: obs.obsTimeUtc,
      tempC: obs.metric?.temp ?? null,
      humidity: obs.humidity ?? null,
      pressure_hPa: obs.metric?.pressure ?? null,
      windSpeed_kmh: obs.metric?.windSpeed ?? null,
      windGust_kmh: obs.metric?.windGust ?? null,
      rainRate_mmhr: obs.metric?.precipRate ?? null,
      rainTotal_mm: obs.metric?.precipTotal ?? null,
      uv: obs.uv ?? null,
      location: {
        name: obs.neighborhood ?? null,
        country: obs.country ?? null,
        lat: obs.lat ?? null,
        lon: obs.lon ?? null,
        elev_m: obs.metric?.elev ?? null,
      },
    };
  }
}