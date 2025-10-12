
# 3) `pilot-checklist.md` — Passo-a-passo dos testes

```markdown
# SmartFarm OS — Pilot Checklist (v0.1)
> Pilotos: Estação Meteo (telemetria) e Válvula/Programador (twin)

## Pré-requisitos
- Broker MQTT Core com WS ativo
- Tabelas criadas (ver `database.md`)
- Schemas carregados (ver `schemas.md`)
- Registos em `devices`:
  - meteo-01 (category=clima, type=weather_station)
  - valve-P01 (category=hidraulica, type=valve)

## A) Meteo → Core (direto)
1. Publicar pacote de teste:
   - Topic: `sfos/<farm>/_/core/meteo-01/telemetry`
   - Payload: `schemas.md` (v1)
2. Verificar ingestão em `telemetry_weather`
3. Dashboard/Gráfico 24h lê por `device_id=meteo-01`
4. Deixar 1 ponto/minuto

✅ Sucesso: série contínua; sem duplicados; UTC coerente.

## B) Rega (Tuya/Core adapter temporário)
1. Publicar `desired`:
   - Topic: `sfos/<farm>/<parcel>/core/valve-P01/state/desired`
   - Payload: `{ "command_id": "...", "action":"open", "duration_min":10, ... }`
2. Adapter executa → publica `ack` em ≤ 2s
3. Adapter publica `state/reported` com `state:"open"` e `remaining_s`
4. Dashboard mostra cronómetro e botão “Cancelar”

✅ Sucesso: ack rápido; reported consistente; auditoria criada.

## C) Migração para NUC
1. Configurar broker local + bridge (QoS1)
2. Mudar origem da Meteo para NUC (mesmo payload)
3. Mudar adapter da Válvula para NUC
4. Confirmar que:
   - tópicos passam a `<nuc_id>` em vez de `core`
   - `ingest_src` muda para `nuc_bridge`
   - UI/gráficos continuam sem alterações

✅ Sucesso: zero alterações na UI; dados contínuos.

## D) Rollback / Fallback
- Se bridge cair → Edge Rules fecham válvulas em baixa pressão
- Logs e alertas para perda de heartbeat