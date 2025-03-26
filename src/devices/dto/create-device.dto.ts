import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { DeviceStatus } from '../infrastructure/persistence/relational/entities/device.entity';

export class CreateDeviceDto {
  @ApiProperty({ example: 'Smart Sensor', description: 'Device name' })
  @IsString()
  name: string;

  @ApiProperty({
    example: DeviceStatus.OFFLINE,
    description: 'Device status',
    enum: DeviceStatus,
  })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @ApiProperty({
    example: '10.7769,106.7009',
    description: 'Latitude, Longitude',
  })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({
    example: '1',
    description: 'Humi',
  })
  @IsOptional()
  @IsNumber()
  humi?: number;

  @ApiProperty({
    example: '1',
    description: 'Temp',
  })
  @IsOptional()
  @IsNumber()
  temp?: number;

  @ApiProperty({
    example: '1',
    description: 'lux',
  })
  @IsOptional()
  @IsNumber()
  lux?: number;

  @ApiProperty({
    example: '1',
    description: 'temp range',
  })
  @IsOptional()
  @IsNumber()
  tempRange?: number;

  @ApiProperty({
    example: '1',
    description: 'mosfet speed',
  })
  @IsOptional()
  @IsNumber()
  mosfetSpeed?: number;

  @ApiProperty({
    example: '1',
    description: 'auto control',
  })
  @IsOptional()
  @IsBoolean()
  autoControl?: boolean;
}
