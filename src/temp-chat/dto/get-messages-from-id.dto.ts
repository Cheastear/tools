import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMessagesFromIdDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  messageIdFrom?: number;
}
