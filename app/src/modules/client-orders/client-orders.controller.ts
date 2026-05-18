import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ClientOrdersService } from './client-orders.service';
import { ClientOrdersStatsQueryDto } from './dto/client-orders-stats-query.dto';
import { CreateClientOrderDto } from './dto/create-client-order.dto';
import { ListClientOrdersQueryDto } from './dto/list-client-orders-query.dto';
import { UpdateClientOrderDeliveryStatusDto } from './dto/update-client-order-delivery-status.dto';
import { UpdateClientOrderPriorityDto } from './dto/update-client-order-priority.dto';

@ApiTags('Client Orders')
@Controller('client-orders')
export class ClientOrdersController {
  constructor(private readonly clientOrdersService: ClientOrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les commandes clients',
    description:
      'Recupere la liste des commandes clients avec filtres (etat de livraison, priorite, client) et pagination.',
  })
  @ApiOkResponse({
    description: 'Liste paginee retournee avec succes.',
    example: {
      data: [
        {
          id: 'a6e51893-e2b2-47f7-bd5d-f8daf452758c',
          code: 'CLO-20260518094510-342',
          clientId: '8f1fce75-6bcc-4fba-a95c-b3a300e265fd',
          deliveryStatus: 'TO_DELIVER',
          priority: 'HIGH',
          orderedAt: '2026-05-18T09:45:10.000Z',
          deliveryDueAt: '2026-05-20T10:30:00.000Z',
          deliveredAt: null,
          note: 'Livrer avant midi.',
          client: {
            id: '8f1fce75-6bcc-4fba-a95c-b3a300e265fd',
            code: 'CL-1002',
            name: 'Agence Rivoli',
            phone: '+2250102030405',
          },
          sales: [],
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Parametres invalides.' })
  findAll(@Query() query: ListClientOrdersQueryDto) {
    return this.clientOrdersService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Compteurs du tableau de suivi',
    description:
      'Retourne les compteurs a afficher en tete de section: a livrer, livrees, priorite haute.',
  })
  @ApiQuery({
    name: 'clientId',
    required: false,
    description: 'Optionnel. Filtrer les stats pour un client precis.',
    example: '8f1fce75-6bcc-4fba-a95c-b3a300e265fd',
  })
  @ApiOkResponse({
    description: 'Compteurs retournes avec succes.',
    example: {
      data: {
        toDeliver: 2,
        delivered: 1,
        highPriority: 1,
      },
    },
  })
  stats(@Query() query: ClientOrdersStatsQueryDto) {
    return this.clientOrdersService.stats(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Enregistrer une commande client',
    description:
      'Cree une commande client a suivre jusqu a livraison. Utiliser la date de livraison prevue pour organiser les echeances.',
  })
  @ApiBody({
    type: CreateClientOrderDto,
    examples: {
      highPriority: {
        summary: 'Commande urgente',
        value: {
          clientId: '8f1fce75-6bcc-4fba-a95c-b3a300e265fd',
          orderedAt: '2026-05-18T09:00:00.000Z',
          deliveryDueAt: '2026-05-20T10:30:00.000Z',
          priority: 'HIGH',
          note: 'Commande urgente, confirmer a la reception.',
        },
      },
      normal: {
        summary: 'Commande standard',
        value: {
          clientId: 'ff7d5514-25d8-4261-b919-6fd98dbf4f61',
          deliveryDueAt: '2026-05-22T14:00:00.000Z',
          priority: 'NORMAL',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Commande client enregistree.',
    example: {
      data: {
        id: 'a6e51893-e2b2-47f7-bd5d-f8daf452758c',
        code: 'CLO-20260518094510-342',
        clientId: '8f1fce75-6bcc-4fba-a95c-b3a300e265fd',
        deliveryStatus: 'TO_DELIVER',
        priority: 'HIGH',
        orderedAt: '2026-05-18T09:00:00.000Z',
        deliveryDueAt: '2026-05-20T10:30:00.000Z',
        deliveredAt: null,
        note: 'Commande urgente, confirmer a la reception.',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Payload invalide.' })
  @ApiNotFoundResponse({ description: 'Client introuvable.' })
  create(@Body() dto: CreateClientOrderDto) {
    return this.clientOrdersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detail d une commande client',
    description: 'Retourne une commande avec son client et les ventes liees.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant UUID de la commande client.' })
  @ApiOkResponse({ description: 'Detail retourne.' })
  @ApiNotFoundResponse({ description: 'Commande client introuvable.' })
  findOne(@Param('id') id: string) {
    return this.clientOrdersService.findOne(id);
  }

  @Patch(':id/delivery-status')
  @ApiOperation({
    summary: 'Marquer livree ou remettre a livrer',
    description:
      'Permet de basculer manuellement le statut de livraison. DELIVERED renseigne deliveredAt, TO_DELIVER le remet a null.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant UUID de la commande client.' })
  @ApiBody({
    type: UpdateClientOrderDeliveryStatusDto,
    examples: {
      delivered: {
        summary: 'Marquer comme livree',
        value: { deliveryStatus: 'DELIVERED' },
      },
      toDeliver: {
        summary: 'Remettre a livrer',
        value: { deliveryStatus: 'TO_DELIVER' },
      },
    },
  })
  @ApiOkResponse({ description: 'Statut de livraison mis a jour.' })
  @ApiNotFoundResponse({ description: 'Commande client introuvable.' })
  updateDeliveryStatus(
    @Param('id') id: string,
    @Body() dto: UpdateClientOrderDeliveryStatusDto,
  ) {
    return this.clientOrdersService.updateDeliveryStatus(id, dto);
  }

  @Patch(':id/priority')
  @ApiOperation({
    summary: 'Changer la priorite',
    description: 'Met a jour la priorite de la commande client (LOW, NORMAL, HIGH).',
  })
  @ApiParam({ name: 'id', description: 'Identifiant UUID de la commande client.' })
  @ApiBody({
    type: UpdateClientOrderPriorityDto,
    examples: {
      high: {
        summary: 'Priorite haute',
        value: { priority: 'HIGH' },
      },
      normal: {
        summary: 'Priorite normale',
        value: { priority: 'NORMAL' },
      },
    },
  })
  @ApiOkResponse({ description: 'Priorite mise a jour.' })
  @ApiNotFoundResponse({ description: 'Commande client introuvable.' })
  updatePriority(@Param('id') id: string, @Body() dto: UpdateClientOrderPriorityDto) {
    return this.clientOrdersService.updatePriority(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une commande client',
    description: 'Supprime une commande du tableau de suivi.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant UUID de la commande client.' })
  @ApiOkResponse({ description: 'Commande client supprimee.', example: { data: { id: 'a6e51893-e2b2-47f7-bd5d-f8daf452758c' } } })
  @ApiNotFoundResponse({ description: 'Commande client introuvable.' })
  remove(@Param('id') id: string) {
    return this.clientOrdersService.remove(id);
  }
}
