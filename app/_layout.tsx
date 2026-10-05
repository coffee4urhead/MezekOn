import { LayoutWithNowPlaying } from '@/components/LayoutWithNowPlaying';
import { Provider } from 'react-redux';
import { store } from '../constants/store/index';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (<>
  <Provider store={store}>
    <LayoutWithNowPlaying />
  </Provider>
  </>);
}