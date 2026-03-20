import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { parsePaymentGuardError } from '@/lib/payment-guard';

interface QuizQuestion {
  id: string;
  contentHtml: string;
  options: string[];
}

interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface QuizDetail {
  questionId: string;
  correct: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  explanation?: string;
}

export default function QuizScreen() {
  const params = useLocalSearchParams();
  const lessonId = params.id as string | undefined;
  const lessonTitle = (params.title as string) || 'Bài tập';
  const courseId = params.courseId as string | undefined;
  const courseTitle = (params.courseTitle as string) || undefined;

  const { tokens } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quizDetails, setQuizDetails] = useState<Record<string, QuizDetail>>({});

  // Load questions khi vào màn hình
  useEffect(() => {
    const loadQuestions = async () => {
      if (!lessonId || !tokens?.accessToken) {
        Alert.alert('Lỗi', 'Thiếu thông tin bài học hoặc phiên đăng nhập.');
        router.back();
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(
          // Lấy câu hỏi theo đúng API bạn mô tả: /api/v1/questions/lesson/{lessonId}
          `${API_BASE_URL}/api/v1/questions/lesson/${lessonId}`,
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || 'Không thể tải câu hỏi.');
        }

        const raw: any = await res.json();
        // Backend trả về { success, data: [...] }
        const list: any[] = raw?.data ?? raw?.questions ?? [];

        const qs: QuizQuestion[] = list.map((q: any) => ({
          id: q.id,
          contentHtml: q.contentHtml ?? '',
          options: q.options ?? [],
        }));

        setQuestions(qs);
        setAnswers(
          qs.reduce<Record<string, number | null>>((acc, q) => {
            acc[q.id] = null;
            return acc;
          }, {})
        );
      } catch (error: any) {
        console.error('[QUIZ] loadQuestions error:', error);
        Alert.alert('Lỗi', error?.message ?? 'Không thể tải câu hỏi.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    void loadQuestions();
  }, [lessonId, tokens?.accessToken]);

  const handleSubmitQuiz = async () => {
    if (!lessonId || !tokens?.accessToken) return;
    if (!questions.length) return;

    const unanswered = questions.filter((q) => answers[q.id] === null);
    if (unanswered.length > 0) {
      Alert.alert('Thiếu câu trả lời', 'Vui lòng trả lời tất cả câu hỏi trước khi nộp bài.');
      return;
    }

    setIsSubmittingQuiz(true);
    try {
      const payload = {
        answers: questions.map((q) => {
          const selectedIndex = answers[q.id] ?? null;
          const selectedOption = selectedIndex !== null ? q.options[selectedIndex] : '';
          return {
            questionId: q.id,
            selectedAnswer: selectedOption, // Gửi text của option, không phải index
          };
        }),
        timeSpentMs: questions.length * 30_000, // Tạm tính 30s mỗi câu
      };

      const res = await fetch(
        `${API_BASE_URL}/api/v1/sequential-learning/lesson/${lessonId}/submit-quiz`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const paymentGuard = await parsePaymentGuardError(res);
        if (paymentGuard?.requiresUpgrade || paymentGuard?.requiresRenewal) {
          const mode = paymentGuard?.requiresRenewal ? 'renewal' : 'upgrade';
          Alert.alert(
            paymentGuard?.requiresRenewal ? 'Can gia han Pro' : 'Can nang cap Pro',
            paymentGuard?.message || 'Vui long nang cap de tiep tuc luyen tap.'
          );
          router.push({ pathname: '/paywall', params: { source: 'lesson-quiz', mode } } as any);
          return;
        }
        const text = await res.text().catch(() => '');
        throw new Error(text || 'Không thể nộp bài.');
      }

      const raw: any = await res.json();
      const data = raw?.data ?? raw;
      const resultData: QuizResult = {
        score: data.score ?? 0,
        totalQuestions: data.totalQuestions ?? questions.length,
        correctAnswers: data.correctAnswers ?? 0,
      };

      // Lưu details để highlight đáp án đúng/sai
      const detailsMap: Record<string, QuizDetail> = {};
      if (Array.isArray(data.details)) {
        data.details.forEach((detail: any) => {
          detailsMap[detail.questionId] = {
            questionId: detail.questionId,
            correct: detail.correct ?? false,
            selectedAnswer: detail.selectedAnswer ?? '',
            correctAnswer: detail.correctAnswer ?? '',
            explanation: detail.explanation,
          };
        });
      }
      setQuizDetails(detailsMap);

      setResult(resultData);

      // Refresh lesson status sau khi submit quiz
      // Có thể gọi API để refresh hoặc để màn lesson tự refresh khi quay lại
      
      if (resultData.score >= 80) {
        Alert.alert('Chúc mừng', 'Bạn đã vượt qua bài kiểm tra! Bài tiếp theo sẽ được mở khóa.');
      } else {
        Alert.alert('Kết quả', `Điểm của bạn: ${resultData.score}%. Hãy thử lại để đạt >= 80%.`);
      }
    } catch (error: any) {
      console.error('[QUIZ] submitQuiz error:', error);
      Alert.alert('Lỗi', error?.message ?? 'Không thể nộp bài.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleRetry = () => {
    // Reset tất cả state để làm lại từ đầu
    setResult(null);
    setQuizDetails({});
    setAnswers(
      questions.reduce<Record<string, number | null>>((acc, q) => {
        acc[q.id] = null;
        return acc;
      }, {})
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
      </SafeAreaView>
    );
  }

  if (!questions.length) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#6B7280" />
        <Text style={styles.loadingText}>Không có câu hỏi nào</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {lessonTitle}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Quiz Content */}
        <View style={styles.quizCard}>
          <View style={styles.quizHeader}>
            <Text style={styles.quizTitle}>Quiz kiểm tra nhanh</Text>
            {result && (
              <Text style={[styles.quizBadge, result.score >= 80 ? styles.quizBadgePass : styles.quizBadgeFail]}>
                {result.score >= 80 ? 'Đã đạt' : 'Chưa đạt'}
              </Text>
            )}
          </View>

          <View style={styles.quizContent}>
            {questions.map((q, index) => {
              const detail = quizDetails[q.id];
              const isSubmitted = result !== null;

              return (
                <View key={q.id} style={styles.questionCard}>
                  <Text style={styles.questionTitle}>
                    Câu {index + 1}: {q.contentHtml.replace(/<[^>]+>/g, '')}
                  </Text>
                  {q.options.map((opt, optIndex) => {
                    const selected = answers[q.id] === optIndex;
                    const isCorrect = false;
                    const isWrong = false;
                    const optionStyleArray: any[] = [styles.optionButton];
                    const textStyleArray: any[] = [styles.optionText];

                    if (isSubmitted && detail) {
                      // So sánh option text với correctAnswer và selectedAnswer
                      const isCorrectAnswer = detail.correctAnswer === opt;
                      const isSelectedAnswer = detail.selectedAnswer === opt;

                      if (isCorrectAnswer) {
                        // Đáp án đúng -> màu xanh
                        optionStyleArray.push(styles.optionButtonCorrect);
                        textStyleArray.push(styles.optionTextCorrect);
                        // isCorrect = true; // Không cần vì đã có logic render icon
                      } else if (isSelectedAnswer && !detail.correct) {
                        // Đáp án học sinh chọn nhưng sai -> màu đỏ
                        optionStyleArray.push(styles.optionButtonWrong);
                        textStyleArray.push(styles.optionTextWrong);
                        // isWrong = true;
                      }
                    } else if (selected) {
                      // Chưa submit, chỉ highlight khi selected
                      optionStyleArray.push(styles.optionButtonSelected);
                      textStyleArray.push(styles.optionTextSelected);
                    }

                    const isCorrectAnswer = isSubmitted && detail && detail.correctAnswer === opt;
                    const isWrongAnswer = isSubmitted && detail && detail.selectedAnswer === opt && !detail.correct;

                    return (
                      <TouchableOpacity
                        key={optIndex}
                        style={optionStyleArray}
                        onPress={() => {
                          if (!isSubmitted) {
                            setAnswers((prev) => ({
                              ...prev,
                              [q.id]: optIndex,
                            }));
                          }
                        }}
                        disabled={isSubmitted}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={textStyleArray}>{opt}</Text>
                          {isSubmitted && isCorrectAnswer && (
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginLeft: 8 }} />
                          )}
                          {isSubmitted && isWrongAnswer && (
                            <Ionicons name="close-circle" size={20} color="#EF4444" style={{ marginLeft: 8 }} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {result && quizDetails[q.id]?.explanation && (
                    <View style={styles.explanationContainer}>
                      <Text style={styles.explanationText}>{quizDetails[q.id].explanation}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {!result ? (
              <TouchableOpacity
                style={[styles.submitButton, isSubmittingQuiz && styles.submitButtonDisabled]}
                onPress={handleSubmitQuiz}
                disabled={isSubmittingQuiz}
              >
                {isSubmittingQuiz ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Nộp bài</Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.resultContainer}>
                  <Text style={styles.resultTitle}>Kết quả</Text>
                  <Text style={styles.resultText}>
                    Điểm: {result.score}% - Đúng {result.correctAnswers}/{result.totalQuestions} câu
                  </Text>
                  {result.score >= 80 ? (
                    <Text style={styles.resultSuccess}>{'🎉 Chúc mừng! Bạn đã vượt qua bài kiểm tra!'}</Text>
                  ) : (
                    <Text style={styles.resultFail}>{'Hãy làm lại để đạt >= 80%'}</Text>
                  )}
                </View>

                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.retryButtonText}>Làm lại</Text>
                </TouchableOpacity>

                {result.score >= 80 && (
                  <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: '#10B981', marginTop: 8 }]}
                    onPress={() => {
                      // Học tiếp: quay về trang curriculum của khoá học (nếu biết), fallback về home
                      if (courseId) {
                        router.replace({
                          pathname: '/course/[id]',
                          params: {
                            id: courseId,
                            title: courseTitle,
                          },
                        } as any);
                      } else {
                        router.replace('/');
                      }
                    }}
                  >
                    <Ionicons name="arrow-forward-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.retryButtonText}>Học tiếp</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  quizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  quizBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '600',
  },
  quizBadgePass: {
    color: '#059669',
    backgroundColor: '#D1FAE5',
  },
  quizBadgeFail: {
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  quizContent: {
    marginTop: 8,
  },
  questionCard: {
    marginBottom: 20,
  },
  questionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  optionButtonCorrect: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  optionButtonWrong: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  optionText: {
    fontSize: 14,
    color: '#111827',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  optionTextCorrect: {
    color: '#059669',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#DC2626',
    fontWeight: '600',
  },
  explanationContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#6EE7B7',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 15,
    color: '#047857',
    marginBottom: 8,
  },
  resultSuccess: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  resultFail: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
