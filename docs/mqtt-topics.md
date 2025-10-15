# SmartFarm OS — MQTT Topics & ACL (v0.1)

## Namespace base
sfos/<farm>/<parcel|_>/<nuc>/<device>/<canal>

- <farm>    : slug/ID da quinta (ex.: farm-001)
- <parcel>  : ID da parcela; "_" quando não se aplica (ex.: meteo, health)
- <nuc>     : ID do NUC; usar "core" nos testes diretos
- <device>  : ID estável do dispositivo (ex.: meteo-01, valve-P01)
- <canal>   : telemetry | state/desired | state/reported | ack | error | health/heartbeat

## Canais (QoS/Retain)
- telemetry         → QoS1, Retain 0
- state/desired     → QoS1, Retain 0  (Core→NUC/Adapter)
- state/reported    → QoS1, Retain 1  (NUC/Adapter→Core)
- ack               → QoS1, Retain 0
- error             → QoS1, Retain 0
- health/heartbeat  → QoS1, Retain 1

## Exemplos
- Meteo (farm level):    sfos/farm-001/_/core/meteo-01/telemetry
- NUC health:            sfos/farm-001/_/nuc-A/health/heartbeat
- Válvula P01 desired:   sfos/farm-001/P01/nuc-A/valve-P01/state/desired
- Válvula P01 reported:  sfos/farm-001/P01/nuc-A/valve-P01/state/reported

## ACL por tenant (exemplo Mosquitto)
pattern write sfos/%u/+/core/+/state/desired
pattern read  sfos/%u/#

# Onde %u = farm_id do utilizador/cliente (mapeado via auth)
# Em produção, usar mTLS + listas por utilizador/grupo se necessário.