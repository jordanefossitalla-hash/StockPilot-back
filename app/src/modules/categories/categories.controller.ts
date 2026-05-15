import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les categories',
    description:
      'Retourne les categories avec pagination, recherche textuelle et nombre de produits rattaches.',
  })
  @ApiOkResponse({ description: 'Liste paginee des categories.' })
  @ApiBadRequestResponse({ description: 'Parametres de recherche invalides.' })
  findAll(@Query() query: ListCategoriesQueryDto) {
    return this.categoriesService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Creer une categorie' })
  @ApiCreatedResponse({ description: 'Categorie creee avec succes.' })
  @ApiBadRequestResponse({ description: 'Payload invalide.' })
  @ApiConflictResponse({ description: 'Une categorie avec ce nom existe deja.' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Recuperer une categorie' })
  @ApiParam({ name: 'id', description: 'Identifiant UUID de la categorie' })
  @ApiOkResponse({ description: 'Detail de la categorie.' })
  @ApiNotFoundResponse({ description: 'Categorie introuvable.' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre a jour une categorie' })
  @ApiParam({ name: 'id', description: 'Identifiant UUID de la categorie' })
  @ApiOkResponse({ description: 'Categorie mise a jour.' })
  @ApiBadRequestResponse({ description: 'Payload invalide.' })
  @ApiNotFoundResponse({ description: 'Categorie introuvable.' })
  @ApiConflictResponse({ description: 'Une categorie avec ce nom existe deja.' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une categorie' })
  @ApiParam({ name: 'id', description: 'Identifiant UUID de la categorie' })
  @ApiOkResponse({ description: 'Categorie supprimee.' })
  @ApiBadRequestResponse({
    description: 'Suppression refusee si des produits sont encore rattaches a la categorie.',
  })
  @ApiNotFoundResponse({ description: 'Categorie introuvable.' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}