import { ThemeContext } from '@/context/ThemeContext';
import { useContext } from 'react';

export function useColorScheme() {
    const { theme } = useContext(ThemeContext);
    return theme;
}

