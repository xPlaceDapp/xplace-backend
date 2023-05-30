import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

export enum PixelColor {
  Red = 'Red',
  Blue = 'Blue',
  Yellow = 'Yellow',
  Purple = 'Purple',
  White = 'White',
  Black = 'Black',
}

@Entity()
export class PixelEntity {
  @PrimaryGeneratedColumn()
    id!: number

  @Column()
    x!: number

  @Column()
    y!: number

  @Column()
    address!: string

  @Column()
    playedCount!: number

  @Column()
    color!: PixelColor
}
