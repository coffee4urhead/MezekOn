import { LayoutWithNowPlaying } from '@/components/LayoutWithNowPlaying';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return <LayoutWithNowPlaying />;
}