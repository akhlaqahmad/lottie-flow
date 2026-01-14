
export interface LottieMetadata {
  name: string;
  size: number;
  fr: number;
  ip: number;
  op: number;
  w: number;
  h: number;
  layers: number;
}

export interface AnimationSettings {
  loop: boolean;
  speed: number;
  backgroundColor: string;
  renderer: 'svg' | 'canvas' | 'html';
}
