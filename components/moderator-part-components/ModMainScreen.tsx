import { useTheme } from '@/context/ThemeContext';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ModActionCard from './ModActionCard';
import ModSecondaryCardsAction from './ModSecondaryCardsAction';

const actionCardsInfo = [
    {
        'card-title': 'Коментари за преглед',
        'card-info': '12',
        'card-logo': require('@/assets/icons/comment.png')
    },
    {
        'card-title': 'Аудио записи за преглед',
        'card-info': '5',
        'card-logo': require('@/assets/icons/audio-waves.png')
    },
    {
        'card-title': 'Документи (PDF) за преглед',
        'card-info': '3',
        'card-logo': require('@/assets/icons/file.png')
    },
    {
        'card-title': 'Сигнали от потребители',
        'card-info': '0',
        'card-logo': require('@/assets/icons/flag.png')
    }
]

const latestActionsCards = [
    {
        'card-caption': 'Нов коментар за преглед',
        'info': 'Това е много интересно!',
        'time-happened': '12',
        'icon': require('@/assets/icons/comment.png')
    },
    {
        'card-caption': 'Аудио запис за проверка',
        'info': 'Заглавие на един нов епизод',
        'time-happened': '28',
        'icon': require('@/assets/icons/audio-waves.png')
    },
    {
        'card-caption': 'PDF документ за преглед',
        'info': 'История на село мезек',
        'time-happened': '1',
        'icon': require('@/assets/icons/file.png')
    }
]

export default function ModMainScreen() {
    const { isDark } = useTheme();
    const mezekonLogo = require('@/assets/icons/logo.png');

    return (
        <ScrollView
            style={[styles.scrollCont, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.section}>
                <View style={styles.captionRow}>
                    <Image source={mezekonLogo} style={styles.captionImage} />
                    <Text style={styles.captionText}>MezekON</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.captionTextMain}>Модериране</Text>
                <Text style={styles.textMain}>
                    Прегледай и упражнявай съдържание, за да поддържаш безопасна и уважителна общност.
                </Text>
            </View>

            <View style={styles.cardsGrid}>
                {actionCardsInfo.map((card) => (
                    <ModActionCard
                        key={card['card-title']}
                        cardTitle={card['card-title']}
                        cardInfo={card['card-info']}
                        cardLogo={card['card-logo']}
                    />
                ))}
            </View>

            <View style={styles.spacedSection}>
                <Text style={styles.captionTextMain}>Последни дейности</Text>
                <TouchableOpacity>
                    <Text style={[styles.textMain, { color: '#0011ff' }]}>Виж всички</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                {latestActionsCards.map((card) => (
                    <ModSecondaryCardsAction
                        key={card['card-caption']}
                        cardCaption={card['card-caption']}
                        info={card['info']}
                        timeHappened={card['time-happened']}
                        icon={card['icon']}
                    />
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollCont: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 20,
    },
    section: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        flexDirection: 'column',
        gap: 8,
        marginBottom: 12,
    },
    spacedSection: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    captionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    captionText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0011ff',
    },
    captionImage: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
    },
    captionTextMain: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    textMain: {
        fontSize: 12,
    },
});