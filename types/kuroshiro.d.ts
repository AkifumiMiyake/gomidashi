declare module 'kuroshiro' {
  export type KuroshiroConvertOptions = {
    to?: 'hiragana' | 'katakana' | 'romaji';
    mode?: 'normal' | 'spaced' | 'okurigana';
  };

  export default class Kuroshiro {
    init(analyzer: unknown): Promise<void>;
    convert(input: string, options?: KuroshiroConvertOptions): Promise<string>;
  }
}
