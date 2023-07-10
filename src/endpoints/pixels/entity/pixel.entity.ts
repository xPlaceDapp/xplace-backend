import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'
import { EnumValue } from '@multiversx/sdk-core/out'
import { VmQueryService } from '../../../common/contracts/vm.query.service'

export enum PixelColor {
  Red = 'Red',
  Blue = 'Blue',
  Yellow = 'Yellow',
  Purple = 'Purple',
  White = 'White',
  Black = 'Black',
}

export function getHexColorFromPixelColorEnum(pixel: PixelColor): string {
  switch (pixel) {
    case PixelColor.Red:
      return '#ff0000'
    case PixelColor.Blue:
      return '#0000ff'
    case PixelColor.Yellow:
      return '#ffff00'
    case PixelColor.Purple:
      return '#ff00ff'
    case PixelColor.White:
      return '#ffffff'
    case PixelColor.Black:
      return '#000000'
    default:
      return '#ffffff'
  }
}

export function getDiscriminantFromPixelColorEnum(pixel: PixelColor): number {
  const abi = VmQueryService.getContractAbi()
  const PixelColorEnum = abi.getEnum('PixelColor')
  const enumValue = EnumValue.fromName(PixelColorEnum, pixel)

  return enumValue.discriminant
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
