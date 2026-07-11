declare module 'react-native-pdf-view' {
  import { Component } from 'react';
    import { ViewStyle } from 'react-native';

  export interface PDFViewProps {
    src: string;
    style?: ViewStyle;
    page?: number;
    fitPolicy?: number;
    spacing?: number;
    showsHorizontalScrollIndicator?: boolean;
    showsVerticalScrollIndicator?: boolean;
    onLoadComplete?: () => void;
    onPageChanged?: (page: number, total: number) => void;
    onError?: (error: any) => void;
  }

  export default class PDFView extends Component<PDFViewProps> {
    setPage(page: number): void;
  }
}