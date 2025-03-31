import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateDeviceDto } from './create-device.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {
  @ApiProperty({
    example: '1',
    description: 'User id',
  })
  @IsNumber()
  @IsOptional()
  user_id?: number;
}
export class UpdateDevicePinDto {
  id: number;
  btn1?: boolean;
  btn2?: boolean;
  btn3?: boolean;
  btn4?: boolean;
  tempRange?: number;
  humiRange?: number;
  luxRange?: number;
  mosfetSpeed?: number;
  autoControl?: boolean;
}
export class UpdateDeviceSensorDto extends UpdateDevicePinDto {
  id: number;
  humi?: number;
  temp?: number;
  lux?: number;
}
