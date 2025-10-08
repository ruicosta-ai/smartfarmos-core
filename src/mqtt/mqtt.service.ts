import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttService implements OnModuleInit {
  private client: mqtt.MqttClient;

  onModuleInit() {
    const url = process.env.MQTT_URL || 'mqtt://localhost:1883';
    this.client = mqtt.connect(url);
    this.client.on('connect', () => {
      console.log('[MQTT] connected to', url);
    });
    this.client.on('error', (err) => {
      console.error('[MQTT] error:', err?.message);
    });
  }

  publish(topic: string, message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || (this.client as any).disconnected) {
        return reject(new Error('MQTT client not connected'));
      }
      this.client.publish(topic, message, { qos: 0 }, (err?: Error) =>
        err ? reject(err) : resolve(),
      );
    });
  }
  isConnected(): boolean {
    return !!this.client && (this.client as any).connected === true;
  }
}
