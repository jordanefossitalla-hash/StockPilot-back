import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiCreatedResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
	constructor(private readonly productsService: ProductsService) {}

	@Get()
	@ApiOperation({ summary: 'Lister les produits' })
	@ApiOkResponse({ description: 'Liste paginee des produits.' })
	@ApiBadRequestResponse({ description: 'Parametres de recherche invalides.' })
	findAll(@Query() query: ListProductsQueryDto) {
		return this.productsService.findAll(query);
	}

	@Post()
	@ApiOperation({ summary: 'Creer un produit' })
	@ApiBody({
		type: CreateProductDto,
		examples: {
			default: {
				summary: 'Produit vendable',
				value: {
					sku: 'SKU-RIZ-25KG',
					name: 'Sac riz 25kg',
					categoryId: 'd3b07384-d9a5-4f8d-a4d5-5f8db57f90ad',
					costPrice: 12500,
					salePrice: 14990,
					stockQuantity: 100,
					stockMinThreshold: 10,
					status: 'ACTIVE',
				},
			},
		},
	})
	@ApiCreatedResponse({ description: 'Produit cree avec succes.' })
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	create(@Body() dto: CreateProductDto) {
		return this.productsService.create(dto);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Recuperer un produit' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID du produit' })
	@ApiOkResponse({ description: 'Detail du produit.' })
	@ApiNotFoundResponse({ description: 'Produit introuvable.' })
	findOne(@Param('id') id: string) {
		return this.productsService.findOne(id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Mettre a jour un produit' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID du produit' })
	@ApiBody({
		type: UpdateProductDto,
		examples: {
			pricing: {
				summary: 'Maj tarifaire',
				value: {
					costPrice: 12900,
					salePrice: 15500,
					stockMinThreshold: 15,
				},
			},
		},
	})
	@ApiOkResponse({ description: 'Produit mis a jour.' })
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	@ApiNotFoundResponse({ description: 'Produit introuvable.' })
	update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
		return this.productsService.update(id, dto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Supprimer un produit' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID du produit' })
	@ApiOkResponse({ description: 'Produit supprime.' })
	@ApiNotFoundResponse({ description: 'Produit introuvable.' })
	remove(@Param('id') id: string) {
		return this.productsService.remove(id);
	}
}
