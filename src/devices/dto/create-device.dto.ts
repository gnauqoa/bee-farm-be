import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsArray, IsEnum } from 'class-validator';
import { DeviceStatus } from '../infrastructure/persistence/relational/entities/device.entity';

class VirtualPin {
  @ApiProperty({ example: 'virtual_1' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Virtual 1' })
  @IsString()
  name: string;

  @ApiProperty({ example: 25 })
  value: any;

  @ApiProperty({ example: 'sensor' })
  @IsString()
  type: string;
}

export class CreateDeviceDto {
  @ApiProperty({ example: 'Smart Sensor', description: 'Device name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 3, description: 'Number of virtual pins' })
  @IsInt()
  virtualPinCount: number;

  @ApiProperty({
    type: [VirtualPin],
    description: 'Array of virtual pins',
    example: [
      { id: 'virtual_1', name: 'Virtual 1', value: 25, type: 'number' },
      { id: 'virtual_2', name: 'Virtual 2', value: 60, type: 'number' },
    ],
  })
  @IsArray()
  virtualPin: VirtualPin[];

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
}
