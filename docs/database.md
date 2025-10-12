# SmartFarm OS — Database (v0.1)

> Objetivo: tabelas mínimas para Meteo + Rega Twin e auditoria.

## 1) Dispositivos registados
```sql
CREATE TABLE IF NOT EXISTS devices (
  device_id    text PRIMARY KEY,
  farm_id      text NOT NULL,
  parcel_id    text NULL,
  nuc_id       text NULL,
  category     text NOT NULL,  -- clima | hidraulica | agronomicos | ...
  type         text NOT NULL,  -- weather_station | valve | soil_sensor | ...
  meta         jsonb DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS telemetry_weather (
  ts              timestamptz NOT NULL,
  farm_id         text NOT NULL,
  nuc_id          text NULL,
  device_id       text NOT NULL,
  temp_c          numeric,
  rh_pct          numeric,
  rain_mm         numeric,
  wind_ms         numeric,
  solar_w_m2      numeric,
  pressure_hpa    numeric,
  ingest_src      text NOT NULL,        -- direct_core | nuc_bridge
  schema_version  text DEFAULT 'v1',
  PRIMARY KEY (device_id, ts)
);

CREATE TABLE IF NOT EXISTS twin_reported (
  device_id   text NOT NULL,
  ts          timestamptz NOT NULL,
  state       jsonb NOT NULL,           -- espelho do reported (válvula, etc.)
  PRIMARY KEY (device_id, ts)
);

CREATE TABLE IF NOT EXISTS audit_commands (
  command_id     text PRIMARY KEY,
  farm_id        text,
  parcel_id      text,
  device_id      text,
  user_id        text,
  action         text,
  timestamp      timestamptz,
  status         text,                  -- ack | error | completed
  ack_at         timestamptz,
  completed_at   timestamptz,
  details        jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_weather_farm_ts ON telemetry_weather (farm_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_twin_device_ts    ON twin_reported (device_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_device_ts   ON audit_commands (device_id, timestamp DESC);

