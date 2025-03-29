import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert,
} from 'typeorm';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import * as crypto from 'crypto';
import { Exclude } from 'class-transformer';
import bcrypt from 'bcryptjs';

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

@Entity({ name: 'device' })
export class DeviceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ nullable: false })
  user_id: number;

  @Column({ nullable: true })
  name?: string;

  @Column({
    type: 'enum',
    enum: DeviceStatus,
    default: DeviceStatus.OFFLINE,
  })
  status: DeviceStatus;

  @Column({ type: 'float', nullable: true })
  temp?: number;

  @Column({ type: 'float', nullable: true })
  lux?: number;

  @Column({ type: 'float', nullable: true })
  humi?: number;

  @Column({ type: 'boolean', default: false })
  btn1: boolean;

  @Column({ type: 'boolean', default: false })
  btn2: boolean;

  @Column({ type: 'boolean', default: false })
  btn3: boolean;

  @Column({ type: 'boolean', default: false })
  btn4: boolean;

  @Column({ type: 'point', nullable: true })
  @Index()
  position?: string;

  @Column({ type: 'float', nullable: true })
  tempRange?: number;

  @Column({ type: 'float', nullable: true })
  humiRange?: number;

  @Column({ type: 'float', nullable: true })
  luxRange?: number;

  @Column({ type: 'float', nullable: true })
  mosfetSpeed?: number;

  @Column({ type: 'boolean', nullable: true })
  autoControl?: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastUpdate: Date;

  @Column({ type: 'boolean', default: false })
  @Exclude()
  is_admin: boolean;

  @Column({ type: 'varchar', unique: true })
  @Exclude()
  device_key: string;

  @Column({ type: 'varchar', nullable: false })
  @Exclude()
  device_pass: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @BeforeInsert()
  async generateKeys() {
    this.device_pass = await bcrypt.hash(
      this.device_pass ??
        crypto.createHash('md5').update(Math.random().toString()).digest('hex'),
      10,
    );
  }
}
