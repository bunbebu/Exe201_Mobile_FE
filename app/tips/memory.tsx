import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/use-colors';

const memoryMethods = [
  {
    title: '1) Active Recall',
    content:
      'Đóng sách lại và tự tưởng lại nội dung vừa học. Tự đặt câu hỏi "Tại sao?", "Như thế nào?". Mục tiêu là nhớ chủ động, không đọc lại thụ động.',
  },
  {
    title: '2) Spaced Repetition',
    content:
      'Ôn lại theo nhịp 1-3-7-14 ngày. Mỗi lần ôn ngắn 10-20 phút, tập trung vào phần dễ quên. Cách này giúp nhớ lâu và giảm học vẹt.',
  },
  {
    title: '3) Feynman Technique',
    content:
      'Giải thích lại bài học bằng ngôn ngữ đơn giản như đang dạy cho bạn bè lớp 6. Chỗ nào giải thích ngập ngừng thì quay lại học lại cho chắc.',
  },
  {
    title: '4) Chunking',
    content:
      'Chia nội dung dài thành nhóm nhỏ 3-5 ý chính. Đặt tiêu đề ngắn cho từng nhóm để não dễ mã hóa và truy xuất khi làm bài.',
  },
  {
    title: '5) Interleaving',
    content:
      'Trộn nhiều dạng bài trong một buổi ôn (lý thuyết + bài tập + trắc nghiệm). Các dạng bài xen kẽ giúp tăng khả năng nhận diện đề.',
  },
];

const quickChecklist = [
  'Buổi sáng: học 25 phút + recall 5 phút.',
  'Buổi chiều: làm 10-15 câu trắc nghiệm ứng với phần vừa học.',
  'Buổi tối: ôn lại 10 phút theo flashcard/ghi nhớ.',
  'Cuối tuần: tổng hợp 1 trang note "tổng ôn".',
];

export default function MemoryTipsScreen() {
  const colors = useColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Mẹo ghi nhớ</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={[styles.heroCard, { backgroundColor: colors.tipCardBg }]}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Học ít, nhớ lâu, đúng cách</Text>
          <Text style={[styles.heroDesc, { color: colors.secondaryText }]}>
            Áp dụng 5 kỹ thuật dưới đây trong 7 ngày, bạn sẽ cảm nhận rõ sự khác biệt về tốc độ
            nhớ và độ chính xác khi làm bài.
          </Text>
        </View>

        {memoryMethods.map((item) => (
          <View key={item.title} style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.cardText, { color: colors.secondaryText }]}>{item.content}</Text>
          </View>
        ))}

        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Checklist áp dụng mỗi ngày</Text>
          {quickChecklist.map((line, idx) => (
            <View key={line} style={styles.checkRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.tint} />
              <Text style={[styles.checkText, { color: colors.secondaryText }]}>
                {idx + 1}. {line}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  heroCard: { borderRadius: 16, padding: 16, marginTop: 12, marginBottom: 14 },
  heroTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  heroDesc: { fontSize: 14, lineHeight: 20 },
  card: { borderRadius: 14, padding: 14, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardText: { fontSize: 14, lineHeight: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  checkText: { flex: 1, fontSize: 14, lineHeight: 20 },
});

