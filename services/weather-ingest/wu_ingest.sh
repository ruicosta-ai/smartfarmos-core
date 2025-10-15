#!/usr/bin/env bash
set -euo pipefail

# carregar variáveis do .env (se existir)
if [ -f ".env" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env | xargs)
fi

: "${WU_STATION:?missing WU_STATION}"
: "${WU_KEY:?missing WU_KEY}"
DATA_DIR="${DATA_DIR:-./data}"

mkdir -p "$DATA_DIR"
STATE_FILE="${DATA_DIR}/state_${WU_STATION}.last"
OUT_FILE="${DATA_DIR}/$(date -u +%Y-%m-%d)_${WU_STATION}.jsonl"

LAST_TS="$(cat "$STATE_FILE" 2>/dev/null || true)"
if [ -z "$LAST_TS" ]; then
  # fallback: if there is previous data in OUT_FILE, use its last timestamp
  if [ -s "$OUT_FILE" ]; then
    LAST_TS=$(tail -n 1 "$OUT_FILE" 2>/dev/null | jq -r '.ts' 2>/dev/null || true)
  fi
fi
[ -z "$LAST_TS" ] && LAST_TS="1970-01-01T00:00:00Z"

TMP_JSON="$(mktemp)"
curl -sS --fail \
  "https://api.weather.com/v2/pws/observations/all/1day?stationId=${WU_STATION}&format=json&units=m&apiKey=${WU_KEY}" \
  -o "$TMP_JSON"

# fail fast if placeholder key is still present or empty
if [ -z "${WU_KEY}" ] || [ "${WU_KEY}" = "COLOCA_A_TUA_API_KEY_AQUI" ]; then
  echo "WU_KEY inválida no .env" >&2
  rm -f "$TMP_JSON"
  exit 1
fi

# extrair e contar novos registos primeiro (evita problemas de wc/tr em macOS)
FILTER_COUNT=$(jq -r --arg last "$LAST_TS" '[.observations[] | select(.obsTimeUtc > $last)] | length' "$TMP_JSON")

# sanity: garantir que é número
if ! [[ "$FILTER_COUNT" =~ ^[0-9]+$ ]]; then
  echo "Erro a calcular número de registos novos (FILTER_COUNT='$FILTER_COUNT')." >&2
  FILTER_COUNT=0
fi

# se houver novos, anexar normalizados ao ficheiro e atualizar o estado
if [ "$FILTER_COUNT" -gt 0 ]; then
  jq -c --arg last "$LAST_TS" '
    .observations[]
    | select(.obsTimeUtc > $last)
    | {
        ts: .obsTimeUtc,
        station_id: .stationID,
        lat, lon,
        temp_c:        (.metric.tempAvg // .metric.temp // null),
        dewpt_c:       (.metric.dewptAvg // .metric.dewpt // null),
        rh_pct:        (.humidityAvg     // .humidity     // null),
        wind_speed_ms: (.metric.windspeedAvg // .metric.windSpeed // null),
        wind_gust_ms:  (.metric.windgustHigh // .metric.windGust  // null),
        wind_dir_deg:  (.winddirAvg // .winddir // null),
        msl_hpa:       (.metric.pressureMax // .metric.pressure // null),
        rain_rate_mm_h:(.metric.precipRate // 0),
        rain_mm_total: (.metric.precipTotal // 0),
        solar_w_m2:    (.solarRadiationHigh // .solarRadiation // null),
        uv_index:      (.uvHigh // .uv // null),
        source: "wu",
        qa_flags: (.qcStatus // 0)
      }
  ' "$TMP_JSON" >> "$OUT_FILE"

  LAST_NEW_TS=$(jq -r --arg last "$LAST_TS" '[.observations[] | select(.obsTimeUtc > $last) | .obsTimeUtc] | max // empty' "$TMP_JSON")
  if [ -n "$LAST_NEW_TS" ]; then
    echo "$LAST_NEW_TS" > "$STATE_FILE"
  fi
fi

LAST_TS_SHOW=$(cat "$STATE_FILE" 2>/dev/null || true)
echo "Ingest: ${FILTER_COUNT} novos → $(basename "$OUT_FILE")  (last_ts=${LAST_TS_SHOW})"

rm -f "$TMP_JSON"