import type { ImageSourcePropType } from 'react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ActionCardProps {
    cardTitle: string;
    cardInfo: string;
    cardLogo: ImageSourcePropType;
}

export default function ModActionCard({ cardTitle, cardInfo, cardLogo }: ActionCardProps) {
    return (
        <TouchableOpacity style={styles.card}>
            <View style={styles.cardTopRow}>
                <Text style={styles.cardInfo}>{cardInfo}</Text>
                <Image source={cardLogo} style={styles.cardLogo} />
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
                {cardTitle}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '48%',
        backgroundColor: '#e8f1fb',
        borderWidth: 1,
        borderColor: '#c9dff5',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 6,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    cardInfo: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1a3a6b',
        lineHeight: 30,
    },
    cardLogo: {
        width: 22,
        height: 22,
        resizeMode: 'contain',
        tintColor: '#1a3a6b',   
    },
    cardTitle: {
        fontSize: 12,
        color: '#3a4b63',
        lineHeight: 16,
    },
});