import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgentJwtGuard } from '../auth/guards/agent-jwt.guard';

// Repete os DTOs aqui para evitar imports circulares
type CreateIntegrationDto = {
  kind: 'WUNDERGROUND';
  name?: string;
  config?: Record<string, any>;
  secrets?: Record<string, any>;
  status?: 'DISABLED' | 'PENDING' | 'RUNNING' | 'ERROR';
};

type UpdateIntegrationDto = Partial<CreateIntegrationDto>;

type AuthedReq = { user?: { sub?: string; id?: string } };

@UseGuards(JwtAuthGuard)
@Controller('nucs/:nucId/integrations')
export class IntegrationsController {
  constructor(private readonly svc: IntegrationsService) {}

  private getUserId(req: AuthedReq) {
    return req.user?.sub || req.user?.id || '';
  }

  @Get()
  async list(@Req() req: AuthedReq, @Param('nucId') nucId: string) {
    const userId = this.getUserId(req);
    return this.svc.list(userId, nucId);
  }

  @Post()
  async create(
    @Req() req: AuthedReq,
    @Param('nucId') nucId: string,
    @Body() dto: CreateIntegrationDto,
  ) {
    const userId = this.getUserId(req);
    return this.svc.create(userId, nucId, dto as any);
  }

  @Patch(':integrationId')
  async update(
    @Req() req: AuthedReq,
    @Param('nucId') nucId: string,
    @Param('integrationId') integrationId: string,
    @Body() dto: UpdateIntegrationDto,
  ) {
    const userId = this.getUserId(req);
    return this.svc.update(userId, nucId, integrationId, dto as any);
  }

  @Delete(':integrationId')
  async remove(
    @Req() req: AuthedReq,
    @Param('nucId') nucId: string,
    @Param('integrationId') integrationId: string,
  ) {
    const userId = this.getUserId(req);
    return this.svc.remove(userId, nucId, integrationId);
  }

  @Post(':integrationId/apply')
  async apply(
    @Req() req: AuthedReq,
    @Param('nucId') nucId: string,
    @Param('integrationId') integrationId: string,
  ) {
    const userId = this.getUserId(req);
    return this.svc.apply(userId, nucId, integrationId);
  }
}

// ---- Agent-facing controller (uses AgentJwtGuard) ----
@UseGuards(AgentJwtGuard)
@Controller('nucs/:nucId/integrations/agent')
export class IntegrationsAgentController {
  constructor(private readonly svc: IntegrationsService) {}

  @Get()
  async listForAgent(@Req() req: any, @Param('nucId') nucId: string) {
    const sub = req?.user?.sub;
    if (!sub || sub !== nucId) {
      throw new ForbiddenException('Token do agente não corresponde ao NUC solicitado');
      }
    return this.svc.listForAgent(nucId);
  }

  @Post(':integrationId/status')
  async reportStatus(
    @Req() req: any,
    @Param('nucId') nucId: string,
    @Param('integrationId') integrationId: string,
    @Body() body: { status: 'RUNNING' | 'ERROR'; lastError?: string | null },
  ) {
    const sub = req?.user?.sub;
    if (!sub || sub !== nucId) {
      throw new ForbiddenException('Token do agente não corresponde ao NUC solicitado');
    }
    return this.svc.agentReportStatus(
      nucId,
      integrationId,
      body.status as any,
      body?.lastError ?? null
    );
  }
}
