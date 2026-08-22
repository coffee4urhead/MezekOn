import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useUserFiles } from '@/hooks/use-user-files';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface ArtickleItemInfo {
    author_id: string;
    content: string;
    media_urls: string[];
    likes_count: number;
    comments_count: number;
    views_count: number;
    title: string;
    $createdAt: string;
    $updatedAt: string;
}

type IconType = 'likes_icon' | 'views_icon' | 'comments_icon';

const iconMap = {
    'likes_icon': require('@/assets/icons/artickleIcons/heart.png'),
    'comments_icon': require('@/assets/icons/artickleIcons/comment.png'),
    'views_icon': require('@/assets/icons/artickleIcons/views.png'),
}

export default function ArtickleItem({ 
    author_id,
    content,
    media_urls,
    likes_count,
    comments_count,
    views_count,
    title,
    $createdAt,
    $updatedAt
}: ArtickleItemInfo) {

    const { getUserById } = useUser();
    const { profilePhoto } = useUserFiles(author_id || '');
    const [authorName, setAuthorName] = useState<string>('Author');
    const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
    const { isDark } = useTheme();

    useEffect(() => {
        const fetchAuthor = async () => {
            if (author_id) {
                const author = await getUserById(author_id);
                if (author) {
                    setAuthorName(author.name || 'Unknown User');
                    setAuthorAvatar(author.profilePhoto || null);
                }
            }
        };
        fetchAuthor();
    }, [author_id]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('bg-BG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderStatIcon = (iconType: IconType, stat: number) => {
        return (
            <TouchableOpacity style={styles.statIconHolder}>
                <Image source={iconMap[iconType]} style={styles.statIcon} />
                <Text style={styles.statStyle}>{stat}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.artickleContainer}>
            <View style={styles.authorSection}>
                <View style={styles.avatarContainer}>
                    {profilePhoto ? (
                        <Image
                            source={{ uri: profilePhoto.coverPhotoUrl }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {authorName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.authorInfo}>
                    <Text style={styles.authorName}>{authorName}</Text>
                    <Text style={styles.dateString}>
                        {formatDate($createdAt)}
                    </Text>
                </View>
            </View>

            <View style={styles.contentSection}>
                <Text style={styles.artickleTitle}>{title}</Text>
                <Text style={styles.contentText} numberOfLines={4}>
                    {content}
                </Text>
            </View>

            {media_urls && media_urls.length > 0 && (
                <View style={styles.mediaSection}>
                    <Text style={styles.mediaCount}>
                        📷 {media_urls.length} media files
                    </Text>
                </View>
            )}

            <View style={styles.statsSection}>
                {renderStatIcon('likes_icon', likes_count)}
                {renderStatIcon('comments_icon', comments_count)}
                {renderStatIcon('views_icon', views_count)}
            </View>
        </View>
    );
}  

const styles = StyleSheet.create({
    artickleContainer: {
        backgroundColor: '#f8f9ff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e8edff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    authorSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        backgroundColor: '#0347F2',
    },
    avatarText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    authorInfo: {
        flex: 1,
    },
    authorName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    dateString: {
        fontSize: 12,
        color: '#888888',
        marginTop: 2,
    },
    contentSection: {
        marginBottom: 12,
    },
    artickleTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
        lineHeight: 24,
    },
    contentText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#444444',
    },
    mediaSection: {
        marginBottom: 12,
        padding: 8,
        backgroundColor: '#f0f4ff',
        borderRadius: 8,
    },
    mediaCount: {
        fontSize: 12,
        color: '#0347F2',
    },
    statsSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e8edff',
        gap: 16,
    },
    statIconHolder: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statIcon: {
        width: 20,
        height: 20,
        tintColor: '#666666',
    },
    statStyle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666666',
    },
});