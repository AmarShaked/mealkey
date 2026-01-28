declare module 'react-lottie' {
  import { Component } from 'react';

  export interface LottieOptions {
    loop?: boolean;
    autoplay?: boolean;
    animationData: any;
    rendererSettings?: {
      preserveAspectRatio?: string;
    };
  }

  export interface LottieProps {
    options: LottieOptions;
    height?: number;
    width?: number;
    isStopped?: boolean;
    isPaused?: boolean;
    isClickToPauseDisabled?: boolean;
  }

  export default class Lottie extends Component<LottieProps> {}
}

