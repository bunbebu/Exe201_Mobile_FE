import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_BASE_URL } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { parsePaymentGuardError } from "@/lib/payment-guard";

type ExamQuestionType = "MULTIPLE_CHOICE" | string;

type ExamQuestion = {
  id: string;
  contentHtml: string;
  type: ExamQuestionType;
  options: string[];
  points?: number;
};

type ExamStartResponse = {
  examId?: string;
  title: string;
  description?: string;
  courseId?: string;
  timeLimitSeconds: number;
  totalQuestions: number;
  passingScore?: number;
  questions: ExamQuestion[];
};

type ExamSubmitAnswer = {
  questionId: string;
  selectedAnswer: string;
  timeSpentMs: number;
};

type ExamSubmitPayload = {
  answers: ExamSubmitAnswer[];
  totalTimeSpentMs: number;
};

type ExamResultDetail = {
  questionId: string;
  contentHtml: string;
  type: ExamQuestionType;
  options: string[];
  selectedAnswer: string;
  correctAnswer: string;
  explanation?: string;
  isCorrect: boolean;
  timeSpentMs: number;
  points?: number;
  pointsEarned?: number;
};

type ExamSubmitResponse = {
  attemptId: string;
  examId: string;
  examTitle: string;
  courseId?: string;
  chapterId?: string;
  scope?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  passingScore: number;
  passed: boolean;
  totalTimeSpentMs: number;
  details: ExamResultDetail[];
  submittedAt?: string;
};

function stripHtml(html: string) {
  return String(html || "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function formatTime(seconds: number) {
  const s = Math.max(0, seconds);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

export default function ExamStartScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const examId = params.id;

  const { tokens } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const [exam, setExam] = useState<ExamStartResponse | null>(null);
  const [selected, setSelected] = useState<Record<string, string | null>>({});

  const [step, setStep] = useState<"exam" | "result">("exam");
  const [result, setResult] = useState<ExamSubmitResponse | null>(null);

  const [timeLeft, setTimeLeft] = useState(0);

  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedRef = useRef<Record<string, string | null>>({});

  const totalQuestions = exam?.questions?.length ?? 0;
  const answeredCount = useMemo(() => {
    if (!exam) return 0;
    return exam.questions.reduce((acc, q) => acc + (selected[q.id] ? 1 : 0), 0);
  }, [exam, selected]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    if (!examId || !tokens?.accessToken) {
      setBootstrapError("Thiếu thông tin phiên đăng nhập hoặc exam.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/exams/${examId}/start`,
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
              accept: "application/json",
            },
          },
        );

        if (!res.ok) {
          const paymentGuard = await parsePaymentGuardError(res);
          if (paymentGuard?.requiresUpgrade || paymentGuard?.requiresRenewal) {
            const mode = paymentGuard?.requiresRenewal ? "renewal" : "upgrade";
            Alert.alert(
              paymentGuard?.requiresRenewal
                ? "Can gia han Pro"
                : "Can nang cap Pro",
              paymentGuard?.message || "Vui long nang cap de mo khoa thi thu.",
            );
            router.replace({
              pathname: "/paywall",
              params: { source: "exam-start", mode },
            } as any);
            return;
          }
          const text = await res.text().catch(() => "");
          throw new Error(text || "Không thể tải đề thi thử.");
        }

        const raw: any = await res.json();
        const data = raw?.data ?? raw;

        const parsed: ExamStartResponse = {
          examId: data.examId ?? data.id,
          title: data.title ?? "Đề thi thử",
          description: data.description,
          courseId: data.courseId,
          timeLimitSeconds: data.timeLimitSeconds ?? 0,
          totalQuestions: data.totalQuestions ?? data.questions?.length ?? 0,
          passingScore: data.passingScore,
          questions: Array.isArray(data.questions) ? data.questions : [],
        };

        setExam(parsed);
        setTimeLeft(parsed.timeLimitSeconds);
        const initial: Record<string, string | null> = {};
        parsed.questions.forEach((q) => {
          initial[q.id] = null;
        });
        setSelected(initial);
        startedAtRef.current = Date.now();
        setStep("exam");
      } catch (e: any) {
        console.error("[EXAM] load error:", e);
        setBootstrapError(e?.message ?? "Không thể tải đề thi thử.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [examId, tokens?.accessToken]);

  useEffect(() => {
    if (!exam || step !== "exam") return;
    if (timerRef.current) clearInterval(timerRef.current);

    if (timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          // Time is up: submit automatically
          void handleSubmitExam({ auto: true });
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, step]);

  const handleSelectOption = (questionId: string, optionText: string) => {
    setSelected((prev) => ({
      ...prev,
      [questionId]: optionText,
    }));
  };

  const handleFillAnswer = (questionId: string, text: string) => {
    setSelected((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const payloadForSubmit = async (): Promise<ExamSubmitPayload> => {
    if (!exam || startedAtRef.current == null) {
      throw new Error("Phiên thi chưa được khởi tạo.");
    }

    const now = Date.now();
    const totalTimeSpentMs = Math.max(0, now - startedAtRef.current);

    const questions = exam.questions;
    const perQuestionTime =
      questions.length > 0
        ? Math.floor(totalTimeSpentMs / questions.length)
        : 0;
    const currentSelected = selectedRef.current;

    // Some backends reject empty selectedAnswer (validation error on answers.*.selectedAnswer).
    // Submit only answered questions; unanswered ones are treated as not attempted.
    const answers: ExamSubmitAnswer[] = questions
      .map((q) => {
        const selectedAnswer = String(currentSelected[q.id] ?? "").trim();
        if (!selectedAnswer) return null;
        return {
          questionId: q.id,
          selectedAnswer,
          timeSpentMs: perQuestionTime,
        };
      })
      .filter((item): item is ExamSubmitAnswer => item !== null);

    return {
      answers,
      totalTimeSpentMs: Math.max(0, totalTimeSpentMs),
    };
  };

  const handleSubmitExam = async (opts?: { auto?: boolean }) => {
    if (!exam || !tokens?.accessToken) return;
    if (isSubmitting) return;

    // Prevent double submit when timeLeft hits 0
    if (step !== "exam") return;

    setIsSubmitting(true);
    try {
      const payload = await payloadForSubmit();

      const res = await fetch(
        `${API_BASE_URL}/api/v1/exams/${exam.examId ?? examId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.accessToken}`,
            accept: "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const paymentGuard = await parsePaymentGuardError(res);
        if (paymentGuard?.requiresUpgrade || paymentGuard?.requiresRenewal) {
          const mode = paymentGuard?.requiresRenewal ? "renewal" : "upgrade";
          Alert.alert(
            paymentGuard?.requiresRenewal
              ? "Can gia han Pro"
              : "Can nang cap Pro",
            paymentGuard?.message ||
              "Vui long nang cap goi de tiep tuc thi thu.",
          );
          router.push({
            pathname: "/paywall",
            params: { source: "exam-submit", mode },
          } as any);
          return;
        }
        const text = await res.text().catch(() => "");
        throw new Error(text || "Không thể nộp bài.");
      }

      const raw: any = await res.json();
      const data = raw?.data ?? raw;

      // instant grading breakdown comes back in submit response
      const parsed: ExamSubmitResponse = {
        attemptId: data.attemptId ?? data.attemptID ?? "",
        examId: data.examId ?? examId,
        examTitle: data.examTitle ?? exam.title,
        courseId: data.courseId,
        chapterId: data.chapterId,
        scope: data.scope,
        score: data.score ?? 0,
        totalQuestions:
          data.totalQuestions ?? exam.totalQuestions ?? totalQuestions,
        correctAnswers: data.correctAnswers ?? 0,
        passingScore: data.passingScore ?? exam.passingScore ?? 0,
        passed: data.passed ?? false,
        totalTimeSpentMs: data.totalTimeSpentMs ?? 0,
        details: Array.isArray(data.details) ? data.details : [],
        submittedAt: data.submittedAt,
      };

      setResult(parsed);
      setStep("result");

      if (!opts?.auto) {
        Alert.alert(
          "Hoàn tất",
          "Bạn đã nộp bài. Hệ thống chấm điểm ngay lập tức.",
        );
      }
    } catch (e: any) {
      console.error("[EXAM] submit error:", e);
      Alert.alert("Lỗi", e?.message ?? "Không thể nộp bài.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerRight = useMemo(() => {
    if (!exam) return null;
    if (step === "result") return null;
    return (
      <View style={styles.headerBadge}>
        <Ionicons name="timer-outline" size={14} color="#3B82F6" />
        <Text style={styles.headerBadgeText}>
          {formatTime(timeLeft)} • {answeredCount}/{totalQuestions}
        </Text>
      </View>
    );
  }, [exam, step, timeLeft, answeredCount, totalQuestions]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải đề thi...</Text>
      </SafeAreaView>
    );
  }

  if (!exam) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Ionicons name="alert-circle-outline" size={48} color="#6B7280" />
        <Text style={styles.loadingText}>
          {bootstrapError || "Không tìm thấy đề thi."}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {exam.title}
              </Text>
              {!!exam.description && (
                <Text style={styles.headerSubtitle} numberOfLines={2}>
                  {exam.description}
                </Text>
              )}
            </View>
            {headerRight}
          </View>

          {step === "exam" ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Bước 1 - Thi thử</Text>

              {exam.questions.map((q, idx) => {
                const chosen = selected[q.id];
                const qType = (q.type ?? "MULTIPLE_CHOICE").toUpperCase();
                const isFillInBlank = qType === "FILL_IN_BLANK";
                return (
                  <View key={q.id} style={styles.questionCard}>
                    <Text style={styles.questionTitle}>
                      Câu {idx + 1}
                      {q.type ? "" : ""}
                    </Text>
                    <Text style={styles.questionContent}>
                      {stripHtml(q.contentHtml)}
                    </Text>

                    {isFillInBlank ? (
                      <TextInput
                        style={styles.fillInput}
                        placeholder="Nhập đáp án của bạn..."
                        value={String(chosen ?? "")}
                        onChangeText={(text) => handleFillAnswer(q.id, text)}
                        editable={!isSubmitting}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    ) : (
                      <View style={styles.options}>
                        {q.options.map((opt) => {
                          const isChosen = chosen === opt;
                          return (
                            <TouchableOpacity
                              key={opt}
                              style={[
                                styles.optionButton,
                                isChosen && styles.optionChosen,
                              ]}
                              onPress={() => handleSelectOption(q.id, opt)}
                              disabled={isSubmitting}
                            >
                              <Text
                                style={[
                                  styles.optionText,
                                  isChosen && styles.optionTextChosen,
                                ]}
                              >
                                {opt}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (isSubmitting || exam.questions.length === 0) &&
                    styles.submitDisabled,
                ]}
                onPress={() => void handleSubmitExam()}
                disabled={isSubmitting || exam.questions.length === 0}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Nộp bài</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.hintText}>
                Khi hết giờ, bài sẽ được nộp tự động và chấm điểm ngay lập tức.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Bước 3 - Đáp án</Text>

              <View style={styles.resultSummary}>
                <Text style={styles.resultTitle}>Kết quả</Text>
                <Text style={styles.resultText}>
                  Điểm: {result?.score ?? 0}% • Đúng{" "}
                  {result?.correctAnswers ?? 0}/
                  {result?.totalQuestions ?? totalQuestions} câu
                </Text>
                <Text
                  style={[
                    styles.resultPassed,
                    (result?.passed ?? false)
                      ? styles.resultPassedOk
                      : styles.resultPassedFail,
                  ]}
                >
                  {(result?.passed ?? false) ? "Đạt" : "Chưa đạt"} • Ngưỡng{" "}
                  {result?.passingScore ?? exam.passingScore ?? 0}%
                </Text>
              </View>

              {/* Cắt giảm feedback sâu:
                  - Không link ngược về bài học
                  - Chỉ hiển thị đúng/sai + đáp án đúng + giải thích text */}
              {(result?.details ?? []).map((d, idx) => {
                const isCorrect = d.isCorrect;
                return (
                  <View key={d.questionId} style={styles.resultQuestionCard}>
                    <View style={styles.resultRow}>
                      <Text style={styles.resultQuestionTitle}>
                        Câu {idx + 1}
                      </Text>
                      <View
                        style={[
                          styles.resultBadge,
                          isCorrect
                            ? styles.resultBadgeOk
                            : styles.resultBadgeFail,
                        ]}
                      >
                        <Ionicons
                          name={isCorrect ? "checkmark-circle" : "close-circle"}
                          size={16}
                          color={isCorrect ? "#059669" : "#DC2626"}
                        />
                        <Text
                          style={[
                            styles.resultBadgeText,
                            isCorrect
                              ? { color: "#059669" }
                              : { color: "#DC2626" },
                          ]}
                        >
                          {isCorrect ? "Đúng" : "Sai"}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.correctAnswerLabel}>Bạn trả lời</Text>
                    <Text style={styles.correctAnswerText}>
                      {d.selectedAnswer || "(trống)"}
                    </Text>

                    <Text style={styles.correctAnswerLabel}>Đáp án đúng</Text>
                    <Text style={styles.correctAnswerText}>
                      {d.correctAnswer}
                    </Text>

                    {!!d.explanation && (
                      <>
                        <Text style={styles.explainLabel}>Giải thích</Text>
                        <Text style={styles.explainText}>
                          {stripHtml(d.explanation)}
                        </Text>
                      </>
                    )}
                  </View>
                );
              })}

              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  // Reload exam screen: re-fetch exam questions and restart timer.
                  router.replace(`/exams/${examId}/start` as any);
                }}
              >
                <Ionicons
                  name="refresh"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.retryButtonText}>Làm lại</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  loadingText: { marginTop: 12, fontSize: 14, color: "#4B5563" },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },

  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderColor: "#DBEAFE",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 2,
  },
  headerBadgeText: { fontSize: 12, fontWeight: "700", color: "#3B82F6" },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
    color: "#111827",
  },

  questionCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  questionContent: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    lineHeight: 18,
    marginBottom: 12,
  },
  options: { gap: 10 },
  optionButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  optionChosen: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  optionText: { fontSize: 14, fontWeight: "700", color: "#111827" },
  optionTextChosen: { color: "#fff" },

  fillInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  submitButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  hintText: { marginTop: 10, fontSize: 12, color: "#6B7280", lineHeight: 18 },

  resultSummary: {
    backgroundColor: "#ECFEFF",
    borderColor: "#06B6D4",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#047857",
    marginBottom: 6,
  },
  resultText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F766E",
    marginBottom: 6,
  },
  resultPassed: { fontSize: 13, fontWeight: "900" },
  resultPassedOk: { color: "#059669" },
  resultPassedFail: { color: "#DC2626" },

  resultQuestionCard: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  resultQuestionTitle: { fontSize: 14, fontWeight: "800", color: "#111827" },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  resultBadgeOk: { backgroundColor: "#D1FAE5", borderColor: "#10B981" },
  resultBadgeFail: { backgroundColor: "#FEE2E2", borderColor: "#EF4444" },
  resultBadgeText: { fontSize: 12, fontWeight: "900" },

  correctAnswerLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  correctAnswerText: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  explainLabel: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "900",
    color: "#111827",
  },
  explainText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    fontStyle: "italic",
    lineHeight: 18,
  },

  retryButton: {
    backgroundColor: "#10B981",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 10,
  },
  retryButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  backButtonText: { fontSize: 16, fontWeight: "700", color: "#3B82F6" },
  retryButtonDisabled: { opacity: 0.6 },
});
