import { PartialType } from '@nestjs/swagger';
import { CreateDeviceDto } from './create-device.dto';

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {}
export class UpdateDeviceSensorDto {
  id: number;
  humi?: number;
  temp?: number;
  lux?: number;
  btn1?: boolean;
  btn2?: boolean;
  btn3?: boolean;
  btn4?: boolean;
}
export class UpdateDevicePinDto {
  id: number;
  btn1: boolean;
  btn2: boolean;
  btn3: boolean;
  btn4: boolean;
}
