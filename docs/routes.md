# SmartFarm OS — Routes & Navigation (v0.1)

Última atualização: 2025-10-10  
Escopo: convenções de URL, rotas iniciais, parâmetros padrão, tempo-real e versionamento.

---

## 1) Domínios

- Site público: `https://smartfarmos.pt`
- App (SPA/Next.js): `https://app.smartfarmos.pt`
- API/Core: `https://api.smartfarmos.pt/v1`
- MQTT-WS: `wss://api.smartfarmos.pt/mqtt`

---

## 2) Convenções gerais

- **Contexto da quinta** no caminho: `/f/<farmSlug>/...`
- **Parcela**: `/p/<parcelId>`
- **Setor**: `/s/<sectorId>`
- Idioma (opcional): prefixo `/pt` ou `/en` → `/pt/f/<farm>/...`
- Timezone na UI: `Europe/Lisbon` (servidor/BD sempre UTC)
- IDs:
  - `farmSlug`: `kebab-case` único por utilizador (ex.: `quinta-do-valado`)
  - `parcelId`, `sectorId`, `deviceId`: strings estáveis
- **Acesso negado** mostra “Sem permissões” (não 404)

---

## 3) Rotas públicas (site)

- `/` — landing
- `/privacy`, `/terms`, `/status` (futuro)

---

## 4) Autenticação

- `/login`
- `/logout`
- `/recover`
- Redireção pós-login:
  - 1 quinta → `/f/<farmSlug>/overview`
  - N quintas → `/dashboard`

---

## 5) Dashboard global do utilizador

- **`/dashboard`**
  - Cards por quinta (estado do NUC, chuva 24h, alertas)
  - Dados: `GET /farms?mine=true`, `GET /alerts?open=true`

---

## 6) Quinta (nível farm)

- **`/f/<farmSlug>/overview`**
  - NUC health, meteo do dia, regas ativas, mapa mini

- **`/f/<farmSlug>/clima`**
  - Gráficos 24h/7d/30d (temp, RH, chuva, vento, pressão); ET₀

- **`/f/<farmSlug>/sensores`**
  - Lista por categoria (solo, hidráulica, meteo); qualidade/última leitura

- **`/f/<farmSlug>/nuc`**
  - Health (CPU/RAM/disco/RTT), bridge status, OTA

- **`/f/<farmSlug>/caderno`**
  - Operações (tratamentos, adubações, podas) por período/parcela

- **`/f/<farmSlug>/mapa`**
  - Geometrias (parcelas/setores), camadas (sensores, condutas, NDVI no futuro)

- **`/f/<farmSlug>/settings`**
  - Utilizadores/Permissões, Dispositivos, Políticas, OTA

---

## 7) Parcela e Setor

- **`/f/<farmSlug>/p/<parcelId>/overview`**
  - Estado hidráulico (válvula/pressão/caudal), solo, últimas regas

- **`/f/<farmSlug>/p/<parcelId>/rega`**
  - Operação do setor: tempo/volume, cronómetro, curvas pressão/caudal

- **`/f/<farmSlug>/p/<parcelId>/fertirrega`**
  - Receitas (ml/L ou dose), níveis tanques, interlocks

- **`/f/<farmSlug>/p/<parcelId>/s/<sectorId>`**
  - Detalhe do setor (link a partir de overview/rega)

---

## 8) Parâmetros comuns (query string)

- Intervalo temporal:
  - `from=2025-10-09T00:00:00Z&to=2025-10-10T00:00:00Z`
  - Atalhos: `range=today|24h|7d|30d`
- Granularidade: `gran=1m|5m|1h|1d`
- Paginação: `page`, `limit` (listas longas)
- Filtros: `category=solo|hidraulica|meteo`, `status=online|offline`

---

## 9) Tempo-real (MQTT-WS) — tópicos por página

> Namespace: `sfos/<farm>/<parcel|_>/<nuc>/<device>/<canal>`

- Overview da quinta:
  - `sfos/<farm>/_/<nuc>/health/heartbeat`
  - `sfos/<farm>/_/<nuc>/meteo-*/telemetry`
  - `sfos/<farm>/<parcel>/<nuc>/*/state/reported`

- Clima:
  - `sfos/<farm>/_/<nuc>/meteo-*/telemetry`

- Parcela → Overview:
  - `sfos/<farm>/<parcel>/<nuc>/valve-*/state/reported`
  - `sfos/<farm>/<parcel>/<nuc>/pressure-*/telemetry`
  - `sfos/<farm>/<parcel>/<nuc>/soil-*/telemetry`

- Parcela → Rega:
  - `.../valve-*/state/reported`, `.../pressure-*/telemetry`, `.../flow-*/telemetry`

- NUC:
  - `sfos/<farm>/_/<nuc>/health/heartbeat`, `sfos/<farm>/_/<nuc>/ota/reported`

---

## 10) APIs esperadas por página (alto nível)

- Clima: `GET /climate/timeseries`, `GET /climate/daily`
- Rega: `POST /irrigation/sectors/{id}/run`, `GET /irrigation/sectors/{id}/status`
- Fertirrega: `GET /fertigation/recipes`, `POST /fertigation/apply`
- Sensores: `GET /devices?sensor=true&farm=...`
- NUC: `GET /nucs/{id}`, `GET /ota/status`
- Mapa/GIS: `GET /gis/parcels`, `GET /gis/layers`
- Settings: `GET/PUT /farms/{id}`, `GET/POST /users`, `GET/POST /devices`

*(Todas versionadas em `api.smartfarmos.pt/v1`.)*

---

## 11) Regras de navegação

- Se o utilizador tiver 1 farm → redirecionar para `/f/<farm>/overview`
- Breadcrumbs: Farm → Parcela → Setor/Dispositivo
- “Sem permissões” quando o user não pertence à farm/parcela pedida
- Guardas de rota:
  - requer sessão (OIDC)
  - valida `farmSlug` nos claims
  - fallback para `/dashboard` se inválido

---

## 12) Versionamento e mudanças

- Este ficheiro segue **semver**: `vMAJOR.MINOR`
- **Breaking changes** em rotas → incrementam MAJOR
- Adições de rotas/params → MINOR
- Registar alterações no final:

### Changelog
- **v0.1 (2025-10-10)**: primeira versão — rotas base, convenções e tópicos WS.

---