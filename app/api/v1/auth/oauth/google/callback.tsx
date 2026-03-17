import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

type LearningGoal = "lay-lai-goc" | "hoc-nang-cao" | "on-thi-thpt" | "luyen-thi-10";

interface GoalOption {
  id: LearningGoal;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function GoogleOAuthCallbackScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [completionToken, setCompletionToken] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<LearningGoal[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { hydrateFromOAuthLogin, completeOAuthProfile, setOnboardingGoals, setOnboardingGrade } =
    useAuth();

  const grades = [9, 10, 11, 12];

  const goals: GoalOption[] = [
    { id: "lay-lai-goc", label: "Lấy lại gốc", icon: "refresh-outline" },
    { id: "hoc-nang-cao", label: "Học nâng cao", icon: "trending-up-outline" },
    { id: "on-thi-thpt", label: "Ôn thi THPT Quốc gia", icon: "school-outline" },
    { id: "luyen-thi-10", label: "Luyện thi vào 10", icon: "trophy-outline" },
  ];

  useEffect(() => {
    const run = async () => {
      try {
        console.log("[CALLBACK] Google OAuth callback page loaded");

        // URL hiện tại FE đang đứng (có iss, code, scope, authuser, prompt...)
        const currentUrl = new URL(window.location.href);
        const backendUrl = `${API_BASE_URL}/api/v1/auth/oauth/google/callback${currentUrl.search}`;
        console.log("[CALLBACK] Calling backend:", backendUrl);

        const res = await fetch(backendUrl, {
          method: "GET",
          credentials: "include",
        });

        console.log("[CALLBACK] Backend response status:", res.status);
        const text = await res.text();

        if (!res.ok) {
          console.error("[CALLBACK] Backend error:", text);
          throw new Error(text || "Đăng nhập Google thất bại.");
        }

        let data: any;
        try {
          data = JSON.parse(text);
          console.log("[CALLBACK] Parsed data:", data);
        } catch {
          console.error("[CALLBACK] Failed to parse JSON:", text);
          throw new Error("Phản hồi từ máy chủ không phải JSON hợp lệ.");
        }

        // Quyết định flow dựa vào needsProfileCompletion
        if (data.needsProfileCompletion === true) {
          // Trường hợp cần hoàn tất profile lần đầu
          if (!data.completionToken) {
            throw new Error("Thiếu completionToken từ server. Vui lòng thử lại.");
          }

          console.log("[CALLBACK] Needs profile completion, showing form");
          setCompletionToken(data.completionToken);
          setShowForm(true);
          setIsLoading(false);
          return;
        }

        // Trường hợp needsProfileCompletion === false: user đã có profile đầy đủ
        if (data.needsProfileCompletion === false) {
          console.log("[CALLBACK] Profile already complete, hydrating auth state");

          if (!data.user || !data.accessToken) {
            throw new Error("Không nhận được thông tin đăng nhập hợp lệ từ server.");
          }

          // Đọc onboardingCompleted từ studentProfile nếu có
          const onboardingCompleted = data.user.studentProfile?.onboardingCompleted ?? false;
          console.log("[CALLBACK] onboardingCompleted from response:", onboardingCompleted);

          // Cập nhật state AuthContext giống như login bằng email
          await hydrateFromOAuthLogin({
            user: {
              id: data.user.id,
              email: data.user.email,
              role: data.user.role,
              avatarUrl: data.user.avatarUrl ?? null,
            },
            accessToken: data.accessToken as string,
            refreshToken: data.refreshToken as string,
            sessionId: data.sessionId as string | undefined,
            onboardingCompleted, // Truyền onboardingCompleted từ response
          });

          // Redirect về index - index sẽ tự động redirect dựa trên auth state
          router.replace("/");
          return;
        }

        // Fallback: nếu không có needsProfileCompletion hoặc không rõ ràng
        throw new Error("Phản hồi từ server không hợp lệ: thiếu thông tin needsProfileCompletion.");
      } catch (e: any) {
        console.error("[CALLBACK] Error in callback:", e);
        setError(e?.message || "Có lỗi xảy ra khi xử lý callback đăng nhập Google.");
        setIsLoading(false);
      }
    };

    void run();
  }, [router, hydrateFromOAuthLogin]);

  const toggleGoal = (goalId: LearningGoal) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const handleComplete = async () => {
    if (!completionToken) {
      Alert.alert("Lỗi", "Không tìm thấy token xác thực.");
      return;
    }

    if (!firstName || !lastName) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ họ và tên.");
      return;
    }

    if (!selectedGrade) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn khối lớp.");
      return;
    }

    if (selectedGoals.length === 0) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn ít nhất một mục tiêu học tập.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Gọi API complete-profile
      await completeOAuthProfile({
        completionToken,
        role: "STUDENT",
        firstName,
        lastName,
        phoneNumber: phoneNumber || undefined,
        gradeLevel: selectedGrade,
        goals: selectedGoals,
      });

      // Save onboarding data
      await setOnboardingGrade(selectedGrade);
      await setOnboardingGoals(selectedGoals);

      // Redirect về trang personalize
      router.replace("/(auth)/personalize");
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message ?? "Hoàn tất hồ sơ thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.text}>Đang hoàn tất đăng nhập Google...</Text>
      </View>
    );
  }

  // Error state
  if (error && !showForm) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Đăng nhập Google thất bại</Text>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  // Form state - hiển thị form hoàn thành profile
  if (showForm) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Hoàn tất hồ sơ</Text>
            </View>

            {/* Welcome text */}
            <Text style={styles.welcomeTitle}>Chào mừng bạn!</Text>
            <Text style={styles.welcomeSubtitle}>
              Vui lòng điền thông tin để hoàn tất tài khoản của bạn.
            </Text>

            {/* Form */}
            <View style={styles.form}>
              {/* First name */}
              <Text style={styles.inputLabel}>Họ *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập họ"
                  placeholderTextColor="#9CA3AF"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              {/* Last name */}
              <Text style={styles.inputLabel}>Tên *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên"
                  placeholderTextColor="#9CA3AF"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              {/* Phone number (optional) */}
              <Text style={styles.inputLabel}>Số điện thoại (tùy chọn)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#9CA3AF"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Grade selection */}
              <Text style={styles.inputLabel}>Khối lớp *</Text>
              <View style={styles.gradeContainer}>
                {grades.map((grade) => (
                  <TouchableOpacity
                    key={grade}
                    style={[styles.gradeCard, selectedGrade === grade && styles.gradeCardSelected]}
                    onPress={() => setSelectedGrade(grade)}
                  >
                    <Text style={[styles.gradeText, selectedGrade === grade && styles.gradeTextSelected]}>
                      Lớp {grade}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Goals selection */}
              <Text style={styles.inputLabel}>Mục tiêu học tập *</Text>
              <View style={styles.goalsContainer}>
                {goals.map((goal) => (
                  <TouchableOpacity
                    key={goal.id}
                    style={[styles.goalChip, selectedGoals.includes(goal.id) && styles.goalChipSelected]}
                    onPress={() => toggleGoal(goal.id)}
                  >
                    <Ionicons
                      name={goal.icon}
                      size={16}
                      color={selectedGoals.includes(goal.id) ? "#fff" : "#3B82F6"}
                    />
                    <Text
                      style={[styles.goalText, selectedGoals.includes(goal.id) && styles.goalTextSelected]}
                    >
                      {goal.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Complete button */}
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  (!firstName || !lastName || !selectedGrade || selectedGoals.length === 0 || isSubmitting) &&
                    styles.completeButtonDisabled,
                ]}
                onPress={handleComplete}
                disabled={
                  !firstName || !lastName || !selectedGrade || selectedGoals.length === 0 || isSubmitting
                }
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.completeButtonText}>Hoàn tất</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#111827",
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#DC2626",
    marginBottom: 8,
    textAlign: "center",
  },
  error: {
    marginTop: 12,
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginTop: 24,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginBottom: 24,
  },
  form: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1a1a1a",
  },
  gradeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gradeCard: {
    width: "47%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  gradeCardSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#EBF5FF",
  },
  gradeText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1a1a1a",
  },
  gradeTextSelected: {
    color: "#3B82F6",
  },
  goalsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  goalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#3B82F6",
    backgroundColor: "#fff",
  },
  goalChipSelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  goalText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },
  goalTextSelected: {
    color: "#fff",
  },
  completeButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  completeButtonDisabled: {
    backgroundColor: "#93C5FD",
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
