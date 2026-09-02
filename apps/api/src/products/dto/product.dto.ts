import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from "class-validator";

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  description!: string;

  @ApiProperty()
  @IsString()
  brand!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  price!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  compareAt?: number;

  @ApiPropertyOptional({ example: "42" })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: "Futebol" })
  @IsOptional()
  @IsString()
  sport?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
