declare module 'jsqr' {
  export interface QRCode {
    binaryData: number[]
    data: string
    chunks: Array<{
      type: string
      bytes: number[]
      text?: string
    }>
    location: {
      topRightCorner: { x: number; y: number }
      topLeftCorner: { x: number; y: number }
      bottomRightCorner: { x: number; y: number }
      bottomLeftCorner: { x: number; y: number }
      topRightFinderPattern: { x: number; y: number }
      topLeftFinderPattern: { x: number; y: number }
      bottomLeftFinderPattern: { x: number; y: number }
    }
  }

  export interface Options {
    inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst'
  }

  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    providedOptions?: Options
  ): QRCode | null
}
