import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  CategoryDeleteResponseDto,
  CategoryListResponseDto,
  CategoryResponseDto,
} from './dto/category-response.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Product Categories')
@ApiExtraModels(CategoryListResponseDto, CategoryResponseDto, CategoryDeleteResponseDto)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les categories',
    description:
      'Retourne une liste paginee des categories avec recherche textuelle sur le nom/la description, filtre par statut et nombre de produits rattaches.',
  })
  @ApiOkResponse({
    description: 'Liste paginee des categories avec nombre de produits rattaches.',
    content: {
      'application/json': {
        example: {
          data: [
            {
              id: '0f7e3d8b-6c42-4d8f-bf75-6ac1c2fd7e2e',
              name: 'Boissons',
              description: 'Produits liquides vendus a l unite ou par carton.',
              status: 'ACTIVE',
              createdAt: '2026-05-15T10:30:00.000Z',
              updatedAt: '2026-05-15T10:30:00.000Z',
              productCount: 12,
            },
            {
              id: '8a30775d-c664-4972-96bc-89c259f4b863',
              name: 'Conserves',
              description: 'Produits alimentaires emballes longue conservation.',
              status: 'INACTIVE',
              createdAt: '2026-05-12T08:15:00.000Z',
              updatedAt: '2026-05-14T16:20:00.000Z',
              productCount: 4,
            },
          ],
          meta: {
            page: 1,
            limit: 20,
            total: 2,
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Parametres de recherche invalides.',
    content: {
      'application/json': {
        example: {
          message: ['limit must not be greater than 100'],
          error: 'Bad Request',
          statusCode: 400,
          timestamp: '2026-05-15T11:15:00.000Z',
          path: '/api/v1/categories?limit=200',
        },
      },
    },
  })
  findAll(@Query() query: ListCategoriesQueryDto) {
    return this.categoriesService.findAll(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Creer une categorie',
    description: 'Cree une nouvelle categorie avec son nom, son statut et sa description optionnelle.',
  })
  @ApiBody({
    description: 'Payload de creation de categorie.',
    type: CreateCategoryDto,
    examples: {
      activeCategory: {
        summary: 'Categorie active',
        value: {
          name: 'Boissons',
          description: 'Produits liquides vendus a l unite ou par carton.',
          status: 'ACTIVE',
        },
      },
      inactiveCategory: {
        summary: 'Categorie inactive',
        value: {
          name: 'Archives',
          description: 'Anciennes references conservees pour historique.',
          status: 'INACTIVE',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Categorie creee avec succes.',
    content: {
      'application/json': {
        example: {
          data: {
            id: '0f7e3d8b-6c42-4d8f-bf75-6ac1c2fd7e2e',
            name: 'Boissons',
            description: 'Produits liquides vendus a l unite ou par carton.',
            status: 'ACTIVE',
            createdAt: '2026-05-15T10:30:00.000Z',
            updatedAt: '2026-05-15T10:30:00.000Z',
            productCount: 0,
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Payload invalide.',
    content: {
      'application/json': {
        example: {
          message: ['name should not be empty'],
          error: 'Bad Request',
          statusCode: 400,
          timestamp: '2026-05-15T11:20:00.000Z',
          path: '/api/v1/categories',
        },
      },
    },
  })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Recuperer une categorie',
    description: 'Retourne le detail d une categorie ainsi que le nombre de produits qui lui sont rattaches.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant UUID de la categorie' })
  @ApiOkResponse({
    description: 'Detail de la categorie.',
    content: {
      'application/json': {
        example: {
          data: {
            id: '0f7e3d8b-6c42-4d8f-bf75-6ac1c2fd7e2e',
            name: 'Boissons',
            description: 'Produits liquides vendus a l unite ou par carton.',
            status: 'ACTIVE',
            createdAt: '2026-05-15T10:30:00.000Z',
            updatedAt: '2026-05-15T10:30:00.000Z',
            productCount: 12,
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Categorie introuvable.',
    content: {
      'application/json': {
        example: {
          message: 'Category not found',
          error: 'Not Found',
          statusCode: 404,
          timestamp: '2026-05-15T11:25:00.000Z',
          path: '/api/v1/categories/0f7e3d8b-6c42-4d8f-bf75-6ac1c2fd7e2e',
        },
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre a jour une categorie',
    description: 'Met a jour partiellement le nom, le statut ou la description d une categorie existante.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant UUID de la categorie' })
  @ApiBody({
    description: 'Payload partiel de mise a jour de categorie.',
    type: UpdateCategoryDto,
    examples: {
      renameAndDeactivate: {
        summary: 'Renommer et desactiver',
        value: {
          name: 'Boissons fraiches',
          status: 'INACTIVE',
          description: 'Categorie temporairement desactivee pour revision.',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Categorie mise a jour.',
    content: {
      'application/json': {
        example: {
          data: {
            id: '0f7e3d8b-6c42-4d8f-bf75-6ac1c2fd7e2e',
            name: 'Boissons fraiches',
            description: 'Categorie temporairement desactivee pour revision.',
            status: 'INACTIVE',
            createdAt: '2026-05-15T10:30:00.000Z',
            updatedAt: '2026-05-15T12:05:00.000Z',
            productCount: 12,
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Payload invalide.',
    content: {
      'application/json': {
        example: {
          message: ['status must be one of the following values: ACTIVE, INACTIVE'],
          error: 'Bad Request',
          statusCode: 400,
          timestamp: '2026-05-15T12:10:00.000Z',
          path: '/api/v1/categories/0f7e3d8b-6c42-4d8f-bf75-6ac1c2fd7e2e',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Categorie introuvable.',
    content: {
      'application/json': {
        example: {
          message: 'Category not found',
          error: 'Not Found',
          statusCode: 404,
          timestamp: '2026-05-15T12:12:00.000Z',
          path: '/api/v1/categories/0f7e3d8b-6c42-4d8f-bf75-6ac1c2fd7e2e',
        },
      },
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une categorie',
    description: 'Supprime une categorie uniquement si aucun produit ne lui est rattache.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant UUID de la categorie' })
  @ApiOkResponse({
    description: 'Categorie supprimee.',
    content: {
      'application/json': {
        example: {
          data: {
            id: '0f7e3d8b-6c42-4d8f-bf75-6ac1c2fd7e2e',
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Categorie liee a des produits.',
    content: {
      'application/json': {
        example: {
          message: 'Category cannot be deleted while products are attached',
          error: 'Bad Request',
          statusCode: 400,
          timestamp: '2026-05-15T12:15:00.000Z',
          path: '/api/v1/categories/0f7e3d8b-6c42-4d8f-bf75-6ac1c2fd7e2e',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Categorie introuvable.',
    content: {
      'application/json': {
        example: {
          message: 'Category not found',
          error: 'Not Found',
          statusCode: 404,
          timestamp: '2026-05-15T12:16:00.000Z',
          path: '/api/v1/categories/0f7e3d8b-6c42-4d8f-bf75-6ac1c2fd7e2e',
        },
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}