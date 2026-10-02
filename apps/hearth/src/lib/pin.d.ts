declare module "./pin.mjs" {
  export function hashPin(pin: string): string;
  export function verifyPin(pin: string, stored: string | null): boolean;
  export function isValidPin(pin: string): boolean;
}
