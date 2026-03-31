import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  OpenFinanceApiService,
  TicketFlowResponse,
} from '../services/open-finance-api.service';
import { environment } from '../../environments/environment';
import {
  TicketFlowEvent,
  TicketFlowState,
  toTicketFlowState,
} from '../services/open-finance-flow.models';
import { OpenFinanceTicketService } from '../services/open-finance-ticket.service';
import {
  OpenFinanceApiMessage,
  JsonRecord,
  OpenFinanceApiContext,
  OpenFinanceTicketActivity,
  OpenFinanceTicketAttachment,
  OpenFinanceTicketAssignment,
  OpenFinanceTicketDescription,
  OpenFinanceTicketAnalysis,
  OpenFinanceTicketCategory,
  OpenFinanceTicketCore,
  OpenFinanceTicketDetail,
  OpenFinanceTicketLifecycle,
  OpenFinanceTicketNote,
  OpenFinanceTicketRawField,
  OpenFinanceTicketRouting,
  OpenFinanceTicketSla,
  OpenFinanceTicketSolution,
  OpenFinanceTicketTimestamps,
} from '../services/open-finance-ticket.models';
import { OWNER_TITLES } from '../ticket-owners';

@Component({
  selector: 'app-ticket-detail-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ticket-detail-page.component.html',
  styleUrl: './ticket-detail-page.component.css',
})
export class TicketDetailPageComponent implements OnInit {
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly openFinanceApi = inject(OpenFinanceApiService);
  private readonly ticketService = inject(OpenFinanceTicketService);

  protected isLoading = true;
  protected errorMessage = '';
  protected ticket: OpenFinanceTicketDetail | null = null;
  protected flow: TicketFlowResponse | null = null;
  protected isSubmittingFlow = false;
  protected flowErrorMessage = '';
  protected flowSuccessMessage = '';
  protected flowNote = '';
  protected isRouteFormVisible = false;
  protected selectedRouteOwnerSlug = '';
  protected isFlowHistoryVisible = false;

  async ngOnInit(): Promise<void> {
    const ticketId = this.route.snapshot.paramMap.get('ticketId');

    if (!ticketId) {
      this.errorMessage = 'Ticket não informado.';
      this.isLoading = false;
      return;
    }

    try {
      const [ticket, flow] = await Promise.all([
        this.openFinanceApi.getTicketById(ticketId),
        this.openFinanceApi.getTicketFlow(ticketId),
      ]);

      this.ticket = ticket;
      this.flow = flow;
      this.selectedRouteOwnerSlug = this.getDefaultRouteOwnerSlug();
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.errorMessage =
          'Nao foi possivel renovar a sessao automaticamente na integracao Open Finance.';
      } else if (error instanceof HttpErrorResponse) {
        this.errorMessage = `Falha ao carregar ticket (${error.status}).`;
      } else {
        this.errorMessage =
          error instanceof Error ? error.message : 'Não foi possível carregar o ticket.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  protected arrayItems(value: unknown): JsonRecord[] {
    return Array.isArray(value) ? (value as JsonRecord[]) : [];
  }

  protected apiContext(): OpenFinanceApiContext {
    return (this.ticket?.api_context as OpenFinanceApiContext | undefined) ?? {};
  }

  protected apiRequest(): OpenFinanceApiMessage {
    return this.apiContext().request ?? {};
  }

  protected apiResponse(): OpenFinanceApiMessage {
    return this.apiContext().response ?? {};
  }

  protected ticketPayload(): OpenFinanceTicketCore {
    return this.ticket?.ticket ?? {};
  }

  protected routingPayload(): OpenFinanceTicketRouting {
    return this.ticket?.routing ?? {};
  }

  protected routedOwnerName(): string {
    const flowState = this.currentFlowState();
    if (flowState?.current_owner_name) {
      return flowState.current_owner_name;
    }

    const value = this.routingPayload().owner_name;
    return typeof value === 'string' && value.trim() ? value : 'Nao informado';
  }

  protected ticketCategory(): OpenFinanceTicketCategory {
    return this.ticketPayload().category ?? {};
  }

  protected slaPayload(): OpenFinanceTicketSla {
    return (this.ticket?.sla as OpenFinanceTicketSla | undefined) ?? {};
  }

  protected assignmentPayload(): OpenFinanceTicketAssignment {
    return (this.ticket?.assignment as OpenFinanceTicketAssignment | undefined) ?? {};
  }

  protected analysisPayload(): OpenFinanceTicketAnalysis {
    return (this.ticket?.analysis as OpenFinanceTicketAnalysis | undefined) ?? {};
  }

  protected solutionPayload(): OpenFinanceTicketSolution {
    return (this.ticket?.solution as OpenFinanceTicketSolution | undefined) ?? {};
  }

  protected timestampsPayload(): OpenFinanceTicketTimestamps {
    return (this.ticket?.timestamps as OpenFinanceTicketTimestamps | undefined) ?? {};
  }

  protected lifecyclePayload(): OpenFinanceTicketLifecycle {
    return (this.ticket?.lifecycle as OpenFinanceTicketLifecycle | undefined) ?? {};
  }

  protected notesPayload(): OpenFinanceTicketNote[] {
    return Array.isArray(this.ticket?.notes)
      ? (this.ticket?.notes as OpenFinanceTicketNote[])
      : [];
  }

  protected activitiesPayload(): OpenFinanceTicketActivity[] {
    return Array.isArray(this.ticket?.activities)
      ? (this.ticket?.activities as OpenFinanceTicketActivity[])
      : [];
  }

  protected attachmentsPayload(): OpenFinanceTicketAttachment[] {
    return Array.isArray(this.ticket?.attachments)
      ? (this.ticket?.attachments as OpenFinanceTicketAttachment[])
      : [];
  }

  protected attachmentName(attachment: OpenFinanceTicketAttachment): string {
    return this.formatValue(attachment.file_name ?? attachment.name ?? attachment.real_file_name);
  }

  protected attachmentTrackKey(attachment: OpenFinanceTicketAttachment, index: number): string {
    return String(attachment.file_id ?? attachment.id ?? index);
  }

  protected attachmentDownloadUrl(attachment: OpenFinanceTicketAttachment): string | null {
    const ticketId = attachment.ticket_id;
    const fileId = attachment.file_id;

    if (
      (typeof ticketId === 'string' || typeof ticketId === 'number') &&
      (typeof fileId === 'string' || typeof fileId === 'number')
    ) {
      return `${environment.apiBaseUrl}/tickets/${encodeURIComponent(String(ticketId))}/attachments/${encodeURIComponent(String(fileId))}/download`;
    }

    const downloadUrl = attachment.download_url;
    return typeof downloadUrl === 'string' && downloadUrl.trim() ? downloadUrl.trim() : null;
  }

  protected rawFieldsPayload(): OpenFinanceTicketRawField[] {
    return Array.isArray(this.ticket?.raw_fields)
      ? (this.ticket?.raw_fields as OpenFinanceTicketRawField[])
      : [];
  }

  protected ticketDescription(): OpenFinanceTicketDescription {
    return this.ticketPayload().description ?? {};
  }

  protected formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return 'Nao informado';
    }

    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Nao';
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }

    return String(value);
  }

  protected goBack(): void {
    this.location.back();
  }

  protected currentFlowState(): TicketFlowState | null {
    return this.flow?.state ?? toTicketFlowState(this.ticket?.flow);
  }

  protected flowEvents(): TicketFlowEvent[] {
    return this.flow?.events ?? [];
  }

  protected toggleFlowHistory(): void {
    this.isFlowHistoryVisible = !this.isFlowHistoryVisible;
  }

  protected flowStageLabel(label: string | null | undefined): string {
    return label || 'Fluxo pendente';
  }

  protected flowActionLabel(label: string | null | undefined): string {
    return label || 'Atualização';
  }

  protected ownerContextSlug(): string {
    return this.route.snapshot.queryParamMap.get('ownerSlug') ?? '';
  }

  protected ownerContextTitle(): string {
    const slug = this.ownerContextSlug();
    return OWNER_TITLES[slug] ?? 'Área atual';
  }

  protected canRouteToOwner(): boolean {
    const flowState = this.currentFlowState();
    const ownerSlug = this.ownerContextSlug();

    return Boolean(
      ownerSlug === 'su-super-usuarios' &&
        flowState &&
        (flowState.current_stage === 'triage_su' || flowState.current_stage === 'returned_to_su')
    );
  }

  protected routeOwnerOptions(): Array<{ slug: string; title: string }> {
    const currentOwnerSlug = this.currentFlowState()?.current_owner_slug ?? '';

    return Object.entries(OWNER_TITLES)
      .filter(([slug]) => slug !== 'su-super-usuarios' && slug !== currentOwnerSlug)
      .map(([slug, title]) => ({ slug, title }));
  }

  protected showRouteForm(): void {
    this.isRouteFormVisible = true;
    if (!this.selectedRouteOwnerSlug) {
      this.selectedRouteOwnerSlug = this.getDefaultRouteOwnerSlug();
    }
    this.flowErrorMessage = '';
    this.flowSuccessMessage = '';
  }

  protected hideRouteForm(): void {
    this.isRouteFormVisible = false;
  }

  protected canAccept(): boolean {
    const flowState = this.currentFlowState();
    const ownerSlug = this.ownerContextSlug();

    return Boolean(
      ownerSlug &&
        flowState &&
        flowState.current_owner_slug === ownerSlug &&
        flowState.current_stage === 'routed_to_owner'
    );
  }

  protected canRespond(): boolean {
    const flowState = this.currentFlowState();
    const ownerSlug = this.ownerContextSlug();

    return Boolean(
      ownerSlug &&
        flowState &&
        flowState.current_owner_slug === ownerSlug &&
        flowState.current_stage === 'accepted_by_owner'
    );
  }

  protected canReturnToSu(): boolean {
    return this.canRespond();
  }

  protected canReject(): boolean {
    const flowState = this.currentFlowState();
    const ownerSlug = this.ownerContextSlug();

    return Boolean(
      ownerSlug &&
        flowState &&
        flowState.current_owner_slug === ownerSlug &&
        (flowState.current_stage === 'routed_to_owner' ||
          flowState.current_stage === 'accepted_by_owner')
    );
  }

  protected async routeToResponsibleOwner(): Promise<void> {
    const ticketId = this.route.snapshot.paramMap.get('ticketId');
    const targetOwnerSlug = this.selectedRouteOwnerSlug.trim();
    const targetOwnerName = OWNER_TITLES[targetOwnerSlug] ?? '';

    if (!ticketId || !targetOwnerSlug || !targetOwnerName) {
      this.flowErrorMessage = 'Selecione a equipe responsavel antes de direcionar o ticket.';
      return;
    }

    await this.submitFlowTransition(ticketId, {
      action: 'route_to_owner',
      note: this.flowNote.trim() || undefined,
      targetOwnerSlug,
      targetOwnerName,
      ticketTitle: this.ticketTitle(),
      ticketStatus: this.ticketStatus(),
    });
  }

  protected async acceptTicket(): Promise<void> {
    const ticketId = this.route.snapshot.paramMap.get('ticketId');
    if (!ticketId) {
      return;
    }

    await this.submitFlowTransition(ticketId, {
      action: 'accept',
      note: this.flowNote.trim() || undefined,
      ticketTitle: this.ticketTitle(),
      ticketStatus: this.ticketStatus(),
    });
  }

  protected async respondTicket(): Promise<void> {
    const ticketId = this.route.snapshot.paramMap.get('ticketId');
    if (!ticketId) {
      return;
    }

    await this.submitFlowTransition(ticketId, {
      action: 'respond',
      note: this.flowNote.trim() || undefined,
      ticketTitle: this.ticketTitle(),
      ticketStatus: this.ticketStatus(),
    });
  }

  protected async returnTicketToSu(): Promise<void> {
    const ticketId = this.route.snapshot.paramMap.get('ticketId');
    if (!ticketId) {
      return;
    }

    await this.submitFlowTransition(ticketId, {
      action: 'return_to_su',
      note: this.flowNote.trim() || undefined,
      ticketTitle: this.ticketTitle(),
      ticketStatus: this.ticketStatus(),
    });
  }

  protected async rejectTicket(): Promise<void> {
    const ticketId = this.route.snapshot.paramMap.get('ticketId');
    if (!ticketId) {
      return;
    }

    await this.submitFlowTransition(ticketId, {
      action: 'reject',
      note: this.flowNote.trim() || undefined,
      ticketTitle: this.ticketTitle(),
      ticketStatus: this.ticketStatus(),
    });
  }

  private routingOwnerSlug(): string {
    const value = this.routingPayload().owner_slug;
    return typeof value === 'string' ? value : '';
  }

  private getDefaultRouteOwnerSlug(): string {
    const routingOwnerSlug = this.routingOwnerSlug();
    return routingOwnerSlug === 'su-super-usuarios' ? '' : routingOwnerSlug;
  }

  private routingOwnerName(): string {
    const value = this.routingPayload().owner_name;
    return typeof value === 'string' ? value : '';
  }

  private ticketTitle(): string | undefined {
    const value = this.ticketPayload().title;
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private ticketStatus(): string | undefined {
    const value = this.ticketPayload().status;
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private async submitFlowTransition(
    ticketId: string,
    payload: Parameters<OpenFinanceApiService['transitionTicketFlow']>[1]
  ): Promise<void> {
    this.isSubmittingFlow = true;
    this.flowErrorMessage = '';
    this.flowSuccessMessage = '';

    try {
      this.flow = await this.openFinanceApi.transitionTicketFlow(ticketId, payload);
      this.flowSuccessMessage = 'Fluxo atualizado com sucesso.';
      this.flowNote = '';
      this.isRouteFormVisible = false;
      this.ticketService.clearCache();
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.flowErrorMessage = `Falha ao atualizar fluxo (${error.status}).`;
      } else {
        this.flowErrorMessage =
          error instanceof Error ? error.message : 'Nao foi possivel atualizar o fluxo.';
      }
    } finally {
      this.isSubmittingFlow = false;
    }
  }
}
