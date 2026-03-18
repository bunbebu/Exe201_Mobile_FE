import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

interface BankQuestion {
  id: string;
  lessonId: string;
  contentHtml: string;
  type: string;
  difficulty: string;
  options: string[];
  correctAnswer: string; // swagger: thường là "0"
  explanation?: string;
}

interface WrongBankItem {
  id: string;
  questionId: string;
  lessonId: string;
  failCount: number;
  lastFailedAt?: string;
  isMastered: boolean;
  question: BankQuestion;
}

interface PracticeResult {
  questionId: string;
  isCorrect: boolean;
  isMastered?: boolean;
  correctAnswer?: string;
  selectedAnswer?: string;
  explanation?: string;
}

function stripHtml(html: string) {
  return String(html || '').replace(/<[^>]+>/g, '').trim();
}

function isNumericString(s: string) {
  return /^-?\d+$/.test(String(s ?? '').trim());
}

export default function ReviewScreen() {
  const { tokens } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<WrongBankItem[]>([]);
  const [selected, setSelected] = useState<Record<string, number | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<Record<string, PracticeResult>>({});

  const unresolvedItems = useMemo(() => items.filter((x) => !x.isMastered), [items]);

  const fetchBank = async () => {
    if (!tokens?.accessToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/wrong-answers/my-bank?isMastered=false`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          accept: 'application/json',
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'Không thể tải kho câu sai.');
      }

      const raw: any = await res.json();
      const data: WrongBankItem[] = raw?.data ?? [];
      setItems(Array.isArray(data) ? data : []);

      const init: Record<string, number | null> = {};
      (Array.isArray(data) ? data : []).forEach((it) => {
        init[it.questionId] = null;
      });
      setSelected(init);
      setResults({});
    } catch (e: any) {
      console.error('[REVIEW] fetchBank error:', e);
      Alert.alert('Lỗi', e?.message ?? 'Không thể tải kho câu sai.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchBank();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.accessToken]);

  const handleSubmitPractice = async () => {
    if (!tokens?.accessToken) return;
    if (!unresolvedItems.length) {
      Alert.alert('Ôn tập', 'Bạn không còn câu sai nào cần ôn tập.');
      return;
    }

    const unanswered = unresolvedItems.filter((it) => selected[it.questionId] === null);
    if (unanswered.length > 0) {
      Alert.alert('Thiếu câu trả lời', 'Vui lòng chọn đáp án cho tất cả câu trước khi nộp.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        answers: unresolvedItems.map((it) => {
          const q = it.question;
          const selectedIndex = selected[it.questionId] ?? 0;

          // Swagger practice example dùng selectedAnswer là index string ("0", "1"...)
          // Nếu backend sau này chuyển sang text, vẫn fallback sang option text.
          const selectedAnswer = isNumericString(q.correctAnswer)
            ? String(selectedIndex)
            : String(q.options?.[selectedIndex] ?? '');

          return {
            questionId: it.questionId,
            selectedAnswer,
          };
        }),
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/wrong-answers/practice`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'Không thể nộp bài ôn tập.');
      }

      const raw: any = await res.json();
      const data = raw?.data ?? raw;
      const list: PracticeResult[] = data?.results ?? data?.data?.results ?? [];

      const map: Record<string, PracticeResult> = {};
      if (Array.isArray(list)) {
        list.forEach((r) => {
          map[r.questionId] = r;
        });
      }
      setResults(map);

      const allCorrect = unresolvedItems.every((it) => map[it.questionId]?.isCorrect === true);

      if (allCorrect) {
        Alert.alert('Ôn tập', 'Tuyệt! Bạn đã làm đúng hết. Kho câu sai sẽ được cập nhật.');
        await fetchBank();
      } else {
        Alert.alert('Ôn tập', 'Bạn vẫn còn câu sai. Hãy xem lại và làm lại cho đến khi đúng hết.');
      }
    } catch (e: any) {
      console.error('[REVIEW] practice error:', e);
      Alert.alert('Lỗi', e?.message ?? 'Không thể nộp bài ôn tập.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Kho câu sai
          </Text>
          <TouchableOpacity onPress={() => fetchBank()} style={styles.backButton} disabled={isLoading}>
            <Ionicons name="refresh" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Cần ôn tập</Text>
          <Text style={styles.summaryValue}>{unresolvedItems.length} câu</Text>
          <Text style={styles.summaryHint}>Làm lại cho đến khi đúng hoàn toàn.</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Đang tải kho câu sai...</Text>
          </View>
        ) : unresolvedItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.emptyTitle}>Không có câu nào cần ôn tập</Text>
            <Text style={styles.emptyHint}>Bạn đã làm đúng hết các câu trước đó.</Text>
          </View>
        ) : (
          <>
            {unresolvedItems.map((it, idx) => {
              const q = it.question;
              const r = results[it.questionId];
              const isSubmitted = Object.keys(results).length > 0;

              return (
                <View key={it.id} style={styles.questionCard}>
                  <Text style={styles.questionTitle}>
                    Câu {idx + 1}: {stripHtml(q.contentHtml)}
                  </Text>
                  {q.options.map((opt, optIndex) => {
                    const chosen = selected[it.questionId] === optIndex;

                    // Feedback sau submit
                    const correctIndex =
                      isNumericString(q.correctAnswer) ? Number(q.correctAnswer) : -1;
                    const isCorrectOpt =
                      isSubmitted && (isNumericString(q.correctAnswer) ? correctIndex === optIndex : r?.correctAnswer === opt);
                    const isWrongChosen = isSubmitted && chosen && r?.isCorrect === false;

                    const optionStyle = [
                      styles.optionButton,
                      chosen && !isSubmitted ? styles.optionSelected : null,
                      isCorrectOpt ? styles.optionCorrect : null,
                      isWrongChosen ? styles.optionWrong : null,
                    ];

                    const optionTextStyle = [
                      styles.optionText,
                      chosen && !isSubmitted ? styles.optionTextSelected : null,
                      isCorrectOpt ? styles.optionTextCorrect : null,
                      isWrongChosen ? styles.optionTextWrong : null,
                    ];

                    return (
                      <TouchableOpacity
                        key={optIndex}
                        style={optionStyle as any}
                        onPress={() => {
                          if (!isSubmitted) {
                            setSelected((prev) => ({ ...prev, [it.questionId]: optIndex }));
                          }
                        }}
                        disabled={isSubmitted}
                      >
                        <Text style={optionTextStyle as any}>{opt}</Text>
                        {isSubmitted && isCorrectOpt && (
                          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                        )}
                        {isSubmitted && isWrongChosen && (
                          <Ionicons name="close-circle" size={18} color="#EF4444" />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {isSubmitted && r?.explanation && (
                    <View style={styles.explainBox}>
                      <Text style={styles.explainText}>{r.explanation}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitPractice}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Luyện lại</Text>
              )}
            </TouchableOpacity>

            {Object.keys(results).length > 0 && (
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#3B82F6', marginTop: 10 }]}
                onPress={() => {
                  // Clear để làm lại vòng tiếp theo (chỉ khi còn sai)
                  setResults({});
                }}
              >
                <Text style={styles.submitButtonText}>Làm lại vòng nữa</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#111827', textAlign: 'center' },

  summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  summaryTitle: { fontSize: 14, color: '#6B7280', marginBottom: 6, fontWeight: '600' },
  summaryValue: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 4 },
  summaryHint: { fontSize: 13, color: '#6B7280' },

  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#4B5563', textAlign: 'center' },

  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: '700', color: '#111827' },
  emptyHint: { marginTop: 6, fontSize: 13, color: '#6B7280', textAlign: 'center' },

  questionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  questionTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 12 },

  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  optionSelected: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  optionCorrect: { backgroundColor: '#D1FAE5', borderColor: '#10B981', borderWidth: 2 },
  optionWrong: { backgroundColor: '#FEE2E2', borderColor: '#EF4444', borderWidth: 2 },

  optionText: { fontSize: 14, color: '#111827', flex: 1, marginRight: 10 },
  optionTextSelected: { color: '#fff', fontWeight: '600' },
  optionTextCorrect: { color: '#059669', fontWeight: '700' },
  optionTextWrong: { color: '#DC2626', fontWeight: '700' },

  explainBox: { marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: '#F3F4F6' },
  explainText: { fontSize: 13, color: '#4B5563', fontStyle: 'italic' },

  submitButton: { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitButtonDisabled: { backgroundColor: '#6EE7B7' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

