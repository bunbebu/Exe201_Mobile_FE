import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/use-colors';

interface ApiImage {
  url?: string;
}

interface ExamItem {
  id: string;
  title: string;
  description?: string;
  timeLimitSeconds?: number;
  totalQuestions?: number;
  thumbnailUrl?: ApiImage | null;
}

interface ExamsResponseData {
  items: ExamItem[];
  page: number;
  pages: number;
}

const PAGE_SIZE = 10;
const API_HOST = 'https://edutech-backend-y2zc.onrender.com';

export default function ExamsListScreen() {
  const colors = useColors();
  const { tokens } = useAuth();

  const [exams, setExams] = useState<ExamItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (targetPage: number, replace = false) => {
      if (replace) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setErrorMessage(null);

      try {
        const url = `${API_HOST}/api/v1/exams?page=${targetPage}&limit=${PAGE_SIZE}`;
        const headers: Record<string, string> = {};
        if (tokens?.accessToken) {
          headers.Authorization = `Bearer ${tokens.accessToken}`;
        }

        const res = await fetch(url, { headers });
        if (!res.ok) {
          throw new Error('Không thể tải danh sách bài kiểm tra');
        }

        const json = await res.json();
        const data: ExamsResponseData = json?.data ?? { items: [], page: 1, pages: 1 };
        const items = Array.isArray(data.items) ? data.items : [];
        const currentPage = data.page || targetPage;
        const pages = data.pages || currentPage;

        setPage(currentPage);
        setTotalPages(pages);
        setExams((prev) => (replace ? items : [...prev, ...items]));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [tokens?.accessToken]
  );

  useEffect(() => {
    void fetchPage(1, true);
  }, [fetchPage]);

  const handleLoadMore = () => {
    if (isLoading || isLoadingMore) return;
    if (page >= totalPages) return;
    void fetchPage(page + 1, false);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--';
    const minutes = Math.floor(seconds / 60);
    return `${minutes} phút`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tất cả bài kiểm tra</Text>
        <View style={styles.headerBtn} />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={[styles.stateText, { color: colors.mutedText }]}>Đang tải bài kiểm tra...</Text>
        </View>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.35}
          onEndReached={handleLoadMore}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.cardBg }]}
              onPress={() =>
                router.push({
                  pathname: '/exams/[id]/start',
                  params: { id: item.id },
                } as any)
              }
            >
              <View style={[styles.thumbWrap, { backgroundColor: colors.inputBg }]}>
                {item.thumbnailUrl?.url ? (
                  <Image source={{ uri: item.thumbnailUrl.url }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <Ionicons name="document-text-outline" size={30} color="#3B82F6" />
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.desc, { color: colors.secondaryText }]} numberOfLines={2}>
                  {item.description || 'Bài kiểm tra trắc nghiệm'}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaText, { color: colors.mutedText }]}>
                    {item.totalQuestions ?? 0} câu
                  </Text>
                  <Text style={[styles.metaText, { color: colors.mutedText }]}>
                    {formatDuration(item.timeLimitSeconds)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={[styles.stateText, { color: colors.mutedText }]}>Chưa có bài kiểm tra nào.</Text>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              {isLoadingMore ? <ActivityIndicator size="small" color="#3B82F6" /> : null}
              {errorMessage ? (
                <Text style={[styles.stateText, { color: '#EF4444' }]}>{errorMessage}</Text>
              ) : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  thumbWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stateText: {
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
