import { useColorScheme } from 'react-native';
import { LightTheme, DarkTheme, AppTheme } from '../../constants/Colors';

/**
 * Returns the semantic color tokens for the current system color scheme.
 * Owner app screens import this instead of raw Colors.* for dark mode support.
 */
export function useTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkTheme : LightTheme;
}

export default useTheme;
