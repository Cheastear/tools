import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateShortLinkDto {
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  originalUrl!: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'code may only contain letters, numbers, hyphens and underscores',
  })
  code?: string;
}
