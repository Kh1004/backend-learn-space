import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateSettingDto } from './update-setting.dto';

export class SettingKeyValuePair {
  @ApiProperty({ example: 'site.name' })
  @IsArray()
  key: string;

  @ApiProperty({ example: 'Education Platform' })
  @ValidateNested()
  @Type(() => UpdateSettingDto)
  value: UpdateSettingDto;
}

export class BulkUpdateSettingDto {
  @ApiProperty({ type: [SettingKeyValuePair] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingKeyValuePair)
  settings: SettingKeyValuePair[];
}
