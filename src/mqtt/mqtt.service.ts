import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, MqttClient } from 'mqtt';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private client: MqttClient | null = null;
  private connected = false;

  onModuleInit() {
    const url = process.env.MQTT_URL || 'mqtt://localhost:1883';
    this.client = connect(url);

    this.client.on('connect', () => {
      this.connected = true;
      this.client?.subscribe('sfos/#', (err) => {
        if (err) console.error('MQTT subscribe error:', err.message);
      });
      this.publish('sfos/health', 'ping');
    });

    this.client.on('error', (err) => {
      this.connected = false;
      console.error('MQTT error:', err.message);
    });

    this.client.on('close', () => {
      this.connected = false;
    });
  }

  onModuleDestroy() {
    this.client?.end(true);
  }

  isConnected(): boolean {
    return this.connected;
  }

  publish(topic: string, payload: string | Buffer) {
    if (!this.client || !this.connected) return;
    this.client.publish(topic, payload);
  }
}
