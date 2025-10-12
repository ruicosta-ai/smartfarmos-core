# 🌿 SmartFarm OS — Overview (v0.1)

Última atualização: 2025-10-10  
Autor: Equipa SmartFarm OS (Core & Edge Architecture)

---

## 🎯 Objetivo

O **SmartFarm OS** é uma plataforma modular de gestão agrícola inteligente.  
Combina hardware local (NUCs e sensores), um Core central na cloud e uma interface web simples para o utilizador final.

O objetivo é **automatizar, monitorizar e otimizar** todas as operações da quinta — rega, fertirrega, clima, sensores e energia — com base em dados reais e regras locais inteligentes.

---

## 🧠 Conceito Base

Cada quinta possui:
1. **Um NUC Local** → cérebro no terreno, comunica com os sensores e executa ordens.  
2. **Sensores e Atuadores** → recolhem dados e controlam a infraestrutura (rega, adubos, etc.).  
3. **O Core (Cloud)** → centraliza dados, histórico e dashboards.  
4. **A Dashboard Web** → interface única para o utilizador visualizar e controlar tudo.

> Se o Core estiver offline, o NUC mantém o sistema da quinta a funcionar de forma autónoma.

---

## 🧩 Estrutura por Blocos

| Bloco | Função principal | Exemplos de dados |
|--------|------------------|-------------------|
| **Core (Cloud)** | API, MQTT, BD, IA, Dashboard | Histórico, relatórios, recomendações |
| **NUC Local** | Lógica de campo, comunicação com dispositivos | Execução de rega, sensores LoRa, Tuya LAN |
| **Módulo de Rega** | Gestão e automação de rega por setor | Estado válvulas, pressão, caudal |
| **Módulo Fertirrega** | Injeção de adubos e receitas | Níveis de tanque, dosagem |
| **Módulo Clima** | Estações meteorológicas e previsão | Temperatura, chuva, vento |
| **Módulo de Sensores** | Solo, pressão, energia, etc. | Humidade, EC, tensão, pH |
| **Caderno de Campo** | Operações agrícolas e registos | Tratamentos, adubações, notas |
| **Segurança & Energia** | Vigilância, alarmes, consumo | Câmaras, UPS, fotovoltaico |

---

## 📡 Comunicação

- Baseada em **MQTT**, com tópicos hierárquicos:
- **NUC ↔ Core** usam bridge MQTT (QoS 1) para sincronização contínua.
- **Dados em tempo real** (rega, clima) chegam à Dashboard via **WebSocket**.
- **Todos os payloads** seguem schemas versionados (`v1`, `v2`, …).

---

## 🧱 Arquitetura Simplificada
🌐 CORE (Hetzner / Cloud)
──────────────────────────
• Dashboard do utilizador
• API e BD central
• Armazenamento de histórico
• Inteligência adaptativa
• Segurança e auditoria
│
▼
🧠 NUC LOCAL (Cérebro da quinta)
──────────────────────────
• Gere sensores e atuadores
• Aplica regras locais
• Mantém operação offline
• Reenvia dados ao Core
│
▼
📡 Dispositivos e Sensores
──────────────────────────
• Rega / Fertirrega / Clima / Solo / Energia
• Comunicação via LAN, Wi-Fi, LoRa, Tuya, Modbus
---

## 🔒 Segurança

- Autenticação mTLS entre NUC e Core.  
- Controlo de acessos por utilizador, quinta e parcela.  
- Auditoria de todos os comandos (quem, quando, o quê).  
- Fail-safe local em caso de falha de comunicação.

---

## 💻 Interface Web

A app (https://app.smartfarmos.pt) é responsiva e mobile-friendly.

| Página | Função | Exemplo |
|---------|--------|---------|
| **Dashboard** | visão global das quintas | alertas, meteo, regas ativas |
| **Overview da quinta** | estado do NUC, clima, setores | uptime, chuva, temperatura |
| **Rega / Fertirrega** | controlo manual e automático | abrir setor, dosear adubo |
| **Clima** | dados e gráficos 24 h / 7 d | ET₀, vento, chuva |
| **Sensores** | lista e qualidade dos sensores | solo, pressão, energia |
| **Caderno de Campo** | operações e conformidade | registos e exportação |
| **Configurações** | permissões, dispositivos | gestão de utilizadores e NUC |

---

## ⚙️ Filosofia Técnica

- **Modularidade** — cada bloco (Rega, Clima, Fertirrega, etc.) é independente.  
- **Resiliência** — se um módulo falhar, os restantes continuam operacionais.  
- **Escalabilidade** — suporta múltiplas quintas, cada uma com o seu NUC.  
- **Interoperabilidade** — integra sensores comerciais (Tuya, LoRa, Modbus, etc.).  
- **Transparência** — todos os dados são armazenados de forma auditável.

---

## 🧭 Próximos Passos (Roadmap)

1. **Pilotos ativos** — estação meteorológica e válvula Tuya LAN.  
2. **Configuração do NUC local** — bridge MQTT + regras locais.  
3. **Módulo Rega completo** — setores, volumes, logs, fertirrega.  
4. **Integração de sensores de solo (LoRa).**  
5. **Módulo IA adaptativo** — rega e fertirrega automáticas por parcela.  
6. **App móvel nativa (futura)** — controlo rápido em campo.

---

## 🧾 Documentação Técnica Relacionada

| Ficheiro | Conteúdo |
|-----------|----------|
| `schemas.md` | Estrutura dos payloads MQTT/API |
| `mqtt-topics.md` | Convenções e ACL de tópicos |
| `database.md` | Estrutura das tabelas principais |
| `pilot-checklist.md` | Passos dos pilotos Meteo e Rega |
| `routes.md` | Estrutura de navegação da App Web |

---

> **SmartFarm OS** — Where Nature Meets Intelligence 🌱  
> A agricultura inteligente feita em Portugal.
