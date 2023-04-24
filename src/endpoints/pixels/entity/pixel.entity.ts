import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'

@Entity()
export class PixelEntity {
  @ApiProperty({
    type: Number,
    example: 1
  })
  @PrimaryGeneratedColumn()
    id!: number

  @ApiProperty({
    type: Number,
    example: 145
  })
  @Column()
    x!: number

  @ApiProperty({
    type: Number,
    example: 145
  })
  @Column()
    y!: number
}
