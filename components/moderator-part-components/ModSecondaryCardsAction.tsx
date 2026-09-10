import { useTheme } from '@/context/ThemeContext';
import type { ImageSourcePropType } from 'react-native';
import { Image, StyleSheet, Text, View } from 'react-native';

interface SecondaryActionCardProps {
    cardCaption: string;
    info: string;
    timeHappened: string;
    icon: ImageSourcePropType;
}

export default function ModSecondaryCardsAction({
    cardCaption,
    info,
    timeHappened,
    icon
}: SecondaryActionCardProps) {
    const { isDark } = useTheme();

    return (
        <View style={[styles.card, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
            <View style={styles.iconWrapper}>
                <Image source={icon} style={styles.cardLogo} />
            </View>

            <View style={styles.textColumn}>
                <Text style={styles.cardCaption}>{cardCaption}</Text>
                <Text style={styles.cardInfo}>{info}</Text>
            </View>

            <Text style={styles.timeHappened}>{timeHappened}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#d6e4f5',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#dcebfb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardLogo: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
        tintColor: '#1a6bd6',
    },
    textColumn: {
        flex: 1,
        flexDirection: 'column',
        gap: 4,
    },
    cardCaption: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a3a6b',
    },
    cardInfo: {
        fontSize: 12,
        color: '#6b7f99',
    },
    timeHappened: {
        fontSize: 14,
        color: '#8aa0ba',
        padding: 12,
        alignSelf: 'flex-start',
    },
});